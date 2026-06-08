"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { createQPayInvoiceForOrder } from "./qpay-actions"

// ═══════════════════════════════════════════════════
// CHECKOUT — Race condition + Idempotency + Stock Lock
// ═══════════════════════════════════════════════════

interface CheckoutInput {
  idempotencyKey: string
  customerName: string
  phoneNumber: string
  accountNumber?: string
  deliveryAddress?: string
  deliveryDate?: string
  wantsDelivery: boolean
  note?: string
  paymentMethod?: "QPAY" | "BANK_TRANSFER"
  userId?: string
  receiptType?: string
  companyRegistryNumber?: string
  allowSubstitution?: boolean
  items: {
    productId: string
    variantId?: string
    quantity: number
  }[]
  loyaltyCardNumber?: string
  loyaltyAction?: string
  useReferralReward?: boolean
}

export async function checkout(input: CheckoutInput) {
  // ──── 1. IDEMPOTENCY: Давхар захиалга шалгах ────
  const existing = await db.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: { items: true }
  })
  if (existing) {
    return {
      success: true,
      order: JSON.parse(JSON.stringify(existing)),
      duplicate: true,
    }
  }

  // ──── 2. INPUT VALIDATION ────
  if (!input.items.length) return { success: false, error: "Сагс хоосон байна" }
  if (!input.userId) return { success: false, error: "Та системд нэвтэрч байж захиалга үүсгэх боломжтой" }
  if (!input.customerName.trim()) return { success: false, error: "Нэрээ оруулна уу" }
  const phone = input.phoneNumber.replace(/\D/g, "")
  if (phone.length !== 8) return { success: false, error: "Утасны дугаар 8 оронтой байх ёстой" }

  try {
    const result = await db.$transaction(async (tx) => {

      // ──── 3. ROW-LEVEL LOCK + STOCK CHECK ────
      const snapshots: {
        productId: string
        variantId?: string
        name: string
        variantName?: string
        sku: string
        unitPrice: number
        quantity: number
      }[] = []

      for (const item of input.items) {
        // SELECT ... FOR UPDATE → бусад transaction энэ мөрийг хүлээнэ
        const [product] = await tx.$queryRaw<any[]>`
          SELECT id, sku, name, price, "stockQuantity", "reservedStock", status
          FROM "Product"
          WHERE id = ${item.productId}
          FOR UPDATE
        `

        if (!product) throw new Error("Бараа олдсонгүй")
        if (product.status !== "ACTIVE" && product.status !== "OUT_OF_STOCK") {
          throw new Error(`"${product.name}" худалдаанд байхгүй байна`)
        }

        const available = product.stockQuantity - product.reservedStock
        if (available < item.quantity) {
          throw new Error(`"${product.name}" хүрэлцэхгүй байна (үлдэгдэл: ${available})`)
        }

        let variantName: string | undefined
        let unitPrice = Number(product.price)
        let sku = product.sku

        // Variant шалгалт
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId }
          })
          if (!variant) throw new Error("Сонгосон хувилбар олдсонгүй")
          if (variant.stockQuantity < item.quantity) {
            throw new Error(`"${variant.name}" хувилбар хүрэлцэхгүй байна (үлдэгдэл: ${variant.stockQuantity})`)
          }
          variantName = variant.name
          sku = variant.sku
          if (variant.price) unitPrice = Number(variant.price)

          // Variant stock бууруулах
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { decrement: item.quantity } }
          })
        }

        // Product reservedStock нэмэх (FOR UPDATE lock-тэй тул атомик)
        await tx.product.update({
          where: { id: item.productId },
          data: { reservedStock: { increment: item.quantity } }
        })

        snapshots.push({
          productId: item.productId,
          variantId: item.variantId,
          name: product.name,
          variantName,
          sku,
          unitPrice,
          quantity: item.quantity,
        })
      }

      // ──── 4. НИЙТ ДҮН БА ХӨНГӨЛӨЛТ (LOYALTY) ────
      const subtotal = snapshots.reduce((sum, s) => sum + s.unitPrice * s.quantity, 0)

      // Хүргэлтийн төлбөр тохиргооноос авах
      let deliveryFee = 0
      if (input.wantsDelivery) {
        const settings = await tx.shopSettings.findMany({
          where: { key: { in: ["delivery_threshold", "delivery_fee_below_threshold", "delivery_fee_above_threshold"] } }
        })
        const threshold = Number(settings.find(s => s.key === "delivery_threshold")?.value || 50000)
        const feeBelow = Number(settings.find(s => s.key === "delivery_fee_below_threshold")?.value || 8000)
        const feeAbove = Number(settings.find(s => s.key === "delivery_fee_above_threshold")?.value || 5000)

        const baseDeliveryFee = subtotal >= threshold ? feeAbove : feeBelow;

        // Custom delivery fee from items (e.g. large items)
        let maxItemFee = 0;
        for (const item of snapshots) {
          const product = await tx.product.findUnique({ where: { id: item.productId } })
          // @ts-ignore - Assuming product model might have custom fields or we fetch from schema
          const itemFee = Number((product as any)?.deliveryFee || 0)
          if (itemFee > maxItemFee) maxItemFee = itemFee
        }

        deliveryFee = Math.max(baseDeliveryFee, maxItemFee)
      }

      // Referral Reward Хөнгөлөлт (Зөвхөн хүргэлтээс)
      let referralRewardUsed = 0
      if (input.useReferralReward && input.userId && input.wantsDelivery && deliveryFee > 0) {
        const user = await tx.user.findUnique({ where: { id: input.userId } })
        if (user && user.referralReward > 0) {
          referralRewardUsed = Math.min(user.referralReward, deliveryFee)
          deliveryFee -= referralRewardUsed
          
          await tx.user.update({
            where: { id: user.id },
            data: { referralReward: { decrement: referralRewardUsed } }
          })
        }
      }

      let totalAmount = subtotal + deliveryFee
      let discount = 0
      let loyaltyPointsUsed = 0
      let loyaltyPointsEarned = 0

      // Loyalty тооцоолол
      if (input.loyaltyCardNumber && input.loyaltyAction) {
        const card = await tx.loyaltyCard.findUnique({ where: { cardNumber: input.loyaltyCardNumber } })
        if (card) {
          if (input.loyaltyAction === "SPEND" && card.pointsBalance > 0) {
            // 1 оноо = 1 төгрөг
            loyaltyPointsUsed = Math.min(card.pointsBalance, totalAmount)
            discount = loyaltyPointsUsed
            totalAmount -= discount
            
            // Оноо хасах
            await tx.loyaltyCard.update({
              where: { id: card.id },
              data: { pointsBalance: { decrement: loyaltyPointsUsed } }
            })
          } else if (input.loyaltyAction === "EARN") {
            // Дэд дүнгийн 3%-ийг цуглуулах
            loyaltyPointsEarned = Math.floor(subtotal * 0.03)
            
            // Оноо нэмэх
            await tx.loyaltyCard.update({
              where: { id: card.id },
              data: { pointsBalance: { increment: loyaltyPointsEarned } }
            })
          }
        }
      }

      // ──── 5. ORDER ҮҮСГЭХ ────
      const paymentMethod = input.paymentMethod || "BANK_TRANSFER"

      const order = await tx.order.create({
        data: {
          idempotencyKey: input.idempotencyKey,
          customerName: input.customerName.trim(),
          customerPhone: phone,
          accountNumber: input.accountNumber?.trim() || undefined,
          deliveryAddress: input.wantsDelivery ? input.deliveryAddress?.trim() : undefined,
          deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : undefined,
          wantsDelivery: input.wantsDelivery,
          subtotal,
          deliveryFee,
          discount,
          totalAmount,
          orderStatus: "PENDING",
          stockReservedAt: new Date(),
          note: input.note?.trim(),
          creationSource: "WEB",
          userId: input.userId || undefined,
          receiptType: input.receiptType || "individual",
          companyRegistryNumber: input.companyRegistryNumber?.trim() || null,
          allowSubstitution: input.allowSubstitution !== false,
          loyaltyCardNumber: input.loyaltyCardNumber || null,
          loyaltyAction: input.loyaltyAction || null,
          loyaltyPointsUsed,
          loyaltyPointsEarned,
          referralRewardUsed,
          // OrderItems
          items: {
            create: snapshots.map(s => ({
              productId: s.productId,
              variantId: s.variantId,
              productName: s.name,
              variantName: s.variantName,
              sku: s.sku,
              quantity: s.quantity,
              unitPrice: s.unitPrice,
              totalPrice: s.unitPrice * s.quantity,
            }))
          },
          // Payment бичлэг
          payments: {
            create: {
              method: paymentMethod,
              amount: totalAmount,
              status: "PENDING",
            }
          }
        },
        include: { items: true, payments: true }
      })

      return order
    }, {
      maxWait: 10000,
      timeout: 30000,
    })

    revalidatePath("/admin/orders")
    revalidatePath("/")

    const paymentMethod = input.paymentMethod || "BANK_TRANSFER"
    const payment = result.payments[0]

    // ──── 6. QPay INVOICE ҮҮСГЭХ (хэрэв QPay сонгосон бол) ────
    let qpayData: any = null
    if (paymentMethod === "QPAY" && payment) {
      const qpayResult = await createQPayInvoiceForOrder(result.id, payment.id)
      if (qpayResult.success) {
        qpayData = {
          invoiceId: qpayResult.invoiceId,
          qrImage: qpayResult.qrImage,
          qrText: qpayResult.qrText,
          urls: qpayResult.urls,
          paymentId: payment.id,
        }
      } else {
        console.error("[Checkout] QPay invoice failed:", qpayResult.error)
        // QPay invoice амжилтгүй ч захиалга амжилттай — банк шилжүүлгээр үргэлжлүүлнэ
      }
    }

    return {
      success: true,
      order: JSON.parse(JSON.stringify(result)),
      paymentMethod,
      paymentId: payment?.id,
      qpayData,
    }

  } catch (error: any) {
    console.error("[Checkout] Error:", error)
    return { success: false, error: error.message || "Захиалга үүсгэхэд алдаа гарлаа" }
  }
}

// ═══════════════════════════════════════════════════
// САГСНЫ STOCK ШАЛГАЛТ (checkout-ын өмнө UI дээр)
// ═══════════════════════════════════════════════════

export async function validateCartStock(items: { productId: string; variantId?: string; quantity: number }[]) {
  const errors: string[] = []

  for (const item of items) {
    const product = await db.product.findUnique({
      where: { id: item.productId },
      select: { name: true, stockQuantity: true, reservedStock: true, status: true }
    })

    if (!product) {
      errors.push("Бараа олдсонгүй")
      continue
    }
    if (product.status !== "ACTIVE") {
      errors.push(`"${product.name}" худалдаанд байхгүй`)
      continue
    }

    const available = product.stockQuantity - product.reservedStock
    if (available < item.quantity) {
      errors.push(`"${product.name}" хүрэлцэхгүй (үлдэгдэл: ${available})`)
    }

    if (item.variantId) {
      const variant = await db.productVariant.findUnique({
        where: { id: item.variantId },
        select: { name: true, stockQuantity: true }
      })
      if (!variant) {
        errors.push("Хувилбар олдсонгүй")
      } else if (variant.stockQuantity < item.quantity) {
        errors.push(`"${variant.name}" хувилбар хүрэлцэхгүй (үлдэгдэл: ${variant.stockQuantity})`)
      }
    }
  }

  return errors.length > 0 ? { success: false, errors } : { success: true, errors: [] }
}

"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { createQPayInvoiceForOrder } from "./qpay-actions"
import { createPaylinkInvoice } from "@/lib/paylink"
import { PaymentMethod } from "@prisma/client"

// ═══════════════════════════════════════════════════
// CHECKOUT — Race condition + Idempotency + Stock Lock
// ═══════════════════════════════════════════════════

interface CheckoutInput {
  idempotencyKey: string
  customerName: string
  customerEmail?: string
  phoneNumber: string
  accountNumber?: string
  note?: string
  paymentMethod?: "QPAY" | "BANK_TRANSFER" | "PAYLINK"
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

      let deliveryFee = 0
      let referralRewardUsed = 0
      if (input.useReferralReward && input.userId && deliveryFee > 0) {
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
        },
        include: { items: true }
      })

      // Payment бичлэг тусдаа үүсгэх
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          method: paymentMethod as PaymentMethod,
          amount: totalAmount,
          status: "PENDING",
        }
      })

      return { order, payment }
    }, {
      maxWait: 10000,
      timeout: 30000,
    })

    revalidatePath("/admin/orders")
    revalidatePath("/")

    const paymentMethod = input.paymentMethod || "BANK_TRANSFER"
    const payment = result.payment

    // ──── 6. INVOICE ҮҮСГЭХ (хэрэв QPay эсвэл Paylink сонгосон бол) ────
    let qpayData: any = null
    let paylinkData: any = null

    if (paymentMethod === "QPAY" && payment) {
      const qpayResult = await createQPayInvoiceForOrder(result.order.id, payment.id)
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
      }
    } else if (paymentMethod === "PAYLINK" && payment) {
      const paylinkResult = await createPaylinkInvoice({
        transactionRef: payment.id,
        amount: Number(result.order.totalAmount),
      })
      if (paylinkResult.success) {
        paylinkData = {
          invoiceId: paylinkResult.data?.invoiceId,
          paymentUrl: paylinkResult.data?.paymentUrl,
          qrImage: paylinkResult.data?.qrImage,
          paymentId: payment.id,
        }
        
        // Save to DB metadata
        await db.payment.update({
          where: { id: payment.id },
          data: {
            metadata: paylinkData,
            externalRef: paylinkResult.data?.invoiceId
          }
        })
      } else {
        console.error("[Checkout] Paylink invoice failed:", paylinkResult.error)
      }
    }

    return {
      success: true,
      order: JSON.parse(JSON.stringify(result.order)),
      paymentMethod,
      paymentId: payment?.id,
      qpayData,
      paylinkData,
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

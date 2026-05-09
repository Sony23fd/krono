"use server"

import { db } from "@/lib/db"
import { getCurrentAdmin } from "@/lib/auth"
import { revalidatePath } from "next/cache"

/**
 * Бүрэн backup-аас DB сэргээх (шинэ schema-д тохируулсан)
 */
export async function restoreFullDatabase(data: any) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin || admin.role !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    await db.$transaction(async (tx) => {
      // Бүх дата устгах (хүүхэд хүснэгтүүдээс эхлэх)
      await tx.payment.deleteMany({})
      await tx.orderItem.deleteMany({})
      await tx.order.deleteMany({})
      await tx.cartItem.deleteMany({})
      await tx.cart.deleteMany({})
      await tx.productVariant.deleteMany({})
      await tx.product.deleteMany({})
      await tx.category.deleteMany({})
      await tx.activityLog.deleteMany({})
      await tx.shopSettings.deleteMany({})

      // Admin-ыг хадгалах
      await tx.user.deleteMany({
        where: { id: { not: admin.id } }
      })

      // Дата оруулах
      if (data.users?.length) {
        const filtered = data.users.filter((u: any) => u.id !== admin.id && u.email !== admin.email)
        if (filtered.length) await tx.user.createMany({ data: filtered })
      }
      if (data.shopSettings?.length) await tx.shopSettings.createMany({ data: data.shopSettings })
      if (data.categories?.length) await tx.category.createMany({ data: data.categories })
      if (data.products?.length) await tx.product.createMany({ data: data.products })
      if (data.productVariants?.length) await tx.productVariant.createMany({ data: data.productVariants })
      if (data.orders?.length) await tx.order.createMany({ data: data.orders })
      if (data.orderItems?.length) await tx.orderItem.createMany({ data: data.orderItems })
      if (data.payments?.length) await tx.payment.createMany({ data: data.payments })
      if (data.activityLogs?.length) await tx.activityLog.createMany({ data: data.activityLogs })
    }, {
      maxWait: 20000,
      timeout: 900000
    })

    revalidatePath("/admin", "layout")
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

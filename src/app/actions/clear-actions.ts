"use server"

import { db } from "@/lib/db"
import { getCurrentAdmin } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function clearAllData() {
  const admin = await getCurrentAdmin()
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.payment.deleteMany({})
      await tx.orderItem.deleteMany({})
      await tx.order.deleteMany({})
      await tx.cartItem.deleteMany({})
      await tx.cart.deleteMany({})
      await tx.productVariant.deleteMany({})
      await tx.product.deleteMany({})
      await tx.category.deleteMany({})
      await tx.activityLog.deleteMany({})
    })

    revalidatePath("/admin", "layout")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

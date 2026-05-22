"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getDiscountedProducts() {
  try {
    const products = await db.product.findMany({
      where: {
        comparePrice: { gt: db.product.fields.price }
      },
      orderBy: { updatedAt: "desc" }
    })
    return { success: true, products: JSON.parse(JSON.stringify(products)) }
  } catch (error: any) {
    return { success: false, error: error.message, products: [] }
  }
}

export async function applyDiscountBulk(productIds: string[], type: "PERCENT" | "FIXED", value: number) {
  try {
    const products = await db.product.findMany({
      where: { id: { in: productIds } }
    })

    const transactions = products.map(product => {
      let oldPrice = Number(product.comparePrice || product.price)
      let newPrice = oldPrice

      if (type === "PERCENT") {
        newPrice = oldPrice - (oldPrice * (value / 100))
      } else {
        newPrice = oldPrice - value
      }

      if (newPrice < 0) newPrice = 0

      return db.product.update({
        where: { id: product.id },
        data: {
          comparePrice: oldPrice,
          price: newPrice
        }
      })
    })

    await db.$transaction(transactions)
    revalidatePath("/admin/products")
    revalidatePath("/admin/marketing/promotions")
    revalidatePath("/")
    
    return { success: true, updatedCount: transactions.length }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function removeDiscountBulk(productIds: string[]) {
  try {
    const products = await db.product.findMany({
      where: { id: { in: productIds } }
    })

    const transactions = products.map(product => {
      const originalPrice = product.comparePrice ? Number(product.comparePrice) : Number(product.price)
      
      return db.product.update({
        where: { id: product.id },
        data: {
          comparePrice: null,
          price: originalPrice
        }
      })
    })

    await db.$transaction(transactions)
    revalidatePath("/admin/products")
    revalidatePath("/admin/marketing/promotions")
    revalidatePath("/")
    
    return { success: true, updatedCount: transactions.length }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

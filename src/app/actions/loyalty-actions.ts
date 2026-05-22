"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getLoyaltyCards() {
  try {
    const cards = await db.loyaltyCard.findMany({
      orderBy: { createdAt: "desc" }
    })
    return { success: true, cards: JSON.parse(JSON.stringify(cards)) }
  } catch (error: any) {
    return { success: false, error: error.message, cards: [] }
  }
}

export async function createLoyaltyCard(data: { cardNumber: string; phone?: string; pointsBalance?: number }) {
  try {
    const card = await db.loyaltyCard.create({
      data: {
        cardNumber: data.cardNumber.trim(),
        phone: data.phone?.trim() || null,
        pointsBalance: data.pointsBalance || 0,
      }
    })
    revalidatePath("/admin/customers/loyalty-cards")
    return { success: true, card: JSON.parse(JSON.stringify(card)) }
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "Картын дугаар эсвэл утасны дугаар давхардаж байна" }
    }
    return { success: false, error: error.message }
  }
}

export async function updateLoyaltyCard(id: string, data: { phone?: string; pointsBalance?: number }) {
  try {
    const card = await db.loyaltyCard.update({
      where: { id },
      data: {
        ...(data.phone !== undefined && { phone: data.phone?.trim() || null }),
        ...(data.pointsBalance !== undefined && { pointsBalance: data.pointsBalance })
      }
    })
    revalidatePath("/admin/customers/loyalty-cards")
    return { success: true, card: JSON.parse(JSON.stringify(card)) }
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "Утасны дугаар давхардаж байна" }
    }
    return { success: false, error: error.message }
  }
}

export async function deleteLoyaltyCard(id: string) {
  try {
    await db.loyaltyCard.delete({ where: { id } })
    revalidatePath("/admin/customers/loyalty-cards")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

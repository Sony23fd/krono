"use server"

import { db } from "@/lib/db"

/**
 * Хэрэглэгч бүртгэх / нэвтрүүлэх (phone-ээр)
 * Утас баталгаажуулсны дараа энэ функцийг дуудна.
 * User хүснэгтэд phone-ээр upsert хийнэ.
 */
export async function registerOrLoginCustomer(phone: string, name: string) {
  try {
    const digits = phone.replace(/\D/g, "")
    if (digits.length !== 8) {
      return { success: false, error: "Утасны дугаар 8 оронтой байх ёстой" }
    }

    // Upsert: байвал шинэчлэх, байхгүй бол үүсгэх
    const user = await db.user.upsert({
      where: { phone: digits },
      update: {
        name: name.trim() || undefined,
      },
      create: {
        phone: digits,
        name: name.trim(),
        role: "CUSTOMER",
      },
    })

    return {
      success: true,
      customer: {
        id: user.id,
        name: user.name || name.trim(),
        phone: user.phone || digits,
        address: user.address || undefined
      }
    }
  } catch (error: any) {
    console.error("[CustomerAuth] Error:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Утасны дугаараар хэрэглэгч хайх
 */
export async function getCustomerByPhone(phone: string) {
  try {
    const digits = phone.replace(/\D/g, "")
    const user = await db.user.findUnique({
      where: { phone: digits },
      select: { id: true, name: true, phone: true, address: true }
    })
    if (!user) return { success: false }
    return {
      success: true,
      customer: {
        id: user.id,
        name: user.name || "",
        phone: user.phone || digits,
        address: user.address || undefined
      }
    }
  } catch {
    return { success: false }
  }
}

export async function updateCustomerAddress(phone: string, address: string) {
  try {
    const digits = phone.replace(/\D/g, "")
    await db.user.update({
      where: { phone: digits },
      data: { address }
    })
    return { success: true }
  } catch (error: any) {
    console.error("[CustomerAuth] Update Address Error:", error)
    return { success: false, error: error.message }
  }
}

export async function updateCustomerProfile(phone: string, data: { name?: string; address?: string }) {
  try {
    const digits = phone.replace(/\D/g, "")
    await db.user.update({
      where: { phone: digits },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.address !== undefined && { address: data.address }),
      }
    })
    return { success: true }
  } catch (error: any) {
    console.error("[CustomerAuth] Update Profile Error:", error)
    return { success: false, error: error.message }
  }
}

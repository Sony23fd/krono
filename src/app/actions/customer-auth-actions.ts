"use server"

import { db } from "@/lib/db"
import { checkPhoneVerified, startPhoneVerification } from "@/app/actions/verify-actions"

export type CustomerAuthResult =
  | {
      success: true
      customer: {
        id: string
        name: string
        phone: string
        address?: string
      }
    }
  | {
      success: false
      error: string
    }

export type BeginCustomerAuthResult =
  | CustomerAuthResult
  | {
      success: false
      verificationRequired: true
      sessionId: string
      smsUri?: string
      displayInstruction?: string
      expiresAt?: string
      status?: "PENDING" | "VERIFIED" | "EXPIRED"
    }

/**
 * Хэрэглэгч бүртгэх / нэвтрүүлэх (phone-ээр)
 * Утас баталгаажуулсны дараа энэ функцийг дуудна.
 * User хүснэгтэд phone-ээр upsert хийнэ.
 */
export async function registerOrLoginCustomer(phone: string, name: string): Promise<CustomerAuthResult> {
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

export async function beginCustomerAuth(phone: string, name: string): Promise<BeginCustomerAuthResult> {
  const digits = phone.replace(/\D/g, "")
  if (digits.length !== 8) {
    return { success: false, error: "Утасны дугаар 8 оронтой байх ёстой" }
  }

  const existingCustomer = await getCustomerByPhone(digits)
  if (existingCustomer.success && existingCustomer.customer) {
    return { success: true, customer: existingCustomer.customer }
  }

  const verified = await checkPhoneVerified(digits)
  if (verified) {
    return await registerOrLoginCustomer(digits, name)
  }

  const verification = await startPhoneVerification(digits)
  if (!verification.success) {
    return { success: false, error: verification.error || "Баталгаажуулалт эхлүүлэхэд алдаа гарлаа" }
  }

  const sessionId = verification.sessionId
  if (!sessionId) {
    return { success: false, error: "Session ID not returned" }
  }

  if (sessionId === "already-verified" || sessionId === "skipped" || verification.status === "VERIFIED") {
    return await registerOrLoginCustomer(digits, name)
  }

  return {
    success: false,
    verificationRequired: true,
    sessionId,
    smsUri: verification.smsUri,
    displayInstruction: verification.displayInstruction,
    expiresAt: verification.expiresAt,
    status: verification.status,
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

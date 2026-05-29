"use server"

import { db } from "@/lib/db"
import { createCustomerSession, destroyCustomerSession, getCustomerSession } from "@/lib/customer-session"
import bcrypt from "bcryptjs"
import { checkPhoneVerified } from "@/app/actions/verify-actions"

export type AuthResult = 
  | { success: true }
  | { success: false; error: string }

/**
 * Get current logged in customer from JWT session
 */
export async function getCurrentCustomer() {
  const session = await getCustomerSession()
  if (!session.isLoggedIn) return null

  return {
    id: session.id,
    name: session.name,
    phone: session.phone,
    address: session.address,
  }
}

/**
 * Login with Phone and Password
 */
export async function loginWithPassword(phone: string, password: string): Promise<AuthResult> {
  try {
    const digits = phone.replace(/\D/g, "")
    if (digits.length !== 8) return { success: false, error: "Утасны дугаар буруу байна." }
    if (password.length < 6) return { success: false, error: "Нууц үг буруу байна." }

    const user = await db.user.findUnique({ where: { phone: digits } })
    if (!user) {
      return { success: false, error: "Бүртгэлтэй хэрэглэгч олдсонгүй." }
    }

    if (!user.password) {
      return { success: false, error: "Та нууц үг үүсгээгүй байна. 'Нууц үг сэргээх' хэсгээр орж нууц үгээ үүсгэнэ үү." }
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return { success: false, error: "Утасны дугаар эсвэл нууц үг буруу байна." }
    }

    // Create secure session
    await createCustomerSession({
      id: user.id,
      name: user.name || "",
      phone: user.phone || digits,
      address: user.address || undefined
    })

    return { success: true }
  } catch (error: any) {
    console.error("[Auth] Login error:", error)
    return { success: false, error: "Нэвтрэхэд алдаа гарлаа." }
  }
}

/**
 * Register a new user
 * Assumes phone is already verified via verify.mn if phoneVerificationEnabled is true
 */
export async function registerWithPassword(phone: string, name: string, password: string, phoneVerificationEnabled: boolean): Promise<AuthResult> {
  try {
    const digits = phone.replace(/\D/g, "")
    if (digits.length !== 8) return { success: false, error: "Утасны дугаар буруу байна." }
    if (!name.trim()) return { success: false, error: "Нэрээ оруулна уу." }
    if (password.length < 6) return { success: false, error: "Нууц үг дор хаяж 6 тэмдэгттэй байх шаардлагатай." }

    // Check if phone was verified (only if globally enabled)
    if (phoneVerificationEnabled) {
      const isVerified = await checkPhoneVerified(digits)
      if (!isVerified) {
        return { success: false, error: "Утасны дугаар баталгаажаагүй байна." }
      }
    }

    const existingUser = await db.user.findUnique({ where: { phone: digits } })
    if (existingUser) {
      if (existingUser.password) {
        return { success: false, error: "Энэ дугаар аль хэдийн бүртгэгдсэн байна." }
      }
      // If user exists but has no password (legacy user), they should use Forgot Password instead, but we can allow them to register to set it if verified
      // Wait, if they are already verified in DB, we can just update them.
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await db.user.upsert({
      where: { phone: digits },
      update: {
        name: name.trim(),
        password: hashedPassword
      },
      create: {
        phone: digits,
        name: name.trim(),
        password: hashedPassword,
        role: "CUSTOMER"
      }
    })

    // Auto login
    await createCustomerSession({
      id: user.id,
      name: user.name || "",
      phone: user.phone || digits,
      address: user.address || undefined
    })

    return { success: true }
  } catch (error: any) {
    console.error("[Auth] Register error:", error)
    return { success: false, error: "Бүртгүүлэхэд алдаа гарлаа." }
  }
}

/**
 * Reset or Create password for legacy user
 * Requires the phone to be recently verified via Verify.mn
 */
export async function resetPassword(phone: string, password: string): Promise<AuthResult> {
  try {
    const digits = phone.replace(/\D/g, "")
    if (digits.length !== 8) return { success: false, error: "Утасны дугаар буруу байна." }
    if (password.length < 6) return { success: false, error: "Нууц үг дор хаяж 6 тэмдэгттэй байх шаардлагатай." }

    // We MUST check if the phone is verified before allowing password reset!
    const isVerified = await checkPhoneVerified(digits)
    if (!isVerified) {
      return { success: false, error: "Утасны дугаар баталгаажаагүй байна. Дахин оролдоно уу." }
    }

    const existingUser = await db.user.findUnique({ where: { phone: digits } })
    if (!existingUser) {
      // User doesn't exist yet, we can create them with empty name for now
      // However, usually they should just Register.
      return { success: false, error: "Бүртгэлтэй хэрэглэгч олдсонгүй. Бүртгүүлэх хэсгээр орно уу." }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await db.user.update({
      where: { phone: digits },
      data: { password: hashedPassword }
    })

    // Auto login after reset
    await createCustomerSession({
      id: user.id,
      name: user.name || "",
      phone: user.phone || digits,
      address: user.address || undefined
    })

    return { success: true }
  } catch (error: any) {
    console.error("[Auth] Reset password error:", error)
    return { success: false, error: "Нууц үг солиход алдаа гарлаа." }
  }
}

export async function logoutCustomer(): Promise<AuthResult> {
  await destroyCustomerSession()
  return { success: true }
}

"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/session"
import bcrypt from "bcryptjs"

export async function updateCustomer(id: string, data: { name?: string; phone?: string; address?: string; password?: string }) {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== "ADMIN") {
    return { success: false, error: "Хандах эрхгүй байна" }
  }

  try {
    // Basic validation
    if (data.phone) {
      const digits = data.phone.replace(/\D/g, "")
      if (digits.length !== 8) {
        return { success: false, error: "Утасны дугаар 8 оронтой байх ёстой" }
      }
      data.phone = digits
    }
    
    let hashedPassword = undefined
    if (data.password) {
      if (data.password.length < 6) {
        return { success: false, error: "Нууц үг дор хаяж 6 тэмдэгттэй байх шаардлагатай" }
      }
      hashedPassword = await bcrypt.hash(data.password, 10)
    }

    await db.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.address !== undefined && { address: data.address }),
        ...(hashedPassword !== undefined && { password: hashedPassword }),
      },
    })

    revalidatePath("/admin/customers")
    return { success: true }
  } catch (error: any) {
    if (error.code === "P2002" && error.meta?.target?.includes("phone")) {
      return { success: false, error: "Энэ утасны дугаар өөр хэрэглэгчид бүртгэлтэй байна" }
    }
    return { success: false, error: error.message || "Харилцагчийн мэдээллийг шинэчлэхэд алдаа гарлаа" }
  }
}

export async function deleteCustomer(id: string) {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== "ADMIN") {
    return { success: false, error: "Хандах эрхгүй байна" }
  }

  try {
    // Check if the user has any orders
    const orderCount = await db.order.count({
      where: { userId: id }
    })

    if (orderCount > 0) {
      return { 
        success: false, 
        error: `Энэ харилцагч ${orderCount} захиалгатай байгаа тул устгах боломжгүй.` 
      }
    }

    // Since they don't have orders, we can safely delete
    // We should also delete cart and cartItems manually if Cascade is not set up correctly, 
    // but Prisma relation on Cart uses `user User? @relation(fields: [userId], references: [id])`.
    // Wait, the User -> Cart relation does not have onDelete: Cascade explicitly in the schema.
    // Let's delete the cart first if it exists.
    const cart = await db.cart.findUnique({
      where: { userId: id }
    })

    if (cart) {
      // Cart items have Cascade delete with Cart, so deleting Cart is enough.
      await db.cart.delete({
        where: { id: cart.id }
      })
    }

    await db.user.delete({
      where: { id },
    })

    revalidatePath("/admin/customers")
    return { success: true }
  } catch (error: any) {
    console.error("[deleteCustomer] error:", error)
    return { success: false, error: error.message || "Харилцагчийг устгахад алдаа гарлаа" }
  }
}

export async function verifyCustomerPhone(phone: string) {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== "ADMIN") {
    return { success: false, error: "Хандах эрхгүй байна" }
  }

  try {
    const digits = phone.replace(/\D/g, "")
    if (digits.length !== 8) {
      return { success: false, error: "Утасны дугаар 8 оронтой байх ёстой" }
    }

    await db.verifiedPhone.upsert({
      where: { phone: digits },
      update: { verifiedAt: new Date() },
      create: { phone: digits }
    })

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Утас баталгаажуулахад алдаа гарлаа" }
  }
}

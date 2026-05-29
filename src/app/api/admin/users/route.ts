import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const session = await getSession()
    if (!session.isLoggedIn || (session.role !== "ADMIN" && session.role !== "DATAADMIN")) {
      return NextResponse.json({ error: "Эрх хүрэхгүй байна" }, { status: 401 })
    }

    const users = await db.user.findMany({
      where: {
        role: { in: session.role === "DATAADMIN" ? ["ADMIN", "CARGO_ADMIN", "DATAADMIN"] : ["ADMIN", "CARGO_ADMIN"] }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" }
    })
    
    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return NextResponse.json({ error: "Хэрэглэгчдийг уншихад алдаа гарлаа" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session.isLoggedIn || (session.role !== "ADMIN" && session.role !== "DATAADMIN")) {
        return NextResponse.json({ error: "Эрх хүрэхгүй байна" }, { status: 401 })
    }

    const body = await req.json()
    const { email, password, name, role } = body

    if (!email || !password || !role) {
      return NextResponse.json({ error: "Имэйл, нууц үг, эрхийг заавал оруулна уу" }, { status: 400 })
    }

    if (session.role === "ADMIN" && role === "DATAADMIN") {
      return NextResponse.json({ error: "Та Дата Админ үүсгэх эрхгүй байна" }, { status: 403 })
    }

    // Check if user exists
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Ийм имэйлтэй хэрэглэгч бүртгэгдсэн байна" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || "Шинэ Админ",
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      }
    })

    return NextResponse.json({ success: true, user: newUser })
  } catch (error) {
    console.error("Failed to create user:", error)
    return NextResponse.json({ error: "Хэрэглэгч үүсгэхэд алдаа гарлаа" }, { status: 500 })
  }
}

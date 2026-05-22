import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import * as xlsx from "xlsx"

async function verifyAdmin(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_token")?.value
  if (!token) return null
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "bileg-secret")
    const { payload } = await jwtVerify(token, secret)
    return payload as any
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const products = await db.product.findMany({
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" }
    })

    const data = products.map(p => ({
      ID: p.id,
      SKU: p.sku,
      "Барааны нэр": p.name,
      "Ангилал": p.category?.name || "",
      "Үнэ": p.price,
      "Харьцуулах үнэ": p.comparePrice || "",
      "Үлдэгдэл": p.stockQuantity,
      "Жин": p.weight || "",
      "Статус": p.status,
      "Тайлбар": p.description || "",
      "Тусгай тэмдэг": p.customBadge || "",
    }))

    const worksheet = xlsx.utils.json_to_sheet(data)
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, "Products")

    const buf = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" })

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="products_export_${new Date().toISOString().split("T")[0]}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }
    })
  } catch (error: any) {
    console.error("[Export Error]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

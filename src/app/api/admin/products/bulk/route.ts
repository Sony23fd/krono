import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

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

// PUT /api/admin/products/bulk — Bulk actions for products
export async function PUT(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { action, productIds, categoryId, value } = body

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: "productIds шаардлагатай" }, { status: 400 })
    }

    switch (action) {
      // ═══ Bulk Category Reassignment ═══
      case "move_category": {
        if (!categoryId) {
          return NextResponse.json({ error: "categoryId шаардлагатай" }, { status: 400 })
        }
        const result = await db.product.updateMany({
          where: { id: { in: productIds } },
          data: { categoryId },
        })
        return NextResponse.json({
          success: true,
          message: `${result.count} бараа шилжүүллээ`,
          count: result.count,
        })
      }

      // ═══ Bulk Set Featured ═══
      case "set_featured": {
        const isFeatured = value === true
        const result = await db.product.updateMany({
          where: { id: { in: productIds } },
          data: { isFeatured },
        })
        return NextResponse.json({
          success: true,
          message: `${result.count} бараа ${isFeatured ? "онцлох" : "энгийн"} болголоо`,
          count: result.count,
        })
      }

      // ═══ Bulk Set Age Verification ═══
      case "set_age_verification": {
        const requiresAgeVerification = value === true
        const result = await db.product.updateMany({
          where: { id: { in: productIds } },
          data: { requiresAgeVerification },
        })
        return NextResponse.json({
          success: true,
          message: `${result.count} бараанд 21+ насны хязгаар ${requiresAgeVerification ? "тохирууллаа" : "болиуллаа"}`,
          count: result.count,
        })
      }

      // ═══ Bulk Status Change ═══
      case "set_status": {
        if (!value) {
          return NextResponse.json({ error: "status утга шаардлагатай" }, { status: 400 })
        }
        const result = await db.product.updateMany({
          where: { id: { in: productIds } },
          data: { status: value },
        })
        return NextResponse.json({
          success: true,
          message: `${result.count} барааны статус шинэчлэгдлээ`,
          count: result.count,
        })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error("[BulkProducts] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

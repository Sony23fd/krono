import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentAdmin } from "@/lib/auth"

// PUT /api/admin/products/bulk — Bulk actions for products
export async function PUT(req: NextRequest) {
  const admin = await getCurrentAdmin()
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

      // ═══ Bulk Delete Products ═══
      case "delete_products": {
        let deletedCount = 0;
        let archivedCount = 0;
        let errorCount = 0;

        for (const id of productIds) {
          const p = await db.product.findUnique({ where: { id } });
          if (!p) continue;

          if (p.status === "ARCHIVED") {
            // Already archived -> permanently delete if no orders
            const totalOrders = await db.orderItem.count({ where: { productId: id } })
            if (totalOrders > 0) {
              errorCount++;
            } else {
              await db.cartItem.deleteMany({ where: { productId: id } })
              await db.product.delete({ where: { id } })
              deletedCount++;
            }
          } else {
            // Not archived -> archive if no active orders
            const activeOrderCount = await db.orderItem.count({
              where: {
                productId: id,
                order: { orderStatus: { in: ["PENDING", "PAID", "PROCESSING", "SHIPPED"] } }
              }
            })
            if (activeOrderCount > 0) {
              errorCount++;
            } else {
              await db.product.update({ where: { id }, data: { status: "ARCHIVED" } })
              archivedCount++;
            }
          }
        }

        let msg = ""
        if (archivedCount > 0) msg += `${archivedCount} бараа архивлагдсан. `
        if (deletedCount > 0) msg += `${deletedCount} бараа бүрмөсөн устгагдсан. `
        if (errorCount > 0) msg += `(${errorCount} барааг устгах боломжгүй: захиалгын түүхтэй байна)`
        if (msg === "") msg = "Ямар нэгэн өөрчлөлт орсонгүй."

        return NextResponse.json({
          success: true,
          message: msg.trim()
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

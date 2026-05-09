import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

/**
 * POST /api/pos/sync
 * Гадаад POS системээс бараа синхрончлох endpoint.
 * 
 * Headers: x-api-key: <POS_SYNC_API_KEY>
 * Body: { items: [{ sku, price?, stockQuantity, name? }], mode: "partial"|"full" }
 * 
 * mode="partial": зөвхөн өгсөн SKU-уудыг шинэчлэх
 * mode="full": өгсөн SKU-уудыг шинэчлэх + бусдыг OUT_OF_STOCK болгох
 */
export async function POST(req: NextRequest) {
  // API Key баталгаажуулалт
  const apiKey = req.headers.get("x-api-key")
  if (!apiKey || apiKey !== process.env.POS_SYNC_API_KEY) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
  }

  try {
    const { items, mode = "partial" } = await req.json()

    if (!Array.isArray(items) || !items.length) {
      return NextResponse.json({ error: "items array шаардлагатай" }, { status: 400 })
    }

    const results = {
      synced: 0,
      notFound: 0,
      created: 0,
      errors: [] as string[],
    }

    // 50 мөрөөр chunk хуваах
    const CHUNK = 50
    for (let i = 0; i < items.length; i += CHUNK) {
      const chunk = items.slice(i, i + CHUNK)

      await db.$transaction(async (tx) => {
        for (const item of chunk) {
          if (!item.sku) {
            results.errors.push("SKU хоосон мөр алгасав")
            continue
          }

          const product = await tx.product.findUnique({
            where: { sku: String(item.sku).trim() }
          })

          if (!product) {
            // POS-оос шинэ бараа үүсгэх (optional)
            if (item.name && item.price) {
              const slug = String(item.name)
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9\-а-яөүё]/gi, "")
                + `-${String(item.sku).toLowerCase()}`

              await tx.product.create({
                data: {
                  sku: String(item.sku).trim(),
                  name: String(item.name).trim(),
                  slug,
                  price: Number(item.price),
                  stockQuantity: Number(item.stockQuantity || 0),
                  status: Number(item.stockQuantity || 0) > 0 ? "ACTIVE" : "OUT_OF_STOCK",
                }
              })
              results.created++
            } else {
              results.notFound++
            }
            continue
          }

          // Шинэчлэх
          await tx.product.update({
            where: { sku: String(item.sku).trim() },
            data: {
              stockQuantity: item.stockQuantity !== undefined
                ? Number(item.stockQuantity)
                : product.stockQuantity,
              ...(item.price !== undefined && { price: Number(item.price) }),
              ...(item.name && { name: String(item.name).trim() }),
              status: Number(item.stockQuantity ?? product.stockQuantity) > 0
                ? "ACTIVE"
                : "OUT_OF_STOCK",
            }
          })
          results.synced++
        }
      }, { timeout: 60000 })
    }

    // Full mode: sync-д ороогүй бүх ACTIVE барааг OUT_OF_STOCK болгох
    if (mode === "full") {
      const syncedSkus = items
        .map((i: any) => String(i.sku || "").trim())
        .filter(Boolean)

      if (syncedSkus.length > 0) {
        await db.product.updateMany({
          where: {
            sku: { notIn: syncedSkus },
            status: "ACTIVE",
          },
          data: {
            status: "OUT_OF_STOCK",
            stockQuantity: 0,
          }
        })
      }
    }

    // Activity log
    await db.activityLog.create({
      data: {
        userId: "SYSTEM",
        userName: "POS Sync",
        userRole: "API",
        action: "POS синхрончлол",
        target: "Бараа",
        detail: `Mode: ${mode}, Synced: ${results.synced}, Created: ${results.created}, Not found: ${results.notFound}`,
      }
    })

    return NextResponse.json({
      success: true,
      ...results,
      message: `${results.synced} синхрончлогдлоо, ${results.created} шинээр нэмэгдлээ`,
    })
  } catch (error: any) {
    console.error("[POS Sync] Error:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// GET /api/pos/sync — Статус шалгах
export async function GET(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key")
  if (!apiKey || apiKey !== process.env.POS_SYNC_API_KEY) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
  }

  const totalProducts = await db.product.count()
  const activeProducts = await db.product.count({ where: { status: "ACTIVE" } })
  const outOfStock = await db.product.count({ where: { status: "OUT_OF_STOCK" } })

  return NextResponse.json({
    success: true,
    stats: { totalProducts, activeProducts, outOfStock },
    timestamp: new Date().toISOString(),
  })
}

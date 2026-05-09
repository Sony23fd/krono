import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

/**
 * ═══════════════════════════════════════════════════════════════
 * POST /api/webhooks/pos-sync
 * ═══════════════════════════════════════════════════════════════
 * 
 * Дотоод POS Agent-ээс ирсэн inventory мэдээллийг хүлээн авч боловсруулна.
 * 
 * POS нь физик дэлгүүрийн "Single Source of Truth" (SSOT) болно.
 * Cloud дээр онлайнаар зарагдсан барааны reservedStock-ыг тооцож,
 * физик + онлайн нөөцийг зөрүүгүй болгоно.
 * 
 * Headers:
 *   x-api-key: <POS_SYNC_API_KEY>
 *   x-agent-id: <AGENT_IDENTIFIER> (optional)
 * 
 * Body:
 * {
 *   "syncId": "uuid-v4",              // Idempotency key
 *   "agentVersion": "1.0.0",
 *   "mode": "delta" | "full",         // delta = зөвхөн өөрчлөгдсөн, full = бүх бараа
 *   "posTimestamp": "ISO-8601",        // POS дээрх sync хийсэн цаг
 *   "items": [
 *     {
 *       "sku": "AA-001",
 *       "name": "Витамин C",
 *       "price": 45000,
 *       "costPrice": 30000,            // optional
 *       "stockQuantity": 25,           // POS дээрх БОДИТ нөөц (физик)
 *       "categoryName": "Витамин",     // optional
 *       "updatedAt": "ISO-8601"        // POS дээр хэзээ өөрчлөгдсөн
 *     }
 *   ]
 * }
 * 
 * ═══════════════════════════════════════════════════════════════
 * DELTA STOCK RESOLUTION STRATEGY:
 * 
 * POS-ийн stock нь физик дэлгүүрийн бодит тоо.
 * Cloud дээр reservedStock = онлайнаар захиалагдсан, бодитоор
 * зарагдаагүй (PENDING) бараа.
 * 
 * Тооцоолол:
 *   cloudStock = posStock - reservedStock
 *   (Онлайн үлдэгдэл = Физик нөөц - Онлайн reserve)
 * 
 * Жишээ:
 *   POS: 25 ширхэг бараа байна
 *   Cloud: 3 ширхэг reserve хийгдсэн (PENDING захиалга)
 *   → cloudStock = 25 - 3 = 22 (хэрэглэгчид 22 харагдана)
 * ═══════════════════════════════════════════════════════════════
 */
export async function POST(req: NextRequest) {
  // ──── 1. API KEY AUTH ────
  const apiKey = req.headers.get("x-api-key")
  if (!apiKey || apiKey !== process.env.POS_SYNC_API_KEY) {
    return NextResponse.json(
      { error: "Invalid API key" },
      { status: 401 }
    )
  }

  const startTime = Date.now()

  try {
    const body = await req.json()
    const { syncId, agentVersion, mode = "delta", items, posTimestamp } = body

    // ──── 2. VALIDATION ────
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "items array шаардлагатай" },
        { status: 400 }
      )
    }

    // ──── 3. IDEMPOTENCY CHECK ────
    if (syncId) {
      const existingLog = await db.activityLog.findFirst({
        where: { detail: { contains: syncId } },
      })
      if (existingLog) {
        return NextResponse.json({
          success: true,
          duplicate: true,
          message: "Энэ sync аль хэдийн боловсруулагдсан",
        })
      }
    }

    // ──── 4. BULK UPSERT WITH DELTA STOCK ────
    const results = {
      synced: 0,
      created: 0,
      skipped: 0,
      errors: [] as string[],
    }

    // Category cache (нэрээр category хайж, байхгүй бол үүсгэнэ)
    const categoryCache = new Map<string, string>()

    // 50 мөрөөр chunk болгож боловсруулна (DB overload-аас хамгаалах)
    const CHUNK_SIZE = 50
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE)

      await db.$transaction(async (tx) => {
        for (const item of chunk) {
          const sku = String(item.sku || "").trim()
          if (!sku) {
            results.skipped++
            continue
          }

          try {
            // ──── Category resolve ────
            let categoryId: string | undefined
            if (item.categoryName) {
              const catName = String(item.categoryName).trim()
              if (categoryCache.has(catName)) {
                categoryId = categoryCache.get(catName)
              } else {
                let cat = await tx.category.findFirst({
                  where: { name: { equals: catName, mode: "insensitive" } },
                })
                if (!cat) {
                  const slug = catName
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z0-9\-а-яөүё]/gi, "")
                  cat = await tx.category.create({
                    data: { name: catName, slug: slug || `cat-${Date.now()}` },
                  })
                }
                categoryId = cat.id
                categoryCache.set(catName, cat.id)
              }
            }

            // ──── Product lookup ────
            const existing = await tx.product.findUnique({
              where: { sku },
              select: {
                id: true,
                reservedStock: true,
                stockQuantity: true,
              },
            })

            const posStock = Number(item.stockQuantity ?? 0)

            if (existing) {
              // ════════════════════════════════════
              // DELTA STOCK RESOLUTION
              // ════════════════════════════════════
              // POS нь физик дэлгүүрийн бодит тоо.
              // reservedStock = cloud дээр PENDING захиалгаар түгжигдсэн.
              // 
              // stockQuantity-г POS-ийн утгаар шинэчилнэ.
              // reservedStock хэвээр үлдэнэ (CRON эсвэл payment confirm хасна).
              // Хэрэглэгчид харагдах = stockQuantity - reservedStock.
              //
              // Хэрвээ posStock < reservedStock бол:
              //   → Физик дэлгүүрт бараа зарагдаж reserve-ээс бага болсон.
              //   → reservedStock-ыг posStock хүртэл бууруулна (clash resolution).
              const adjustedReserved = Math.min(existing.reservedStock, posStock)

              await tx.product.update({
                where: { sku },
                data: {
                  stockQuantity: posStock,
                  reservedStock: adjustedReserved,
                  ...(item.price !== undefined && { price: Number(item.price) }),
                  ...(item.costPrice !== undefined && { costPrice: Number(item.costPrice) }),
                  ...(item.name && { name: String(item.name).trim() }),
                  ...(categoryId && { categoryId }),
                  status: posStock > adjustedReserved ? "ACTIVE" : "OUT_OF_STOCK",
                },
              })
              results.synced++
            } else {
              // ════════════════════════════════════
              // ШИНЭ БАРАА ҮҮСГЭХ
              // ════════════════════════════════════
              if (!item.name) {
                results.skipped++
                results.errors.push(`SKU "${sku}": нэр байхгүй, алгаслаа`)
                continue
              }

              const name = String(item.name).trim()
              const slug = name
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9\-а-яөүё]/gi, "")
                + `-${sku.toLowerCase()}`

              await tx.product.create({
                data: {
                  sku,
                  name,
                  slug,
                  price: Number(item.price || 0),
                  costPrice: item.costPrice ? Number(item.costPrice) : undefined,
                  stockQuantity: posStock,
                  status: posStock > 0 ? "ACTIVE" : "OUT_OF_STOCK",
                  ...(categoryId && { categoryId }),
                },
              })
              results.created++
            }
          } catch (err: any) {
            results.errors.push(`SKU "${sku}": ${err.message}`)
          }
        }
      }, { timeout: 60000 })
    }

    // ──── 5. FULL MODE: бусад барааг OUT_OF_STOCK ────
    if (mode === "full") {
      const syncedSkus = items
        .map((i: any) => String(i.sku || "").trim())
        .filter(Boolean)

      if (syncedSkus.length > 0) {
        const deactivated = await db.product.updateMany({
          where: {
            sku: { notIn: syncedSkus },
            status: "ACTIVE",
          },
          data: {
            status: "OUT_OF_STOCK",
            stockQuantity: 0,
          },
        })
        if (deactivated.count > 0) {
          results.errors.push(`Full mode: ${deactivated.count} бараа OUT_OF_STOCK болголоо`)
        }
      }
    }

    // ──── 6. ACTIVITY LOG ────
    const duration = Date.now() - startTime
    await db.activityLog.create({
      data: {
        userId: "SYSTEM",
        userName: "POS Agent",
        userRole: "API",
        action: "POS Sync",
        target: "Product",
        detail: [
          `SyncID: ${syncId || "N/A"}`,
          `Mode: ${mode}`,
          `Agent: ${agentVersion || "unknown"}`,
          `Items: ${items.length}`,
          `Synced: ${results.synced}`,
          `Created: ${results.created}`,
          `Skipped: ${results.skipped}`,
          `Duration: ${duration}ms`,
          `POS Time: ${posTimestamp || "N/A"}`,
        ].join(" | "),
      },
    })

    return NextResponse.json({
      success: true,
      ...results,
      duration: `${duration}ms`,
      message: `${results.synced} шинэчлэгдлээ, ${results.created} шинээр нэмэгдлээ`,
    })
  } catch (error: any) {
    console.error("[POS Webhook] Fatal:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// ──── GET: Статус шалгах endpoint ────
export async function GET(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key")
  if (!apiKey || apiKey !== process.env.POS_SYNC_API_KEY) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
  }

  const [total, active, oos, lastSync] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { status: "ACTIVE" } }),
    db.product.count({ where: { status: "OUT_OF_STOCK" } }),
    db.activityLog.findFirst({
      where: { action: "POS Sync" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, detail: true },
    }),
  ])

  return NextResponse.json({
    success: true,
    stats: { total, active, outOfStock: oos },
    lastSync: lastSync
      ? { time: lastSync.createdAt, detail: lastSync.detail }
      : null,
    serverTime: new Date().toISOString(),
  })
}

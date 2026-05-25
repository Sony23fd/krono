import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentAdmin } from "@/lib/auth"
import * as XLSX from "xlsx"

/**
 * POST /api/admin/products/bulk-upload
 * CSV/Excel файл upload → SKU-аар UPSERT (байвал шинэчлэх, байхгүй бол нэмэх)
 * 
 * CSV Template:
 * SKU | Нэр | Үнэ | Өртөг | Тоо | Жин | Хэмжих нэгж | Ангилал | Тайлбар | Хувилбар_SKU | Хувилбар_нэр | Хувилбар_Тоо
 */

interface ParsedProduct {
  sku: string
  name: string
  price: number
  costPrice?: number
  stockQuantity: number
  weight?: number
  unit?: string
  categoryName?: string
  description?: string
}

interface ParsedVariant {
  sku: string
  parentSku: string
  name: string
  stockQuantity: number
  price?: number
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Зөвхөн ADMIN эрхтэй" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File
  if (!file) {
    return NextResponse.json({ error: "Файл оруулна уу" }, { status: 400 })
  }

  // ──── PARSE ────
  const buffer = Buffer.from(await file.arrayBuffer())
  const workbook = XLSX.read(buffer, { type: "buffer" })
  const rawRows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[workbook.SheetNames[0]])

  if (!rawRows.length) {
    return NextResponse.json({ error: "Файл хоосон байна" }, { status: 400 })
  }
  if (rawRows.length > 10000) {
    return NextResponse.json({ error: "Нэг удаад 10,000 мөрөөс хэтрэхгүй" }, { status: 400 })
  }

  // ──── VALIDATE ────
  const products: ParsedProduct[] = []
  const variants: ParsedVariant[] = []
  const errors: { row: number; msg: string }[] = []
  const seenSkus = new Set<string>()

  for (let i = 0; i < rawRows.length; i++) {
    const r = rawRows[i]
    const row = i + 2 // Excel header = row 1

    const sku = String(r["SKU"] || r["sku"] || "").trim()
    const parentSku = String(r["Хувилбар_SKU"] || r["parent_sku"] || "").trim()

    if (!sku) { errors.push({ row, msg: "SKU хоосон" }); continue }
    if (seenSkus.has(sku)) { errors.push({ row, msg: `SKU давхардсан: ${sku}` }); continue }
    seenSkus.add(sku)

    // Variant мөр
    if (parentSku) {
      const vName = String(r["Хувилбар_нэр"] || r["variant_name"] || sku).trim()
      const vQty = Number(r["Хувилбар_Тоо"] || r["variant_qty"] || r["Тоо"] || 0)
      const vPrice = r["Үнэ"] || r["price"] ? Number(r["Үнэ"] || r["price"]) : undefined
      if (isNaN(vQty)) { errors.push({ row, msg: "Variant тоо буруу" }); continue }
      variants.push({ sku, parentSku, name: vName, stockQuantity: vQty, price: vPrice })
      continue
    }

    // Product мөр
    const name = String(r["Нэр"] || r["name"] || "").trim()
    const price = Number(r["Үнэ"] || r["price"])
    const costPrice = r["Өртөг"] || r["cost"] ? Number(r["Өртөг"] || r["cost"]) : undefined
    const qty = Number(r["Тоо"] || r["stock"] || 0)
    const weight = Number(r["Жин"] || r["weight"] || 0)
    const unit = String(r["Хэмжих нэгж"] || r["unit"] || "ширхэг").trim()
    const cat = String(r["Ангилал"] || r["category"] || "").trim()
    const desc = String(r["Тайлбар"] || r["description"] || "").trim()

    if (!name) { errors.push({ row, msg: "Нэр хоосон" }); continue }
    if (isNaN(price) || price <= 0) { errors.push({ row, msg: `Үнэ буруу: ${r["Үнэ"]}` }); continue }
    if (isNaN(qty)) { errors.push({ row, msg: `Тоо буруу: ${r["Тоо"]}` }); continue }

    products.push({ sku, name, price, costPrice, stockQuantity: qty, weight, unit, categoryName: cat, description: desc })
  }

  if (!products.length && !variants.length) {
    return NextResponse.json({
      success: false,
      errors: errors.slice(0, 50),
      message: "Зөв мөр олдсонгүй"
    }, { status: 400 })
  }

  // ──── UPSERT (100 мөрөөр chunk) ────
  const CHUNK = 100
  let inserted = 0, updated = 0, variantsProcessed = 0

  // Category cache
  const categoryCache = new Map<string, string>()

  // Products upsert
  for (let i = 0; i < products.length; i += CHUNK) {
    const chunk = products.slice(i, i + CHUNK)

    await db.$transaction(async (tx) => {
      for (const p of chunk) {
        // Category resolve (cached)
        let categoryId: string | undefined
        if (p.categoryName) {
          if (categoryCache.has(p.categoryName)) {
            categoryId = categoryCache.get(p.categoryName)
          } else {
              const slug = p.categoryName
                .toLowerCase()
                .trim()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9\-а-яөүё]/gi, "") || `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`

              let cat = await tx.category.findFirst({ 
                where: { OR: [{ name: p.categoryName }, { slug }] } 
              })

              if (!cat) {
                cat = await tx.category.create({
                  data: { name: p.categoryName.trim(), slug }
                })
              }
            categoryId = cat.id
            categoryCache.set(p.categoryName, cat.id)
          }
        }

        const slug = p.name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9\-а-яөүё]/gi, "")
          + `-${p.sku.toLowerCase()}`

        const existing = await tx.product.findUnique({ where: { sku: p.sku } })

        if (existing) {
          // ═══ UPDATE ═══
          await tx.product.update({
            where: { sku: p.sku },
            data: {
              name: p.name,
              price: p.price,
              costPrice: p.costPrice,
              stockQuantity: p.stockQuantity,
              weight: p.weight || 0,
              unit: p.unit || "ширхэг",
              description: p.description || undefined,
              status: p.stockQuantity > 0 ? "ACTIVE" : "OUT_OF_STOCK",
              ...(categoryId && { categoryId }),
            }
          })
          updated++
        } else {
          // ═══ INSERT ═══
          await tx.product.create({
            data: {
              sku: p.sku,
              name: p.name,
              slug,
              price: p.price,
              costPrice: p.costPrice,
              stockQuantity: p.stockQuantity,
              weight: p.weight || 0,
              unit: p.unit || "ширхэг",
              description: p.description || undefined,
              status: p.stockQuantity > 0 ? "ACTIVE" : "OUT_OF_STOCK",
              ...(categoryId && { categoryId }),
            }
          })
          inserted++
        }
      }
    }, { timeout: 120000 })
  }

  // Variants upsert
  for (let i = 0; i < variants.length; i += CHUNK) {
    const chunk = variants.slice(i, i + CHUNK)

    await db.$transaction(async (tx) => {
      for (const v of chunk) {
        const parent = await tx.product.findUnique({ where: { sku: v.parentSku } })
        if (!parent) {
          errors.push({ row: 0, msg: `Parent SKU олдсонгүй: ${v.parentSku}` })
          continue
        }

        const existing = await tx.productVariant.findUnique({ where: { sku: v.sku } })
        if (existing) {
          await tx.productVariant.update({
            where: { sku: v.sku },
            data: {
              name: v.name,
              stockQuantity: v.stockQuantity,
              ...(v.price !== undefined && { price: v.price }),
            }
          })
        } else {
          await tx.productVariant.create({
            data: {
              sku: v.sku,
              name: v.name,
              stockQuantity: v.stockQuantity,
              options: {},
              productId: parent.id,
              ...(v.price !== undefined && { price: v.price }),
            }
          })
        }
        variantsProcessed++
      }
    }, { timeout: 60000 })
  }

  // Activity log
  await db.activityLog.create({
    data: {
      userId: admin.id,
      userName: admin.name || "Админ",
      userRole: admin.role,
      action: "Бараа бөөнөөр оруулав",
      target: "Бараа",
      detail: `CSV upload: ${inserted} нэмэгдсэн, ${updated} шинэчлэгдсэн, ${variantsProcessed} хувилбар. Нийт мөр: ${rawRows.length}`,
    }
  })

  return NextResponse.json({
    success: true,
    inserted,
    updated,
    variantsProcessed,
    errors: errors.slice(0, 50),
    total: products.length + variants.length,
    message: `${inserted} нэмэгдлээ, ${updated} шинэчлэгдлээ, ${variantsProcessed} хувилбар боловсруулагдлаа`,
  })
}

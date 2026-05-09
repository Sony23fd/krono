import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentAdmin, logActivity } from "@/lib/auth"

/**
 * POST /api/admin/orders/import
 * Бараанууд CSV файлаас олноор import хийх
 * 
 * CSV Формат: sku, name, price, stockQuantity, categoryName, description
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "CSV файл шаардлагатай" }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean)

    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV файлд мэдээлэл олдсонгүй" }, { status: 400 })
    }

    // Parse header
    const header = lines[0].split(",").map(h => h.replace(/"/g, "").trim().toLowerCase())
    const skuIdx = header.indexOf("sku")
    const nameIdx = header.indexOf("name")
    const priceIdx = header.indexOf("price")
    const stockIdx = header.indexOf("stockquantity") !== -1 ? header.indexOf("stockquantity") : header.indexOf("stock")
    const catIdx = header.indexOf("category") !== -1 ? header.indexOf("category") : header.indexOf("categoryname")
    const descIdx = header.indexOf("description")

    if (skuIdx === -1 || nameIdx === -1) {
      return NextResponse.json({ error: "CSV-д 'sku' болон 'name' багана шаардлагатай" }, { status: 400 })
    }

    const results = { created: 0, updated: 0, skipped: 0, errors: [] as string[] }

    // Category cache
    const categoryCache = new Map<string, string>()

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i])
      const sku = cols[skuIdx]?.trim()
      const name = cols[nameIdx]?.trim()

      if (!sku || !name) {
        results.skipped++
        continue
      }

      const price = priceIdx !== -1 ? Number(cols[priceIdx]) || 0 : 0
      const stock = stockIdx !== -1 ? Number(cols[stockIdx]) || 0 : 0
      const catName = catIdx !== -1 ? cols[catIdx]?.trim() : undefined
      const description = descIdx !== -1 ? cols[descIdx]?.trim() : undefined

      // Category resolve
      let categoryId: string | undefined
      if (catName) {
        if (categoryCache.has(catName)) {
          categoryId = categoryCache.get(catName)
        } else {
          let cat = await db.category.findFirst({ where: { name: { equals: catName, mode: "insensitive" } } })
          if (!cat) {
            const slug = catName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-а-яөүё]/gi, "")
            cat = await db.category.create({ data: { name: catName, slug: slug || `cat-${Date.now()}` } })
          }
          categoryId = cat.id
          categoryCache.set(catName, cat.id)
        }
      }

      try {
        const existing = await db.product.findUnique({ where: { sku } })

        if (existing) {
          await db.product.update({
            where: { sku },
            data: {
              name,
              price,
              stockQuantity: stock,
              ...(description && { description }),
              ...(categoryId && { categoryId }),
              status: stock > 0 ? "ACTIVE" : "OUT_OF_STOCK",
            },
          })
          results.updated++
        } else {
          const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-а-яөүё]/gi, "") + `-${sku.toLowerCase()}`
          await db.product.create({
            data: {
              sku,
              name,
              slug,
              price,
              stockQuantity: stock,
              ...(description && { description }),
              ...(categoryId && { categoryId }),
              status: stock > 0 ? "ACTIVE" : "OUT_OF_STOCK",
            },
          })
          results.created++
        }
      } catch (err: any) {
        results.errors.push(`Мөр ${i + 1} (${sku}): ${err.message}`)
      }
    }

    await logActivity({
      userId: admin.id,
      userName: admin.name || "Админ",
      userRole: admin.role,
      action: "Бараа импорт",
      target: "Product",
      detail: `CSV импорт: ${results.created} шинээр, ${results.updated} шинэчлэв, ${results.skipped} алгасав`,
    })

    return NextResponse.json({
      success: true,
      ...results,
      message: `${results.created} шинээр нэмэгдлээ, ${results.updated} шинэчлэгдлээ`,
    })
  } catch (error: any) {
    console.error("[ProductImport] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * CSV мөрийг зөв parse хийх (quoted strings дотор comma-г тооцохгүй)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

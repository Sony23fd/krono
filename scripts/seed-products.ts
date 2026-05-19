/**
 * ═══════════════════════════════════════════════════════════════
 * Bileg Supermarket — HTML Product Seed Script
 * ═══════════════════════════════════════════════════════════════
 * 
 * Parses the exported POS HTML table and inserts products into
 * the Prisma database with proper category relationships.
 * 
 * Usage:
 *   1. npm install cheerio iconv-lite
 *   2. npx tsx scripts/seed-products.ts
 * 
 * The HTML file columns (per data row, 10 <td> cells):
 *   [0] empty (spacer)
 *   [1] productCode (e.g. "100002")
 *   [2] name (e.g. "Grey goose 1л")
 *   [3] barCode (e.g. "080480280017")
 *   [4] unit (e.g. "ширхэг")
 *   [5] costPrice (e.g. "163,443.94")
 *   [6] discount (e.g. "0.00")
 *   [7] sellingPrice (e.g. "245,000.00")
 *   [8] stockQuantity (e.g. "2")
 *   [9] empty (IE compat spacer)
 * 
 * Group/Category header rows have colspan="8" on the 2nd <td>,
 * containing text like "003  Ахл.Тэсэл Ундаасал" 
 * (groupCode + categoryName).
 */

import * as fs from "fs"
import * as path from "path"
import * as cheerio from "cheerio"
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

// ─── Configuration ────────────────────────────────────────────
const HTML_FILE = path.join(process.cwd(), "public", "20260505 - Copy (2).html")

// Try multiple encodings — the POS export may use various Mongolian encodings
const ENCODINGS_TO_TRY = ["utf-8", "utf-16le", "latin1"]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80) || "unnamed"
}

function parsePrice(raw: string): number {
  if (!raw) return 0
  // Remove commas, spaces, and parse
  const cleaned = raw.replace(/,/g, "").replace(/\s/g, "").trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : Math.round(num) // Round to whole tugrik
}

function cleanText(raw: string): string {
  return raw
    .replace(/&nbsp;/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

interface ParsedProduct {
  code: string
  name: string
  barcode: string
  costPrice: number
  sellingPrice: number
  stock: number
  categoryName: string
  categoryCode: string
}

async function main() {
  console.log("═══════════════════════════════════════════")
  console.log("  Bileg Supermarket — Product Seed Script  ")
  console.log("═══════════════════════════════════════════")
  console.log()

  // ─── 1. Read the HTML file ──────────────────────────────
  if (!fs.existsSync(HTML_FILE)) {
    console.error(`❌ HTML file not found: ${HTML_FILE}`)
    process.exit(1)
  }

  let html: string
  
  // Try reading with different approaches
  try {
    // First try: read as buffer and let cheerio handle it
    const buffer = fs.readFileSync(HTML_FILE)
    html = buffer.toString("utf-8")
    
    // If Mongolian characters are broken, try iconv-lite
    if (html.includes("?????????") || html.includes("??????")) {
      try {
        const iconv = require("iconv-lite")
        // Try common Mongolian encodings
        for (const enc of ["win1251", "cp1251", "iso-8859-5", "koi8-r"]) {
          const decoded = iconv.decode(buffer, enc)
          if (!decoded.includes("?????????")) {
            html = decoded
            console.log(`✅ File decoded with encoding: ${enc}`)
            break
          }
        }
      } catch {
        console.log("⚠️  iconv-lite not available, proceeding with UTF-8 (Mongolian text may be garbled)")
      }
    } else {
      console.log("✅ File read with UTF-8 encoding")
    }
  } catch (err: any) {
    console.error(`❌ Failed to read file: ${err.message}`)
    process.exit(1)
  }

  console.log(`📄 File size: ${(html.length / 1024).toFixed(0)} KB`)
  console.log()

  // ─── 2. Parse HTML with Cheerio ─────────────────────────
  const $ = cheerio.load(html)
  const rows = $("tr")
  console.log(`📊 Total <tr> rows found: ${rows.length}`)

  const products: ParsedProduct[] = []
  let currentCategoryName = "Ангилалгүй"
  let currentCategoryCode = "000"
  let skippedRows = 0
  let groupCount = 0

  rows.each((i, row) => {
    const cells = $(row).find("td")
    if (cells.length < 3) return // Skip spacer/header rows

    // Check if this is a GROUP HEADER row
    // Group headers have a cell with colspan="8" containing "003  Ахл.Тэсэл"
    const colspanCell = cells.filter(function () {
      return $(this).attr("colspan") === "8"
    })

    if (colspanCell.length > 0) {
      const groupText = cleanText(colspanCell.first().text())
      // Extract group code (first numeric part) and name
      const match = groupText.match(/^(\d+)\s+(.+)$/)
      if (match) {
        currentCategoryCode = match[1].trim()
        currentCategoryName = match[2].trim()
        groupCount++
      }
      return
    }

    // Check if this is a DATA ROW (has 10 cells, first data cell contains a numeric code)
    if (cells.length < 8) return

    const codeText = cleanText($(cells[1]).text())
    
    // Product rows have a numeric code in the first visible cell
    if (!/^\d{3,}$/.test(codeText)) return

    const name = cleanText($(cells[2]).text())
    const barcode = cleanText($(cells[3]).text())
    const costPriceRaw = cleanText($(cells[5]).text())
    const sellingPriceRaw = cleanText($(cells[7]).text())
    const stockRaw = cleanText($(cells[8]).text())

    // Skip rows with empty names
    if (!name || name === "" || name === "?" || name.length < 2) {
      skippedRows++
      return
    }

    const sellingPrice = parsePrice(sellingPriceRaw)
    const costPrice = parsePrice(costPriceRaw)
    const stock = parseInt(stockRaw) || 0

    // Skip products with 0 selling price
    if (sellingPrice <= 0) {
      skippedRows++
      return
    }

    products.push({
      code: codeText,
      name,
      barcode: barcode || codeText,
      costPrice,
      sellingPrice,
      stock: Math.max(0, stock),
      categoryName: currentCategoryName,
      categoryCode: currentCategoryCode,
    })
  })

  console.log(`✅ Parsed ${products.length} products across ${groupCount} categories`)
  console.log(`⏭️  Skipped ${skippedRows} invalid rows`)
  console.log()

  if (products.length === 0) {
    console.error("❌ No products parsed! Check the HTML file format.")
    process.exit(1)
  }

  // Show sample
  console.log("📋 Sample products (first 5):")
  products.slice(0, 5).forEach((p, i) => {
    console.log(`   ${i + 1}. [${p.code}] ${p.name} — ₮${p.sellingPrice.toLocaleString()} (stock: ${p.stock}) [${p.categoryName}]`)
  })
  console.log()

  // ─── 3. Create/Find Categories ──────────────────────────
  console.log("📁 Creating categories...")
  
  const uniqueCategories = [...new Map(
    products.map(p => [p.categoryCode, p.categoryName])
  ).entries()]

  const categoryMap = new Map<string, string>() // categoryCode -> categoryId

  for (const [code, name] of uniqueCategories) {
    const displayName = name || `Ангилал ${code}`
    const slug = slugify(displayName) + "-" + code

    try {
      const existing = await db.category.findFirst({
        where: { OR: [{ slug }, { name: displayName }] }
      })

      if (existing) {
        categoryMap.set(code, existing.id)
        console.log(`   ✓ Exists: "${displayName}" (${existing.id})`)
      } else {
        const created = await db.category.create({
          data: {
            name: displayName,
            slug,
            sortOrder: parseInt(code) || 0,
          }
        })
        categoryMap.set(code, created.id)
        console.log(`   + Created: "${displayName}" (${created.id})`)
      }
    } catch (err: any) {
      console.log(`   ⚠️  Category "${displayName}": ${err.message}`)
      // Try finding by name only
      const fallback = await db.category.findFirst({ where: { name: displayName } })
      if (fallback) categoryMap.set(code, fallback.id)
    }
  }

  console.log(`✅ ${categoryMap.size} categories ready`)
  console.log()

  // ─── 4. Insert Products (with duplicate SKU protection) ─
  console.log("📦 Inserting products...")

  let inserted = 0
  let updated = 0
  let duplicates = 0
  let errors = 0

  // Track used SKUs to avoid duplicates within this batch
  const usedSkus = new Set<string>()
  const usedSlugs = new Set<string>()

  for (const product of products) {
    // Generate unique SKU from product code
    let sku = product.barcode || product.code
    if (usedSkus.has(sku)) {
      sku = `${product.code}-${sku}`
    }
    if (usedSkus.has(sku)) {
      sku = `${sku}-${Date.now()}`
    }
    usedSkus.add(sku)

    // Generate unique slug
    let slug = slugify(product.name)
    let slugSuffix = 0
    let finalSlug = slug
    while (usedSlugs.has(finalSlug)) {
      slugSuffix++
      finalSlug = `${slug}-${slugSuffix}`
    }
    usedSlugs.add(finalSlug)

    const categoryId = categoryMap.get(product.categoryCode) || null

    try {
      // Check if product already exists by SKU
      const existing = await db.product.findUnique({ where: { sku } })

      if (existing) {
        // Update price and stock only
        await db.product.update({
          where: { id: existing.id },
          data: {
            price: product.sellingPrice,
            costPrice: product.costPrice,
            stockQuantity: product.stock,
            categoryId,
          }
        })
        updated++
      } else {
        // Also check slug uniqueness in DB
        const slugExists = await db.product.findUnique({ where: { slug: finalSlug } })
        if (slugExists) {
          finalSlug = `${finalSlug}-${product.code}`
        }

        await db.product.create({
          data: {
            sku,
            name: product.name,
            slug: finalSlug,
            price: product.sellingPrice,
            costPrice: product.costPrice,
            stockQuantity: product.stock,
            categoryId,
            status: product.stock > 0 ? "ACTIVE" : "OUT_OF_STOCK",
          }
        })
        inserted++
      }
    } catch (err: any) {
      if (err.code === "P2002") {
        duplicates++
      } else {
        errors++
        if (errors <= 5) {
          console.error(`   ❌ Error on "${product.name}": ${err.message}`)
        }
      }
    }

    // Progress indicator
    const total = inserted + updated + duplicates + errors
    if (total % 100 === 0) {
      process.stdout.write(`\r   Progress: ${total}/${products.length} (${Math.round(total / products.length * 100)}%)`)
    }
  }

  console.log()
  console.log()
  console.log("═══════════════════════════════════════════")
  console.log("  SEED COMPLETE — Summary                  ")
  console.log("═══════════════════════════════════════════")
  console.log(`  ✅ Inserted:   ${inserted}`)
  console.log(`  🔄 Updated:    ${updated}`)
  console.log(`  ⏭️  Duplicates: ${duplicates}`)
  console.log(`  ❌ Errors:     ${errors}`)
  console.log(`  📊 Total:      ${products.length}`)
  console.log("═══════════════════════════════════════════")

  await db.$disconnect()
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})

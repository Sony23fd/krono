import { readdir, readFile, unlink, mkdir, copyFile } from "fs/promises"
import { join, basename } from "path"
import { PrismaClient } from "@prisma/client"
import { processImage } from "../src/lib/image-processor"

const db = new PrismaClient()
const BULK_IMAGES_DIR = join(process.cwd(), "public", "bulk-images")
const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "products")

async function run() {
  console.log("=== Барааны зургуудыг SKU-ээр синк хийх ===")
  
  try {
    await mkdir(BULK_IMAGES_DIR, { recursive: true })
    await mkdir(UPLOAD_DIR, { recursive: true })
  } catch (err) {}

  async function getFiles(dir: string): Promise<string[]> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return []
    }
    const files: string[] = []
    for (const entry of entries) {
      const res = join(dir, entry.name)
      if (entry.isDirectory()) {
        files.push(...await getFiles(res))
      } else {
        files.push(res)
      }
    }
    return files
  }

  let files = await getFiles(BULK_IMAGES_DIR)
  if (files.length === 0) {
    console.log(`[Алдаа] ${BULK_IMAGES_DIR} хавтас хоосон эсвэл олдсонгүй!`)
    process.exit(1)
  }

  const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))

  if (imageFiles.length === 0) {
    console.log(`[Анхааруулга] ${BULK_IMAGES_DIR} хавтаст зураг (jpg, png, webp) олдсонгүй.`)
    process.exit(0)
  }

  console.log(`Нийт ${imageFiles.length} зураг олдлоо. Боловсруулж эхэллээ...\n`)

  // 1. Fetch all existing SKUs to accurately match filenames
  const allProducts = await db.product.findMany({ select: { sku: true, id: true, name: true } })
  const skuSet = new Set(allProducts.map(p => p.sku))
  const productMap = new Map(allProducts.map(p => [p.sku, p]))

  // Group by SKU
  const skuMap = new Map<string, string[]>()
  
  for (const file of imageFiles) {
    // file нь үнэмлэхүй зам (absolute path) байгаа тул зөвхөн нэрийг нь авна
    const fileName = basename(file)
    const baseName = fileName.replace(/\.[^/.]+$/, "")
    
    let sku = ""
    
    // Check if the exact filename is a valid SKU
    if (skuSet.has(baseName)) {
      sku = baseName
    } else {
      // Хэрэв файлын нэрний төгсгөлд _1 эсвэл -1 байвал салгаж шалгана. Жнь: 100153-1 -> 100153
      const match = baseName.match(/^(.*)[-_](\d+)$/)
      if (match && skuSet.has(match[1])) {
        sku = match[1]
      } else {
        // Олдсонгүй бол зүгээр л baseName-ээр нь бүртгэнэ (дараагийн шатанд алдаа заана)
        sku = baseName
      }
    }
    
    if (!skuMap.has(sku)) {
      skuMap.set(sku, [])
    }
    skuMap.get(sku)!.push(file)
  }

  let successCount = 0
  let notFoundCount = 0
  let errorCount = 0

  for (const [sku, filesForSku] of skuMap.entries()) {
    const product = productMap.get(sku)
    if (!product) {
      console.log(`[АЛГАСЛАА] SKU: ${sku} - Бааз дээр ийм бараа олдсонгүй! (${filesForSku.length} зураг)`)
      notFoundCount++
      continue
    }

    console.log(`[ОЛДСОН] SKU: ${sku} -> Бараа: ${product.name} (${filesForSku.length} зураг)`)

    // Эрэмбэлэх: PROD-001.jpg эхэндээ, дараа нь PROD-001_1.jpg, PROD-001_2.jpg гэх мэт...
    filesForSku.sort((a, b) => a.localeCompare(b))

    const uploadedUrls: string[] = []

    for (const file of filesForSku) {
      // file нь одоо абсолют зам болсон
      const filePath = file
      const buffer = await readFile(filePath)
      
      try {
        // processImage дотор sharp ашиглан 3 хэмжээтэй үүсгэж, public/uploads/products дотор хадгална
        const processed = await processImage(buffer, product.id, product.sku)
        
        uploadedUrls.push(processed.medium)
        console.log(`  -> Амжилттай боловсруулсан: ${file}`)
        
      } catch (err: any) {
        console.log(`  -> [АЛДАА] Зураг боловсруулахад алдаа гарлаа: ${file} - ${err.message}`)
        errorCount++
      }
    }

    if (uploadedUrls.length > 0) {
      const imageUrl = uploadedUrls[0]
      const additionalImages = uploadedUrls.slice(1)
      
      await db.product.update({
        where: { id: product.id },
        data: {
          imageUrl: imageUrl,
          images: additionalImages.length > 0 ? additionalImages : []
        }
      })
      console.log(`  -> Баазад зургуудыг холбож хадгаллаа!`)
      successCount++
    }
  }

  console.log(`\n=== ҮР ДҮНГИЙН ТАЙЛАН ===`)
  console.log(`Нийт олдсон SKU: ${skuMap.size}`)
  console.log(`Амжилттай зураг холбосон бараа: ${successCount}`)
  console.log(`Бараа нь олдоогүй SKU: ${notFoundCount}`)
  if (errorCount > 0) console.log(`Боловсруулах явцад алдаа гарсан зураг: ${errorCount}`)
  console.log(`===========================\n`)
}

run().catch(e => {
  console.error("Системийн алдаа гарлаа:", e)
  process.exit(1)
}).finally(() => {
  db.$disconnect()
})

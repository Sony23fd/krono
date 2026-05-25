import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentAdmin } from "@/lib/auth"
import { processImage } from "@/lib/image-processor"

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "Файл илгээгээгүй байна" }, { status: 400 })
    }

    const fileName = file.name
    // Extract base name without extension
    const baseName = fileName.replace(/\.[^/.]+$/, "")

    // 1. Fetch all SKUs (in a real app we might query just the matched SKU, but caching all SKUs is fast enough for single lookups, or we can just query exactly what we need)
    // Actually, querying the specific SKU is faster for a single file API.
    
    let sku = ""
    let isMain = false
    
    // First, check if baseName exactly matches a SKU
    let product = await db.product.findUnique({ where: { sku: baseName } })
    
    if (product) {
      sku = baseName
      isMain = true // Exact match -> Main image
    } else {
      // Check if it matches SKU_1 or SKU-1 pattern
      const match = baseName.match(/^(.*)[-_](\d+)$/)
      if (match) {
        const potentialSku = match[1]
        product = await db.product.findUnique({ where: { sku: potentialSku } })
        if (product) {
          sku = potentialSku
          isMain = false // Suffix -> Additional image
        }
      }
    }

    if (!product) {
      return NextResponse.json({ 
        success: false, 
        error: `SKU олдсонгүй: ${baseName}` 
      }, { status: 404 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const processed = await processImage(buffer, product.id)
    const newImageUrl = processed.medium

    // Update DB
    if (isMain) {
      await db.product.update({
        where: { id: product.id },
        data: { imageUrl: newImageUrl }
      })
    } else {
      // Append to additional images
      // images in Prisma is a JSON array if properly formatted, but it can be null.
      let currentImages: string[] = []
      if (product.images && Array.isArray(product.images)) {
        currentImages = product.images as string[]
      } else if (typeof product.images === "string") {
        try {
          const parsed = JSON.parse(product.images)
          if (Array.isArray(parsed)) currentImages = parsed
        } catch(e) {}
      }

      currentImages.push(newImageUrl)
      
      // If imageUrl is empty, maybe set it as main?
      const updateData: any = { images: currentImages }
      if (!product.imageUrl) {
        updateData.imageUrl = newImageUrl
        // Optionally remove it from additional? Let's leave it in both or just set as main.
      }

      await db.product.update({
        where: { id: product.id },
        data: updateData
      })
    }

    return NextResponse.json({
      success: true,
      message: "Амжилттай",
      sku: product.sku
    })

  } catch (error: any) {
    console.error("[BulkImageUpload Error]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

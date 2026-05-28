import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  validateUploadFile,
  processImage,
  saveVideo,
  deleteImage,
  type ProcessedImages,
} from "@/lib/image-processor"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const productId = formData.get("productId") as string
    const skipDbUpdate = formData.get("skipDbUpdate") === "true"

    if (!file || !productId) {
      return NextResponse.json(
        { error: "File and productId are required" },
        { status: 400 }
      )
    }

    // ── Validate ──
    const validation = validateUploadFile(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Fetch product to get SKU for folder organization
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { sku: true },
    })
    
    // Fallback to productId if SKU is somehow not found (e.g. invalid productId)
    // but in normal flow, it will be found.
    const sku = product?.sku || productId

    const buffer = Buffer.from(await file.arrayBuffer())

    // ── Process ──
    if (validation.isVideo) {
      // Video: save as-is (no sharp processing)
      const ext = file.name.split(".").pop() ?? "mp4"
      const videoUrl = await saveVideo(buffer, productId, sku, ext)

      if (!skipDbUpdate) {
        await db.product.update({
          where: { id: productId },
          data: { imageUrl: videoUrl },
        })
      }

      return NextResponse.json({
        success: true,
        url: videoUrl,
        imageUrl: videoUrl,
        videoUrl,
        type: "video",
      })
    }

    // Image: run through the sharp pipeline
    const images: ProcessedImages = await processImage(buffer, productId, sku)

    if (!skipDbUpdate) {
      // Store the medium-sized image as primary imageUrl
      // Store all responsive URLs in the images JSON field
      await db.product.update({
        where: { id: productId },
        data: {
          imageUrl: images.medium,
          images: {
            thumb: images.thumb,
            medium: images.medium,
            large: images.large,
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      url: images.medium,           // Backward compatible
      imageUrl: images.medium,
      type: "image",
      responsive: {
        thumb: images.thumb,         // 300x300 - mobile grid
        medium: images.medium,       // 600x600 - product detail
        large: images.large,         // 1200px  - zoom view
      },
    })
  } catch (error: any) {
    console.error("[Upload] Error:", error)
    return NextResponse.json(
      { error: error.message ?? "Upload failed" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    const success = await deleteImage(url)
    
    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, error: "Failed to delete file" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("[Upload Delete] Error:", error)
    return NextResponse.json(
      { error: error.message ?? "Delete failed" },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const productId = formData.get("productId") as string

    if (!file || !productId) {
      return NextResponse.json({ error: "File and productId are required" }, { status: 400 })
    }

    // Validate file type
    const isImage = file.type.startsWith("image/")
    const isVideo = file.type === "video/mp4" || file.type === "video/webm" || file.type.startsWith("video/")

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: "Only images or videos (MP4/WebM) are allowed" }, { status: 400 })
    }

    // Max 5MB for images, Max 15MB for videos
    const maxSize = isVideo ? 15 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: `File too large (max ${isVideo ? '15MB' : '5MB'})` }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save to /public/uploads/products/
    const uploadsDir = join(process.cwd(), "public", "uploads", "products")
    await mkdir(uploadsDir, { recursive: true })

    const ext = file.name.split(".").pop() ?? (isVideo ? "mp4" : "jpg")
    const filename = `${productId}-${Date.now()}.${ext}`
    const filepath = join(uploadsDir, filename)

    await writeFile(filepath, buffer)

    const skipDbUpdate = formData.get("skipDbUpdate") === "true"

    const fileUrl = `/uploads/products/${filename}`

    if (!skipDbUpdate) {
      // Update product.imageUrl in DB (videos also stored here since no separate videoUrl field)
      await db.product.update({
        where: { id: productId },
        data: { imageUrl: fileUrl }
      })
    }

    return NextResponse.json({ success: true, url: fileUrl, imageUrl: fileUrl, videoUrl: isVideo ? fileUrl : undefined, type: isVideo ? "video" : "image" })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: error.message ?? "Upload failed" }, { status: 500 })
  }
}

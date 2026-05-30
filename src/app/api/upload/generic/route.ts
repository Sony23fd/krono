import { NextRequest, NextResponse } from "next/server"
import { mkdir, writeFile, unlink } from "fs/promises"
import { join } from "path"
import sharp from "sharp"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = formData.get("folder") as string || "misc"

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Файл хэт том байна (Дээд тал нь 10MB)" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const uploadDir = `${process.cwd()}/public/uploads/${folder}`
    await mkdir(uploadDir, { recursive: true })

    const ext = file.name.split(".").pop()?.toLowerCase() || "webp"
    const timestamp = Date.now()
    const baseName = `img-${timestamp}`
    let finalUrl = ""

    if (file.type.startsWith("image/") && file.type !== "image/gif" && file.type !== "image/svg+xml") {
      // Optimize image with sharp
      await sharp(buffer)
        .webp({ quality: 85 })
        .toFile(join(uploadDir, `${baseName}.webp`))
      finalUrl = `/uploads/${folder}/${baseName}.webp`
    } else {
      // Save directly for non-images or SVGs/GIFs
      await writeFile(join(uploadDir, `${baseName}.${ext}`), buffer)
      finalUrl = `/uploads/${folder}/${baseName}.${ext}`
    }

    return NextResponse.json({ success: true, url: finalUrl })
  } catch (error: any) {
    console.error("[Generic Upload Error]:", error)
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url || !url.startsWith("/uploads/")) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    const filePath = join(process.cwd(), "public", url)
    await unlink(filePath).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Generic Delete Error]:", error)
    return NextResponse.json({ error: error.message || "Delete failed" }, { status: 500 })
  }
}

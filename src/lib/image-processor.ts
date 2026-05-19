import sharp from "sharp"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

// ═══════════════════════════════════════
// Image Processing Configuration
// ═══════════════════════════════════════

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "products")

const SIZES = {
  thumb: { width: 300, height: 300, fit: "cover" as const, suffix: "thumb" },
  medium: { width: 600, height: 600, fit: "contain" as const, suffix: "md" },
  large: { width: 1200, height: undefined, fit: "inside" as const, suffix: "lg" },
} as const

const WEBP_OPTIONS = {
  quality: 80,
  effort: 4,       // 0-6, higher = slower but smaller
  smartSubsample: true,
}

// Allowed MIME types
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
])

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_VIDEO_SIZE = 15 * 1024 * 1024 // 15MB

// ═══════════════════════════════════════
// Validation
// ═══════════════════════════════════════

export interface UploadValidation {
  valid: boolean
  error?: string
  isVideo: boolean
}

export function validateUploadFile(file: File): UploadValidation {
  const isImage = ALLOWED_TYPES.has(file.type)
  const isVideo = file.type === "video/mp4" || file.type === "video/webm"

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: "Зөвхөн зураг (jpg, png, webp) эсвэл видео (mp4, webm) оруулна уу.",
      isVideo: false,
    }
  }

  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Файлын хэмжээ хэтэрсэн байна (хамгийн ихдээ ${isVideo ? "15MB" : "5MB"}).`,
      isVideo,
    }
  }

  return { valid: true, isVideo }
}

// ═══════════════════════════════════════
// Image Processing Pipeline
// ═══════════════════════════════════════

export interface ProcessedImages {
  original: string
  thumb: string
  medium: string
  large: string
}

/**
 * Process an image buffer through the sharp pipeline:
 * 1. Convert to WebP
 * 2. Generate 3 responsive sizes (thumb, medium, large)
 * 3. Save all to disk
 * 4. Return URL paths
 */
export async function processImage(
  buffer: Buffer,
  productId: string,
  timestamp?: number
): Promise<ProcessedImages> {
  await mkdir(UPLOAD_DIR, { recursive: true })

  const ts = timestamp || Date.now()
  const baseName = `${productId}-${ts}`

  // Process all 3 sizes in parallel
  const [thumbPath, mediumPath, largePath] = await Promise.all([
    // ── Thumbnail (300x300 cover crop) ──
    sharp(buffer)
      .resize(SIZES.thumb.width, SIZES.thumb.height, {
        fit: SIZES.thumb.fit,
        position: sharp.strategy.entropy, // Smart crop: focus on the most "interesting" region
      })
      .webp(WEBP_OPTIONS)
      .toFile(join(UPLOAD_DIR, `${baseName}-${SIZES.thumb.suffix}.webp`))
      .then(() => `/uploads/products/${baseName}-${SIZES.thumb.suffix}.webp`),

    // ── Medium (600x600 contain with white bg) ──
    sharp(buffer)
      .resize(SIZES.medium.width, SIZES.medium.height, {
        fit: SIZES.medium.fit,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .flatten({ background: { r: 255, g: 255, b: 255 } }) // Ensure no transparency
      .webp(WEBP_OPTIONS)
      .toFile(join(UPLOAD_DIR, `${baseName}-${SIZES.medium.suffix}.webp`))
      .then(() => `/uploads/products/${baseName}-${SIZES.medium.suffix}.webp`),

    // ── Large (max 1200px wide, preserve aspect ratio) ──
    sharp(buffer)
      .resize(SIZES.large.width, SIZES.large.height, {
        fit: SIZES.large.fit,
        withoutEnlargement: true, // Don't upscale small images
      })
      .webp({ ...WEBP_OPTIONS, quality: 85 }) // Slightly higher quality for zoom view
      .toFile(join(UPLOAD_DIR, `${baseName}-${SIZES.large.suffix}.webp`))
      .then(() => `/uploads/products/${baseName}-${SIZES.large.suffix}.webp`),
  ])

  // Also save the medium as the "original" URL (backward compatible with imageUrl field)
  const originalUrl = mediumPath

  return {
    original: originalUrl,
    thumb: thumbPath,
    medium: mediumPath,
    large: largePath,
  }
}

/**
 * Save a video file without processing (just copy to uploads dir)
 */
export async function saveVideo(
  buffer: Buffer,
  productId: string,
  ext: string
): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true })
  const filename = `${productId}-${Date.now()}.${ext}`
  await writeFile(join(UPLOAD_DIR, filename), buffer)
  return `/uploads/products/${filename}`
}

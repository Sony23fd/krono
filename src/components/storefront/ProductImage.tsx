"use client"

import Image from "next/image"
import { useState, useEffect } from "react"

interface ProductImageProps {
  src: string
  alt: string
  fill?: boolean
  width?: number
  height?: number
  sizes?: string
  className?: string
  priority?: boolean
}

export function ProductImage({ src, alt, fill, width, height, sizes, className, priority }: ProductImageProps) {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Reset error and loaded states when src changes
  useEffect(() => {
    setError(false)
    setLoaded(false)
  }, [src])

  if (error || !src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium bg-slate-100">
        Зураггүй
      </div>
    )
  }

  // Local uploads don't need Next.js image optimization
  const isLocalUpload = src.startsWith("/uploads/")

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 bg-slate-100 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        sizes={sizes}
        className={className}
        priority={priority}
        unoptimized={isLocalUpload}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </>
  )
}

"use client"

import { useState } from "react"
import { ProductImage } from "@/components/storefront/ProductImage"
import { Package } from "lucide-react"

export function ProductGallery({ product }: { product: any }) {
  const [activeImage, setActiveImage] = useState<string | null>(product.imageUrl || null)
  
  const allImages: string[] = []
  if (product.imageUrl) allImages.push(product.imageUrl)
  if (Array.isArray(product.images)) {
    product.images.forEach((img: string) => {
      if (!allImages.includes(img)) allImages.push(img)
    })
  }

  if (allImages.length === 0) {
    return (
      <div className="aspect-[4/5] sm:aspect-square bg-slate-100 flex items-center justify-center overflow-hidden w-full relative">
        <div className="flex flex-col items-center text-slate-400 gap-2">
          <Package className="w-12 h-12" />
          <span className="text-sm font-medium">{product.name}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full">
      {/* Main Image */}
      <div className="aspect-[4/5] sm:aspect-square bg-slate-50 flex items-center justify-center overflow-hidden w-full relative">
        <ProductImage 
          src={activeImage || allImages[0]} 
          alt={product.name} 
          fill 
          sizes="(max-width: 768px) 100vw, 50vw" 
          className="object-cover w-full h-full transition-opacity duration-300"
          priority
        />
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-4 hide-scrollbar bg-white">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImage(img)}
              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all shadow-sm ${
                activeImage === img ? "border-[#E21B22] opacity-100 ring-2 ring-red-100 ring-offset-1" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <ProductImage
                src={img}
                alt={`${product.name} thumbnail ${idx + 1}`}
                fill
                sizes="80px"
                className="object-cover w-full h-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

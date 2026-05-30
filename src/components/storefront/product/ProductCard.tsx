"use client"

import Link from "next/link"
import { ProductImage } from "@/components/storefront/ProductImage"
import { AddToCartButton } from "@/components/storefront/AddToCartButton"
import { Heart, CheckCircle2 } from "lucide-react"
import { useFavorites } from "@/context/FavoritesContext"

export function ProductCard({ product, index = 0, theme = "default" }: { product: any, index?: number, theme?: "default" | "featured" | "sale" }) {
  const isPreOrder = Boolean(product.isPreOrder);
  const stockQty = product.remainingQuantity ?? product.stockQuantity;
  const hasStock = stockQty > 0;
  
  const price = Number(product.price) || 0;
  const comparePrice = Number(product.comparePrice) || 0;
  const hasDiscount = comparePrice > price;
  const discountPercentage = hasDiscount ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;
  
  const { isFavorite, toggleFavorite } = useFavorites()
  const isFav = isFavorite(product.id)

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(product.id)
  }

  // Parse secondary image for hover effect
  let secondaryImage = null;
  if (product.images) {
    try {
      const parsedImages = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
      if (Array.isArray(parsedImages) && parsedImages.length > 0) {
        // Find the first image that is not the primary image
        secondaryImage = parsedImages.find((img: string) => img !== product.imageUrl) || parsedImages[0];
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }

  return (
    <div 
      className="bg-white rounded-xl p-2.5 md:p-3.5 flex flex-col group border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
      suppressHydrationWarning
    >
      <Link href={`/product/${product.id}`} className="block relative bg-gray-50 rounded-lg overflow-hidden aspect-square mb-2.5 md:mb-3">
        {product.videoUrl ? (
          <video
            src={product.videoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 pointer-events-none"
          />
        ) : product.imageUrl ? (
          <>
            <ProductImage
              src={product.imageUrl}
              alt={product.name || "Бараа"}
              fill
              className={`object-cover w-full h-full transition-all duration-700 ${secondaryImage ? 'group-hover:opacity-0 group-hover:scale-105' : 'group-hover:scale-105'}`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={index < 4}
            />
            {secondaryImage && (
              <ProductImage
                src={secondaryImage}
                alt={`${product.name || "Бараа"} 2`}
                fill
                className="object-cover w-full h-full absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            )}
            
            {/* Quick View Floating Overlay */}
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
              <span className="bg-white text-slate-900 px-4 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-black/10 flex items-center gap-1.5 whitespace-nowrap border border-slate-100 hover:bg-[#F26522] hover:text-white transition-colors">
                Дэлгэрэнгүй
              </span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-medium text-sm">Зураггүй</div>
        )}

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-[#F26522] text-white px-2.5 py-1 rounded-tl-lg rounded-br-lg text-xs md:text-sm font-black flex items-center shadow-md shadow-orange-500/40 z-10 animate-bounce-slow" suppressHydrationWarning>
            <span>-{discountPercentage}%</span>
          </div>
        )}
        
        {/* Custom Badge (shifted right if discount exists) */}
        {product.customBadge && (
          <div className={`absolute top-2 ${hasDiscount ? 'left-14 md:left-16' : 'left-2'} bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] md:text-xs font-bold text-emerald-700 flex items-center gap-1 shadow-sm border border-emerald-100`} suppressHydrationWarning>
            <span>{product.customBadge}</span>
          </div>
        )}

        {/* Favorite Button */}
        <button 
          onClick={handleFavoriteClick}
          className="absolute top-2 right-2 w-7 h-7 md:w-8 md:h-8 rounded-lg bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-sm border border-slate-100 hover:bg-white hover:scale-110 active:scale-95 transition-all z-10"
        >
          <Heart className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isFav ? 'fill-[#F26522] text-[#F26522]' : 'text-slate-400'}`} />
        </button>
      </Link>

      <div className="flex-1 flex flex-col gap-1 md:gap-1.5">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold text-[#1B3561] text-sm md:text-base leading-snug hover:text-[#F26522] transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto pt-1 md:pt-2">
          {/* Price */}
          <div className="mb-2 md:mb-2.5">
            <div className="flex items-end gap-2">
              <p className="text-lg md:text-xl font-black text-[#1B3561] tracking-tight">
                ₮{price.toLocaleString()} <span className="text-sm md:text-base font-bold text-slate-400">/ {product.unit || "ширхэг"}</span>
              </p>
              {hasDiscount && (
                <p className="text-xs md:text-sm font-medium text-slate-400 line-through mb-0.5">
                  ₮{comparePrice.toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {Number(product.deliveryFee) > 0 && (
                <span className="text-[10px] md:text-[11px] text-slate-400 font-medium">+₮{Number(product.deliveryFee).toLocaleString()} хүргэлт</span>
              )}
              {hasStock && (
                <span className="text-[10px] md:text-[11px] text-emerald-600 font-bold">{stockQty} үлдсэн</span>
              )}
            </div>
          </div>

          <AddToCartButton
            batchId={product.id}
            name={product.name}
            imageUrl={product.imageUrl}
            unitPrice={price}
            deliveryFee={Number(product.deliveryFee || 0)}
            isPreOrder={product.isPreOrder}
            requiresAgeVerification={product.requiresAgeVerification}
          />
        </div>
      </div>
    </div>
  )
}

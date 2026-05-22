"use client"

import Link from "next/link"
import { ProductImage } from "@/components/storefront/ProductImage"
import { AddToCartButton } from "@/components/storefront/AddToCartButton"
import { Heart } from "lucide-react"
import { useFavorites } from "@/context/FavoritesContext"

export function SliderProductCard({ product }: { product: any }) {
  const stockQty = product.remainingQuantity ?? product.stockQuantity;
  
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

  return (
    <div 
      className="bg-white rounded-2xl p-3 flex flex-col group border border-gray-100 hover:shadow-md transition-all duration-300 h-full"
      suppressHydrationWarning
    >
      <Link href={`/product/${product.id}`} className="block relative bg-gray-50 rounded-xl overflow-hidden aspect-square mb-3">
        {product.imageUrl ? (
          <ProductImage
            src={product.imageUrl}
            alt={product.name || "Бараа"}
            fill
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 60vw, (max-width: 1024px) 30vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-medium text-sm">Зураггүй</div>
        )}

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-[#F26522] text-white px-2 py-1 rounded-md text-xs font-bold shadow-sm" suppressHydrationWarning>
            -{discountPercentage}%
          </div>
        )}

        {/* Custom Badge */}
        {product.customBadge && (
          <div className={`absolute top-2 ${hasDiscount ? 'left-[4.5rem]' : 'left-2'} bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] md:text-xs font-bold text-emerald-700 flex items-center gap-1 shadow-sm border border-emerald-100`} suppressHydrationWarning>
            <span>{product.customBadge}</span>
          </div>
        )}

        {/* Favorite Button */}
        <button 
          onClick={handleFavoriteClick}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-transparent border border-gray-200 flex items-center justify-center hover:bg-white transition-all z-10"
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-[#F26522] text-[#F26522]' : 'text-gray-400'}`} />
        </button>
      </Link>

      <div className="flex-1 flex flex-col gap-1.5">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug hover:text-[#F26522] transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto pt-2">
          {/* Price */}
          <div className="mb-3 flex items-end gap-2 flex-wrap">
            <p className="text-lg font-bold text-gray-900">
              ₮{price.toLocaleString()}
            </p>
            {hasDiscount && (
              <p className="text-sm font-medium text-gray-400 line-through mb-0.5">
                ₮{comparePrice.toLocaleString()}
              </p>
            )}
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

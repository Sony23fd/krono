"use client"

import Link from "next/link"
import { ProductImage } from "@/components/storefront/ProductImage"
import { AddToCartButton } from "@/components/storefront/AddToCartButton"
import { Heart, CheckCircle2 } from "lucide-react"
import { useFavorites } from "@/context/FavoritesContext"

export function ProductCard({ product, index = 0 }: { product: any, index?: number }) {
  const isPreOrder = Boolean(product.isPreOrder);
  const stockQty = product.remainingQuantity ?? product.stockQuantity;
  const hasStock = stockQty > 0;
  
  const { isFavorite, toggleFavorite } = useFavorites()
  const isFav = isFavorite(product.id)

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(product.id)
  }

  return (
    <div 
      className="bg-white rounded-2xl md:rounded-3xl p-3 md:p-4 flex flex-col group border border-slate-100 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
      suppressHydrationWarning
    >
      <Link href={`/product/${product.id}`} className="block relative bg-gray-50 rounded-xl md:rounded-2xl overflow-hidden aspect-square mb-3 md:mb-4">
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
          <ProductImage
            src={product.imageUrl}
            alt={product.name || "Бараа"}
            fill
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={index < 4}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-medium text-sm">Зураггүй</div>
        )}

        {/* Stock Badge */}
        {hasStock && (
          <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-white/95 backdrop-blur-sm px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold text-emerald-700 flex items-center gap-1 shadow-sm border border-emerald-100" suppressHydrationWarning>
            <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-500" />
            <span>Нөөцтэй</span>
          </div>
        )}

        {/* Favorite Button */}
        <button 
          onClick={handleFavoriteClick}
          className="absolute top-2 right-2 md:top-3 md:right-3 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-sm border border-slate-100 hover:bg-white hover:scale-110 active:scale-95 transition-all z-10"
        >
          <Heart className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isFav ? 'fill-[#E21B22] text-[#E21B22]' : 'text-slate-400'}`} />
        </button>
      </Link>

      <div className="flex-1 flex flex-col gap-1.5 md:gap-2">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold text-[#1B3561] text-sm md:text-base leading-snug hover:text-[#E21B22] transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto pt-1 md:pt-2">
          {/* Price */}
          <div className="mb-2 md:mb-3">
            <p className="text-lg md:text-xl font-black text-[#1B3561] tracking-tight">
              ₮{Number(product.price).toLocaleString()}
            </p>
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
            unitPrice={Number(product.price)}
            deliveryFee={Number(product.deliveryFee || 0)}
            isPreOrder={product.isPreOrder}
          />
        </div>
      </div>
    </div>
  )
}

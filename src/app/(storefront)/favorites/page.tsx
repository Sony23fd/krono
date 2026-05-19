"use client"

import { useState, useEffect } from "react"
import { useFavorites } from "@/context/FavoritesContext"
import { getProductsByIds } from "@/app/actions/product-actions"
import { ProductCard } from "@/components/storefront/product/ProductCard"
import Link from "next/link"
import { Heart } from "lucide-react"

export default function FavoritesPage() {
  const { favorites, isReady } = useFavorites()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFavorites() {
      if (!isReady) return
      
      if (favorites.length === 0) {
        setProducts([])
        setLoading(false)
        return
      }

      setLoading(true)
      const res = await getProductsByIds(favorites)
      if (res.success) {
        setProducts(res.products)
      }
      setLoading(false)
    }

    loadFavorites()
  }, [favorites, isReady])

  if (!isReady || loading) {
    return <div className="min-h-[50vh] flex items-center justify-center">Ачаалж байна...</div>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-[#E21B22]">
          <Heart className="w-6 h-6 fill-[#E21B22]" />
        </div>
        <h1 className="text-3xl font-extrabold text-[#1B3561]">Хадгалсан бараа</h1>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Heart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Танд хадгалсан бараа байхгүй байна</h2>
          <p className="text-slate-500 mb-6">Таалагдсан бараан дээрээ зүрхэн товчлуур дарж хадгалаарай.</p>
          <Link href="/shop" className="inline-flex items-center justify-center px-8 py-3 bg-[#1B3561] text-white font-bold rounded-xl hover:bg-blue-900 transition-colors">
            Бараа үзэх
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}

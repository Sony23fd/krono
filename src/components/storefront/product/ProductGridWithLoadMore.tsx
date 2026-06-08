"use client"

import { useState } from "react"
import { ProductCard } from "@/components/storefront/product/ProductCard"
import { ProductCardSkeleton } from "@/components/storefront/product/ProductCardSkeleton"
import { Package } from "lucide-react"

export function ProductGridWithLoadMore({
  initialProducts,
  initialTotalPages,
  initialPage,
  fetchNextPage
}: {
  initialProducts: any[],
  initialTotalPages: number,
  initialPage?: number,
  fetchNextPage: (page: number) => Promise<any[]>
}) {
  const [products, setProducts] = useState(initialProducts)
  const [page, setPage] = useState(initialPage || 1)
  const [loading, setLoading] = useState(false)
  
  // Keep track if props change (e.g. user changes filters/search)
  // Normally we would use a key on the component in the parent, but we can also just rely on React replacing the tree if the key changes.

  const handleLoadMore = async () => {
    if (loading || page >= initialTotalPages) return;
    setLoading(true);
    try {
      const newPage = page + 1;
      const nextProducts = await fetchNextPage(newPage);
      setProducts(prev => [...prev, ...nextProducts]);
      setPage(newPage);
      
      // Update URL to support scroll restoration on back navigation
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("page", newPage.toString());
        window.history.replaceState({}, "", url.toString());
      }
    } catch (error) {
      console.error("Failed to load more products:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <Package className="w-16 h-16 text-slate-200 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Бараа олдсонгүй</h2>
        <p className="text-slate-500 text-center max-w-md">Шүүлтүүр болон хайлтын нөхцлийг өөрчилж үзнэ үү.</p>
      </div>
    );
  }

  return (
    <div className="pb-12">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
        {products.map((product, index) => (
          <ProductCard key={`${product.id}-${index}`} product={product} index={index} />
        ))}
        
        {loading && (
          // Render 4 skeletons while loading
          Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={`skeleton-${i}`} />
          ))
        )}
      </div>

      {page < initialTotalPages && (
        <div className="mt-12 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-slate-300"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-slate-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Уншиж байна...
              </>
            ) : (
              "Цааш үзэх"
            )}
          </button>
        </div>
      )}
    </div>
  )
}

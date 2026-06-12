import { getActiveProducts } from "@/app/actions/product-actions"
import { ProductCard } from "@/components/storefront/product/ProductCard"
import { Suspense } from "react"
import { Package } from "lucide-react"

export const dynamic = "force-dynamic"

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6 mt-6">
      {Array.from({ length: 30 }).map((_, i) => (
        <div key={i} className="animate-pulse bg-slate-100 rounded-2xl h-[280px] w-full" />
      ))}
    </div>
  )
}

async function ProductGrid() {
  // Fetch a reasonably large number of products for the homepage
  const result = await getActiveProducts({ limit: 100 })
  const products = result?.products || []

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Package className="w-12 h-12 mb-4 opacity-50" />
        <p>Бараа олдсонгүй</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6 mt-6">
      {products.map((product: any) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

export default function StorefrontHomePage() {
  return (
    <div className="bg-slate-50 min-h-screen flex flex-col pb-10">
      <div className="max-w-7xl mx-auto px-4 w-full py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#1B3561] mb-2 tracking-tight">Бүх бараа</h1>
        <p className="text-slate-500 text-sm md:text-base mb-8">Манай дэлгүүрт байгаа бүх бараа бүтээгдэхүүнүүд</p>
        
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductGrid />
        </Suspense>
      </div>
    </div>
  )
}

import Link from "next/link"
import { TrendingUp } from "lucide-react"
import { ProductCard } from "@/components/storefront/product/ProductCard"

export function ActiveBatchesList({ 
  batches,
  title = "Яг одоо захиалах",
  subtitle = "Хамгийн эрэлттэй, захиалга нь нээлттэй байгаа бараанууд",
  badge = "Тренд бараанууд",
  theme = "ready",
  viewAllLink
}: { 
  batches: any[],
  title?: string | null,
  subtitle?: string | null,
  badge?: string | null,
  theme?: "ready" | "preorder" | string,
  viewAllLink?: string
}) {
  if (!batches || batches.length === 0) return null;

  return (
    <div id="batches" className="pt-12 pb-16 border-b border-indigo-50/50">
      <div className="max-w-6xl mx-auto px-4">
        {(title || badge || subtitle) && (
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              {badge && (
                <div className={`inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full border ${theme === "preorder" ? "bg-amber-100/50 border-amber-200/50 text-amber-600" : "bg-indigo-100/50 border-indigo-200/50 text-[#4e3dc7]"}`}>
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">{badge}</span>
                </div>
              )}
              {title && <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{title}</h2>}
              {subtitle && <p className="text-slate-500 mt-2 text-lg">{subtitle}</p>}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
          {batches.map((batch: any, index: number) => (
            <ProductCard key={batch.id} product={batch} index={index} />
          ))}
        </div>
        
        {viewAllLink && (
          <div className="mt-10 text-center">
            <Link 
              href={viewAllLink}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-indigo-100 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors"
            >
              Бүх барааг үзэх
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { ProductCard } from "@/components/storefront/product/ProductCard"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface ProductGridSectionProps {
  title: string
  products: any[]
  viewAllLink?: string
  viewAllText?: string
  theme?: "default" | "featured" | "sale"
}

export function ProductGridSection({
  title,
  products,
  viewAllLink,
  viewAllText = "Бүгдийг харах",
  theme = "default"
}: ProductGridSectionProps) {
  if (!products || products.length === 0) return null

  // Determine styling based on theme
  let containerClasses = "max-w-7xl mx-auto px-4 mb-12 md:mb-16 rounded-2xl py-8 md:py-10"
  let titleClasses = "text-2xl md:text-3xl font-extrabold text-[#1B3561] tracking-tight"
  
  if (theme === "featured") {
    containerClasses += " bg-gradient-to-br from-amber-50 to-blue-50 border border-amber-100 shadow-sm"
    titleClasses = "text-2xl md:text-3xl font-extrabold text-amber-600 tracking-tight"
  } else if (theme === "sale") {
    containerClasses += " bg-red-50/50 border border-red-100/50"
    titleClasses = "text-2xl md:text-3xl font-extrabold text-[#E21B22] tracking-tight"
  } else {
    containerClasses = "max-w-7xl mx-auto px-4 mb-10 md:mb-14"
  }

  return (
    <div className={containerClasses}>
      <div className="flex items-end justify-between mb-6 md:mb-8">
        <div>
          <h2 className={titleClasses}>{title}</h2>
          {theme === "featured" && <p className="text-sm text-slate-500 mt-1">Хамгийн эрэлттэй бараанууд</p>}
          {theme === "sale" && <p className="text-sm text-slate-500 mt-1">Хямдралтай бараануудыг амжиж аваарай</p>}
        </div>
        {viewAllLink && (
          <Link
            href={viewAllLink}
            className="hidden md:flex items-center gap-1 text-sm font-semibold text-[#4F46E5] hover:text-[#4338ca] transition-colors group"
          >
            {viewAllText}
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            theme={theme}
          />
        ))}
      </div>

      {viewAllLink && (
        <div className="mt-6 md:hidden">
          <Link
            href={viewAllLink}
            className="flex items-center justify-center gap-1.5 w-full bg-white border-2 border-[#1B3561]/10 text-[#1B3561] font-bold py-3.5 rounded-xl hover:bg-[#1B3561]/5 active:bg-[#1B3561]/10 transition-colors"
          >
            {viewAllText}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}

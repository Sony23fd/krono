"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import clsx from "clsx"

type Category = { id: string; name: string; slug: string }

export function ShopSidebar({ categories, selectedCategorySlug }: { categories?: Category[]; selectedCategorySlug?: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentCategory = selectedCategorySlug || searchParams.get("category") || "all"

  // Only show on large screens, on small screens ShopFilters handles categories
  return (
    <div className="hidden lg:block w-64 shrink-0 pr-8">
      <div className="sticky top-24">
        <h2 className="text-xl font-extrabold text-[#1B3561] mb-6 tracking-tight">Ангилал</h2>
        <ul className="space-y-2">
          <li>
            <Link
              href="/shop"
              className={clsx(
                "block px-4 py-2.5 rounded-xl font-semibold transition-all duration-200",
                currentCategory === "all"
                  ? "bg-[#F26522] text-white shadow-md shadow-red-500/20 translate-x-2"
                  : "text-slate-600 hover:bg-slate-100 hover:text-[#1B3561] hover:translate-x-1"
              )}
            >
              Бүх ангилал
            </Link>
          </li>
          {categories?.map((category) => (
            <li key={category.id}>
              <Link
                href={`/shop?category=${category.slug}`}
                className={clsx(
                  "block px-4 py-2.5 rounded-xl font-semibold transition-all duration-200",
                  currentCategory === category.slug
                    ? "bg-[#F26522] text-white shadow-md shadow-red-500/20 translate-x-2"
                    : "text-slate-600 hover:bg-slate-100 hover:text-[#1B3561] hover:translate-x-1"
                )}
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
        
        {/* Decorative elements or extra filters can go here */}
        <div className="mt-8 pt-8 border-t border-slate-200/60">
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-2">Тусламж хэрэгтэй юу?</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Та хайж буй бараагаа олохгүй бол бидэнтэй холбогдоорой.
            </p>
            <a href="tel:70001234" className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-bold text-[#1B3561] bg-white border border-slate-200 rounded-lg hover:border-[#1B3561] hover:bg-slate-50 transition-colors">
              Холбоо барих
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

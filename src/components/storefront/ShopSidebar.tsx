"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import clsx from "clsx"

type Category = { id: string; name: string; slug: string; parentId?: string | null; displayName?: string | null }

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
          {categories?.filter(c => !c.parentId).map((category) => {
            const subCats = categories.filter(sub => sub.parentId === category.id)
            return (
              <li key={category.id} className="space-y-1">
                <Link
                  href={`/shop?category=${category.slug}`}
                  className={clsx(
                    "block px-4 py-2.5 rounded-xl font-semibold transition-all duration-200",
                    currentCategory === category.slug
                      ? "bg-[#F26522] text-white shadow-md shadow-red-500/20 translate-x-2"
                      : "text-slate-700 hover:bg-slate-100 hover:text-[#1B3561] hover:translate-x-1"
                  )}
                >
                  {category.displayName || category.name}
                </Link>
                {subCats.length > 0 && (
                  <ul className="pl-4 space-y-1 border-l-2 border-slate-100 ml-4 mt-1">
                    {subCats.map(sub => (
                      <li key={sub.id}>
                        <Link
                          href={`/shop?category=${sub.slug}`}
                          className={clsx(
                            "block px-4 py-2 text-sm rounded-xl font-medium transition-all duration-200",
                            currentCategory === sub.slug
                              ? "bg-indigo-50 text-[#F26522] font-bold"
                              : "text-slate-500 hover:text-[#F26522] hover:bg-slate-50"
                          )}
                        >
                          {sub.displayName || sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
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

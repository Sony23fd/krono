"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function CategoryBar({ categories }: { categories: any[] }) {
  const pathname = usePathname()
  
  // Extract slug from /categories/[slug] or default to "all" for /shop
  let currentCategory = "all"
  if (pathname?.startsWith("/categories/")) {
    currentCategory = pathname.split("/categories/")[1]
  } else if (pathname === "/shop") {
    currentCategory = "all"
  } else {
    currentCategory = ""
  }

  return (
    <div className="bg-white border-b border-slate-100 hidden md:block">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-3">
          <Link
            href="/shop"
            className={`text-sm font-semibold whitespace-nowrap transition-colors ${
              currentCategory === "all"
                ? "text-[#F26522] border-b-2 border-[#F26522] pb-0.5"
                : "text-slate-600 hover:text-[#F26522]"
            }`}
          >
            Бүх бараа
          </Link>
          {categories.filter(c => !c.parentId).map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className={`text-sm font-semibold whitespace-nowrap transition-colors ${
                currentCategory === cat.slug
                  ? "text-[#F26522] border-b-2 border-[#F26522] pb-0.5"
                  : "text-slate-600 hover:text-[#F26522]"
              }`}
            >
              {cat.displayName || cat.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Search } from "lucide-react"
import { useEffect, useState } from "react"
import clsx from "clsx"
import { ChevronDown } from "lucide-react"

type Category = { id: string; name: string; slug: string }

export function ShopFilters({ categories, selectedCategorySlug }: { categories?: Category[]; selectedCategorySlug?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()


  const initialQuery = searchParams.get("q") || ""
  const currentCategory = selectedCategorySlug || searchParams.get("category") || "all"

  const [query, setQuery] = useState(initialQuery)

  // Sync state if URL changes directly
  useEffect(() => {
    setQuery(searchParams.get("q") || "")
  }, [searchParams])

  const buildQueryString = (params: URLSearchParams) => {
    const queryString = params.toString()
    return queryString ? `?${queryString}` : ""
  }

  const getCategoryRoute = (slug: string) => {
    return slug === "all" ? "/shop" : `/categories/${slug}`
  }

  const setCategory = (categorySlug: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("category") // ensure we don't have this in url

    if (categorySlug === "all") {
      const target = `/shop${buildQueryString(params)}`
      router.push(target, { scroll: false })
      return
    }

    const path = `/categories/${categorySlug}${buildQueryString(params)}`
    router.push(path, { scroll: false })
  }

  // Debounced search
  useEffect(() => {
    const currentQ = searchParams.get("q") || ""
    if (query === currentQ) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (query.trim()) {
        params.set("q", query.trim())
      } else {
        params.delete("q")
      }
      if (pathname?.startsWith("/categories")) {
        router.replace(`${pathname}${buildQueryString(params)}`, { scroll: false })
      } else {
        router.replace(`/shop${buildQueryString(params)}`, { scroll: false })
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [query, router, searchParams, pathname])



  return (
    <div className="max-w-6xl mx-auto px-4 w-full mb-8 space-y-4">
      <div className="flex flex-col gap-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 lg:bg-transparent lg:border-none lg:p-0">
        {categories && categories.length > 0 && (
          <div className="relative lg:hidden">
            <select
              value={currentCategory}
              onChange={(e) => setCategory(e.target.value)}
              className="appearance-none w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-[#F26522]/20 focus:border-[#F26522] pr-10 shadow-sm transition-all"
            >
              <option value="all">Бүх ангилал</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {(category as any).displayName || category.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">

          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={searchParams.get("sort") || "newest"}
                onChange={(e) => {
                  const params = new URLSearchParams(searchParams.toString())
                  params.set("sort", e.target.value)
                  if (pathname?.startsWith("/categories")) {
                    router.replace(`${pathname}${buildQueryString(params)}`, { scroll: false })
                  } else {
                    router.replace(`/shop${buildQueryString(params)}`, { scroll: false })
                  }
                }}
                className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#1B3561]/20 focus:border-[#1B3561] pr-8"
              >
                <option value="newest">Шинээр нэмэгдсэн</option>
                <option value="oldest">Хуучин эхлээд</option>
                <option value="price_asc">Үнэ: багаас их</option>
                <option value="price_desc">Үнэ: ихээс бага</option>
                <option value="stock_asc">Нөөц: багаас их</option>
                <option value="stock_desc">Нөөц: ихээс бага</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative flex-1 sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1B3561]/20 focus:border-[#1B3561] sm:text-sm transition-all"
                placeholder="Барааны нэрээр хайх..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

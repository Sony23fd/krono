"use client"

import { Search, ChevronDown } from "lucide-react"
import { useSearchParams } from "next/navigation"

export function HeaderSearchBar({ categories }: { categories: { id: string; name: string; slug: string }[] }) {
  const searchParams = useSearchParams()
  const selectedCategory = searchParams.get("category") || "all"
  const query = searchParams.get("q") || ""

  return (
    <form action="/shop" className="flex items-center w-full h-12 rounded-full border-2 border-blue-600 bg-white overflow-hidden group focus-within:ring-4 focus-within:ring-blue-600/20 transition-all">
      <div className="relative flex items-center bg-slate-100 px-4 border-r border-slate-200 hover:bg-slate-200 transition-colors shrink-0">
        <select
          name="category"
          defaultValue={selectedCategory}
          className="appearance-none w-full bg-transparent pr-8 text-sm font-semibold text-slate-700 outline-none cursor-pointer"
        >
          <option value="all">Бүх ангилал</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>{category.name}</option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 pointer-events-none" />
      </div>

      <input
        type="text"
        name="q"
        defaultValue={query}
        placeholder="Бараа хайх..."
        className="flex-1 h-full px-5 outline-none text-sm text-slate-800 placeholder:text-slate-400"
      />

      <button type="submit" className="h-full px-6 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors">
        <Search className="w-5 h-5" />
      </button>
    </form>
  )
}

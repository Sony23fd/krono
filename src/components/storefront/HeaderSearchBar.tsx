"use client"

import { useState, useRef, useEffect } from "react"
import { Search, ChevronDown, Check } from "lucide-react"
import { useSearchParams } from "next/navigation"

interface Category {
  id: string
  name: string
  slug: string
}

export function HeaderSearchBar({ categories }: { categories: Category[] }) {
  const searchParams = useSearchParams()
  const selectedSlug = searchParams.get("category") || "all"
  const query = searchParams.get("q") || ""

  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState(selectedSlug)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedLabel = selected === "all"
    ? "Бүх ангилал"
    : categories.find(c => c.slug === selected)?.name || "Бүх ангилал"

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <form action="/shop" className="flex items-center w-full h-11 md:h-12 rounded-full border-2 border-[#e63946] bg-white overflow-visible group focus-within:ring-4 focus-within:ring-[#e63946]/15 transition-all relative">
      {/* Hidden input to submit category */}
      <input type="hidden" name="category" value={selected} />

      {/* Custom Category Dropdown */}
      <div ref={dropdownRef} className="relative hidden md:flex items-center shrink-0">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 h-full pl-4 pr-3 py-2.5 bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-semibold text-gray-700 rounded-l-full border-r border-gray-200 whitespace-nowrap"
        >
          <span className="max-w-[100px] truncate">{selectedLabel}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Ангилал сонгох</p>
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              <button
                type="button"
                onClick={() => { setSelected("all"); setIsOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                  selected === "all"
                    ? "bg-[#e63946]/5 text-[#e63946] font-semibold"
                    : "text-gray-700 hover:bg-gray-50 hover:text-[#e63946]"
                }`}
              >
                <span>Бүх ангилал</span>
                {selected === "all" && <Check className="w-4 h-4 text-[#e63946]" />}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { setSelected(cat.slug); setIsOpen(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                    selected === cat.slug
                      ? "bg-[#e63946]/5 text-[#e63946] font-semibold"
                      : "text-gray-700 hover:bg-gray-50 hover:text-[#e63946]"
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  {selected === cat.slug && <Check className="w-4 h-4 text-[#e63946]" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search Input */}
      <input
        type="text"
        name="q"
        defaultValue={query}
        placeholder="Бараа хайх..."
        className="flex-1 h-full px-4 md:px-5 outline-none text-sm text-slate-800 placeholder:text-slate-400 bg-transparent"
      />

      {/* Submit Button */}
      <button
        type="submit"
        className="h-full px-4 md:px-5 flex items-center justify-center bg-[#e63946] text-white hover:bg-[#c8161d] transition-colors rounded-r-full"
      >
        <Search className="w-4.5 h-4.5 md:w-5 md:h-5" />
      </button>
    </form>
  )
}

"use client"

import { Heart } from "lucide-react"
import { useFavorites } from "@/context/FavoritesContext"
import Link from "next/link"

export function FavoritesBadgeIcon() {
  const { favorites } = useFavorites()
  const totalItems = favorites.length

  return (
    <Link href="/favorites" className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-[#1B3561] hover:bg-slate-200 transition-colors relative group">
      <Heart className="w-5 h-5 group-hover:text-[#E21B22] transition-colors" />
      {totalItems > 0 && (
        <span className="absolute top-1 right-0 bg-[#E21B22] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </Link>
  )
}

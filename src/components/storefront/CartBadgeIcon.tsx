"use client"

import { ShoppingCart } from "lucide-react"
import { useCart } from "@/context/CartContext"
import Link from "next/link"
import { useState, useEffect } from "react"

export function CartBadgeIcon() {
  const { totalCount } = useCart()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Use total quantity instead of distinct items
  const displayCount = mounted ? totalCount : 0

  return (
    <Link href="/cart" className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-[#1B3561] hover:bg-slate-200 transition-colors relative">
      <ShoppingCart className="w-5 h-5" />
      {displayCount > 0 && (
        <span className="absolute top-1 right-0 bg-[#F26522] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
          {displayCount > 99 ? "99+" : displayCount}
        </span>
      )}
    </Link>
  )
}

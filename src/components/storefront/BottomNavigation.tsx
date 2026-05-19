"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, LayoutGrid, ShoppingCart, User } from "lucide-react"
import { useCart } from "@/context/CartContext"

export function BottomNavigation() {
  const pathname = usePathname()
  const { items } = useCart()
  const cartCount = items.reduce((sum, i) => sum + i.qty, 0)

  const tabs = [
    { name: "Нүүр", href: "/", icon: Home },
    { name: "Ангилал", href: "/categories", icon: LayoutGrid },
    { name: "Сагс", href: "/cart", icon: ShoppingCart, badge: cartCount },
    { name: "Профайл", href: "/profile", icon: User },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-100 flex justify-around items-center h-16 px-1 z-50 shadow-[0_-2px_20px_rgba(0,0,0,0.06)]" suppressHydrationWarning>
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || (tab.href !== "/" && pathname?.startsWith(tab.href))
        const Icon = tab.icon

        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all ${
              isActive ? "text-[#E21B22]" : "text-slate-400"
            }`}
          >
            <div className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${isActive ? "bg-red-50" : ""}`}>
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : "stroke-[1.8px]"}`} />
              {tab.badge && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center bg-[#E21B22] text-white text-[10px] font-bold rounded-full px-1">
                  {tab.badge > 99 ? "99+" : tab.badge}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-semibold ${isActive ? "text-[#E21B22]" : "text-slate-500"}`}>
              {tab.name}
            </span>
          </Link>
        )
      })}
    </div>
  )
}

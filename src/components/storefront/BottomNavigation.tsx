"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, LayoutGrid, ShoppingCart, User } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { useCustomerAuth } from "@/context/CustomerAuthContext"

export function BottomNavigation() {
  const pathname = usePathname()
  const { items } = useCart()
  const { customer, isReady } = useCustomerAuth()
  const cartCount = items.reduce((sum, i) => sum + i.qty, 0)

  const tabs = [
    { name: "Дэлгүүр", href: "/", icon: Home },
    { name: "Ангилал", href: "/categories", icon: LayoutGrid },
    { name: "Сагс", href: "/cart", icon: ShoppingCart, badge: cartCount },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100/50 flex justify-around items-center h-16 px-2 z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]" suppressHydrationWarning>
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || (tab.href !== "/" && pathname?.startsWith(tab.href))
        const Icon = tab.icon

        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`relative flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-all duration-300 ${
              isActive ? "text-[#F26522]" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {/* Background glow indicator for active tab */}
            {isActive && (
              <div className="absolute -top-1 w-12 h-1 bg-[#F26522] rounded-b-md shadow-[0_4px_10px_rgba(242,101,34,0.5)]" />
            )}

            <div className={`relative flex items-center justify-center w-10 h-8 transition-all duration-300 ${isActive ? "-translate-y-1" : ""}`}>
              <Icon className={`w-[22px] h-[22px] transition-all duration-300 ${isActive ? "stroke-[2.5px] drop-shadow-sm" : "stroke-[1.8px]"}`} />
              {tab.badge && tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-[#F26522] text-white text-[10px] font-black rounded-full px-1 shadow-[0_2px_5px_rgba(242,101,34,0.4)] border-2 border-white">
                  {tab.badge > 99 ? "99+" : tab.badge}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-bold transition-all duration-300 ${isActive ? "text-[#F26522] -translate-y-0.5" : "text-slate-500"}`}>
              {tab.name}
            </span>
          </Link>
        )
      })}
    </div>
  )
}

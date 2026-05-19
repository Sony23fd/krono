"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Package, ShoppingBag, ListFilter, CreditCard, FileText, Truck, Users, Settings, Database, BookOpen, Activity } from "lucide-react"

type AdminRole = "ADMIN" | "CARGO_ADMIN" | "DATAADMIN"

interface SidebarItem {
  name: string
  url: string
  icon: React.ElementType
  highlight?: boolean
  roles: AdminRole[]
}

interface SidebarGroup {
  label: string
  items: SidebarItem[]
}

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    label: "ҮНДСЭН",
    items: [
      { name: "Хянах самбар", url: "/admin/home", icon: LayoutDashboard, roles: ["ADMIN", "CARGO_ADMIN", "DATAADMIN"] },
    ]
  },
  {
    label: "ЗАХИАЛГА",
    items: [
      { name: "Бүх захиалга", url: "/admin/orders", icon: ShoppingBag, roles: ["ADMIN", "CARGO_ADMIN"] },
      { name: "Харилцагчид", url: "/admin/customers", icon: Users, roles: ["ADMIN"] },
      { name: "Барааны жагсаалт", url: "/admin/products", icon: Package, roles: ["ADMIN"] },
      { name: "Ангилал & Төрөл", url: "/admin/categories", icon: ListFilter, roles: ["ADMIN"] },
    ]
  },
  {
    label: "СИСТЕМ & ТОХИРГОО",
    items: [
      { name: "Өгөгдлийн төв", url: "/admin/data-center", icon: Database, highlight: true, roles: ["DATAADMIN"] },
      { name: "Хэрэглэгчид", url: "/admin/users", icon: Users, roles: ["ADMIN", "DATAADMIN"] },
      { name: "Ерөнхий тохиргоо", url: "/admin/settings/general", icon: Settings, roles: ["ADMIN"] },
      { name: "Төлбөрийн тохиргоо", url: "/admin/settings/payment", icon: CreditCard, roles: ["ADMIN"] },
      { name: "Карго төлбөр", url: "/admin/cargo-settings", icon: CreditCard, highlight: true, roles: ["CARGO_ADMIN"] },
      { name: "Нөхцөлийн тохиргоо", url: "/admin/settings/terms", icon: FileText, roles: ["ADMIN"] },
      { name: "Үйлдлийн лог", url: "/admin/activity", icon: Activity, roles: ["ADMIN", "DATAADMIN"] },
      { name: "Гарын авлага", url: "/admin/guide", icon: BookOpen, roles: ["ADMIN", "CARGO_ADMIN"] },
    ]
  }
]

export function AdminSidebar({ className, role }: { className?: string; role: AdminRole }) {
  const pathname = usePathname()

  return (
    <aside className={cn("w-[260px] flex flex-col bg-[#001f3f] h-full", className)}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10 flex flex-col justify-center min-h-[72px]">
        <Link href="/admin/home" className="flex items-center gap-3 w-max">
          <div className="bg-[#e63946] text-white w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-red-900/30">
            B
          </div>
          <div>
            <h2 className="text-[15px] font-extrabold text-white tracking-tight leading-none">
              Bileg Admin
            </h2>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5">Супермаркет удирдлага</p>
          </div>
        </Link>
        {role === "CARGO_ADMIN" && (
          <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-300 bg-sky-500/15 rounded-md px-2.5 py-1 w-max border border-sky-500/20">
            <Truck className="w-3 h-3" />
            Карго Админ
          </div>
        )}
        {role === "DATAADMIN" && (
          <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-500/15 rounded-md px-2.5 py-1 w-max border border-purple-500/20">
            <Database className="w-3 h-3" />
            Дата Админ
          </div>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 min-h-0 px-3 py-5 space-y-6 overflow-y-auto custom-scrollbar">
        {SIDEBAR_GROUPS.map((group, idx) => {
          const visibleItems = group.items.filter(item => item.roles.includes(role))
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              <h3 className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {group.label}
              </h3>
              {visibleItems.map((item) => {
                const isActive = pathname.startsWith(item.url)
                return (
                  <Link
                    key={item.name}
                    href={item.url}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                      isActive
                        ? "bg-[#e63946] text-white shadow-lg shadow-red-900/30"
                        : item.highlight
                          ? "text-amber-300 hover:bg-white/5"
                          : "text-slate-300 hover:text-white hover:bg-white/8"
                    )}
                  >
                    <item.icon className={cn("w-[18px] h-[18px]", isActive ? "text-white" : item.highlight ? "text-amber-400" : "text-slate-500")} />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-4 py-3 border-t border-white/10 text-[11px] text-slate-500 font-medium flex items-center justify-between">
        <span>© Bileg 2026</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      </div>
    </aside>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  ListFilter,
  RefreshCw,
  ShoppingCart,
  Undo2,
  Users,
  Tag,
  Image as ImageIcon,
  Settings,
  Database,
  FileText,
  Truck,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Shield
} from "lucide-react"

type AdminRole = "ADMIN" | "CARGO_ADMIN" | "DATAADMIN"

interface SidebarItem {
  name: string
  url: string
  icon: React.ElementType
  roles: AdminRole[]
}

interface SidebarGroup {
  id: string
  label: string
  items: SidebarItem[]
}

const SIDEBAR_STRUCTURE: SidebarGroup[] = [
  {
    id: "general",
    label: "Үндсэн",
    items: [
      { name: "Хянах самбар", url: "/admin/home", icon: LayoutDashboard, roles: ["ADMIN", "CARGO_ADMIN", "DATAADMIN"] }
    ]
  },
  {
    id: "catalog",
    label: "Каталог",
    items: [
      { name: "Барааны жагсаалт", url: "/admin/products", icon: Package, roles: ["ADMIN"] },
      { name: "Ангилал & Төрөл", url: "/admin/categories", icon: ListFilter, roles: ["ADMIN"] },
      { name: "Өгөгдөл & POS Sync", url: "/admin/data-center", icon: RefreshCw, roles: ["DATAADMIN"] }
    ]
  },
  {
    id: "sales",
    label: "Борлуулалт",
    items: [
      { name: "Бүх захиалга", url: "/admin/orders", icon: ShoppingCart, roles: ["ADMIN", "CARGO_ADMIN"] },
      { name: "Буцаалт & Цуцлалт", url: "/admin/orders?status=CANCELLED", icon: Undo2, roles: ["ADMIN", "CARGO_ADMIN"] }
    ]
  },
  {
    id: "people",
    label: "Хэрэглэгчид",
    items: [
      { name: "Харилцагчид", url: "/admin/customers", icon: Users, roles: ["ADMIN"] }
    ]
  },
  {
    id: "marketing",
    label: "Маркетинг",
    items: [
      { name: "Хямдрал & Урамшуулал", url: "/admin/settings/general#discounts", icon: Tag, roles: ["ADMIN"] },
      { name: "Нүүрний баннер", url: "/admin/settings/general#banners", icon: ImageIcon, roles: ["ADMIN"] }
    ]
  },
  {
    id: "system",
    label: "Систем",
    items: [
      { name: "Ерөнхий тохиргоо", url: "/admin/settings/general", icon: Settings, roles: ["ADMIN"] },
      { name: "Төлбөрийн тохиргоо", url: "/admin/settings/payment", icon: Settings, roles: ["ADMIN"] },
      { name: "Карго тохиргоо", url: "/admin/cargo-settings", icon: Truck, roles: ["CARGO_ADMIN"] },
      { name: "Нөхцөлийн тохиргоо", url: "/admin/settings/terms", icon: FileText, roles: ["ADMIN"] },
      { name: "Админ хэрэглэгчид", url: "/admin/users", icon: Users, roles: ["ADMIN", "DATAADMIN"] },
      { name: "Үйлдлийн лог", url: "/admin/activity", icon: Database, roles: ["ADMIN", "DATAADMIN"] },
      { name: "Гарын авлага", url: "/admin/guide", icon: BookOpen, roles: ["ADMIN", "CARGO_ADMIN"] }
    ]
  }
]

export function AdminSidebar({ className, role }: { className?: string; role: AdminRole }) {
  const pathname = usePathname()
  
  // Track open/collapsed state of groups
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    general: false,
    catalog: false,
    sales: false,
    people: false,
    marketing: false,
    system: false,
  })

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }))
  }

  return (
    <aside className={cn("w-[260px] flex flex-col bg-[#001f3f] h-full transition-all duration-300", className)}>
      {/* Brand Header */}
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

      {/* Navigation Space */}
      <nav className="flex-1 min-h-0 px-3 py-5 space-y-4 overflow-y-auto custom-scrollbar">
        {SIDEBAR_STRUCTURE.map((group) => {
          const visibleItems = group.items.filter(item => item.roles.includes(role))
          if (visibleItems.length === 0) return null

          const isCollapsed = collapsedGroups[group.id]

          return (
            <div key={group.id} className="space-y-1">
              {/* Group Header - Clickable to expand/collapse */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors duration-150"
              >
                <span>{group.label}</span>
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3 text-slate-500" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                )}
              </button>

              {/* Group Items */}
              <div
                className={cn(
                  "space-y-0.5 transition-all duration-300 overflow-hidden",
                  isCollapsed ? "max-h-0 opacity-0 pointer-events-none" : "max-h-[500px] opacity-100"
                )}
              >
                {visibleItems.map((item) => {
                  // Active state check supporting exact or nested routing
                  const isActive = pathname === item.url || (item.url !== "/admin/home" && pathname.startsWith(item.url.split("?")[0]))

                  return (
                    <Link
                      key={item.name}
                      href={item.url}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                        isActive
                          ? "bg-[#e63946] text-white shadow-lg shadow-red-900/30"
                          : "text-slate-300 hover:text-white hover:bg-white/8"
                      )}
                    >
                      <item.icon className={cn("w-[18px] h-[18px]", isActive ? "text-white" : "text-slate-500")} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Footer Info */}
      <div className="px-4 py-3 border-t border-white/10 text-[11px] text-slate-500 font-medium flex items-center justify-between">
        <span>© Bileg 2026</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      </div>
    </aside>
  )
}

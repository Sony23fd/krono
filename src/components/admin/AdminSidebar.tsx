"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Package, ShoppingBag, Search, Activity, ListFilter, CheckCircle, XCircle, Clock, CreditCard, FileText, Truck, Users, Settings, Handshake, PackageCheck, Archive, BookOpen, Database, RefreshCcw } from "lucide-react"

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
      { name: "Хайх (Данс, Утас)", url: "/admin/orders/search", icon: Search, roles: ["ADMIN", "CARGO_ADMIN"] },
    ]
  },
  {
    label: "ЗАХИАЛГА",
    items: [
      { name: "Бүх захиалга", url: "/admin/orders", icon: ShoppingBag, roles: ["ADMIN", "CARGO_ADMIN"] },
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
      { name: "Үйлдлийн лог", url: "/admin/activity", icon: FileText, roles: ["ADMIN", "DATAADMIN"] },
      { name: "Гарын авлага", url: "/admin/guide", icon: BookOpen, roles: ["ADMIN", "CARGO_ADMIN"] },
    ]
  }
]

export function AdminSidebar({ className, role }: { className?: string; role: AdminRole }) {
  const pathname = usePathname()

  return (
    <aside className={cn("w-[280px] flex flex-col border-r border-slate-200 bg-white h-full shadow-sm", className)}>
      <div className="p-6 border-b border-slate-100 flex flex-col justify-center min-h-[80px]">
        <Link href="/admin/home" className="flex items-center gap-3 w-max">
          <div className="bg-[#4e3dc7] text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-200">
            A
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Anar Shop
          </h2>
        </Link>
        {role === "CARGO_ADMIN" && (
          <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 rounded-md px-2.5 py-1 w-max">
            <Truck className="w-3.5 h-3.5" />
            Карго Админ
          </div>
        )}
        {role === "DATAADMIN" && (
          <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 rounded-md px-2.5 py-1 w-max">
            <Database className="w-3.5 h-3.5" />
            Дата Админ
          </div>
        )}
      </div>
      
      <nav className="flex-1 min-h-0 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
        {SIDEBAR_GROUPS.map((group, idx) => {
          const visibleItems = group.items.filter(item => item.roles.includes(role))
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-3">
              <h3 className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                {group.label}
              </h3>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = pathname.startsWith(item.url)
                  return (
                    <Link
                      key={item.name}
                      href={item.url}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-indigo-50 text-[#4e3dc7]"
                          : item.highlight
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      )}
                    >
                      <item.icon className={cn("w-5 h-5", isActive ? "text-[#4e3dc7]" : item.highlight ? "text-amber-500" : "text-slate-400")} />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>
      <div className="p-4 border-t border-slate-100 text-xs text-slate-400 font-medium flex items-center justify-between">
        <span>EngiineeR</span>
        <span className="w-2 h-2 rounded-full bg-green-500"></span>
      </div>
    </aside>
  )
}

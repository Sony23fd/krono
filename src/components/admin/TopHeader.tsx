"use client"

import { useRouter, usePathname } from "next/navigation"
import { Menu, LogOut, Shield, Truck, Database, Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OrderNotificationListener } from "@/components/admin/OrderNotificationListener"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { AdminSidebar } from "@/components/admin/AdminSidebar"

interface AdminUser {
  id: string
  email: string
  name: string
  role: "ADMIN" | "CARGO_ADMIN" | "DATAADMIN"
}

const PAGE_TITLES: Record<string, string> = {
  "/admin/home": "Хянах самбар",
  "/admin/orders": "Захиалгууд",
  "/admin/customers": "Харилцагчид",
  "/admin/products": "Бараа бүтээгдэхүүн",
  "/admin/categories": "Ангилал & Төрөл",
  "/admin/settings": "Тохиргоо",
  "/admin/users": "Хэрэглэгчид",
  "/admin/activity": "Үйлдлийн лог",
  "/admin/data-center": "Өгөгдлийн төв",
  "/admin/cargo-settings": "Карго тохиргоо",
  "/admin/guide": "Гарын авлага",
}

function getPageTitle(pathname: string): string {
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(path)) return title;
  }
  return "Админ";
}

export function TopHeader({ admin }: { admin?: AdminUser | null }) {
  const router = useRouter()
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 print:!hidden" suppressHydrationWarning>
      {/* Left: Mobile menu + Page title */}
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger className="md:hidden p-2 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors">
            <Menu className="w-5 h-5" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[260px] bg-[#001f3f] border-none">
            <SheetTitle className="sr-only">Гар утасны цэс</SheetTitle>
            <AdminSidebar className="w-full" role={admin?.role || "CARGO_ADMIN"} />
          </SheetContent>
        </Sheet>
        <div className="hidden md:block">
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">{pageTitle}</h1>
        </div>
      </div>

      {/* Center: Search (Desktop) */}
      <div className="hidden lg:flex flex-1 max-w-xl mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Бараа, захиалга, харилцагч хайх..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F26522]/30 focus:border-[#F26522]/50 placeholder:text-slate-400 transition-all"
          />
        </div>
      </div>

      {/* Right: Notifications, User, Logout */}
      <div className="flex items-center gap-2">
        {admin && (
          <OrderNotificationListener />
        )}

        {/* User Pill */}
        {admin && (
          <div className="hidden sm:flex items-center gap-2.5 text-sm bg-slate-50 rounded-xl px-3 py-2 border border-slate-200/80">
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", 
              admin.role === "ADMIN" ? "bg-[#F26522]/10 text-[#F26522]" : 
              admin.role === "DATAADMIN" ? "bg-purple-100 text-purple-600" :
              "bg-sky-100 text-sky-600"
            )}>
              {admin.role === "ADMIN" ? (
                <Shield className="w-3.5 h-3.5" />
              ) : admin.role === "DATAADMIN" ? (
                <Database className="w-3.5 h-3.5" />
              ) : (
                <Truck className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="leading-tight">
              <p className="font-semibold text-slate-800 text-[13px]">{admin.name}</p>
              <p className="text-[10px] text-slate-400 font-medium">
                {admin.role === "ADMIN" ? "Үндсэн Админ" : admin.role === "DATAADMIN" ? "Дата Админ" : "Каргоны Админ"}
              </p>
            </div>
          </div>
        )}

        {/* Logout */}
        {admin && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Гарах"
            className="text-slate-400 hover:text-[#F26522] hover:bg-red-50 rounded-xl"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        )}
      </div>
    </header>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

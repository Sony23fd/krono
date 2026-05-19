import { ReactNode } from "react"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { TopHeader } from "@/components/admin/TopHeader"
import { getCurrentAdmin } from "@/lib/auth"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await getCurrentAdmin()

  if (!admin) {
    return <div className="min-h-screen w-full bg-slate-50">{children}</div>
  }

  return (
    <div className="flex h-screen w-full bg-[#f1f5f9] print:block print:h-auto print:overflow-visible">
      <AdminSidebar className="hidden md:flex print:!hidden" role={admin?.role || "CARGO_ADMIN"} />
      <div className="flex flex-col flex-1 w-full relative print:block print:h-auto print:overflow-visible">
        <TopHeader admin={admin} />
        <main className="flex-1 w-full p-4 overflow-y-auto overflow-x-hidden md:p-6 lg:p-8 relative print:!overflow-visible print:!h-auto print:!p-0">
          {children}
        </main>
      </div>
    </div>
  )
}


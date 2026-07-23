import { db } from "@/lib/db"
import { Building2, Plus, MapPin } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function BranchesPage() {
  const branches = await db.branch.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { inventory: true, users: true }
      }
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Салбарууд</h1>
          <p className="text-sm text-slate-500 mt-1">Агуулах болон дэлгүүрийн салбаруудын жагсаалт</p>
        </div>
        <button className="flex items-center gap-2 bg-[#F26522] hover:bg-[#d9551a] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Шинэ салбар
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map(branch => (
          <div key={branch.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-4 group hover:border-[#F26522]/30 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-[#F26522]/10 group-hover:text-[#F26522] transition-colors">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{branch.name}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 inline-block mt-1">
                    {branch.type === "MAIN_WAREHOUSE" ? "Төв Агуулах" : "Дэлгүүр"}
                  </span>
                </div>
              </div>
            </div>
            
            {branch.address && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="line-clamp-1">{branch.address}</span>
              </div>
            )}
            
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
              <div className="text-slate-500">
                Барааны нэр төрөл: <strong className="text-slate-900">{branch._count.inventory}</strong>
              </div>
              <div className="text-slate-500">
                Ажилчид: <strong className="text-slate-900">{branch._count.users}</strong>
              </div>
            </div>
          </div>
        ))}
        {branches.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
            Одоогоор салбар бүртгэгдээгүй байна
          </div>
        )}
      </div>
    </div>
  )
}

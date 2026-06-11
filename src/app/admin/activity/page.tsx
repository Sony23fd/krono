import { getCurrentAdmin } from "@/lib/auth"
import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { Shield, Truck, Clock } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; actionType?: string; days?: string; adminName?: string }>
}) {
  const admin = await getCurrentAdmin()
  if (!admin || admin.role !== "ADMIN") redirect("/admin/orders")

  const { page: pageStr, q, actionType, days, adminName } = await searchParams
  const page = parseInt(pageStr || "1")
  const pageSize = 50
  const skip = (page - 1) * pageSize

  // Build where clause based on multiple filters
  const where: any = {}
  
  if (q) {
    where.OR = [
      { userName: { contains: q, mode: "insensitive" } },
      { action: { contains: q, mode: "insensitive" } },
      { target: { contains: q, mode: "insensitive" } },
      { detail: { contains: q, mode: "insensitive" } },
    ]
  }

  if (actionType && actionType !== "ALL") {
    // If they select "CREATE", it should match anything containing CREATE or ADD
    if (actionType === "CREATE") {
      where.action = { in: ["CREATE_ORDER", "CREATE_BATCH", "CREATE_PRODUCT", "ADD_ITEM", "IMPORT_ORDERS"] } // Rough matching, or we can use contains logic
    } else {
      where.action = { contains: actionType, mode: "insensitive" }
    }
  }

  if (adminName && adminName !== "ALL") {
    where.userName = adminName
  }

  if (days && days !== "ALL") {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days))
    where.createdAt = { gte: cutoffDate }
  }

  const [logs, total, distinctUsers] = await Promise.all([
    (db as any).activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    (db as any).activityLog.count({ where }),
    (db as any).activityLog.groupBy({
      by: ['userName'],
      _count: { userName: true },
      orderBy: { _count: { userName: 'desc' } }
    }).catch(() => []), // Catch if unsupported by DB driver
  ])

  const totalPages = Math.ceil(total / pageSize)

  function formatDate(d: string) {
    const dt = new Date(d)
    return dt.toLocaleString("mn-MN", { dateStyle: "medium", timeStyle: "short" })
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Үйлдлийн лог</h1>
              <p className="text-slate-500 text-sm mt-1">Нийт {total} бичлэг олдлоо</p>
            </div>
          </div>
          <form method="GET" className="flex flex-wrap items-center gap-3">
            <select name="actionType" defaultValue={actionType || "ALL"} className="border-slate-300 rounded-lg text-sm bg-slate-50 focus:ring-indigo-500">
              <option value="ALL">Бүх үйлдэл</option>
              <option value="CREATE">Үүсгэсэн (Create)</option>
              <option value="UPDATE">Өөрчилсөн (Update)</option>
              <option value="DELETE">Устгасан (Delete)</option>
              <option value="LOGIN">Нэвтэрсэн (Login)</option>
            </select>
            
            <select name="adminName" defaultValue={adminName || "ALL"} className="border-slate-300 rounded-lg text-sm bg-slate-50 focus:ring-indigo-500">
              <option value="ALL">Бүх ажилтан</option>
              {distinctUsers.map((u: any) => (
                <option key={u.userName} value={u.userName}>{u.userName}</option>
              ))}
            </select>

            <select name="days" defaultValue={days || "ALL"} className="border-slate-300 rounded-lg text-sm bg-slate-50 focus:ring-indigo-500">
              <option value="ALL">Бүх хугацаа</option>
              <option value="1">Сүүлийн 24 цаг</option>
              <option value="7">Сүүлийн 7 хоног</option>
              <option value="30">Сүүлийн 1 сар</option>
            </select>

            <input
              name="q"
              defaultValue={q}
              placeholder="Түлхүүр үгээр хайх..."
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-48 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button type="submit" className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
              Шүүх
            </button>
            <a href="/admin/activity" className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors">
              Цэвэрлэх
            </a>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500 font-medium">
            <tr>
              <th className="px-4 py-3">Хэзээ</th>
              <th className="px-4 py-3">Хэн</th>
              <th className="px-4 py-3">Эрх</th>
              <th className="px-4 py-3">Үйлдэл</th>
              <th className="px-4 py-3">Объект</th>
              <th className="px-4 py-3">Дэлгэрэнгүй</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Лог бичлэг байхгүй байна
                </td>
              </tr>
            ) : logs.map((log: any) => {
              
              // Determine action badge color
              let actionColor = "bg-slate-100 text-slate-700"
              const act = log.action.toUpperCase()
              if (act.includes("CREATE") || act.includes("ADD") || act.includes("IMPORT")) actionColor = "bg-green-100 text-green-700 border-green-200"
              else if (act.includes("UPDATE") || act.includes("EDIT")) actionColor = "bg-blue-100 text-blue-700 border-blue-200"
              else if (act.includes("DELETE") || act.includes("REMOVE") || act.includes("REJECT")) actionColor = "bg-red-100 text-red-700 border-red-200"
              else if (act.includes("LOGIN") || act.includes("AUTH")) actionColor = "bg-amber-100 text-amber-700 border-amber-200"

              return (
              <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-4 whitespace-nowrap text-slate-500 text-xs align-top">
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(log.createdAt)}
                  </div>
                </td>
                <td className="px-4 py-4 font-bold text-slate-800 align-top text-sm">
                  <div className="mt-0.5">{log.userName}</div>
                </td>
                <td className="px-4 py-4 align-top">
                  {log.userRole === "ADMIN" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider mt-0.5">
                      <Shield className="w-3 h-3" /> Админ
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] bg-blue-50 border border-blue-100 text-blue-700 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider mt-0.5">
                      <Truck className="w-3 h-3" /> Карго
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 align-top">
                   <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider border shadow-sm mt-0.5 ${actionColor}`}>
                     {log.action.replace(/_/g, " ")}
                   </span>
                </td>
                <td className="px-4 py-4 align-top">
                  {log.targetUrl ? (
                    <a href={log.targetUrl} className="inline-block text-indigo-600 hover:text-indigo-800 font-semibold text-xs border border-indigo-100 bg-indigo-50/50 px-2 py-1 rounded transition-colors mt-0.5 max-w-[200px] truncate" title={log.target || log.targetUrl}>
                      {log.target || log.targetUrl}
                    </a>
                  ) : (
                    <span className="inline-block text-slate-600 font-medium text-xs bg-slate-50 border border-slate-100 px-2 py-1 rounded mt-0.5">{log.target || "—"}</span>
                  )}
                </td>
                <td className="px-4 py-4 text-slate-600 text-xs leading-relaxed align-top">
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 whitespace-pre-wrap break-words max-h-[150px] overflow-y-auto">
                    {log.detail || "Дэлгэрэнгүй мэдээлэл байхгүй"}
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
            Math.max(0, page - 3), page + 3
          ).map(p => (
            <a
              key={p}
              href={`?page=${p}${q ? `&q=${q}` : ""}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? "bg-indigo-600 text-white"
                  : "bg-white border text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

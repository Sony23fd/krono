import { db } from "@/lib/db"
import Link from "next/link"
import { Search, Package, Clock, CheckCircle2, XCircle, Truck } from "lucide-react"
import { DateRangeFilter } from "@/components/admin/DateRangeFilter"

export const dynamic = "force-dynamic"

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Хүлээгдэж буй",
  PAID: "Төлбөр баталгаажсан",
  PROCESSING: "Боловсруулж буй",
  SHIPPED: "Илгээгдсэн",
  DELIVERED: "Хүргэгдсэн",
  CANCELLED: "Цуцлагдсан",
  REFUNDED: "Буцаагдсан",
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-indigo-100 text-indigo-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-slate-100 text-slate-700",
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ days?: string, page?: string, status?: string }> }) {
  const p = await searchParams;
  const days = p.days ? parseInt(p.days, 10) : 30;
  const page = p.page ? parseInt(p.page, 10) : 1;
  const statusFilter = p.status || "ALL";
  const perPage = 30;

  const cutoffDate = days > 0 ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : undefined;

  const where: any = {
    ...(cutoffDate && { createdAt: { gte: cutoffDate } }),
    ...(statusFilter !== "ALL" && { orderStatus: statusFilter }),
  };

  const [orders, totalCount, statusCounts] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        items: { select: { productName: true, quantity: true, totalPrice: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.order.count({ where }),
    db.order.groupBy({
      by: ['orderStatus'],
      ...(cutoffDate && { where: { createdAt: { gte: cutoffDate } } }),
      _count: true,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / perPage);
  const statusCountMap: Record<string, number> = {};
  statusCounts.forEach(s => { statusCountMap[s.orderStatus] = s._count; });
  const allCount = Object.values(statusCountMap).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Global Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Захиалга Хайх</h2>
          <p className="text-sm text-slate-500 mb-4">Утас, данс, захиалгын дугаар эсвэл барааны нэрээр хайна уу.</p>
          <form action="/admin/orders/search" className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                name="q"
                placeholder="Хайх... (Ж: 99112233, 12345)"
                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm">
              Хайх
            </button>
          </form>
        </div>
      </div>

      {/* Status Tabs + Date Filter */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold text-slate-900">Захиалгууд</h1>
          <DateRangeFilter days={days} />
        </div>

        {/* Status filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <StatusTab label="Бүгд" count={allCount} active={statusFilter === "ALL"} href={`?days=${days}&status=ALL`} />
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <StatusTab key={key} label={label} count={statusCountMap[key] || 0} active={statusFilter === key} href={`?days=${days}&status=${key}`} />
          ))}
        </div>

        {/* Orders table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Дугаар</th>
                <th className="px-4 py-3 text-left">Захиалагч</th>
                <th className="px-4 py-3 text-left">Бараа</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-right">Дүн</th>
                <th className="px-4 py-3 text-right">Огноо</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.length > 0 ? orders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-bold text-indigo-600">
                    <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                      #{order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{order.customerName}</p>
                    <p className="text-xs text-slate-400">{order.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate text-slate-600">
                    {order.items.map(i => `${i.productName} (${i.quantity})`).join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.orderStatus] || "bg-slate-100 text-slate-600"}`}>
                      {STATUS_LABELS[order.orderStatus] || order.orderStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800">
                    ₮{Number(order.totalAmount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500 text-xs">
                    {new Date(order.createdAt).toLocaleDateString("mn-MN")}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">Захиалга олдсонгүй.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <a href={`?days=${days}&status=${statusFilter}&page=${Math.max(1, page - 1)}`}
              className={`px-4 py-2 border rounded-lg text-sm font-medium ${page <= 1 ? "opacity-50 pointer-events-none" : "hover:bg-slate-50"}`}>
              Өмнөх
            </a>
            <span className="text-sm font-medium text-slate-600 px-4">
              {page} / {totalPages} ({totalCount} захиалга)
            </span>
            <a href={`?days=${days}&status=${statusFilter}&page=${Math.min(totalPages, page + 1)}`}
              className={`px-4 py-2 border rounded-lg text-sm font-medium ${page >= totalPages ? "opacity-50 pointer-events-none" : "hover:bg-slate-50"}`}>
              Дараах
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusTab({ label, count, active, href }: { label: string; count: number; active: boolean; href: string }) {
  return (
    <a href={href}
      className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
        active 
          ? "bg-indigo-600 text-white border-indigo-600" 
          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
      }`}>
      {label} {count > 0 && <span className={active ? "text-indigo-200" : "text-slate-400"}>({count})</span>}
    </a>
  )
}

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

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ days?: string, page?: string, status?: string, userId?: string, customerName?: string, q?: string }> }) {
  const p = await searchParams;
  const userIdFilter = p.userId;
  const customerNameFilter = p.customerName;
  const q = p.q?.trim() || "";
  
  // Хэрэв тодорхой хэрэглэгчээр шүүж байвал default нь бүх хугацаа (days=0) байна.
  const days = p.days ? parseInt(p.days, 10) : (userIdFilter ? 0 : 30);
  const page = p.page ? parseInt(p.page, 10) : 1;
  const statusFilter = p.status || "ALL";
  const perPage = 30;

  const cutoffDate = days > 0 ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : undefined;
  const isNum = !isNaN(Number(q)) && q.length > 0;
  
  const searchFilter = q ? {
    OR: [
      { customerPhone: { contains: q } },
      { accountNumber: { contains: q } },
      ...(isNum ? [{ orderNumber: Number(q) }] : []),
    ],
  } : {};

  const where: any = {
    ...(cutoffDate && { createdAt: { gte: cutoffDate } }),
    ...(statusFilter !== "ALL" && { orderStatus: statusFilter }),
    ...(userIdFilter && { userId: userIdFilter }),
    ...searchFilter,
  };

  const groupByWhere: any = {
    ...(cutoffDate && { createdAt: { gte: cutoffDate } }),
    ...(userIdFilter && { userId: userIdFilter }),
    ...searchFilter,
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
      where: groupByWhere,
      _count: true,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / perPage);
  const statusCountMap: Record<string, number> = {};
  statusCounts.forEach(s => { statusCountMap[s.orderStatus] = s._count; });
  const allCount = Object.values(statusCountMap).reduce((a, b) => a + b, 0);

  let userSummary: any = null;
  if (userIdFilter) {
    const allUserOrders = await db.order.findMany({
      where: { userId: userIdFilter },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });

    const totalSpent = allUserOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalDeliveryFee = allUserOrders.reduce((sum, o) => sum + Number(o.deliveryFee), 0);
    const totalItemsCount = allUserOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
    
    // Aggregate items by product name
    const itemsMap = new Map<string, { qty: number, total: number }>();
    allUserOrders.forEach(o => {
      o.items.forEach(item => {
        const existing = itemsMap.get(item.productName) || { qty: 0, total: 0 };
        itemsMap.set(item.productName, {
          qty: existing.qty + item.quantity,
          total: existing.total + Number(item.totalPrice)
        });
      });
    });

    const aggregatedItems = Array.from(itemsMap.entries()).map(([name, data]) => ({
      name,
      qty: data.qty,
      total: data.total
    }));

    userSummary = {
      orderCount: allUserOrders.length,
      totalSpent,
      totalDeliveryFee,
      totalItemsCount,
      aggregatedItems,
      lastAddress: allUserOrders.find(o => o.deliveryAddress)?.deliveryAddress || "Байхгүй",
      phone: allUserOrders[0]?.customerPhone || ""
    };
  }

  return (
    <div className="space-y-6">
      {userIdFilter && userSummary && (
        <div className="bg-white border border-indigo-200 rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="bg-indigo-50 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-indigo-100">
            <div>
              <h3 className="font-bold text-lg text-indigo-900">Харилцагчийн нэгтгэл</h3>
              <p className="text-sm text-indigo-700">Одоо <strong>{customerNameFilter || "Энэ харилцагч"}</strong>-ын бүх цаг үеийн захиалгуудыг харж байна.</p>
            </div>
            <Link href="/admin/orders" className="bg-white border border-indigo-200 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl font-medium text-sm transition-colors whitespace-nowrap shadow-sm">
              Бүх захиалгыг харах
            </Link>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Нийт захиалга</p>
                <p className="text-2xl font-black text-slate-800">{userSummary.orderCount}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Нийт худалдан авалт</p>
                <p className="text-xl font-black text-green-600">₮{userSummary.totalSpent.toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Нийт бараа</p>
                <p className="text-2xl font-black text-blue-600">{userSummary.totalItemsCount}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Утас</p>
                <p className="text-xl font-black text-slate-800">{userSummary.phone}</p>
              </div>
            </div>

            <h4 className="font-bold text-slate-800 mb-4">Бүх захиалсан бараанууд (Нэгтгэл)</h4>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase text-xs">Бараа</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600 uppercase text-xs">Ширхэг</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600 uppercase text-xs">Нийт үнэ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {userSummary.aggregatedItems.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                      <td className="px-4 py-3 text-center font-bold text-blue-600">{item.qty}</td>
                      <td className="px-4 py-3 text-right text-slate-600 font-medium">₮{item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                  {userSummary.aggregatedItems.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-slate-500">Бараа олдсонгүй</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 items-start">
              <Truck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Сүүлд бүртгүүлсэн хаяг</p>
                <p className="text-sm text-amber-900 leading-relaxed font-medium">{userSummary.lastAddress}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Захиалга Хайх</h2>
          <p className="text-sm text-slate-500 mb-4">Утас, данс, захиалгын дугаар эсвэл барааны нэрээр хайна уу.</p>
          <form action="/admin/orders" className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Хайх... (Ж: 99112233, 12345)"
                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm">
              Хайх
            </button>
            {q && (
              <Link href="/admin/orders" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-medium transition-colors shadow-sm flex items-center">
                Цэвэрлэх
              </Link>
            )}
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
          <StatusTab label="Бүгд" count={allCount} active={statusFilter === "ALL"} href={`?days=${days}&status=ALL${userIdFilter ? `&userId=${userIdFilter}` : ''}${customerNameFilter ? `&customerName=${customerNameFilter}` : ''}${q ? `&q=${q}` : ''}`} />
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <StatusTab key={key} label={label} count={statusCountMap[key] || 0} active={statusFilter === key} href={`?days=${days}&status=${key}${userIdFilter ? `&userId=${userIdFilter}` : ''}${customerNameFilter ? `&customerName=${customerNameFilter}` : ''}${q ? `&q=${q}` : ''}`} />
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
                <th className="px-4 py-3 text-center">Үйлдэл</th>
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
                    <Link href={`/admin/customers?q=${order.customerPhone}`} className="group block">
                      <p className="font-medium text-slate-800 group-hover:text-indigo-600 transition-colors">{order.customerName}</p>
                      <p className="text-xs text-slate-400 group-hover:text-indigo-500 transition-colors">{order.customerPhone}</p>
                      {order.deliveryAddress && order.deliveryAddress.match(/^\[(.*?)\]/) && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded uppercase">
                          {order.deliveryAddress.match(/^\[(.*?)\]/)?.[1]}
                        </span>
                      )}
                    </Link>
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
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                    >
                      Удирдах →
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">Захиалга олдсонгүй.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <a href={`?days=${days}&status=${statusFilter}&page=${Math.max(1, page - 1)}${userIdFilter ? `&userId=${userIdFilter}` : ''}${customerNameFilter ? `&customerName=${customerNameFilter}` : ''}${q ? `&q=${q}` : ''}`}
              className={`px-4 py-2 border rounded-lg text-sm font-medium ${page <= 1 ? "opacity-50 pointer-events-none" : "hover:bg-slate-50"}`}>
              Өмнөх
            </a>
            <span className="text-sm font-medium text-slate-600 px-4">
              {page} / {totalPages} ({totalCount} захиалга)
            </span>
            <a href={`?days=${days}&status=${statusFilter}&page=${Math.min(totalPages, page + 1)}${userIdFilter ? `&userId=${userIdFilter}` : ''}${customerNameFilter ? `&customerName=${customerNameFilter}` : ''}${q ? `&q=${q}` : ''}`}
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

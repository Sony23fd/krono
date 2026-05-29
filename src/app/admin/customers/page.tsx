import { db } from "@/lib/db"
import Link from "next/link"
import { Users, Phone, ShoppingBag, Calendar, Search, User } from "lucide-react"

import { CustomerActions } from "./CustomerActions"

export const dynamic = "force-dynamic"

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const p = await searchParams
  const q = p.q?.trim() || ""
  const page = p.page ? parseInt(p.page, 10) : 1
  const perPage = 50

  const where: any = {
    role: "CUSTOMER",
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ],
    }),
  }

  const [customers, totalCount, totalOrders] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.user.count({ where }),
    db.user.count({ where: { role: "CUSTOMER" } }),
  ])

  const totalPages = Math.ceil(totalCount / perPage)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-500" /> Харилцагчид
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Нийт <strong>{totalOrders}</strong> бүртгэлтэй харилцагч
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <form className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Нэр эсвэл утасны дугаараар хайх..."
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors">
            Хайх
          </button>
          {q && (
            <Link href="/admin/customers" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors">
              Цэвэрлэх
            </Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3 text-left">Харилцагч</th>
              <th className="px-5 py-3 text-left">Утас</th>
              <th className="px-5 py-3 text-center">Захиалга</th>
              <th className="px-5 py-3 text-right">Бүртгүүлсэн</th>
              <th className="px-5 py-3 text-center">Үйлдэл</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.length > 0 ? customers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-50 rounded-full flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{c.name || "Нэргүй"}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{c.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">
                    {c.phone || "—"}
                  </span>
                </td>
                <td className="px-5 py-3 text-center">
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                    c._count.orders > 0 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    <ShoppingBag className="w-3 h-3" />
                    {c._count.orders}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-slate-500 text-xs">
                  <div className="flex items-center justify-end gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(c.createdAt).toLocaleDateString("mn-MN")}
                  </div>
                </td>
                <td className="px-5 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      href={`/admin/orders?userId=${c.id}&customerName=${encodeURIComponent(c.name || c.phone || "")}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                    >
                      Захиалга
                    </Link>
                    <CustomerActions 
                      customer={{
                        id: c.id,
                        name: c.name,
                        phone: c.phone,
                        address: c.address,
                        orderCount: c._count.orders
                      }}
                    />
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Users className="w-8 h-8" />
                    <p className="font-medium">{q ? "Хайлтын илэрц олдсонгүй" : "Бүртгэлтэй харилцагч байхгүй"}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 py-4 border-t">
            <a
              href={`?q=${q}&page=${Math.max(1, page - 1)}`}
              className={`px-4 py-2 border rounded-lg text-sm font-medium ${page <= 1 ? "opacity-50 pointer-events-none" : "hover:bg-slate-50"}`}
            >
              Өмнөх
            </a>
            <span className="text-sm font-medium text-slate-600 px-4">
              {page} / {totalPages} ({totalCount})
            </span>
            <a
              href={`?q=${q}&page=${Math.min(totalPages, page + 1)}`}
              className={`px-4 py-2 border rounded-lg text-sm font-medium ${page >= totalPages ? "opacity-50 pointer-events-none" : "hover:bg-slate-50"}`}
            >
              Дараах
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

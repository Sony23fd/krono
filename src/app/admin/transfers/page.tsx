import { db } from "@/lib/db"
import Link from "next/link"
import { ArrowRightLeft, Plus } from "lucide-react"
import { TransferActions } from "./TransferActions"

export const dynamic = "force-dynamic"

export default async function TransfersPage() {
  const transfers = await db.stockTransfer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      fromBranch: true,
      toBranch: true,
      createdBy: true,
      items: {
        include: { product: true }
      }
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Шилжүүлэг</h1>
          <p className="text-sm text-slate-500 mt-1">Салбар хооронд шилжүүлсэн барааны баримтууд</p>
        </div>
        <Link href="/admin/transfers/new" className="flex items-center gap-2 bg-[#F26522] hover:bg-[#d9551a] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Шилжүүлэг үүсгэх
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Баримтын №</th>
                <th className="px-6 py-4">Огноо</th>
                <th className="px-6 py-4">Чиглэл</th>
                <th className="px-6 py-4">Барааны тоо</th>
                <th className="px-6 py-4">Төлөв</th>
                <th className="px-6 py-4 text-right">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transfers.map(transfer => {
                const totalItems = transfer.items.reduce((acc, item) => acc + item.quantity, 0)
                return (
                  <tr key={transfer.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-900 font-medium">
                      {transfer.referenceNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(transfer.createdAt).toLocaleString("mn-MN")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-rose-600">{transfer.fromBranch.name}</span>
                        <ArrowRightLeft className="w-4 h-4 text-slate-300" />
                        <span className="font-semibold text-emerald-600">{transfer.toBranch.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-900 font-semibold">
                      {totalItems} ш ({transfer.items.length} нэр төрөл)
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${
                        transfer.status === "PENDING" ? "text-amber-700 bg-amber-50" :
                        transfer.status === "IN_TRANSIT" ? "text-blue-700 bg-blue-50" :
                        transfer.status === "COMPLETED" ? "text-emerald-700 bg-emerald-50" :
                        "text-slate-700 bg-slate-100"
                      }`}>
                        {transfer.status === "PENDING" ? "Хүлээгдэж буй" :
                         transfer.status === "IN_TRANSIT" ? "Замд яваа" :
                         transfer.status === "COMPLETED" ? "Хүлээн авсан" : "Цуцлагдсан"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <TransferActions transferId={transfer.id} status={transfer.status} />
                    </td>
                  </tr>
                )
              })}
              {transfers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Шилжүүлгийн баримт олдсонгүй
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

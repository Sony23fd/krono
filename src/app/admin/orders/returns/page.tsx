import { db } from "@/lib/db"
import { Undo2, Search, ArrowRight, Eye } from "lucide-react"
import Link from "next/link"

export default async function ReturnsPage() {
  const returns = await db.order.findMany({
    where: {
      orderStatus: { in: ["CANCELLED", "REFUNDED"] }
    },
    include: {
      items: true
    },
    orderBy: {
      updatedAt: "desc"
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Undo2 className="w-6 h-6 text-[#F26522]" /> Буцаалт & Цуцлалт
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Нийт {returns.length} ширхэг цуцлагдсан эсвэл буцаагдсан захиалга байна.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
            <tr>
              <th className="px-6 py-3.5">Төлөв</th>
              <th className="px-6 py-3.5">Захиалга #</th>
              <th className="px-6 py-3.5">Харилцагч</th>
              <th className="px-6 py-3.5">Буцаалтын шалтгаан</th>
              <th className="px-6 py-3.5 text-right">Үнийн дүн</th>
              <th className="px-6 py-3.5 text-right">Үйлдэл</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {returns.map(order => (
              <tr key={order.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    order.orderStatus === "REFUNDED" 
                      ? "bg-purple-100 text-purple-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {order.orderStatus === "REFUNDED" ? "БУЦААГДСАН" : "ЦУЦЛАГДСАН"}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono font-bold text-slate-900">
                  #{order.orderNumber}
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900">{order.customerName}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{order.customerPhone}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-red-600 font-medium italic">"{order.cancellationReason || "Тодорхойгүй"}"</p>
                  <p className="text-[10px] text-slate-400 mt-1">{new Date(order.updatedAt).toLocaleString()}</p>
                </td>
                <td className="px-6 py-4 text-right font-bold text-slate-900">
                  ₮{Number(order.totalAmount).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    href={`/admin/orders/${order.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium text-xs transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Дэлгэрэнгүй
                  </Link>
                </td>
              </tr>
            ))}
            {returns.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                  <Undo2 className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                  <p className="font-medium text-slate-600">Буцаагдсан болон цуцлагдсан захиалга алга байна.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { getOrdersByQuery } from "@/app/actions/track-actions"
import { getShopSettings } from "@/app/actions/settings-actions"
import { 
  CheckCircle2, 
  Truck, 
  Package, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Search, 
  History,
  AlertTriangle
} from "lucide-react"
import PhoneTracker from "./PhoneTracker"
import { TrackAutoQuery } from "./TrackAutoQuery"
import { Suspense } from "react"

export const dynamic = "force-dynamic"

// Статус-ыг тодорхойлох helper
const STATUS_STYLES: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  PENDING: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  PAID: { icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  PROCESSING: { icon: Package, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
  SHIPPED: { icon: Truck, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
  DELIVERED: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
  CANCELLED: { icon: XCircle, color: "text-red-500", bg: "bg-red-50", border: "border-red-200" },
  REFUNDED: { icon: AlertCircle, color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200" },
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Хүлээгдэж буй",
  PAID: "Төлбөр баталгаажсан",
  PROCESSING: "Боловсруулж буй",
  SHIPPED: "Илгээгдсэн",
  DELIVERED: "Хүргэгдсэн",
  CANCELLED: "Цуцлагдсан",
  REFUNDED: "Буцаагдсан",
}

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string, q?: string }>
}) {
  const resolvedParams = await searchParams
  const q = resolvedParams.q || resolvedParams.account

  const [settings, queryData] = await Promise.all([
    getShopSettings(),
    q ? getOrdersByQuery(q) : Promise.resolve({ orders: [], success: true }),
  ])
  const orders = queryData.orders || []

  const activeOrders = orders.filter((o: any) => !["CANCELLED", "DELIVERED", "REFUNDED"].includes(o.orderStatus))
  const completedOrders = orders.filter((o: any) => ["CANCELLED", "DELIVERED", "REFUNDED"].includes(o.orderStatus))

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Нэвтэрсэн хэрэглэгчийн утсыг автоматаар хайх */}
      <Suspense fallback={null}>
        <TrackAutoQuery />
      </Suspense>
      {/* Global Delivery Delay Warning */}
      {settings.delivery_delay_active === "true" && (
        <div className="mb-8 bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 shadow-sm flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-white border border-amber-200 flex items-center justify-center shrink-0 text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-amber-900">Хүргэлтийн Анхааруулга</h4>
            <p className="text-sm text-amber-800/80 font-medium italic">&quot;{settings.delivery_delay_message}&quot;</p>
          </div>
        </div>
      )}

      {!q ? (
        <div className="py-20 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Захиалга хайх</h2>
          <p className="text-slate-500">Утасны дугаар эсвэл дансны дугаараа оруулан хайна уу.</p>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
              Хайлтын үр дүн: <span className="text-[#4F46E5]">{q}</span>
            </h1>
            <p className="text-slate-500 mt-1 font-medium">Нийт захиалга: {orders.length}</p>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed p-12 text-center text-slate-500 font-medium">
              Хайлтын илэрц олдсонгүй. Утас, данс-аа шалгана уу.
            </div>
          ) : (
            <div className="space-y-12">
              {/* Active Orders */}
              <div>
                <h2 className="text-xl font-bold text-slate-800 border-b pb-3 mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" /> Идэвхтэй захиалга
                </h2>
                {activeOrders.length > 0 ? (
                  <div className="space-y-4">
                    {activeOrders.map((order: any) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-lg p-8 text-center text-slate-500 border font-medium italic">
                    Одоогоор идэвхтэй захиалга алга байна.
                  </div>
                )}
              </div>

              {/* Completed Orders */}
              {completedOrders.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-800 border-b pb-3 mb-6 flex items-center gap-2">
                    <History className="w-5 h-5 text-green-500" /> Өмнөх түүх
                  </h2>
                  <div className="space-y-4">
                    {completedOrders.map((order: any) => (
                      <OrderCard key={order.id} order={order} completed />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function OrderCard({ order, completed = false }: { order: any; completed?: boolean }) {
  const style = STATUS_STYLES[order.orderStatus] || STATUS_STYLES.PENDING
  const StatusIcon = style.icon
  const isCancelled = order.orderStatus === "CANCELLED"

  return (
    <div className={`bg-white rounded-xl border overflow-hidden transition-all ${completed ? "opacity-70" : ""} ${isCancelled ? "border-l-4 border-l-red-400" : ""}`}>
      {/* Header */}
      <div className="bg-slate-50/30 border-b border-slate-100 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${style.bg} ${style.border}`}>
            <StatusIcon className={`w-4 h-4 ${style.color}`} />
          </div>
          <div>
            <p className="text-sm font-extrabold text-slate-800">
              Захиалга #{order.orderNumber}
            </p>
            <p className="text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
              {new Date(order.createdAt).toLocaleDateString("mn-MN")} · {order.customerName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${style.bg} ${style.border} ${style.color}`}>
            {STATUS_LABELS[order.orderStatus] || order.orderStatus}
          </span>
          <span className={`font-black text-lg ${isCancelled || completed ? "text-slate-400" : "text-slate-900"}`}>
            ₮{Number(order.totalAmount).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-slate-50">
        {order.items?.map((item: any) => (
          <div key={item.id} className="px-5 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className={`font-bold text-sm truncate ${isCancelled ? "text-slate-400" : "text-slate-800"}`}>
                {item.productName}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wide">
                SKU: {item.sku} · {item.quantity} ширхэг
              </p>
            </div>
            <span className="text-sm font-bold text-slate-700 shrink-0">
              ₮{Number(item.totalPrice).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Delivery info */}
      {order.wantsDelivery && order.deliveryAddress && (
        <div className="px-5 py-3 bg-blue-50/50 border-t border-blue-100">
          <div className="flex items-start gap-2.5">
            <Truck className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-black text-blue-800/60 uppercase tracking-widest mb-1">Хүргэлтийн хаяг:</p>
              <p className="text-sm text-blue-900 font-semibold">{order.deliveryAddress}</p>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation reason */}
      {isCancelled && order.cancellationReason && (
        <div className="px-5 py-3 bg-red-50/50 border-t border-red-100">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-black text-red-800/60 uppercase tracking-widest mb-1">Шалтгаан:</p>
              <p className="text-[11px] text-red-700 font-bold italic">&quot;{order.cancellationReason}&quot;</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

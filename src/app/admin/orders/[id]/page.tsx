import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { ArrowLeft, Package, User, Phone, CreditCard, MapPin, Clock } from "lucide-react"
import Link from "next/link"
import { adminConfirmPayment, cancelOrder, updateOrderStatus } from "@/app/actions/order-actions"
import { Button } from "@/components/ui/button"

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

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      payments: true,
    },
  })

  if (!order) notFound()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Захиалгууд руу буцах
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Захиалга #{order.orderNumber}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {new Date(order.createdAt).toLocaleString("mn-MN")} · {order.creationSource}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-bold px-4 py-2 rounded-full ${
              order.orderStatus === "PAID" ? "bg-green-100 text-green-700" :
              order.orderStatus === "PENDING" ? "bg-amber-100 text-amber-700" :
              order.orderStatus === "CANCELLED" ? "bg-red-100 text-red-700" :
              "bg-slate-100 text-slate-700"
            }`}>
              {STATUS_LABELS[order.orderStatus] || order.orderStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Customer info */}
      <div className="bg-white rounded-xl border p-6 space-y-3">
        <h2 className="font-bold text-slate-900 flex items-center gap-2"><User className="w-4 h-4" /> Захиалагч</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-400 text-xs">Нэр</p>
            <p className="font-medium text-slate-800">{order.customerName}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Утас</p>
            <p className="font-medium text-slate-800">{order.customerPhone}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Данс</p>
            <p className="font-medium text-slate-800">{order.accountNumber || "—"}</p>
          </div>
          {order.deliveryAddress && (
            <div>
              <p className="text-slate-400 text-xs">Хүргэлтийн хаяг</p>
              <p className="font-medium text-slate-800">{order.deliveryAddress}</p>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Package className="w-4 h-4" /> Захиалсан бараа</h2>
        <div className="divide-y">
          {order.items.map(item => (
            <div key={item.id} className="py-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-slate-800">{item.productName}</p>
                <p className="text-xs text-slate-400">SKU: {item.sku} · {item.quantity} ш × ₮{Number(item.unitPrice).toLocaleString()}</p>
              </div>
              <span className="font-bold text-slate-900">₮{Number(item.totalPrice).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="border-t pt-3 mt-3 flex justify-between font-bold text-lg">
          <span>Нийт</span>
          <span className="text-indigo-600">₮{Number(order.totalAmount).toLocaleString()}</span>
        </div>
      </div>

      {/* Actions */}
      {order.orderStatus === "PENDING" && (
        <div className="bg-white rounded-xl border p-6 space-y-3">
          <h2 className="font-bold text-slate-900">Үйлдлүүд</h2>
          <div className="flex gap-3">
            <form action={async () => {
              "use server"
              await adminConfirmPayment(id)
            }}>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                ✅ Төлбөр баталгаажуулах
              </Button>
            </form>
            <form action={async () => {
              "use server"
              await cancelOrder(id, "Админ цуцалсан")
            }}>
              <Button type="submit" variant="destructive">
                ❌ Цуцлах
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Status update for non-pending orders */}
      {!["PENDING", "CANCELLED", "REFUNDED"].includes(order.orderStatus) && (
        <div className="bg-white rounded-xl border p-6 space-y-3">
          <h2 className="font-bold text-slate-900">Статус өөрчлөх</h2>
          <div className="flex flex-wrap gap-2">
            {["PROCESSING", "SHIPPED", "DELIVERED"].map(status => (
              status !== order.orderStatus && (
                <form key={status} action={async () => {
                  "use server"
                  await updateOrderStatus(id, status as any)
                }}>
                  <Button type="submit" variant="outline" className="text-sm">
                    {STATUS_LABELS[status]}
                  </Button>
                </form>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

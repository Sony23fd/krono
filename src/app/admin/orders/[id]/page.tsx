import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { ArrowLeft, Package, User, CreditCard, Clock, Banknote, ShieldCheck, Zap, RefreshCw } from "lucide-react"
import Link from "next/link"
import { OrderActionsClient } from "./OrderActionsClient"
import { ManualVerifyButton } from "./ManualVerifyButton"

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
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  PAID: "bg-blue-100 text-blue-700 border-blue-200",
  PROCESSING: "bg-indigo-100 text-indigo-700 border-indigo-200",
  SHIPPED: "bg-purple-100 text-purple-700 border-purple-200",
  DELIVERED: "bg-green-100 text-green-700 border-green-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
  REFUNDED: "bg-slate-100 text-slate-600 border-slate-200",
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  QPAY: "QPay",
  BANK_TRANSFER: "Банк шилжүүлэг",
  CASH: "Бэлнээр",
  CARD: "Карт",
}

const VERIFICATION_METHOD_LABELS: Record<string, string> = {
  AUTO: "🔄 QPay Callback",
  CLIENT: "⚡ Автомат (Client Poll)",
  ADMIN: "👤 Админ шалгалт",
  MANUAL: "👤 Админ шалгалт",
  UNKNOWN: "❓ Тодорхойгүй",
}

function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
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

  const payment = order.payments[0]
  const paymentMethod = payment?.method || "BANK_TRANSFER"
  const isQPay = paymentMethod === "QPAY"
  const isPaid = order.orderStatus === "PAID"
  const isPending = order.orderStatus === "PENDING"

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
              {formatDateTime(order.createdAt)} · {order.creationSource}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-bold px-4 py-2 rounded-full border ${STATUS_COLORS[order.orderStatus] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
              {STATUS_LABELS[order.orderStatus] || order.orderStatus}
            </span>
          </div>
        </div>
      </div>

      {/* QPay Verification Status */}
      {isQPay && (
        <div className={`rounded-xl border p-4 ${
          isPaid
            ? "bg-emerald-50 border-emerald-200"
            : isPending
            ? "bg-blue-50 border-blue-200"
            : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isPaid ? "bg-emerald-100" : "bg-blue-100"
              }`}>
                {isPaid ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Zap className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div>
                <p className={`font-bold text-sm ${isPaid ? "text-emerald-800" : "text-blue-800"}`}>
                  {isPaid ? "✅ QPay төлбөр баталгаажсан" : "⏳ QPay төлбөр хүлээгдэж байна"}
                </p>
                <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                  {payment?.externalRef && (
                    <p>📋 Invoice ID: <span className="font-mono font-medium">{payment.externalRef}</span></p>
                  )}
                  {payment?.qpayVerifiedAt && (
                    <>
                      <p>✅ Баталгаажсан: <strong>{formatDateTime(payment.qpayVerifiedAt)}</strong></p>
                      {payment.qpayVerifiedBy && (
                        <p>🔐 Арга: <strong>{VERIFICATION_METHOD_LABELS[payment.qpayVerifiedBy] || payment.qpayVerifiedBy}</strong></p>
                      )}
                    </>
                  )}
                  {payment?.lastQpayCheckAt && (
                    <p>🔍 Сүүлд шалгасан: {formatDateTime(payment.lastQpayCheckAt)}</p>
                  )}
                  {!isPaid && !payment?.qpayVerifiedAt && (
                    <p>⏰ Төлбөр хүлээгдэж байна. QPay-ээр төлбөр хийсэн бол шалгаад баталгаажуулна.</p>
                  )}
                </div>
              </div>
            </div>
            {isPending && (
              <ManualVerifyButton
                paymentId={payment.id}
                orderId={order.id}
                orderNumber={order.orderNumber}
              />
            )}
          </div>
        </div>
      )}

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
              <p className="font-medium text-slate-800 flex items-start gap-2 flex-wrap">
                {order.deliveryAddress.match(/^\[(.*?)\]/) && (
                  <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded uppercase">
                    {order.deliveryAddress.match(/^\[(.*?)\]/)?.[1]}
                  </span>
                )}
                <span>{order.deliveryAddress.replace(/^\[.*?\]\s*/, "")}</span>
              </p>
            </div>
          )}
        </div>
        {order.note && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
            <p className="text-xs text-amber-600 font-medium">Тэмдэглэл:</p>
            <p className="text-sm text-amber-800">{order.note}</p>
          </div>
        )}
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
        <div className="border-t pt-3 mt-3 space-y-1">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Барааны дүн</span>
            <span>₮{Number(order.subtotal).toLocaleString()}</span>
          </div>
          {Number(order.deliveryFee) > 0 && (
            <div className="flex justify-between text-sm text-slate-500">
              <span>Хүргэлт</span>
              <span>+₮{Number(order.deliveryFee).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-1">
            <span>Нийт</span>
            <span className="text-indigo-600">₮{Number(order.totalAmount).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Payment info */}
      <div className="bg-white rounded-xl border p-6 space-y-3">
        <h2 className="font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-4 h-4" /> Төлбөрийн мэдээлэл
        </h2>
        {payment ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400 text-xs">Төлбөрийн арга</p>
              <p className="font-medium text-slate-800 flex items-center gap-1.5">
                {paymentMethod === "QPAY" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">QPay</span>
                ) : (
                  <Banknote className="w-3.5 h-3.5 text-blue-500" />
                )}
                {PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Төлбөрийн төлөв</p>
              <p className={`font-bold ${payment.status === "PAID" ? "text-green-600" : "text-amber-600"}`}>
                {payment.status === "PAID" ? "✅ Төлөгдсөн" : payment.status === "FAILED" ? "❌ Амжилтгүй" : "⏳ Хүлээгдэж буй"}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Төлсөн огноо</p>
              <p className="font-medium text-slate-800">
                {payment.paidAt ? formatDateTime(payment.paidAt) : "—"}
              </p>
            </div>
            {payment.externalRef && (
              <div>
                <p className="text-slate-400 text-xs">Invoice ID</p>
                <p className="font-mono text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded">{payment.externalRef}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">Төлбөрийн мэдээлэл байхгүй</p>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border p-6 space-y-3">
        <h2 className="font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Хугацааны мэдээлэл
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-slate-400">Үүсгэсэн:</span>
            <span className="font-medium text-slate-800">{formatDateTime(order.createdAt)}</span>
          </div>
          {order.stockReservedAt && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-slate-400">Нөөц түгжигдсэн:</span>
              <span className="font-medium text-slate-800">{formatDateTime(order.stockReservedAt)}</span>
            </div>
          )}
          {order.stockReleasedAt && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-slate-400">Нөөц буцаагдсан:</span>
              <span className="font-medium text-slate-800">{formatDateTime(order.stockReleasedAt)}</span>
            </div>
          )}
          {isPaid && payment?.paidAt && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-400">Төлбөр баталгаажсан:</span>
              <span className="font-medium text-emerald-700">{formatDateTime(payment.paidAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <OrderActionsClient
        orderId={order.id}
        currentStatus={order.orderStatus}
        orderNumber={order.orderNumber}
        paymentMethod={paymentMethod}
      />
    </div>
  )
}

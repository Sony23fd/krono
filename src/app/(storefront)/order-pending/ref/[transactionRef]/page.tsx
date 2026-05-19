import { getShopSettings } from "@/app/actions/settings-actions"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Clock, CreditCard, CheckCircle2, AlertCircle, Banknote } from "lucide-react"
import { CopyButton } from "@/components/storefront/CopyButton"
import { QPayPollingClient } from "./QPayPollingClient"
import CopyTrackingLink from "../../../track/CopyTrackingLink"

export const dynamic = "force-dynamic"

export default async function OrderPendingByRefPage({ params }: { params: Promise<{ transactionRef: string }> }) {
  const { transactionRef } = await params

  // transactionRef нь orderNumber эсвэл id байж болно
  const isNum = !isNaN(Number(transactionRef))
  const orders = await db.order.findMany({
    where: {
      OR: [
        ...(isNum ? [{ orderNumber: Number(transactionRef) }] : []),
        { id: transactionRef },
      ],
    },
    include: {
      items: true,
      payments: {
        select: { id: true, method: true, status: true, amount: true, externalRef: true, metadata: true, paidAt: true }
      }
    },
  })

  const settings = await getShopSettings()

  if (!orders?.length) notFound()

  const allConfirmed = orders.every((o: any) => o.orderStatus === "PAID" || o.orderStatus === "DELIVERED")
  const anyRejected = orders.some((o: any) => o.orderStatus === "CANCELLED")
  const totalAmount = orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0)
  const wantsDelivery = orders.some((o: any) => o.wantsDelivery)
  const order = orders[0] as any
  const payment = order.payments?.[0]

  // QPay мэдээлэл
  const isQPay = payment?.method === "QPAY"
  const qpayMeta = (payment?.metadata as any) || {}

  // ═══ БАТАЛГААЖСАН ═══
  if (allConfirmed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Захиалга баталгаажлаа! 🎉</h1>
          <p className="text-slate-500 text-sm">Таны төлбөр хүлээн авагдаж, захиалга баталгаажлаа.</p>
          <p className="text-xs text-slate-400">
            Захиалгын дугаар: <span className="font-mono font-semibold">{transactionRef}</span>
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <a href={`/track?q=${order.customerPhone}`} className="bg-[#1B3561] text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#152b4e] transition-colors">
              Захиалга хянах
            </a>
            <a href="/" className="bg-slate-100 text-slate-700 px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors">
              Нүүр хуудас
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ═══ ЦУЦЛАГДСАН ═══
  if (anyRejected) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Захиалга цуцлагдлаа</h1>
          <p className="text-slate-500 text-sm">Төлбөр баталгаажаагүй тул захиалга цуцлагдлаа.</p>
          <a href="/" className="inline-block bg-[#1B3561] text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#152b4e] transition-colors">
            Нүүр хуудас руу буцах
          </a>
        </div>
      </div>
    )
  }

  // ═══ ХҮЛЭЭГДЭЖ БУЙ ═══
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-4">

        <CopyTrackingLink trackingRef={transactionRef} />

        {/* Status */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Төлбөр хүлээгдэж байна</p>
            <p className="text-amber-600 text-xs mt-0.5">
              {isQPay ? "QPay-ээр төлбөрөө төлнө үү" : "Дараах дансанд шилжүүлгийг бүрэн хийнэ үү"}
            </p>
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-3">
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#1B3561]" /> Захиалгын дэлгэрэнгүй
          </h2>
          <div className="text-sm text-slate-500 space-y-0.5">
            <p><span className="font-medium text-slate-800">{order.customerName}</span> · {order.customerPhone}</p>
            <p>{wantsDelivery ? `📍 ${order.deliveryAddress || "—"}` : "🏪 Өөрөө ирж авна"}</p>
          </div>

          {/* Items */}
          <div className="divide-y border rounded-xl overflow-hidden">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center px-3 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-slate-800">{item.productName}</p>
                  <p className="text-xs text-slate-400">{item.quantity} ширхэг × ₮{Number(item.unitPrice).toLocaleString()}</p>
                </div>
                <span className="font-semibold text-slate-700">₮{Number(item.totalPrice).toLocaleString()}</span>
              </div>
            ))}
          </div>

          {Number(order.deliveryFee) > 0 && (
            <div className="flex justify-between text-sm text-slate-500 px-1">
              <span>Хүргэлт</span>
              <span>+₮{Number(order.deliveryFee).toLocaleString()}</span>
            </div>
          )}

          <div className="flex justify-between font-bold text-slate-900 text-base border-t pt-2">
            <span>Нийт төлөх</span>
            <span className="text-[#E21B22]">₮{totalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment Section */}
        <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            {isQPay ? "📱 QPay Төлбөр" : "💳 Банк Шилжүүлэг"}
          </h2>

          {isQPay && payment ? (
            /* ═══ QPay Section ═══ */
            <QPayPollingClient
              paymentId={payment.id}
              qrImage={qpayMeta.qr_image}
              urls={qpayMeta.urls}
              customerPhone={order.customerPhone}
            />
          ) : (
            /* ═══ Bank Transfer Section ═══ */
            <div className="space-y-3">
              <div className="space-y-2">
                <PaymentRow label="Банк" value={settings.bank_name || "—"} />
                <PaymentRow label="Дансны дугаар" value={settings.bank_account || "—"} copyable />
                <PaymentRow label="Хүлээн авагч" value={settings.bank_holder || "—"} />
              </div>
              <div className="bg-[#1B3561]/5 border border-[#1B3561]/20 rounded-xl p-3">
                <p className="text-xs text-[#1B3561] font-medium mb-1">⚠️ Гүйлгээний утга (заавал бичнэ)</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-[#1B3561] text-sm tracking-wider">{transactionRef}</span>
                  <CopyButton text={transactionRef} />
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 space-y-1">
                <p>1. Дээрх дансанд <strong>₮{totalAmount.toLocaleString()}</strong> шилжүүлнэ</p>
                <p>2. Гүйлгээний утгад <strong>{transactionRef}</strong> гэж заавал бичнэ</p>
                <p>3. Админ гүйлгээг шалгаад захиалгыг баталгаажуулна</p>
              </div>
            </div>
          )}
        </div>

        {/* Track link */}
        <div className="text-center space-y-2">
          <a href={`/track?q=${order.customerPhone}`} className="text-[#1B3561] font-medium text-sm hover:underline">
            Захиалгын явц хянах →
          </a>
          <p className="text-xs text-slate-400">Асуулт байвал бидэнтэй холбогдоорой</p>
        </div>
      </div>
    </div>
  )
}

function PaymentRow({ label, value, copyable }: {
  label: string; value: string; copyable?: boolean
}) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b last:border-0">
      <span className="text-slate-400 text-xs">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-slate-800 text-sm">{value}</span>
        {copyable && <CopyButton text={value} />}
      </div>
    </div>
  )
}

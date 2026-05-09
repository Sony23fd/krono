import { getShopSettings } from "@/app/actions/settings-actions"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Clock, CreditCard, CheckCircle2, AlertCircle } from "lucide-react"
import { CopyButton } from "../../[orderId]/CopyButton"
import { QRCodeSVG } from "qrcode.react"
import { PaymentCheckClient } from "./PaymentCheckClient"
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
    include: { items: true, payments: true },
  })

  const settings = await getShopSettings()
  const qpayRes = null as any // TODO: QPay integration дахин хийх

  if (!orders?.length) notFound()

  const allConfirmed = orders.every((o: any) => o.orderStatus === "PAID" || o.orderStatus === "DELIVERED")
  const anyRejected = orders.some((o: any) => o.orderStatus === "CANCELLED")
  const totalAmount = orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0)
  const wantsDelivery = orders.some((o: any) => o.wantsDelivery)
  const customer = orders[0] as any

  if (allConfirmed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Захиалга баталгаажлаа! 🎉</h1>
          <p className="text-slate-500 text-sm mb-4">Таны төлбөр хүлээн авагдаж, захиалга баталгаажлаа.</p>
          <p className="text-xs text-slate-400 mb-6">Гүйлгээний утга: <span className="font-mono font-semibold">{transactionRef}</span></p>

          {/* E-barimt section if available */}
          {customer.ebarimtId && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-left space-y-3">
              <h3 className="font-bold text-slate-800 text-sm flex justify-center items-center gap-2">
                И-Баримт
              </h3>
              {customer.ebarimtQr && (
                <div className="flex justify-center bg-white p-2 rounded-lg border inline-block mx-auto w-fit">
                  <QRCodeSVG value={customer.ebarimtQr} size={120} />
                </div>
              )}
              <div className="text-xs text-slate-500 text-center space-y-1">
                <p>Сугалааны дугаар: <span className="font-mono font-bold text-slate-700">{customer.ebarimtLottery || "—"}</span></p>
                <p>Дүн: ₮{totalAmount.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (anyRejected) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Захиалга цуцлагдлаа</h1>
          <p className="text-slate-500 text-sm">Төлбөр баталгаажаагүй тул захиалга цуцлагдлаа.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-4">

        <CopyTrackingLink trackingRef={transactionRef} />

        {/* Status */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Төлбөр хүлээгдэж байна</p>
            <p className="text-amber-600 text-xs mt-0.5">Дараах дансанд шилжүүлгийг бүрэн хийнэ үү</p>
          </div>
        </div>

        {/* Order summary — all items */}
        <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-3">
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-500" /> Захиалгын дэлгэрэнгүй
          </h2>
          <div className="text-sm text-slate-500 space-y-0.5">
            <p><span className="font-medium text-slate-800">{customer.customerName}</span> · {customer.customerPhone}</p>
            <p>{wantsDelivery ? `📍 ${customer.deliveryAddress || "Хүргэлтийн хаяг оруулаагүй"}` : "🏪 Өөрөө ирж авна"}</p>
          </div>

          {/* Items */}
          <div className="divide-y border rounded-xl overflow-hidden">
            {orders.map((order: any) => (
              <div key={order.id} className="flex justify-between items-center px-3 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-slate-800">{order.batch?.product?.name}</p>
                  <p className="text-xs text-slate-400">{order.quantity} ширхэг × ₮{Math.round(Number(order.totalAmount) / order.quantity).toLocaleString()}</p>
                </div>
                <span className="font-semibold text-slate-700">₮{Number(order.totalAmount).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between font-bold text-slate-900 text-base border-t pt-2">
            <span>Нийт төлөх</span>
            <span className="text-indigo-600">₮{totalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment instructions */}
        <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-slate-900">💳 Төлбөрийн мэдээлэл</h2>

          {/* QPay QR and Deep links */}
          {qpayRes && qpayRes.success && qpayRes.qpayQrText ? (
            <div className="flex flex-col items-center justify-center space-y-4 mb-6">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 inline-block">
                <QRCodeSVG value={qpayRes.qpayQrText} size={160} />
              </div>
              
              {/* Bank Apps Deep Links */}
              {qpayRes.qpayUrls && qpayRes.qpayUrls.length > 0 && (
                <div className="w-full">
                  <p className="text-xs text-center font-semibold text-slate-500 mb-2 uppercase tracking-wider">Гар утаснаас төлөх</p>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {qpayRes.qpayUrls.map((bank: any) => (
                      <a
                        key={bank.name}
                        href={bank.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-1 p-1 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        {bank.logo && <img src={bank.logo} alt={bank.name} className="w-8 h-8 rounded animate-in zoom-in" />}
                        <span className="text-[9px] text-slate-500 text-center leading-tight line-clamp-2">{bank.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="w-full mt-4">
                <PaymentCheckClient transactionRef={transactionRef} />
              </div>
            </div>
          ) : (
            <div className="w-40 h-40 mx-auto bg-slate-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-slate-300 mb-4">
              <div className="text-slate-300 text-4xl mb-1">⬛</div>
              <p className="text-[10px] text-slate-400 text-center">QPay холбогдоогүй<br/>эсвэл алдаа гарлаа</p>
            </div>
          )}

          <div className="space-y-2">
            <PaymentRow label="Банк" value={settings.bank_name || "—"} />
            <PaymentRow label="Дансны дугаар" value={settings.bank_account || "—"} copyable transactionRef={transactionRef} />
            <PaymentRow label="Хүлээн авагч" value={settings.bank_holder || "—"} />
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
              <p className="text-xs text-indigo-600 font-medium mb-1">⚠️ Гүйлгээний утга (заавал бичнэ)</p>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-indigo-800 text-sm tracking-wider">{transactionRef}</span>
                <CopyButton text={transactionRef} />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 space-y-1">
            <p>1. Дээрх дансанд <strong>₮{totalAmount.toLocaleString()}</strong> шилжүүлнэ</p>
            <p>2. Гүйлгээний утгад <strong>{transactionRef}</strong> гэж заавал бичнэ</p>
            <p>3. Админ гүйлгээг шалгаад захиалгыг баталгаажуулна</p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">Асуулт байвал бидэнтэй холбогдоорой</p>
      </div>
    </div>
  )
}

function PaymentRow({ label, value, copyable, transactionRef }: {
  label: string; value: string; copyable?: boolean; transactionRef?: string
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

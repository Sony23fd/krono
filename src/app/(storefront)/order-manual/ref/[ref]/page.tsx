import { getShopSettings } from "@/app/actions/settings-actions"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Clock, Copy } from "lucide-react"
import { ManualPaymentClient } from "./ManualPaymentClient"
import CopyTrackingLink from "../../../track/CopyTrackingLink"

export const dynamic = "force-dynamic"

export default async function ManualCheckoutPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params
  
  const orders = await db.order.findMany({
    where: {
      OR: [
        ...(isNaN(Number(ref)) ? [] : [{ orderNumber: Number(ref) }]),
        { id: ref },
      ],
    },
    include: { items: true },
  })

  if (!orders || orders.length === 0) {
    notFound()
  }

  const settings = await getShopSettings()
  const totalAmount = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)

  return (
    <div className="max-w-xl mx-auto px-4 py-20 min-h-screen">
      <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-8 relative overflow-hidden">
        <CopyTrackingLink trackingRef={ref} />

        {/* Pending header */}
        <div className="text-center space-y-3 relative z-10">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Таны захиалга хүлээн авлаа</h1>
          <p className="text-slate-500">
            Таны төлбөр төлөгдсөнөөр захиалга баталгаажна.
          </p>
        </div>

        {/* Amount */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center">
          <p className="text-indigo-600 text-sm font-semibold mb-1">ТӨЛБӨР ТӨЛӨХ ДҮН</p>
          <div className="text-4xl font-black text-indigo-900 font-mono">
            ₮{totalAmount.toLocaleString()}
          </div>
        </div>

        {/* Bank details */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-800 border-b pb-2">Дансны мэдээлэл</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Хүлээн авагч банк</p>
              <p className="font-medium text-slate-800">{settings.bank_name || "Хаан банк"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Дансны нэр</p>
              <p className="font-medium text-slate-800">{settings.bank_holder || "Байгууллага"}</p>
            </div>
          </div>

          <ManualPaymentClient label="Дансны дугаар" value={settings.bank_account || "Данс оруулаагүй байна"} />
          
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
            <p className="text-xs text-amber-800 font-medium mb-2 uppercase tracking-wide">Гүйлгээний утга (Заавал бичих)</p>
            <ManualPaymentClient value={ref} large />
            <p className="text-[11px] text-amber-700 mt-2">
              Гүйлгээний утга дээр дээрх кодыг заавал бичнэ үү. Өөр зүйл бичсэн тохиолдолд захиалга баталгаажихгүйг анхаарна уу!
            </p>
          </div>
        </div>

        <div className="pt-4 text-center">
          <p className="text-sm text-slate-500 mb-4">
            Төлбөр төлсний дараа бид систем дээр шалгаж баталгаажуулах болно.
          </p>
          <a href="/" className="text-indigo-600 font-medium text-sm hover:underline">
            Нүүр хуудас руу буцах
          </a>
        </div>
      </div>
    </div>
  )
}

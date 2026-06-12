"use client"

import { useState } from "react"
import { saveShopSetting } from "@/app/actions/settings-actions"
import { CheckCircle2, Loader2 } from "lucide-react"

const FIELDS = [
  { key: "bank_name", label: "Банкны нэр", placeholder: "Хаан Банк" },
  { key: "bank_account", label: "Дансны дугаар", placeholder: "5071443386" },
  { key: "bank_holder", label: "Данс эзэмшигч", placeholder: "Отгоо" },
  { key: "bank_note", label: "Нэмэлт тайлбар", placeholder: "Билэг Супермаркет" },
  { key: "delivery_fee", label: "Хүргэлтийн хураамж /QPay/ (₮)", placeholder: "6000" },
]

export function PaymentSettingsForm({ settings }: { settings: Record<string, string> }) {
  const [values, setValues] = useState(settings)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  async function save(key: string) {
    setSaving(key)
    await saveShopSetting(key, values[key] ?? "")
    setSaving(null)
    setSaved(key)
    setTimeout(() => setSaved(null), 2000)
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
      
      {/* QPAY TOGGLE */}
      <div className="flex items-center justify-between p-4 bg-slate-50 border rounded-xl">
        <div>
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            QPay Төлбөрийн Систем
            {values["qpay_enabled"] === "true" ? (
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Асаалттай</span>
            ) : (
              <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium">Унтраалттай</span>
            )}
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">QPay QR код үүсгэх эсэхийг тохируулах.</p>
        </div>
        <button
          onClick={async () => {
            const newVal = values["qpay_enabled"] === "true" ? "false" : "true"
            setValues(v => ({ ...v, qpay_enabled: newVal }))
            setSaving("qpay_enabled")
            await saveShopSetting("qpay_enabled", newVal)
            setSaving(null)
            setSaved("qpay_enabled")
            setTimeout(() => setSaved(null), 2000)
          }}
          disabled={saving === "qpay_enabled"}
          className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 outline-none ${values["qpay_enabled"] === "true" ? "bg-indigo-600" : "bg-slate-300"}`}
        >
          <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${values["qpay_enabled"] === "true" ? "translate-x-6" : "translate-x-0"}`} />
        </button>
      </div>

      {/* PAYLINK TOGGLE */}
      <div className="flex items-center justify-between p-4 bg-slate-50 border rounded-xl">
        <div>
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            Paylink Төлбөрийн Систем
            {values["paylink_enabled"] !== "false" ? (
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Асаалттай</span>
            ) : (
              <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium">Унтраалттай</span>
            )}
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">Paylink төлбөрийн сонголтыг харуулах.</p>
        </div>
        <button
          onClick={async () => {
            const newVal = values["paylink_enabled"] !== "false" ? "false" : "true"
            setValues(v => ({ ...v, paylink_enabled: newVal }))
            setSaving("paylink_enabled")
            await saveShopSetting("paylink_enabled", newVal)
            setSaving(null)
            setSaved("paylink_enabled")
            setTimeout(() => setSaved(null), 2000)
          }}
          disabled={saving === "paylink_enabled"}
          className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 outline-none ${values["paylink_enabled"] !== "false" ? "bg-indigo-600" : "bg-slate-300"}`}
        >
          <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${values["paylink_enabled"] !== "false" ? "translate-x-6" : "translate-x-0"}`} />
        </button>
      </div>

      <div className="space-y-5 border-t pt-5">
        <h3 className="font-semibold text-slate-800">Банкны Мэдээлэл (QPay унтраалттай үед харагдана)</h3>
        {FIELDS.map(f => (
          <div key={f.key} className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{f.label}</label>
            <div className="flex gap-2">
              <input
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder={f.placeholder}
                value={values[f.key] ?? ""}
                onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
              />
              <button
                onClick={() => save(f.key)}
                disabled={saving === f.key}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60 flex items-center gap-1.5"
              >
                {saving === f.key
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : saved === f.key
                    ? <CheckCircle2 className="w-4 h-4 text-green-200" />
                    : "Хадгалах"
                }
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 text-xs text-slate-400">
        Эдгээр мэдээлэл нь хэрэглэгчид захиалгын дараа харуулагдана.
      </div>
    </div>
  )
}

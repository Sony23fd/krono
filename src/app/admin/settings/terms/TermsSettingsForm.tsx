"use client"

import { useState } from "react"
import { saveShopSetting } from "@/app/actions/settings-actions"
import { CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"

const FIELDS = [
  {
    key: "terms_of_service",
    label: "Үйлчилгээний нөхцөл",
    placeholder: "Захиалгаа баталгаажуулсны дараа цуцлах боломжгүй...",
    hint: "Checkout хуудсанд нийт үнийн доор харагдана. Хэрэглэгч эдгээрийг зөвшөөрснөөр л захиалах боломжтой болно.",
  },
  {
    key: "delivery_terms",
    label: "Хүргэлтийн нөхцөл",
    placeholder: "Хүргэлт нь Улаанбаатар хот дотор үйлчилнэ...",
    hint: "\"Хүргэлтээр\" сонгосон тохиолдолд захиалга баталгаажуулах хэсэгт харагдана.",
  },
  {
    key: "privacy_policy",
    label: "Нууцлалын бодлого",
    placeholder: "Таны хувийн мэдээллийг бид ингэж хамгаална...",
    hint: "Нүүр хуудасны хамгийн доорх хэсэгт (Footer) харагдах болно.",
  },
]

export function TermsSettingsForm({ settings }: { settings: Record<string, string> }) {
  const [values, setValues] = useState(settings)
  const [saving, setSaving] = useState<string | null>(null)

  async function save(key: string) {
    setSaving(key)
    const result = await saveShopSetting(key, values[key] ?? "")
    setSaving(null)
    if (result.success) {
      toast.success("Нөхцөл хадгалагдлаа")
    } else {
      toast.error(result.error || "Алдаа гарлаа")
    }
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
      {FIELDS.map(f => (
        <div key={f.key} className="space-y-2">
          <div>
            <label className="text-sm font-semibold text-slate-800">{f.label}</label>
            <p className="text-xs text-slate-400 mt-0.5">{f.hint}</p>
          </div>
          <textarea
            rows={4}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            placeholder={f.placeholder}
            value={values[f.key] ?? ""}
            onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
          />
          <button
            onClick={() => save(f.key)}
            disabled={saving === f.key}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60 flex items-center gap-1.5"
          >
            {saving === f.key
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Хадгалж байна...</>
              : <><CheckCircle2 className="w-4 h-4" /> Хадгалах</>
            }
          </button>
        </div>
      ))}

      <div className="border-t pt-4 text-xs text-slate-400">
        Эдгээр нөхцөлүүд нь захиалга хийх хуудасруу автоматаар татагдан харагдана.
      </div>
    </div>
  )
}

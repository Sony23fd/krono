"use client"

import { useState } from "react"
import { saveShopSetting } from "@/app/actions/settings-actions"
import { Save, Loader2, CheckCircle2 } from "lucide-react"

export function PosScriptEditor({ initialScript }: { initialScript: string }) {
  const [script, setScript] = useState(initialScript)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    setSaved(false)
    try {
      const res = await saveShopSetting("POS_SYNC_SCRIPT", script)
      if (res.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        alert("Хадгалахад алдаа гарлаа: " + res.error)
      }
    } catch (error: any) {
      alert("Хадгалахад алдаа гарлаа")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center p-3 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <div className="w-3 h-3 rounded-full bg-amber-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
          <span className="text-xs font-mono text-slate-400 ml-2 font-medium">syncInventory.js</span>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-1.5 bg-[#001f3f] text-white text-sm font-semibold rounded-lg hover:bg-[#001f3f]/90 transition-colors disabled:opacity-70"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? "Хадгалагдлаа" : "Хадгалах"}
        </button>
      </div>
      
      <textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        className="w-full h-[600px] p-4 bg-[#0d1117] text-[#e6edf3] font-mono text-sm leading-relaxed outline-none resize-none rounded-b-xl focus:ring-2 focus:ring-inset focus:ring-[#F26522]/50"
        spellCheck={false}
        placeholder="// Скрипт кодоо энд хуулна уу..."
      />
    </div>
  )
}

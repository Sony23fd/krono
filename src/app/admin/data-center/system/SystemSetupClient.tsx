"use client"

import { useState } from "react"
import { saveEnvFile } from "@/app/actions/env-actions"
import { updateSystemFromServer } from "@/app/actions/system-actions"
import { toast } from "sonner"
import { Save, RefreshCw, Loader2, AlertTriangle } from "lucide-react"

export function SystemSetupClient({ initialEnv }: { initialEnv: string }) {
  const [envContent, setEnvContent] = useState(initialEnv)
  const [savingEnv, setSavingEnv] = useState(false)
  const [updatingSystem, setUpdatingSystem] = useState(false)
  const [logs, setLogs] = useState<string>("")

  async function handleSaveEnv() {
    setSavingEnv(true)
    const result = await saveEnvFile(envContent)
    setSavingEnv(false)

    if (result.success) {
      toast.success(".env файл хадгалагдлаа. Системийг шинэчлэх товчийг дарж идэвхжүүлнэ үү.")
    } else {
      toast.error(result.error || "Хадгалж чадсангүй")
    }
  }

  async function handleSystemUpdate() {
    if (!confirm("Та Github-аас сүүлийн үеийн кодуудыг татаж, системийг шинэчлэхдээ итгэлтэй байна уу? Энэ үйлдэл хэдэн минут үргэлжлэх бөгөөд сервер түр зогсох болно.")) return

    setUpdatingSystem(true)
    setLogs("Шинэчлэл эхэллээ... Түр хүлээнэ үү.\n")
    
    try {
      const result = await updateSystemFromServer()
      
      if (result.success) {
        setLogs(prev => prev + "\n✅ " + result.message + "\n\nДэлгэрэнгүй лог:\n" + (result.output || ""))
        toast.success("Шинэчлэл хийгдлээ. Сайт дахин ачааллагдаж байна.")
        
        // Reload after a few seconds
        setTimeout(() => {
          window.location.reload()
        }, 5000)
      } else {
        setLogs(prev => prev + "\n❌ Алдаа гарлаа: " + result.error)
        toast.error(result.error || "Шинэчлэх явцад алдаа гарлаа")
      }
    } catch (e: any) {
      setLogs(prev => prev + "\n❌ Сүлжээний алдаа эсвэл Сервер унтарлаа. (pm2 restart хийгдсэн байж магадгүй)")
    } finally {
      setUpdatingSystem(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            ⚙️ Орчны хувьсагчууд (.env)
          </h2>
          <button
            onClick={handleSaveEnv}
            disabled={savingEnv}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors disabled:opacity-50"
          >
            {savingEnv ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Хадгалах
          </button>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
          <p>
            Энэхүү файлыг буруу засварлавал систем бүхэлдээ ажиллахгүй болох эрсдэлтэй. Засвар хийсний дараа доорх <b>Систем шинэчлэх</b> товчийг дарж идэвхжүүлээрэй.
          </p>
        </div>

        <textarea
          value={envContent}
          onChange={(e) => setEnvContent(e.target.value)}
          className="w-full h-64 p-4 font-mono text-sm bg-slate-900 text-green-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
          spellCheck={false}
        />
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              🚀 Систем шинэчлэх (Deploy)
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Github-аас сүүлийн үеийн кодуудыг татаж, бааз шинэчлэх болон pm2 restart хийх үйлдлүүдийг автоматаар гүйцэтгэнэ.
            </p>
          </div>
          <button
            onClick={handleSystemUpdate}
            disabled={updatingSystem}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-md hover:shadow-lg"
          >
            {updatingSystem ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            Шинэчлэх (Deploy)
          </button>
        </div>

        {logs && (
          <div className="mt-4 p-4 bg-slate-900 text-slate-300 font-mono text-xs rounded-lg whitespace-pre-wrap max-h-96 overflow-y-auto">
            {logs}
          </div>
        )}
      </div>
    </div>
  )
}

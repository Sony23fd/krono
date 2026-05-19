"use client"

import { useState } from "react"
import { clearActivityLogs } from "@/app/actions/activity-actions"
import { toast } from "sonner"
import { Trash2, Loader2 } from "lucide-react"

export function ClearLogsButton() {
  const [loading, setLoading] = useState(false)

  async function handleClear() {
    if (!confirm("Та 30-аас дээш хоносон хуучин логуудыг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.")) return

    setLoading(true)
    const result = await clearActivityLogs(30)
    setLoading(false)

    if (result.success) {
      toast.success(`Нийт ${result.count} хуучин лог устгагдлаа`)
    } else {
      toast.error(result.error || "Устгахад алдаа гарлаа")
    }
  }

  return (
    <button
      type="button"
      onClick={handleClear}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 text-sm font-bold rounded-lg border border-rose-200 hover:bg-rose-100 hover:text-rose-700 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      Хуучин лог устгах
    </button>
  )
}

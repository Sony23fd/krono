"use client"
import { Copy, Check } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function ManualPaymentClient({ label, value, large = false }: { label?: string, value: string, large?: boolean }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    toast.success("Хуулагдлаа: " + value)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      {label && <p className="text-xs text-slate-400 mb-1">{label}</p>}
      <div className={`flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 group cursor-pointer hover:bg-slate-100 transition-colors`} onClick={handleCopy}>
        <span className={`font-mono text-slate-800 select-all ${large ? 'text-xl font-bold tracking-tight text-amber-900' : 'font-semibold'}`}>
          {value}
        </span>
        <button className={`p-2 rounded-md transition-colors ${copied ? 'bg-green-100 text-green-600' : 'bg-white border shadow-sm text-slate-400 group-hover:text-slate-600 group-hover:border-slate-300'}`}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

"use client"

import { useState, useRef } from "react"
import { Download, Upload, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export function ExcelExportImport() {
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleExport = () => {
    const qs = searchParams.toString()
    const url = qs ? `/api/admin/products/export?${qs}` : "/api/admin/products/export"
    window.open(url, "_blank")
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      
      const res = await fetch("/api/admin/products/bulk-upload", {
        method: "POST",
        body: formData
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        alert(`Амжилттай: ${data.inserted} шинээр нэмэгдэж, ${data.updated} шинэчлэгдэн, ${data.variantsProcessed} хувилбар орлоо.`)
        router.refresh()
      } else {
        console.error("Bulk Upload Error:", data)
        if (data.errors && data.errors.length > 0) {
          alert(`Алдаа: ${data.message}\n` + data.errors.map((err: any) => `Мөр ${err.row}: ${err.msg}`).join('\n'))
        } else {
          alert("Алдаа: " + (data.error || data.message || "Мэдэгдэхгүй алдаа"))
        }
      }
    } catch (error: any) {
      alert("Сервертэй холбогдоход алдаа гарлаа: " + error.message)
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
      >
        {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-slate-500" />}
        Импорт
      </button>
      <input 
        type="file" 
        accept=".xlsx, .xls" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleImport} 
      />

      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
      >
        <Download className="w-4 h-4 text-slate-500" />
        Экспорт
      </button>
    </div>
  )
}

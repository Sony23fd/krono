"use client"

import { useState, useRef } from "react"
import { Download, Upload, Loader2 } from "lucide-react"
import { importProducts } from "@/app/actions/product-actions"
import * as xlsx from "xlsx"

export function ExcelExportImport() {
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    window.open("/api/admin/products/export", "_blank")
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const data = await file.arrayBuffer()
      const workbook = xlsx.read(data, { type: "array" })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const rows = xlsx.utils.sheet_to_json(worksheet)

      if (rows.length === 0) {
        alert("Excel файл хоосон байна.")
        setImporting(false)
        return
      }

      const res = await importProducts(rows)
      if (res.success) {
        alert(`Амжилттай: ${res.imported} шинээр нэмэгдэж, ${res.updated} шинэчлэгдлээ.`)
      } else {
        alert("Алдаа: " + res.error)
      }
    } catch (error: any) {
      alert("Excel уншихад алдаа гарлаа: " + error.message)
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

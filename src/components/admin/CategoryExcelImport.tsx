"use client"

import { useState, useRef } from "react"
import { Upload, Loader2 } from "lucide-react"
import { importProducts } from "@/app/actions/product-actions"
import * as xlsx from "xlsx"

export function CategoryExcelImport({ categoryId, categoryName }: { categoryId: string, categoryName: string }) {
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!confirm(`"${categoryName}" ангилал руу бараа импортлох уу?`)) {
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

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

      const res = await importProducts(rows, categoryId)
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
    <>
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 text-blue-500"
        title="Энэ ангилалд бараа импортлох"
      >
        {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
      </button>
      <input 
        type="file" 
        accept=".xlsx, .xls" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleImport} 
      />
    </>
  )
}

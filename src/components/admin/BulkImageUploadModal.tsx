"use client"

import { useState, useRef } from "react"
import { Loader2, ImagePlus, UploadCloud, CheckCircle2, AlertCircle, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function BulkImageUploadModal() {
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  
  // Progress states
  const [currentIndex, setCurrentIndex] = useState(0)
  const [successCount, setSuccessCount] = useState(0)
  const [errors, setErrors] = useState<{name: string, error: string}[]>([])
  const [finished, setFinished] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).filter(f => f.type.startsWith("image/"))
      setFiles(selected)
      // reset states
      setCurrentIndex(0)
      setSuccessCount(0)
      setErrors([])
      setFinished(false)
    }
  }

  const startUpload = async () => {
    if (files.length === 0) return
    setUploading(true)
    setFinished(false)
    
    let success = 0
    let errs: {name: string, error: string}[] = []

    for (let i = 0; i < files.length; i++) {
      setCurrentIndex(i + 1)
      const file = files[i]
      
      const formData = new FormData()
      formData.append("file", file)

      try {
        const res = await fetch("/api/admin/products/bulk-image", {
          method: "POST",
          body: formData
        })
        
        let data;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await res.json()
        } else {
          // Fallback if server returns HTML (like 413 Payload Too Large from Nginx)
          const text = await res.text();
          throw new Error(res.status === 413 ? "Зургийн хэмжээ хэт том байна (1MB+)" : `Серверийн алдаа (${res.status})`);
        }
        
        if (res.ok && data.success) {
          success++
          setSuccessCount(success)
        } else {
          errs.push({ name: file.name, error: data.error || "Алдаа гарлаа" })
          setErrors([...errs])
        }
      } catch (e: any) {
        errs.push({ name: file.name, error: e.message || "Сүлжээний алдаа (Интернетээ шалгана уу)" })
        setErrors([...errs])
      }
    }

    setUploading(false)
    setFinished(true)
    router.refresh()
  }

  const handleClose = () => {
    if (uploading) {
      if (!confirm("Хуулж дуусаагүй байна. Та хаахдаа итгэлтэй байна уу?")) return
    }
    setOpen(false)
    setFiles([])
    setCurrentIndex(0)
    setSuccessCount(0)
    setErrors([])
    setFinished(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if(!v) handleClose(); else setOpen(true) }}>
      <DialogTrigger className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors shadow-sm">
        <ImagePlus className="w-4 h-4" />
        Зураг олноор оруулах
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Зураг бөөнөөр оруулах</DialogTitle>
          <DialogDescription>
            Барааны SKU кодоор нэрлэсэн зургуудыг сонгоно уу. Жишээ: <strong>100153.webp</strong>, эсвэл <strong>100153-1.jpg</strong>
          </DialogDescription>
        </DialogHeader>

        {!uploading && !finished && (
          <div className="space-y-4 py-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 hover:border-indigo-300 transition-all"
            >
              <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
              <p className="text-sm font-medium text-slate-700">Энд дарж зургуудаа сонгоно уу</p>
              <p className="text-xs text-slate-500 mt-1">Олон зураг зэрэг сонгож болно</p>
              
              {/* @ts-ignore - webkitdirectory is a non-standard attribute but works in modern browsers */}
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFiles}
                // webkitdirectory=""
              />
            </div>

            {files.length > 0 && (
              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex items-center justify-between">
                <span className="text-sm font-medium text-indigo-800">Нийт {files.length} зураг сонгогдлоо</span>
                <Button onClick={startUpload} className="bg-indigo-600 hover:bg-indigo-700">
                  Хуулж эхлэх
                </Button>
              </div>
            )}
          </div>
        )}

        {(uploading || finished) && (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-slate-700">Хуулж байна...</span>
                <span className="text-indigo-700">{currentIndex} / {files.length}</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${(currentIndex / files.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <div>
                  <p className="text-2xl font-bold text-emerald-700">{successCount}</p>
                  <p className="text-xs font-medium text-emerald-600">Амжилттай</p>
                </div>
              </div>
              <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-700">{errors.length}</p>
                  <p className="text-xs font-medium text-red-600">Алдаа гарсан</p>
                </div>
              </div>
            </div>

            {errors.length > 0 && (
              <div className="mt-4 border border-red-200 rounded-lg overflow-hidden">
                <div className="bg-red-50 px-3 py-2 text-xs font-bold text-red-800 border-b border-red-200">
                  Алдааны жагсаалт
                </div>
                <div className="max-h-40 overflow-y-auto bg-white p-2">
                  {errors.map((err, i) => (
                    <div key={i} className="text-xs py-1 px-2 border-b last:border-0 border-slate-100 flex justify-between">
                      <span className="font-medium text-slate-700 truncate mr-2" title={err.name}>{err.name}</span>
                      <span className="text-red-600 whitespace-nowrap">{err.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {finished && (
              <Button onClick={handleClose} className="w-full mt-4" variant="outline">
                Хаах
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

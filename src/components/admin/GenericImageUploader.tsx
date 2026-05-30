"use client"

import { useRef, useState } from "react"
import { ImagePlus, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  name: string
  defaultValue?: string | null
  folder: string
  required?: boolean
  imageClassName?: string
}

export function GenericImageUploader({ name, defaultValue, folder, required, imageClassName = "h-40" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState<string | null>(defaultValue || null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Зөвхөн зураг оруулна уу")
      return
    }
    
    setError(null)
    setUploading(true)

    const form = new FormData()
    form.append("file", file)
    form.append("folder", folder)

    try {
      const res = await fetch("/api/upload/generic", { method: "POST", body: form })
      const data = await res.json()
      
      if (data.success) {
        setUrl(data.url)
      } else {
        setError(data.error || "Алдаа гарлаа")
      }
    } catch (err) {
      setError("Холболтын алдаа")
    } finally {
      setUploading(false)
    }
  }

  function handleRemove() {
    setUrl(null)
  }

  return (
    <div className="w-full">
      <input type="hidden" name={name} value={url || ""} />
      {required && !url && <input type="hidden" required />}
      
      {url ? (
        <div className={`relative rounded-lg border border-slate-200 overflow-hidden group w-full bg-slate-100 flex items-center justify-center ${imageClassName}`}>
          <img src={url} alt="Uploaded" className="max-w-full max-h-full object-contain" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button 
              type="button" 
              variant="destructive" 
              size="sm" 
              onClick={handleRemove}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Устгах
            </Button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => inputRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files?.[0]; if(file) handleFile(file) }}
          onDragOver={(e) => e.preventDefault()}
          className={`w-full border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${imageClassName} ${uploading ? 'bg-slate-50 border-slate-300' : 'bg-slate-50 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400'}`}
        >
          {uploading ? (
             <div className="flex flex-col items-center gap-2 text-indigo-500">
               <Loader2 className="w-8 h-8 animate-spin" />
               <span className="text-sm font-medium">Хуулж байна...</span>
             </div>
          ) : (
            <>
              <ImagePlus className="w-8 h-8 text-indigo-400" />
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700">Зураг сонгох эсвэл чирж оруулах</p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP (Max 10MB)</p>
              </div>
            </>
          )}
        </div>
      )}
      
      <input 
        ref={inputRef} 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); e.target.value = ''; }} 
      />
      
      {error && <p className="text-xs text-red-500 font-medium mt-2">{error}</p>}
    </div>
  )
}

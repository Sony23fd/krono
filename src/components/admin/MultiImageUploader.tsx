"use client"

import { useRef, useState } from "react"
import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react"
import { updateProduct } from "@/app/actions/product-actions"

interface Props {
  product: any
}

export function MultiImageUploader({ product }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Local state for fast UI updates
  const [mainImage, setMainImage] = useState<string | null>(product.imageUrl || null)
  const [additionalImages, setAdditionalImages] = useState<string[]>(
    Array.isArray(product.images) ? product.images : []
  )
  
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(files: FileList) {
    setError(null)
    setUploading(true)

    const newImageUrls: string[] = []

    // Upload each file sequentially to avoid overwhelming the server
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith("image/")) continue
      if (file.size > 5 * 1024 * 1024) continue

      const form = new FormData()
      form.append("file", file)
      form.append("productId", product.id)
      form.append("skipDbUpdate", "true")

      try {
        const res = await fetch("/api/upload", { method: "POST", body: form })
        const data = await res.json()
        if (data.success && data.imageUrl) {
          newImageUrls.push(data.imageUrl)
        }
      } catch (err) {
        console.error("Upload error", err)
      }
    }

    if (newImageUrls.length > 0) {
      let newMain = mainImage
      let newAdditional = [...additionalImages]

      // If no main image exists, the first uploaded becomes main
      if (!newMain) {
        newMain = newImageUrls[0]
        newAdditional = [...newAdditional, ...newImageUrls.slice(1)]
      } else {
        newAdditional = [...newAdditional, ...newImageUrls]
      }

      setMainImage(newMain)
      setAdditionalImages(newAdditional)

      // Save to DB via Server Action
      await updateProduct(product.id, {
        imageUrl: newMain,
        images: newAdditional
      })
    } else {
      setError("Зураг хуулахад алдаа гарлаа эсвэл хэмжээ хэтэрсэн байна.")
    }

    setUploading(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
    // reset input
    if (inputRef.current) inputRef.current.value = ""
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  async function setAsMain(url: string) {
    const newAdditional = [...additionalImages.filter(img => img !== url)]
    if (mainImage) {
      newAdditional.push(mainImage)
    }
    setMainImage(url)
    setAdditionalImages(newAdditional)

    await updateProduct(product.id, {
      imageUrl: url,
      images: newAdditional
    })
  }

  async function removeImage(url: string, isMain: boolean) {
    if (isMain) {
      let newMain = null
      let newAdditional = [...additionalImages]
      if (newAdditional.length > 0) {
        newMain = newAdditional[0]
        newAdditional = newAdditional.slice(1)
      }
      setMainImage(newMain)
      setAdditionalImages(newAdditional)
      
      await updateProduct(product.id, {
        imageUrl: newMain || "",
        images: newAdditional
      })
    } else {
      const newAdditional = additionalImages.filter(img => img !== url)
      setAdditionalImages(newAdditional)
      
      await updateProduct(product.id, {
        images: newAdditional
      })
    }
  }

  const allImages = []
  if (mainImage) allImages.push({ url: mainImage, isMain: true })
  additionalImages.forEach(url => allImages.push({ url, isMain: false }))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2" onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
        {allImages.map((img, idx) => (
          <div key={`${img.url}-${idx}`} className={`relative group w-[72px] h-[72px] rounded-lg overflow-hidden border-2 flex-shrink-0 ${img.isMain ? 'border-amber-400' : 'border-slate-200'}`}>
            <img src={img.url} alt="Product" className="w-full h-full object-cover" />
            
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
              <div className="flex gap-1.5">
                {!img.isMain && (
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setAsMain(img.url) }} 
                    className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
                    title="Үндсэн зураг болгох"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeImage(img.url, img.isMain) }} 
                  className="p-1.5 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors"
                  title="Устгах"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            {img.isMain && (
              <div className="absolute bottom-0 left-0 right-0 bg-amber-400 text-[8px] font-bold text-amber-900 text-center py-0.5">
                ҮНДСЭН
              </div>
            )}
          </div>
        ))}

        {/* Upload Button */}
        <div
          onClick={() => inputRef.current?.click()}
          className="w-[72px] h-[72px] rounded-lg border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 hover:border-indigo-400 cursor-pointer flex flex-col items-center justify-center gap-1 text-center relative flex-shrink-0 transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
          ) : (
            <>
              <ImagePlus className="w-5 h-5 text-indigo-400" />
              <span className="text-[9px] font-semibold text-indigo-600 leading-tight px-1">Нэмэх</span>
            </>
          )}
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleChange} />
      
      {error && <div className="text-[10px] text-red-600 bg-red-50 p-1.5 rounded font-medium w-fit">{error}</div>}
    </div>
  )
}

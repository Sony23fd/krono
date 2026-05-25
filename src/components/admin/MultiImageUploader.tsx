"use client"

import { useRef, useState } from "react"
import { ImagePlus, Loader2, Trash2, GripVertical } from "lucide-react"
import { updateProduct } from "@/app/actions/product-actions"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

interface Props {
  product: any
}

export function MultiImageUploader({ product }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  
  const [images, setImages] = useState<string[]>(() => {
    const list: string[] = []
    if (product.imageUrl) list.push(product.imageUrl)
    if (Array.isArray(product.images)) {
      product.images.forEach((img: string) => {
        if (!list.includes(img)) list.push(img)
      })
    }
    return list
  })
  
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(files: FileList) {
    setError(null)
    setUploading(true)

    const newImageUrls: string[] = []

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
      const newImages = [...images, ...newImageUrls]
      setImages(newImages)

      const newMain = newImages[0] || null
      const newAdditional = newImages.slice(1)

      await updateProduct(product.id, {
        imageUrl: newMain || "",
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
    if (inputRef.current) inputRef.current.value = ""
  }

  async function removeImage(url: string) {
    const newImages = images.filter(img => img !== url)
    setImages(newImages)
    
    const newMain = newImages[0] || null
    const newAdditional = newImages.slice(1)

    await updateProduct(product.id, {
      imageUrl: newMain || "",
      images: newAdditional
    })
  }

  async function onDragEnd(result: any) {
    if (!result.destination) return
    const items = Array.from(images)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setImages(items)

    const newMain = items[0] || null
    const newAdditional = items.slice(1)

    await updateProduct(product.id, {
      imageUrl: newMain || "",
      images: newAdditional
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="product-images" direction="horizontal">
          {(provided) => (
            <div 
              className="flex flex-wrap gap-2" 
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {images.map((url, index) => (
                <Draggable key={url} draggableId={url} index={index}>
                  {(provided) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`relative group w-[72px] h-[72px] rounded-lg overflow-hidden border-2 flex-shrink-0 ${index === 0 ? 'border-amber-400' : 'border-slate-200'}`}
                    >
                      <img src={url} alt="Product" className="w-full h-full object-cover" />
                      
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                        <div className="flex gap-1.5">
                          <div 
                            {...provided.dragHandleProps}
                            className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors cursor-grab active:cursor-grabbing"
                            title="Зөөх"
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </div>
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeImage(url) }} 
                            className="p-1.5 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors"
                            title="Устгах"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      {index === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-amber-400 text-[8px] font-bold text-amber-900 text-center py-0.5">
                          ҮНДСЭН
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              {/* Upload Button */}
              <div
                onClick={() => inputRef.current?.click()}
                className={`w-[72px] h-[72px] rounded-lg border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-1 text-center relative flex-shrink-0 transition-colors ${
                  images.length === 0
                    ? "border-red-300 bg-red-50 hover:bg-red-100"
                    : "border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 hover:border-indigo-400"
                }`}
              >
                {uploading ? (
                  <Loader2 className={`w-5 h-5 animate-spin ${images.length === 0 ? "text-red-500" : "text-indigo-500"}`} />
                ) : (
                  <>
                    <ImagePlus className={`w-5 h-5 ${images.length === 0 ? "text-red-400" : "text-indigo-400"}`} />
                    <span className={`text-[9px] font-semibold leading-tight px-1 ${images.length === 0 ? "text-red-600" : "text-indigo-600"}`}>
                      {images.length === 0 ? "Зураггүй!" : "Нэмэх"}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleChange} />
      
      {error && <div className="text-[10px] text-red-600 bg-red-50 p-1.5 rounded font-medium w-fit">{error}</div>}
    </div>
  )
}

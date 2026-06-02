"use client"

import { useState, useEffect, useMemo } from "react"
import { updateProduct } from "@/app/actions/product-actions"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Loader2, Plus, Package } from "lucide-react"
import { useRouter } from "next/navigation"
import { RichTextEditor } from "@/components/admin/RichTextEditor"
import { toast } from "sonner"

export interface EditProductSheetProps {
  product: any;
  categories: any[];
}

/**
 * Generate all variant combinations from options.
 * Example: [{ name: "Өнгө", values: ["Хар","Цагаан"] }, { name: "Хэмжээ", values: ["42","43"] }]
 * → ["Хар-42", "Хар-43", "Цагаан-42", "Цагаан-43"]
 */
function generateVariantKeys(options: { name: string; values: string[] }[]): { key: string; labels: Record<string, string> }[] {
  if (options.length === 0) return []
  
  const validOptions = options.filter(o => o.values.length > 0)
  if (validOptions.length === 0) return []

  let combos: { key: string; labels: Record<string, string> }[] = [{ key: "", labels: {} }]
  
  for (const opt of validOptions) {
    const newCombos: typeof combos = []
    for (const combo of combos) {
      for (const val of opt.values) {
        newCombos.push({
          key: combo.key ? `${combo.key}-${val}` : val,
          labels: { ...combo.labels, [opt.name]: val }
        })
      }
    }
    combos = newCombos
  }
  
  return combos
}

export function EditProductSheet({ product, categories }: EditProductSheetProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<{name: string, values: string}[]>([])
  const [variantStock, setVariantStock] = useState<Record<string, number>>({})
  const [variantPrice, setVariantPrice] = useState<Record<string, number>>({})
  const router = useRouter()

  useEffect(() => {
    if (product?.options) {
      const rawOptions = Array.isArray(product.options) ? product.options : []
      const formatted = rawOptions.map((opt: any) => ({
        name: opt.name || "",
        values: Array.isArray(opt.values) ? opt.values.join(", ") : (opt.values || "")
      }))
      setOptions(formatted)
    }
    
    // Initialize variant stocks and prices if variants exist
    if (product?.variants?.length > 0) {
      const initialStock: Record<string, number> = {}
      const initialPrice: Record<string, number> = {}
      
      product.variants.forEach((v: any) => {
        // Find the matching key from options
        if (v.options) {
          const key = Object.values(v.options).join("-")
          initialStock[key] = v.stockQuantity || 0
          initialPrice[key] = Number(v.price) || 0
        }
      })
      
      setVariantStock(initialStock)
      setVariantPrice(initialPrice)
    }
  }, [product])

  const addOption = () => setOptions([...options, { name: "", values: "" }])
  const removeOption = (idx: number) => setOptions(options.filter((_, i) => i !== idx))
  const handleOptionChange = (idx: number, field: "name" | "values", val: string) => {
    const newOpts = [...options]
    newOpts[idx][field] = val
    setOptions(newOpts)
  }

  // Parse options into structured format for variant generation
  const parsedOptions = useMemo(() => {
    return options
      .filter(o => o.name.trim() && o.values.trim())
      .map(o => ({
        name: o.name.trim(),
        values: o.values.split(",").map(v => v.trim()).filter(v => v)
      }))
  }, [options])

  // Generate variant combinations
  const variantCombos = useMemo(() => generateVariantKeys(parsedOptions), [parsedOptions])
  
  // Total variant stock
  const totalVariantStock = useMemo(() => {
    return variantCombos.reduce((sum, v) => sum + (variantStock[v.key] || 0), 0)
  }, [variantCombos, variantStock])

  async function onSubmit(formData: FormData) {
    setLoading(true)
    const formattedOptions = parsedOptions

    // Build variantStock only if we have variants
    const finalVariantStock = variantCombos.length > 0 
      ? Object.fromEntries(variantCombos.map(v => [v.key, variantStock[v.key] || 0]))
      : null

    const finalVariantPrice = variantCombos.length > 0 
      ? Object.fromEntries(variantCombos.map(v => [v.key, variantPrice[v.key] || 0]))
      : null

    const remainingQuantity = variantCombos.length > 0 
      ? totalVariantStock 
      : Number(formData.get("remainingQuantity") || 0)

    const baseSku = product.sku

    const variantsData = variantCombos.length > 0 ? variantCombos.map(v => ({
      sku: `${baseSku}-${v.key}`,
      name: Object.values(v.labels).join(" "),
      price: finalVariantPrice ? finalVariantPrice[v.key] : Number(formData.get("price") || 0),
      stockQuantity: finalVariantStock ? finalVariantStock[v.key] : 0,
      options: v.labels
    })) : undefined

    const promise = updateProduct(product.id, {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      stockQuantity: remainingQuantity,
      price: Number(formData.get("price") || 0),
      weight: Number(formData.get("weight") || 0),
      unit: (formData.get("unit") as string) || "ширхэг",
      status: formData.get("status") as string,
      categoryId: formData.get("categoryId") as string || undefined,
      options: formattedOptions.length > 0 ? formattedOptions : [],
      isFeatured: formData.get("isFeatured") === "on",
      requiresAgeVerification: formData.get("requiresAgeVerification") === "on",
      customBadge: (formData.get("customBadge") as string) || undefined,
      variants: variantsData,
    })

    toast.promise(promise, {
      loading: "Шинэчилж байна...",
      success: (res) => {
        setLoading(false)
        if (res.success) {
          setOpen(false)
          router.refresh()
          return "Амжилттай хадгалагдлаа"
        }
        throw new Error(res.error || "Алдаа гарлаа")
      },
      error: (err) => {
        setLoading(false)
        return err.message || "Алдаа гарлаа"
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger>
        <div className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 cursor-pointer">
          <Pencil className="w-4 h-4" />
        </div>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Бараа засах</SheetTitle>
          <SheetDescription>{product.sku} - {product.name} мэдээллийг шинэчлэх.</SheetDescription>
        </SheetHeader>
        <form action={onSubmit} className="space-y-4 mt-6 pb-20">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Барааны нэр</label>
            <Input id="name" name="name" required defaultValue={product.name} />
          </div>

          <div className="space-y-2">
            <label htmlFor="customBadge" className="text-sm font-medium">Тусгай Badge (Шошго)</label>
            <Input id="customBadge" name="customBadge" defaultValue={product.customBadge || ""} placeholder="Жнь: Шинэ, Хит, Цөөн үлдсэн..." />
            <p className="text-[10px] text-slate-400 font-medium italic">* Хоосон орхивол нөөцтэй үед "Нөөцтэй" гэж гарна.</p>
          </div>

          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-800">Сонголтууд (Өнгө, Хэмжээ г.м)</label>
              <Button type="button" variant="outline" size="sm" onClick={addOption} className="h-7 px-2 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Нэмэх
              </Button>
            </div>
            <div className="space-y-3">
              {options.map((opt, i) => (
                <div key={i} className="flex items-start gap-2 bg-white p-2 border rounded-md shadow-sm">
                  <div className="space-y-2 flex-1">
                    <Input 
                      placeholder="Төрөл (Ж: Өнгө)" 
                      value={opt.name} 
                      onChange={(e) => handleOptionChange(i, "name", e.target.value)} 
                      className="h-8 text-xs"
                    />
                    <Input 
                      placeholder="Утгууд (Ж: Хар, Цагаан таслалаар тусгаарлах)" 
                      value={opt.values} 
                      onChange={(e) => handleOptionChange(i, "values", e.target.value)} 
                      className="h-8 text-xs"
                    />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(i)} className="h-8 w-8 text-red-500 shrink-0">
                    &times;
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Variant Stock Matrix */}
          {variantCombos.length > 0 && (
            <div className="space-y-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" />
                <label className="text-sm font-bold text-slate-800">Variant бүрийн үлдэгдэл</label>
              </div>
              <div className="space-y-2">
                {variantCombos.map(v => (
                  <div key={v.key} className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-lg border shadow-sm">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">
                        {Object.entries(v.labels).map(([k, val]) => `${k}: ${val}`).join(' · ')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          placeholder="Үнэ"
                          value={variantPrice[v.key] ?? ""}
                          onChange={(e) => setVariantPrice(prev => ({
                            ...prev,
                            [v.key]: Math.max(0, Number(e.target.value) || 0)
                          }))}
                          className="w-24 h-8 text-xs font-bold pl-2 pr-6"
                        />
                        <span className="absolute right-2 top-2 text-[10px] text-slate-400 font-bold">₮</span>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          placeholder="Тоо"
                          value={variantStock[v.key] ?? 0}
                          onChange={(e) => setVariantStock(prev => ({
                            ...prev,
                            [v.key]: Math.max(0, Number(e.target.value) || 0)
                          }))}
                          className="w-20 h-8 text-xs text-center font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-indigo-200">
                <span className="text-xs font-bold text-slate-600">Нийт үлдэгдэл (= remainingQuantity)</span>
                <span className="text-sm font-black text-indigo-700">{totalVariantStock}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Тайлбар</label>
            <RichTextEditor name="description" defaultValue={product.description || ""} />
          </div>
          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium">Статус</label>
            <select id="status" name="status" defaultValue={product.status} className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="ACTIVE">Идэвхтэй</option>
              <option value="DRAFT">Ноорог (Идэвхгүй)</option>
              <option value="ARCHIVED">Архивласан</option>
              <option value="OUT_OF_STOCK">Нөөц дууссан</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="categoryId" className="text-sm font-medium">Ангилал</label>
            <select id="categoryId" name="categoryId" defaultValue={product.categoryId || ""} className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Сонгох...</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium">Үнэ (₮)</label>
              <Input id="price" name="price" type="number" required defaultValue={Number(product.price)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="weight" className="text-sm font-medium">Жин (кг)</label>
              <Input id="weight" name="weight" type="number" step="0.01" defaultValue={Number(product.weight || 0)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="unit" className="text-sm font-medium">Хэмжих нэгж</label>
              <Input id="unit" name="unit" defaultValue={product.unit || "ширхэг"} placeholder="Ширхэг, кг, гр..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="stockQuantity" className="text-sm font-medium">Нөөцийн тоо</label>
              <Input id="stockQuantity" name="stockQuantity" type="number" required defaultValue={product.stockQuantity} />
            </div>
            <div className="space-y-2">
              <label htmlFor="remainingQuantity" className="text-sm font-medium">
                Үлдэгдэл {variantCombos.length > 0 && <span className="text-indigo-600 text-[10px]">(auto)</span>}
              </label>
              <Input 
                id="remainingQuantity" 
                name="remainingQuantity" 
                type="number" 
                required 
                defaultValue={product.stockQuantity - product.reservedStock}
                disabled={variantCombos.length > 0}
                value={variantCombos.length > 0 ? totalVariantStock : undefined}
                className={variantCombos.length > 0 ? "bg-slate-100 text-slate-500" : ""}
              />
            </div>
          </div>
          {/* Product Flags */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <label className="text-sm font-medium text-slate-800">Барааны тохиргоо</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" name="isFeatured" defaultChecked={product.isFeatured} className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                <span className="text-sm text-slate-700">⭐ Онцлох бараа</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" name="requiresAgeVerification" defaultChecked={product.requiresAgeVerification} className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-600" />
                <span className="text-sm text-slate-700">🛡️ 21+ насны хязгаар шаардах</span>
              </label>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-[#4F46E5] hover:bg-[#4338ca] mt-6 py-6 font-bold shadow-md">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            ӨӨРЧЛӨЛТИЙГ ХАДГАЛАХ
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

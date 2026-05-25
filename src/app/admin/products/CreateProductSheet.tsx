"use client"

import { useState, useMemo } from "react"
import { createProduct } from "@/app/actions/product-actions"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2, Package } from "lucide-react"
import { useRouter } from "next/navigation"
import { RichTextEditor } from "@/components/admin/RichTextEditor"

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

export function CreateProductSheet({ categories }: { categories: any[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [options, setOptions] = useState<{name: string, values: string}[]>([])
  const [variantStock, setVariantStock] = useState<Record<string, number>>({})
  const router = useRouter()

  const addOption = () => setOptions([...options, { name: "", values: "" }])
  const removeOption = (idx: number) => setOptions(options.filter((_, i) => i !== idx))
  const handleOptionChange = (idx: number, field: "name" | "values", val: string) => {
    const newOpts = [...options]
    newOpts[idx][field] = val
    setOptions(newOpts)
  }

  const parsedOptions = useMemo(() => {
    return options
      .filter(o => o.name.trim() && o.values.trim())
      .map(o => ({
        name: o.name.trim(),
        values: o.values.split(",").map(v => v.trim()).filter(v => v)
      }))
  }, [options])

  const variantCombos = useMemo(() => generateVariantKeys(parsedOptions), [parsedOptions])
  
  const totalVariantStock = useMemo(() => {
    return variantCombos.reduce((sum, v) => sum + (variantStock[v.key] || 0), 0)
  }, [variantCombos, variantStock])

  async function onSubmit(formData: FormData) {
    setLoading(true)
    const formattedOptions = parsedOptions

    const finalVariantStock = variantCombos.length > 0 
      ? Object.fromEntries(variantCombos.map(v => [v.key, variantStock[v.key] || 0]))
      : undefined

    const remainingQuantity = variantCombos.length > 0 
      ? totalVariantStock 
      : Number(formData.get("remainingQuantity") || 0)

    const res = await createProduct({
      sku: (formData.get("sku") as string) || `SKU-${Date.now()}`,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      stockQuantity: remainingQuantity,
      price: Number(formData.get("price") || 0),
      weight: Number(formData.get("weight") || 0),
      unit: (formData.get("unit") as string) || "ширхэг",
      categoryId: selectedCategoryId || undefined,
      customBadge: (formData.get("customBadge") as string) || undefined,
      options: formattedOptions.length > 0 ? formattedOptions : undefined,
    })
    setLoading(false)
    if (res.success) {
      setOpen(false)
      setOptions([])
      setVariantStock({})
      setSelectedCategoryId("")
      router.refresh()
    } else {
      alert(res.error || "Алдаа гарлаа")
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="inline-flex items-center justify-center rounded-md bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white hover:bg-[#4338ca] shadow-sm">
        <Plus className="w-4 h-4 mr-2" />
        Бараа нэмэх
      </SheetTrigger>
      <SheetContent className="overflow-y-auto w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Шинэ бараа нэмэх</SheetTitle>
          <SheetDescription>Дэлгүүрт худалдаалах шинэ барааны мэдээллийг оруулна уу.</SheetDescription>
        </SheetHeader>
        <form action={onSubmit} className="space-y-4 mt-6 pb-20">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Барааны нэр</label>
            <Input id="name" name="name" required placeholder="Нэр..." />
          </div>

          <div className="space-y-2">
            <label htmlFor="customBadge" className="text-sm font-medium">Тусгай Badge (Шошго)</label>
            <Input id="customBadge" name="customBadge" placeholder="Жнь: Шинэ, Хит, Цөөн үлдсэн..." />
            <p className="text-[10px] text-slate-400 font-medium italic">* Хоосон орхивол нөөцтэй үед "Нөөцтэй" гэж гарна.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="categoryId" className="text-sm font-medium">Ангилал (Category)</label>
            <select 
              id="categoryId"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Сонгох...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 font-medium italic">* Сонгохгүй бол "Ерөнхий ангилал"-д автоматаар орно.</p>
          </div>
          
          {/* Options / Variants UI */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-800">Сонголтууд (Өнгө, Хэмжээ г.м)</label>
              <Button type="button" variant="outline" size="sm" onClick={addOption} className="h-7 px-2 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Нэмэх
              </Button>
            </div>
            {options.length === 0 ? (
               <p className="text-xs text-slate-400">Сонголт шаардлагагүй бол хоосон үлдээнэ үү.</p>
            ) : (
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
            )}
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
                    <Input
                      type="number"
                      min={0}
                      value={variantStock[v.key] ?? 0}
                      onChange={(e) => setVariantStock(prev => ({
                        ...prev,
                        [v.key]: Math.max(0, Number(e.target.value) || 0)
                      }))}
                      className="w-20 h-8 text-xs text-center font-bold"
                    />
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
            <RichTextEditor name="description" placeholder="Барааны дэлгэрэнгүй..." />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium">Үнэ (₮)</label>
              <Input id="price" name="price" type="number" required placeholder="0" />
            </div>
            <div className="space-y-2">
              <label htmlFor="weight" className="text-sm font-medium">Жин (кг)</label>
              <Input id="weight" name="weight" type="number" step="0.01" placeholder="0.0" />
            </div>
            <div className="space-y-2">
              <label htmlFor="unit" className="text-sm font-medium">Хэмжих нэгж</label>
              <Input id="unit" name="unit" defaultValue="ширхэг" placeholder="Ширхэг, кг, гр..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="targetQuantity" className="text-sm font-medium">Зорилтот тоо</label>
              <Input id="targetQuantity" name="targetQuantity" type="number" required placeholder="0" />
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
                placeholder="0"
                disabled={variantCombos.length > 0}
                value={variantCombos.length > 0 ? totalVariantStock : undefined}
                className={variantCombos.length > 0 ? "bg-slate-100 text-slate-500" : ""}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="sourceLink" className="text-sm font-medium">Эх сурвалжийн холбоос</label>
            <Input id="sourceLink" name="sourceLink" type="url" placeholder="https://..." />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-[#4F46E5] hover:bg-[#4338ca] mt-6 py-6 shadow-md shadow-indigo-200">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Хадгалах
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

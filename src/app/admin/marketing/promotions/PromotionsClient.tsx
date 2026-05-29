"use client"

import { useState } from "react"
import { Package, Tag, Undo2, Check, Search } from "lucide-react"
import { applyDiscountBulk, removeDiscountBulk } from "@/app/actions/promotion-actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function PromotionsClient({ discountedProducts, allProducts }: { discountedProducts: any[], allProducts: any[] }) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // Create Promotion Form State
  const [search, setSearch] = useState("")
  const [promoType, setPromoType] = useState<"PERCENT" | "FIXED">("PERCENT")
  const [promoValue, setPromoValue] = useState("")
  const [selectedPromoIds, setSelectedPromoIds] = useState<string[]>([])
  const [isApplying, setIsApplying] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  const handleApply = async () => {
    if (selectedPromoIds.length === 0) return toast.error("Бараа сонгоно уу")
    if (!promoValue || Number(promoValue) <= 0) return toast.error("Утга оруулна уу")
    
    setIsApplying(true)
    const promise = applyDiscountBulk(selectedPromoIds, promoType, Number(promoValue))
    
    toast.promise(promise, {
      loading: "Хямдрал зарлаж байна...",
      success: (res) => {
        setIsApplying(false)
        if (res.success) {
          setSelectedPromoIds([])
          setPromoValue("")
          router.refresh()
          return "Амжилттай хямдрал зарлалаа"
        }
        throw new Error(res.error || "Алдаа гарлаа")
      },
      error: (err) => {
        setIsApplying(false)
        return "Алдаа: " + err.message
      }
    })
  }

  const handleRemove = async () => {
    if (selectedIds.length === 0) return
    if (!confirm("Сонгосон бараануудын хямдралыг зогсоох уу?")) return

    setIsRemoving(true)
    const promise = removeDiscountBulk(selectedIds)
    
    toast.promise(promise, {
      loading: "Хямдрал зогсоож байна...",
      success: (res) => {
        setIsRemoving(false)
        if (res.success) {
          setSelectedIds([])
          router.refresh()
          return "Хямдрал амжилттай зогслоо"
        }
        throw new Error(res.error || "Алдаа гарлаа")
      },
      error: (err) => {
        setIsRemoving(false)
        return "Алдаа: " + err.message
      }
    })
  }

  const filteredProducts = allProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex gap-4 items-center">
          <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-900">Идэвхтэй хямдрал</h2>
            <p className="text-sm text-slate-500">Нийт {discountedProducts.length} бараа хямдралтай байна</p>
          </div>
        </div>
        <Dialog>
          <DialogTrigger className="inline-flex items-center justify-center bg-[#4F46E5] hover:bg-[#4338ca] text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors">
            Шинэ хямдрал зарлах
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b border-slate-100">
              <DialogTitle>Бараа хямдруулах</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Хямдралын төрөл</label>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={promoType}
                    onChange={(e) => setPromoType(e.target.value as any)}
                  >
                    <option value="PERCENT">Хувиар (%)</option>
                    <option value="FIXED">Мөнгөн дүнгээр (₮)</option>
                  </select>
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Утга {promoType === "PERCENT" ? "(%)" : "(₮)"}</label>
                  <Input type="number" value={promoValue} onChange={e => setPromoValue(e.target.value)} placeholder={promoType === "PERCENT" ? "Ж: 20" : "Ж: 5000"} />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-sm">Бараа сонгох <span className="text-[#4F46E5]">({selectedPromoIds.length} сонгосон)</span></h3>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <Input 
                    placeholder="Барааны нэр эсвэл SKU-ээр хайх..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="border rounded-md max-h-60 overflow-y-auto divide-y bg-white">
                  {filteredProducts.map(p => (
                    <label key={p.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedPromoIds.includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedPromoIds([...selectedPromoIds, p.id])
                          else setSelectedPromoIds(selectedPromoIds.filter(id => id !== p.id))
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5]"
                      />
                      {p.imageUrl ? <img src={p.imageUrl} className="w-10 h-10 rounded object-cover border border-slate-200" /> : <div className="w-10 h-10 rounded border border-slate-200 bg-slate-50 flex items-center justify-center"><Package className="w-5 h-5 text-slate-400"/></div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{p.name}</p>
                        <p className="text-xs font-mono text-slate-500">SKU: {p.sku}</p>
                      </div>
                      <div className="text-right pl-2">
                        <p className="text-sm font-bold text-slate-900">₮{Number(p.price).toLocaleString()}</p>
                      </div>
                    </label>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="p-4 text-center text-sm text-slate-500">Бараа олдсонгүй</div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <Button onClick={handleApply} disabled={isApplying} className="w-full bg-[#4F46E5] text-white hover:bg-[#4338ca] shadow-md shadow-[#4F46E5]/20">
                {isApplying ? "Уншиж байна..." : "Хямдруулах"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center justify-between animate-in slide-in-from-top-2">
          <span className="text-amber-800 font-medium text-sm">{selectedIds.length} бараа сонгогдлоо</span>
          <Button onClick={handleRemove} disabled={isRemoving} variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100">
            Хямдрал зогсоох
          </Button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
            <tr>
              <th className="px-4 py-3.5 w-10">
                <input 
                  type="checkbox" 
                  checked={selectedIds.length === discountedProducts.length && discountedProducts.length > 0}
                  onChange={(e) => setSelectedIds(e.target.checked ? discountedProducts.map(p => p.id) : [])}
                  className="rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5]"
                />
              </th>
              <th className="px-4 py-3.5">Бараа</th>
              <th className="px-4 py-3.5 text-right">Хуучин үнэ</th>
              <th className="px-4 py-3.5 text-right">Хямдарсан үнэ</th>
              <th className="px-4 py-3.5 text-right">Зөрүү</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {discountedProducts.length > 0 ? discountedProducts.map(product => {
              const oldPrice = Number(product.comparePrice)
              const newPrice = Number(product.price)
              const diff = oldPrice - newPrice
              const percent = Math.round((diff / oldPrice) * 100)
              
              return (
                <tr key={product.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-4">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(product.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds([...selectedIds, product.id])
                        else setSelectedIds(selectedIds.filter(id => id !== product.id))
                      }}
                      className="rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5]"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {product.imageUrl ? <img src={product.imageUrl} className="w-10 h-10 rounded-md object-cover border" /> : <div className="w-10 h-10 rounded-md bg-slate-100 border flex items-center justify-center"><Package className="w-5 h-5 text-slate-400"/></div>}
                      <div>
                        <p className="font-bold text-slate-900">{product.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">SKU: {product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="line-through text-slate-400 font-medium">₮{oldPrice.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-bold text-[#F26522] text-base">₮{newPrice.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-emerald-600 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded">-{percent}%</span>
                      <span className="text-slate-500 text-[10px] mt-0.5">-₮{diff.toLocaleString()}</span>
                    </div>
                  </td>
                </tr>
              )
            }) : (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                  <Tag className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                  <p className="font-medium text-slate-600">Хямдралтай бараа алга байна.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

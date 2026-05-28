"use client"

import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Package, ImagePlus } from "lucide-react"
import { getProducts } from "@/app/actions/product-actions"

export function CategoryProductsSheet({ categoryId, categoryName, productCount }: { categoryId: string, categoryName: string, productCount: number }) {
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadProducts()
    }
  }, [open])

  async function loadProducts() {
    setLoading(true)
    try {
      const res = await getProducts({ categoryId, limit: 100 }) // Load up to 100
      if (res.success) {
        setProducts(res.products)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1 rounded-full text-xs transition-colors cursor-pointer ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 gap-1.5">
        <Package className="w-3.5 h-3.5 text-slate-500" />
        {productCount}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>"{categoryName}" бараанууд</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {products.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Энэ ангилалд бараа алга байна.
              </div>
            ) : (
              <div className="grid gap-3">
                {products.map((p) => (
                  <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-colors">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-14 h-14 object-cover rounded-lg border border-slate-200 shadow-sm" />
                    ) : (
                      <div className="w-14 h-14 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                        <ImagePlus className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-slate-900 truncate" title={p.name}>{p.name}</h4>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{p.sku}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[#F26522] font-bold text-sm">{Number(p.price).toLocaleString()} ₮</span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">Үлдэгдэл: {p.stockQuantity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

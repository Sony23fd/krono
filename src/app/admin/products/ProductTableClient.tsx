"use client"

import { useState } from "react"
import { BulkActionsBar } from "./BulkActionsBar"
import { EditProductSheet } from "./EditProductSheet"
import { MultiImageUploader } from "@/components/admin/MultiImageUploader"
import { VideoUploader } from "@/components/admin/VideoUploader"
import { Package, Star, ShieldAlert } from "lucide-react"

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Идэвхтэй",
  OUT_OF_STOCK: "Дууссан",
  DRAFT: "Ноорог",
  ARCHIVED: "Архив",
}

interface ProductTableProps {
  products: any[]
  categories: any[]
  search: string
  currentPage?: number
}

export function ProductTableClient({ products, categories, search, currentPage = 1 }: ProductTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const allIds = products.map((p: any) => p.id)
  const allSelected = allIds.length > 0 && allIds.every((id: string) => selectedIds.includes(id))

  function toggleAll() {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(allIds)
    }
  }

  function toggleOne(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  return (
    <>
      {/* ═══ Desktop Table ═══ */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden hidden md:block">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/80 border-b border-slate-200/80">
            <tr className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
              <th className="px-3 py-3.5 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-slate-300 text-[#F26522] focus:ring-[#F26522] cursor-pointer"
                />
              </th>
              <th className="px-3 py-3.5 w-10 text-center">Д/д</th>
              <th className="px-4 py-3.5">SKU</th>
              <th className="px-4 py-3.5">Бараа</th>
              <th className="px-4 py-3.5 text-center">Медиа</th>
              <th className="px-4 py-3.5 text-right">Үнэ</th>
              <th className="px-4 py-3.5 text-center">Үлдэгдэл</th>
              <th className="px-4 py-3.5 text-center">Статус</th>
              <th className="px-4 py-3.5 text-center">Засах</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.length > 0 ? (
              products.map((product: any, index: number) => {
                const availableStock = product.stockQuantity - product.reservedStock
                const isChecked = selectedIds.includes(product.id)
                const serialNumber = (currentPage - 1) * 20 + index + 1
                return (
                  <tr key={product.id} className={`transition-colors ${isChecked ? "bg-blue-50/50" : availableStock > 0 && availableStock < 5 ? "bg-red-50/30 hover:bg-red-50/50" : "hover:bg-slate-50/50"}`}>
                    <td className="px-3 py-4">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleOne(product.id)}
                        className="w-4 h-4 rounded border-slate-300 text-[#F26522] focus:ring-[#F26522] cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-4 text-center text-[11px] text-slate-400 font-medium">{serialNumber}</td>
                    <td className="px-4 py-4 font-mono text-[11px] text-slate-400">{product.sku}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-slate-900 text-[13px] leading-snug">{product.name}</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {product.category && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600">
                              {product.category.name}
                            </span>
                          )}
                          {product.isPreOrder && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fb8500]/10 text-[#fb8500]">
                              ⏰ Урьдчилсан
                            </span>
                          )}
                          {product.isFeatured && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                              <Star className="w-2.5 h-2.5 fill-amber-500" /> Онцлох
                            </span>
                          )}
                          {product.requiresAgeVerification && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                              <ShieldAlert className="w-2.5 h-2.5" /> 21+
                            </span>
                          )}
                          {availableStock > 0 && availableStock < 5 && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 animate-pulse">
                              ⚠️ Дуусаж буй
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2 justify-center items-center">
                        <MultiImageUploader product={product} />
                        <VideoUploader
                          productId={product.id}
                          currentVideoUrl={product.videoUrl}
                          batchName={product.name}
                        />
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <span className="font-bold text-slate-900 text-[13px]">₮{Number(product.price).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">/ {product.unit || "ширхэг"}</span></span>
                      {Number(product.deliveryFee) > 0 && (
                        <p className="text-[10px] text-slate-400 mt-0.5">+₮{Number(product.deliveryFee).toLocaleString()}</p>
                      )}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center justify-center min-w-[48px] px-2.5 py-1 rounded-full text-xs font-bold ${
                        availableStock <= 0 ? 'bg-red-100 text-red-700' :
                        availableStock < 20 ? 'bg-[#fb8500]/10 text-[#fb8500]' :
                        'bg-[#22c55e]/10 text-[#22c55e]'
                      }`}>
                        {availableStock}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                        product.status === "ACTIVE" ? "bg-[#22c55e]/10 text-[#166534]" :
                        product.status === "OUT_OF_STOCK" ? "bg-red-50 text-red-700" :
                        product.status === "DRAFT" ? "bg-amber-50 text-amber-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {STATUS_LABELS[product.status] || product.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <EditProductSheet product={product} categories={categories} />
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={9} className="px-5 py-16 text-center text-slate-500">
                  <Package className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                  <p className="font-semibold text-slate-600">{search ? `"${search}" хайлтад тохирох бараа олдсонгүй` : "Бараа бүртгэгдээгүй байна"}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ═══ Mobile Card View ═══ */}
      <div className="md:hidden space-y-3">
        {products.length > 0 ? (
          products.map((product: any, index: number) => {
            const availableStock = product.stockQuantity - product.reservedStock
            const isChecked = selectedIds.includes(product.id)
            const serialNumber = (currentPage - 1) * 20 + index + 1
            return (
              <div key={product.id} className={`rounded-2xl border shadow-sm p-4 ${availableStock > 0 && availableStock < 5 ? "bg-red-50/10 border-red-200/80" : "bg-white border-slate-200/80"} ${isChecked ? "ring-2 ring-[#F26522]/30" : ""}`}>
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleOne(product.id)}
                    className="w-4 h-4 mt-1 rounded border-slate-300 text-[#F26522] focus:ring-[#F26522] cursor-pointer shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm leading-snug truncate">
                      <span className="text-slate-400 font-normal mr-1.5">{serialNumber}.</span>
                      {product.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">SKU: {product.sku}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {product.category && (
                        <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          {product.category.name}
                        </span>
                      )}
                      {product.isFeatured && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          <Star className="w-2.5 h-2.5 fill-amber-500" /> Онцлох
                        </span>
                      )}
                      {product.requiresAgeVerification && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          <ShieldAlert className="w-2.5 h-2.5" /> 21+
                        </span>
                      )}
                      {availableStock > 0 && availableStock < 5 && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 animate-pulse">
                          ⚠️ Дуусаж буй
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                    product.status === "ACTIVE" ? "bg-[#22c55e]/10 text-[#166534]" :
                    product.status === "OUT_OF_STOCK" ? "bg-red-50 text-red-700" :
                    product.status === "DRAFT" ? "bg-amber-50 text-amber-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {STATUS_LABELS[product.status] || product.status}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Үнэ</p>
                      <p className="font-black text-slate-900">₮{Number(product.price).toLocaleString()} <span className="text-[10px] font-normal text-slate-500">/ {product.unit || "ширхэг"}</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Үлдэгдэл</p>
                      <p className={`font-bold ${
                        availableStock <= 0 ? 'text-red-600' :
                        availableStock < 20 ? 'text-[#fb8500]' :
                        'text-[#22c55e]'
                      }`}>{availableStock}</p>
                    </div>
                  </div>
                  <EditProductSheet product={product} categories={categories} />
                </div>
              </div>
            )
          })
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
            <Package className="w-10 h-10 mx-auto text-slate-200 mb-3" />
            <p className="font-semibold text-slate-600 text-sm">
              {search ? `"${search}" хайлтад тохирох бараа олдсонгүй` : "Бараа бүртгэгдээгүй байна"}
            </p>
          </div>
        )}
      </div>

      {/* Bulk Actions Floating Bar */}
      <BulkActionsBar
        selectedIds={selectedIds}
        categories={categories}
        onClear={() => setSelectedIds([])}
      />
    </>
  )
}

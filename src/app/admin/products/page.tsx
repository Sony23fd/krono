import { getProducts } from "@/app/actions/product-actions"
import { getCategories } from "@/app/actions/category-actions"
import { CreateProductSheet } from "./CreateProductSheet"
import { EditProductSheet } from "./EditProductSheet"
import { MultiImageUploader } from "@/components/admin/MultiImageUploader"
import { VideoUploader } from "@/components/admin/VideoUploader"
import { ListSearchFilter } from "@/components/admin/ListSearchFilter"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Package, Plus, Upload } from "lucide-react"

export const dynamic = "force-dynamic"

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Идэвхтэй",
  OUT_OF_STOCK: "Дууссан",
  DRAFT: "Ноорог",
  ARCHIVED: "Архив",
}

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ q?: string, page?: string, status?: string, category?: string, sort?: string }> }) {
  const p = await searchParams;
  const search = p.q || "";
  const page = Math.max(1, Number(p.page || 1));
  const statusFilter = p.status || "ALL";
  const categoryFilter = p.category || "";
  const sortFilter = (p.sort || "newest") as any;

  const [{ products, success, total, totalPages, currentPage }, { categories }] = await Promise.all([
    getProducts({
      search: search || undefined,
      page,
      limit: 20,
      status: statusFilter !== "ALL" ? statusFilter : undefined,
      categoryId: categoryFilter || undefined,
      sort: sortFilter,
    }),
    getCategories()
  ])

  const filteredProducts = products || [];

  function buildPageUrl(pageNum: number) {
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    if (statusFilter !== "ALL") params.set("status", statusFilter)
    if (categoryFilter) params.set("category", categoryFilter)
    if (sortFilter !== "newest") params.set("sort", sortFilter)
    params.set("page", String(pageNum))
    return `/admin/products?${params.toString()}`
  }

  return (
    <div className="space-y-5" suppressHydrationWarning>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Бараанууд</h1>
          <p className="text-sm text-slate-500 mt-1">
            Нийт <strong className="text-slate-700">{total}</strong> бараа
            {search && <> · "<span className="text-[#e63946] font-medium">{search}</span>" хайлт</>}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ListSearchFilter placeholder="Барааны нэрээр хайх..." />
          <CreateProductSheet categories={categories || []} />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-sm overflow-x-auto">
        {[
          { key: "ALL", label: "Бүгд" },
          { key: "ACTIVE", label: "Идэвхтэй" },
          { key: "OUT_OF_STOCK", label: "Дууссан" },
          { key: "DRAFT", label: "Ноорог" },
          { key: "ARCHIVED", label: "Архив" },
        ].map(tab => (
          <Link
            key={tab.key}
            href={`/admin/products?status=${tab.key}${search ? `&q=${search}` : ""}`}
            className={`px-4 py-2 rounded-xl font-semibold text-xs transition-all whitespace-nowrap ${
              statusFilter === tab.key
                ? "bg-[#001f3f] text-white shadow-md"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* ═══ Desktop Table ═══ */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden hidden md:block">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/80 border-b border-slate-200/80">
            <tr className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
              <th className="px-5 py-3.5">SKU</th>
              <th className="px-5 py-3.5">Бараа</th>
              <th className="px-5 py-3.5 text-center">Медиа</th>
              <th className="px-5 py-3.5 text-right">Үнэ</th>
              <th className="px-5 py-3.5 text-center">Үлдэгдэл</th>
              <th className="px-5 py-3.5 text-center">Статус</th>
              <th className="px-5 py-3.5 text-center">Засах</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {success && filteredProducts.length > 0 ? (
              filteredProducts.map((product: any) => {
                const availableStock = product.stockQuantity - product.reservedStock;
                return (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4 font-mono text-[11px] text-slate-400">{product.sku}</td>
                  <td className="px-5 py-4">
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
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-2 justify-center items-center">
                      <MultiImageUploader product={product} />
                      <VideoUploader
                        productId={product.id}
                        currentVideoUrl={product.videoUrl}
                        batchName={product.name}
                      />
                    </div>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <span className="font-bold text-slate-900 text-[13px]">₮{Number(product.price).toLocaleString()}</span>
                    {Number(product.deliveryFee) > 0 && (
                      <p className="text-[10px] text-slate-400 mt-0.5">+₮{Number(product.deliveryFee).toLocaleString()}</p>
                    )}
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex items-center justify-center min-w-[48px] px-2.5 py-1 rounded-full text-xs font-bold ${
                      availableStock <= 0 ? 'bg-red-100 text-red-700' :
                      availableStock < 20 ? 'bg-[#fb8500]/10 text-[#fb8500]' :
                      'bg-[#22c55e]/10 text-[#22c55e]'
                    }`}>
                      {availableStock}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                      product.status === "ACTIVE" ? "bg-[#22c55e]/10 text-[#166534]" :
                      product.status === "OUT_OF_STOCK" ? "bg-red-50 text-red-700" :
                      product.status === "DRAFT" ? "bg-amber-50 text-amber-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {STATUS_LABELS[product.status] || product.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <EditProductSheet product={product} />
                  </td>
                </tr>
              )})
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center text-slate-500">
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
        {success && filteredProducts.length > 0 ? (
          filteredProducts.map((product: any) => {
            const availableStock = product.stockQuantity - product.reservedStock;
            return (
              <div key={product.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm leading-snug truncate">{product.name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">SKU: {product.sku}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {product.category && (
                        <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          {product.category.name}
                        </span>
                      )}
                      {product.isPreOrder && (
                        <span className="text-[10px] font-bold bg-[#fb8500]/10 text-[#fb8500] px-2 py-0.5 rounded-full">
                          ⏰ Урьдчилсан
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
                      <p className="font-black text-slate-900">₮{Number(product.price).toLocaleString()}</p>
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
                  <EditProductSheet product={product} />
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200/80 shadow-sm px-5 py-3">
          <p className="text-xs text-slate-500">
            <strong className="text-slate-700">{currentPage}</strong> / <strong className="text-slate-700">{totalPages}</strong> хуудас
          </p>
          <div className="flex items-center gap-1">
            {currentPage > 1 && (
              <Link href={buildPageUrl(currentPage - 1)} className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
                <ChevronLeft className="w-4 h-4 text-slate-500" />
              </Link>
            )}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
              return (
                <Link key={pageNum} href={buildPageUrl(pageNum)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                    pageNum === currentPage ? "bg-[#001f3f] text-white shadow-md" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >{pageNum}</Link>
              )
            })}
            {currentPage < totalPages && (
              <Link href={buildPageUrl(currentPage + 1)} className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

import { getProducts } from "@/app/actions/product-actions"
import { getCategories } from "@/app/actions/category-actions"
import { CreateProductSheet } from "./CreateProductSheet"
import { EditProductSheet } from "./EditProductSheet"
import { MultiImageUploader } from "@/components/admin/MultiImageUploader"
import { VideoUploader } from "@/components/admin/VideoUploader"
import { ListSearchFilter } from "@/components/admin/ListSearchFilter"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Package } from "lucide-react"

export const dynamic = "force-dynamic"

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
    <div className="space-y-6" suppressHydrationWarning>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Бараанууд</h1>
          <p className="text-sm text-slate-500 mt-1">
            Нийт <strong>{total}</strong> бараа
            {search && <> · "<span className="text-indigo-600 font-medium">{search}</span>" хайлт</>}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <ListSearchFilter placeholder="Барааны нэрээр хайх..." />
          <CreateProductSheet categories={categories || []} />
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 border-b">
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
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${
              statusFilter === tab.key
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm w-full border">
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-medium whitespace-nowrap">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Нэр</th>
                <th className="px-4 py-3 text-center">Медиа</th>
                <th className="px-4 py-3">Үлдэгдэл</th>
                <th className="px-4 py-3">Үнэ</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3 text-center">Засах</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {success && filteredProducts.length > 0 ? (
                filteredProducts.map((product: any) => {
                  const availableStock = product.stockQuantity - product.reservedStock;
                  return (
                  <tr key={product.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-4 font-mono text-xs text-slate-500">{product.sku}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-slate-900">{product.name}</span>
                        {product.category && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 w-fit">
                            {product.category.name}
                          </span>
                        )}
                        {product.isPreOrder && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 w-fit">
                            ⏰ Урьдчилсан
                          </span>
                        )}
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

                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        availableStock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {availableStock} / {product.stockQuantity}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="font-bold text-slate-900">₮{Number(product.price).toLocaleString()}</span>
                    </td>

                    <td className="px-4 py-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        product.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                        product.status === "OUT_OF_STOCK" ? "bg-red-100 text-red-700" :
                        product.status === "DRAFT" ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-700"
                      }`}>
                        {product.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <EditProductSheet product={product} />
                    </td>
                  </tr>
                )})
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    {search ? `"${search}" хайлтад тохирох бараа олдсонгүй` : "Бараа бүртгэгдээгүй байна"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <p className="text-xs text-slate-500">
              Нийт <strong>{total}</strong> барааны <strong>{currentPage}</strong> / <strong>{totalPages}</strong> хуудас
            </p>
            <div className="flex items-center gap-1">
              {currentPage > 1 && (
                <Link href={buildPageUrl(currentPage - 1)} className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-slate-50">
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              )}
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const pageNum = totalPages <= 7 ? i + 1 : currentPage <= 4 ? i + 1 : currentPage >= totalPages - 3 ? totalPages - 6 + i : currentPage - 3 + i;
                return (
                  <Link key={pageNum} href={buildPageUrl(pageNum)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold ${
                      pageNum === currentPage ? "bg-indigo-600 text-white" : "border text-slate-600 hover:bg-slate-50"
                    }`}
                  >{pageNum}</Link>
                )
              })}
              {currentPage < totalPages && (
                <Link href={buildPageUrl(currentPage + 1)} className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-slate-50">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

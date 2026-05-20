import { getProducts } from "@/app/actions/product-actions"
import { getCategories } from "@/app/actions/category-actions"
import { CreateProductSheet } from "./CreateProductSheet"
import { ProductTableClient } from "./ProductTableClient"
import { ListSearchFilter } from "@/components/admin/ListSearchFilter"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Package, Plus, Upload } from "lucide-react"

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

      {/* ═══ Product Table with Checkboxes ═══ */}
      <ProductTableClient
        products={filteredProducts}
        categories={categories || []}
        search={search}
      />

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

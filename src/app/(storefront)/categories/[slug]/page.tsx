import { notFound } from "next/navigation"
import Link from "next/link"
import { getCategories } from "@/app/actions/category-actions"
import { getActiveProducts } from "@/app/actions/product-actions"
import { ActiveBatchesList } from "@/components/storefront/home/ActiveBatchesList"
import { ShopFilters } from "@/components/storefront/ShopFilters"
import { Pagination } from "@/components/storefront/Pagination"
import { Package } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function CategoryDetailPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ type?: string, q?: string, sort?: string, page?: string }> }) {
  const { slug } = await params
  const search = await searchParams
  const filterType = search.type || "all"
  const query = search.q?.trim() || ""
  const sort = search.sort || "newest"
  const page = parseInt(search.page || "1")

  const [{ categories }, { products, total, totalPages, currentPage }] = await Promise.all([
    getCategories(),
    getActiveProducts({
      categorySlug: slug,
      type: filterType as "all" | "ready" | "preorder",
      search: query,
      sort: sort as "newest" | "oldest" | "price_asc" | "price_desc" | "stock_asc" | "stock_desc",
      page,
      limit: 24,
    }),
  ])

  const category = categories?.find((cat: any) => cat.slug === slug)
  if (!category) return notFound()

  let title = `${category.name}`
  let subtitle = `${category._count?.products ?? 0} бүтээгдэхүүнтэй ангилал`
  let theme: "ready" | "preorder" | string = "ready"
  let badge = category.name

  if (filterType === "ready") {
    title = `${category.name} - Бэлэн бараа`
    subtitle = `"${category.name}" ангиллын бэлэн бараа`
    theme = "ready"
  } else if (filterType === "preorder") {
    title = `${category.name} - Урьдчилсан захиалга`
    subtitle = `"${category.name}" ангиллын урьдчилсан захиалга`
    theme = "preorder"
  }

  if (query) {
    subtitle = `"${query}" хайлтад олдсон үр дүн`
  }

  return (
    <div className="bg-white min-h-screen pt-8 pb-12">
      <div className="max-w-6xl mx-auto px-4 mb-2">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <Link href="/categories" className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">← Ангилалууд руу буцах</Link>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-4">{category.name}</h1>
            <p className="text-slate-500 mt-2">{category._count?.products ?? 0} бүтээгдэхүүнтэй ангилал</p>
          </div>
          <Link href="/shop" className="rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors">Дэлгүүрт бүх бараа харах</Link>
        </div>
      </div>

      <ShopFilters categories={categories || []} selectedCategorySlug={category.slug} />

      {products && products.length > 0 ? (
        <>
          <ActiveBatchesList
            batches={products}
            title={title}
            subtitle={subtitle}
            badge={badge}
            theme={theme}
          />
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl={`/categories/${slug}`}
            searchParams={new URLSearchParams({
              type: filterType,
              q: query,
              sort,
            })}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 px-4">
          <Package className="w-16 h-16 text-slate-200 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Тухайн ангилалд бараа олдсонгүй</h2>
          <p className="text-slate-500 text-center max-w-md">Шүүлтүүр болон хайлтын нөхцлийг өөрчилж үзнэ үү.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="inline-flex items-center justify-center rounded-full bg-[#1B3561] px-6 py-3 text-sm font-bold text-white hover:bg-[#152849] transition-colors">Дэлгүүр рүү буцах</Link>
            <Link href="/categories" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Ангилалуудыг үзэх</Link>
          </div>
        </div>
      )}
    </div>
  )
}

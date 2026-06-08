import { notFound } from "next/navigation"
import Link from "next/link"
import { getCategories } from "@/app/actions/category-actions"
import { getActiveProducts } from "@/app/actions/product-actions"
import { ShopFilters } from "@/components/storefront/ShopFilters"
import { ShopSidebar } from "@/components/storefront/ShopSidebar"
import { ProductGridWithLoadMore } from "@/components/storefront/product/ProductGridWithLoadMore"
import { Package } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function CategoryDetailPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ type?: string, q?: string, sort?: string, page?: string }> }) {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  const search = await searchParams
  const filterType = search.type || "all"
  const query = search.q?.trim() || ""
  const sort = search.sort || "newest"
  const page = parseInt(search.page || "1")

  const [{ categories }, { products, total, totalPages, currentPage }] = await Promise.all([
    getCategories(),
    getActiveProducts({
      categorySlug: decodedSlug,
      type: filterType as "all" | "ready" | "preorder",
      search: query,
      sort: sort as "newest" | "oldest" | "price_asc" | "price_desc" | "stock_asc" | "stock_desc",
      page: 1, // Start on page 1 but with larger limit to get all products up to current page
      limit: 24 * page,
    }),
  ])

  async function loadMore(nextPage: number) {
    "use server";
    const { products } = await getActiveProducts({
      categorySlug: decodedSlug,
      type: filterType as "all" | "ready" | "preorder",
      search: query,
      sort: sort as "newest" | "oldest" | "price_asc" | "price_desc" | "stock_asc" | "stock_desc",
      page: nextPage,
      limit: 24,
    });
    return products;
  }

  const category = categories?.find((cat: any) => cat.slug === decodedSlug)
  if (!category) return notFound()

  // Determine the display parent and the siblings/children
  let displayCategory = category;
  let activeSubSlug = "all";

  if (category.parentId) {
    // We are on a subcategory page!
    const parentCat = categories?.find((c: any) => c.id === category.parentId);
    if (parentCat) {
      displayCategory = parentCat;
      activeSubSlug = category.slug; // Mark this subcategory as active
    }
  }

  const displayName = displayCategory.displayName || displayCategory.name
  const subCats = categories?.filter((c: any) => c.parentId === displayCategory.id) || []

  let title = `${displayName}`
  let subtitle = `${total} бүтээгдэхүүнтэй ангилал`
  let theme: "ready" | "preorder" | string = "ready"
  let badge = displayName

  if (filterType === "ready") {
    title = `${displayName} - Бэлэн бараа`
    subtitle = `"${displayName}" ангиллын бэлэн бараа`
    theme = "ready"
  } else if (filterType === "preorder") {
    title = `${displayName} - Урьдчилсан захиалга`
    subtitle = `"${displayName}" ангиллын урьдчилсан захиалга`
    theme = "preorder"
  }

  if (query) {
    subtitle = `"${query}" хайлтад олдсон үр дүн`
  }

  return (
    <div className="bg-white min-h-screen pt-8 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="lg:flex lg:gap-8">
          <ShopSidebar categories={categories || []} selectedCategorySlug={displayCategory.slug} />
          
          <div className="flex-1">
            <div className="mb-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <Link href="/categories" className="text-sm text-slate-500 hover:text-indigo-600 transition-colors lg:hidden">← Ангилалууд руу буцах</Link>
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-4">{displayName}</h1>
                  <p className="text-slate-500 mt-2">{total} бүтээгдэхүүнтэй ангилал</p>
                  
                  {subCats.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700 py-1.5 mr-2">Ангилал:</span>
                      
                      {/* "All" Tab */}
                      <Link 
                        href={`/categories/${displayCategory.slug}`}
                        className={`inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium transition-all ${
                          activeSubSlug === "all" 
                            ? "bg-[#F26522] text-white shadow-md" 
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-transparent"
                        }`}
                      >
                        Бүгд
                      </Link>

                      {/* Subcategory Tabs */}
                      {subCats.map((sub: any) => (
                        <Link 
                          key={sub.id} 
                          href={`/categories/${sub.slug}`}
                          className={`inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium transition-all ${
                            activeSubSlug === sub.slug 
                              ? "bg-[#F26522] text-white shadow-md" 
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-transparent"
                          }`}
                        >
                          {sub.displayName || sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <ShopFilters categories={categories || []} selectedCategorySlug={category.slug} />

      {products && products.length > 0 ? (
        <div className="pt-6">
          <ProductGridWithLoadMore 
            initialProducts={products}
            initialTotalPages={totalPages}
            initialPage={page}
            fetchNextPage={loadMore}
          />
        </div>
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
        </div>
      </div>
    </div>
  )
}

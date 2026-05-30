import { getActiveProducts } from "@/app/actions/product-actions"
import { getCategories } from "@/app/actions/category-actions"
import { ShopFilters } from "@/components/storefront/ShopFilters"
import { ShopSidebar } from "@/components/storefront/ShopSidebar"
import { ProductGridWithLoadMore } from "@/components/storefront/product/ProductGridWithLoadMore"
import { TrendingUp, Package } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ q?: string, category?: string, sort?: string, page?: string, sale?: string }> }) {
  const params = await searchParams
  const query = params.q ? decodeURIComponent(params.q.trim()) : ""
  const rawCategorySlug = params.category?.trim() || "all"
  const categorySlug = rawCategorySlug !== "all" ? decodeURIComponent(rawCategorySlug) : "all"
  const sort = params.sort || "newest"
  const page = parseInt(params.page || "1")
  const isSale = params.sale === "true"

  const [{ categories }, { products, total, totalPages, currentPage }] = await Promise.all([
    getCategories(),
    getActiveProducts({
      search: query,
      type: "all",
      categorySlug: categorySlug !== "all" ? categorySlug : undefined,
      sort: sort as "newest" | "oldest" | "price_asc" | "price_desc" | "stock_asc" | "stock_desc",
      page: 1, // initial page is always 1 for Server Component
      limit: 24,
      sale: isSale,
    }),
  ])

  async function loadMore(nextPage: number) {
    "use server";
    const { products } = await getActiveProducts({
      search: query,
      type: "all",
      categorySlug: categorySlug !== "all" ? categorySlug : undefined,
      sort: sort as "newest" | "oldest" | "price_asc" | "price_desc" | "stock_asc" | "stock_desc",
      page: nextPage,
      limit: 24,
      sale: isSale,
    });
    return products;
  }

  const selectedCategory = categories?.find((cat: any) => cat.slug === categorySlug)

  let title = selectedCategory ? (selectedCategory.displayName || selectedCategory.name) : "Дэлгүүр"
  let subtitle = selectedCategory
    ? `"${selectedCategory.displayName || selectedCategory.name}" ангиллын бүтээгдэхүүнүүд`
    : "Манай дэлгүүрт байгаа бүх барааны жагсаалт"
  let theme: "ready" | "preorder" | string = "ready"
  let badge = selectedCategory ? (selectedCategory.displayName || selectedCategory.name) : "Каталог"

  if (isSale) {
    title = "Хямдралтай бараанууд"
    subtitle = "СУПЕР ХЯМДРАЛ"
  } else if (query) {
    subtitle = `"${query}" хайлтад олдсон бараанууд`
  }

  return (
    <div className="bg-white min-h-screen pt-8 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Main Flex Container */}
        <div className="lg:flex lg:gap-8">
          
          {/* Sidebar (Desktop only) */}
          <ShopSidebar categories={categories || []} selectedCategorySlug={selectedCategory?.slug} />

          {/* Main Content Area */}
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold text-[#1B3561] tracking-tight mb-6 lg:hidden">Дэлгүүр</h1>
            
            <ShopFilters categories={categories || []} selectedCategorySlug={selectedCategory?.slug} />

            {products && products.length > 0 ? (
              <div className="pt-8">
                {(title || badge || subtitle) && (
                  <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                      {badge && (
                        <div className={`inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full border ${theme === "preorder" ? "bg-amber-100/50 border-amber-200/50 text-amber-600" : "bg-indigo-100/50 border-indigo-200/50 text-[#4e3dc7]"}`}>
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">{badge}</span>
                        </div>
                      )}
                      {title && <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{title}</h2>}
                      {subtitle && <p className="text-slate-500 mt-2 text-lg">{subtitle}</p>}
                    </div>
                  </div>
                )}
                
                <ProductGridWithLoadMore 
                  initialProducts={products}
                  initialTotalPages={totalPages}
                  fetchNextPage={loadMore}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 px-4 border-t border-slate-100">
                <Package className="w-16 h-16 text-slate-200 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Бараа олдсонгүй</h2>
                <p className="text-slate-500 text-center max-w-md">Сонгосон шүүлтүүр, ангилал, хайлтын үр дүнгээр бараа олдсонгүй.</p>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  )
}


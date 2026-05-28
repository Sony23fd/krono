import { getActiveProducts } from "@/app/actions/product-actions"
import { getCategories } from "@/app/actions/category-actions"
import { ActiveBatchesList } from "@/components/storefront/home/ActiveBatchesList"
import { ShopFilters } from "@/components/storefront/ShopFilters"
import { ShopSidebar } from "@/components/storefront/ShopSidebar"
import { Pagination } from "@/components/storefront/Pagination"
import { Package } from "lucide-react"

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
      page,
      limit: 24,
      sale: isSale,
    }),
  ])

  const selectedCategory = categories?.find((cat: any) => cat.slug === categorySlug)

  let title = selectedCategory ? selectedCategory.name : "Дэлгүүр"
  let subtitle = selectedCategory
    ? `"${selectedCategory.name}" ангиллын бүтээгдэхүүнүүд`
    : "Манай дэлгүүрт байгаа бүх барааны жагсаалт"
  let theme: "ready" | "preorder" | string = "ready"
  let badge = selectedCategory ? selectedCategory.name : "Каталог"

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
                  baseUrl="/shop"
                  searchParams={new URLSearchParams({
                    ...(query && { q: query }),
                    ...(categorySlug !== "all" && { category: categorySlug }),
                    ...(sort !== "newest" && { sort }),
                    ...(isSale && { sale: "true" }),
                  }).toString()}
                />
              </>
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


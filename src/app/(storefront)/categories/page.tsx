import Link from "next/link"
import { getCategories } from "@/app/actions/category-actions"
import { Package } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function CategoriesPage() {
  const { categories } = await getCategories()

  return (
    <div className="bg-white min-h-screen pt-8 pb-12">
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Ангилалууд</h1>
        <p className="text-slate-500 max-w-2xl">Манай дэлгүүрийн бүх ангилал болон тэдгээрт байгаа бүтээгдэхүүнийг эндээс хайж олоорой.</p>
      </div>

      {categories && categories.length > 0 ? (
        <div className="max-w-6xl mx-auto px-3 sm:px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {categories.filter((c: any) => !c.parentId).map((category: any) => {
            const subCats = categories.filter((sub: any) => sub.parentId === category.id)
            const totalProducts = (category._count?.products ?? 0) + subCats.reduce((sum: number, sub: any) => sum + (sub._count?.products ?? 0), 0)
            return (
              <div key={category.id} className="group bg-white rounded-2xl sm:rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all flex flex-row sm:flex-col overflow-hidden items-center sm:items-stretch p-2 sm:p-0 gap-3 sm:gap-0">
                <Link
                  href={`/categories/${category.slug}`}
                  className="block relative shrink-0 w-24 h-24 sm:w-full sm:h-auto sm:aspect-[4/3] rounded-xl sm:rounded-none overflow-hidden bg-slate-50"
                >
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl}
                      alt={category.name}
                      className="object-cover w-full h-full transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100">
                      <Package className="w-8 h-8 sm:w-12 sm:h-12" />
                    </div>
                  )}
                </Link>
                
                <div className="flex flex-col flex-1 min-w-0 sm:p-6 py-1 pr-1">
                  <div className="flex-1">
                    <Link href={`/categories/${category.slug}`}>
                      <h2 className="text-sm sm:text-xl font-bold text-slate-900 mb-0.5 sm:mb-2 hover:text-[#F26522] transition-colors truncate sm:whitespace-normal sm:line-clamp-2 leading-tight">
                        {category.displayName || category.name}
                      </h2>
                    </Link>
                    <p className="text-[11px] sm:text-sm text-slate-500 mb-1.5 sm:mb-4">{totalProducts} бүтээгдэхүүн</p>
                    
                    {subCats.length > 0 && (
                      <div className="mb-1 sm:mb-6 mt-auto overflow-hidden">
                        <ul className="flex sm:flex-wrap gap-1.5 sm:gap-2 overflow-x-auto hide-scrollbar sm:overflow-visible pb-1 sm:pb-0">
                          {subCats.map((sub: any) => (
                            <li key={sub.id} className="shrink-0">
                              <Link 
                                href={`/categories/${sub.slug}`}
                                className="inline-block px-2.5 py-1 text-[10px] sm:text-xs font-medium text-slate-600 bg-slate-100 hover:bg-[#F26522]/10 hover:text-[#F26522] rounded-lg transition-colors border border-transparent hover:border-[#F26522]/20"
                              >
                                {sub.displayName || sub.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="hidden sm:block mt-auto pt-4 border-t border-slate-100">
                    <Link 
                      href={`/categories/${category.slug}`}
                      className="inline-flex items-center justify-center w-full rounded-full bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-[#F26522] hover:bg-[#F26522]/10 transition-colors"
                    >
                      Бүгдийг үзэх
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 px-4">
          <Package className="w-16 h-16 text-slate-200 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Ангилал олдсонгүй</h2>
          <p className="text-slate-500 text-center max-w-md">Системд идэвхтэй ангилал байршуулсан эсэхийг шалгана уу.</p>
          <Link href="/shop" className="mt-6 inline-flex items-center justify-center rounded-full bg-[#1B3561] px-6 py-3 text-sm font-bold text-white hover:bg-[#152849] transition-colors">
            Дэлгүүр рүү буцах
          </Link>
        </div>
      )}
    </div>
  )
}

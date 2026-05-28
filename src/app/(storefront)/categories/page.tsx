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
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.filter((c: any) => !c.parentId).map((category: any) => {
            const subCats = categories.filter((sub: any) => sub.parentId === category.id)
            return (
              <div key={category.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col transition hover:-translate-y-0.5 hover:shadow-lg">
                <Link
                  href={`/categories/${category.slug}`}
                  className="block relative"
                >
                  <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="object-cover w-full h-full transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">Зураг байхгүй</div>
                    )}
                  </div>
                </Link>
                <div className="p-6 flex flex-col flex-grow">
                  <Link href={`/categories/${category.slug}`}>
                    <h2 className="text-xl font-semibold text-slate-900 mb-2 hover:text-indigo-600 transition-colors">
                      {category.displayName || category.name}
                    </h2>
                  </Link>
                  <p className="text-sm text-slate-500 mb-4">{category._count?.products ?? 0} бүтээгдэхүүн</p>
                  
                  {subCats.length > 0 && (
                    <div className="mb-6 space-y-2 mt-auto">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Дэд ангилал</h3>
                      <ul className="flex flex-wrap gap-2">
                        {subCats.map((sub: any) => (
                          <li key={sub.id}>
                            <Link 
                              href={`/categories/${sub.slug}`}
                              className="inline-block px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                            >
                              {sub.displayName || sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-auto pt-4 border-t border-slate-100">
                    <Link 
                      href={`/categories/${category.slug}`}
                      className="inline-flex items-center justify-center w-full rounded-full bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100"
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

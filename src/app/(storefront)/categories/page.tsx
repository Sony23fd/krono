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
          {categories.map((category: any) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
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
              <div className="p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-2">{category.name}</h2>
                <p className="text-sm text-slate-500 mb-4">{category._count?.products ?? 0} бүтээгдэхүүн</p>
                <span className="inline-flex items-center justify-center rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition group-hover:bg-indigo-100">
                  Ангилал руу орох
                </span>
              </div>
            </Link>
          ))}
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

import { db } from "@/lib/db"
import { Boxes, Search } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function InventoryPage() {
  const branches = await db.branch.findMany({ orderBy: { createdAt: "asc" } })
  const products = await db.product.findMany({
    where: { status: "ACTIVE" },
    include: {
      inventories: true
    },
    orderBy: { createdAt: "desc" },
    take: 50
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Нэгдсэн Үлдэгдэл</h1>
          <p className="text-sm text-slate-500 mt-1">Бүх салбар дахь барааны үлдэгдлийн мэдээлэл</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Бараа</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Үнэ</th>
                {branches.map(branch => (
                  <th key={branch.id} className="px-6 py-4 text-center border-l border-slate-100">
                    <span className="block text-slate-800 font-bold">{branch.name}</span>
                    <span className="text-slate-400 font-normal">{branch.type === "MAIN_WAREHOUSE" ? "Төв" : "Дэлгүүр"}</span>
                  </th>
                ))}
                <th className="px-6 py-4 text-center border-l border-slate-200 bg-slate-50 font-black text-slate-800">
                  Нийт дүн
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map(product => {
                const totalStock = product.inventories.reduce((acc, inv) => acc + inv.quantity, 0)
                
                return (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Boxes className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="font-semibold text-slate-900 line-clamp-2">{product.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-slate-500">{product.sku}</td>
                    <td className="px-6 py-3 font-medium text-slate-900">{Number(product.price).toLocaleString()} ₮</td>
                    
                    {branches.map(branch => {
                      const inv = product.inventories.find(i => i.branchId === branch.id)
                      const qty = inv?.quantity || 0
                      return (
                        <td key={branch.id} className="px-6 py-3 text-center border-l border-slate-100">
                          <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${
                            qty > 10 ? "text-emerald-700 bg-emerald-50" : 
                            qty > 0 ? "text-amber-700 bg-amber-50" : 
                            "text-rose-700 bg-rose-50"
                          }`}>
                            {qty}
                          </span>
                        </td>
                      )
                    })}
                    
                    <td className="px-6 py-3 text-center border-l border-slate-200 bg-slate-50/30">
                      <span className="font-black text-slate-900">{totalStock}</span>
                    </td>
                  </tr>
                )
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={4 + branches.length} className="px-6 py-12 text-center text-slate-500">
                    Идэвхтэй бараа олдсонгүй
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useCart } from "@/context/CartContext"
import { useRouter } from "next/navigation"
import { CheckCircle2, ArrowRight, Zap, Shield, BarChart3, Database } from "lucide-react"

export function SaaSHomepageClient({ products }: { products: any[] }) {
  const { addItem } = useCart()
  const router = useRouter()

  const crm = products.find(p => p.slug === "crm-system")
  const erp = products.find(p => p.slug === "erp-system")

  const handlePurchase = (product: any) => {
    if (!product) return;
    addItem({
      batchId: product.id,
      productId: product.id,
      name: product.name,
      unitPrice: Number(product.price),
      qty: 1
    })
    router.push("/cart")
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative overflow-hidden flex flex-col items-center pt-20 pb-32">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-200 blur-[100px] rounded-full mix-blend-multiply" />
      </div>

      <div className="max-w-6xl w-full px-4 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-sm border border-slate-200 text-indigo-600 text-sm font-semibold mb-8">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Бизнесээ дараагийн түвшинд гарга</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 text-slate-900">
            Ухаалаг системээр <br className="hidden md:block"/> бизнесээ хурдасга
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
            Орчин үеийн байгууллагуудад зориулсан дэвшилтэт CRM болон ERP систем. Таны бизнесийн өсөлтийн найдвартай түнш.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* CRM Card */}
          {crm && (
            <div className="relative group rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 p-8 md:p-10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 blur-[80px] rounded-full group-hover:bg-indigo-100 transition-colors" />
              
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-8 border border-indigo-200/50 shadow-sm">
                <BarChart3 className="w-8 h-8 text-indigo-600" />
              </div>
              
              <h2 className="text-3xl font-extrabold mb-4 text-slate-900">{crm.name}</h2>
              <p className="text-slate-500 mb-8 h-20 font-medium leading-relaxed">
                {crm.description}
              </p>
              
              <div className="mb-8 flex items-baseline gap-2">
                <span className="text-5xl font-black text-slate-900">₮{Number(crm.price).toLocaleString()}</span>
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-sm">/ шууд авах</span>
              </div>

              <ul className="space-y-4 mb-10 text-slate-600 font-medium">
                {['Хэрэглэгчийн нэгдсэн сан', 'Борлуулалтын урсгалын удирдлага', 'Тайлан аналитик', 'Хязгааргүй хэрэглэгч'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-indigo-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handlePurchase(crm)}
                className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40"
              >
                Худалдан авах <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ERP Card */}
          {erp && (
            <div className="relative group rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 p-8 md:p-10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-50 blur-[80px] rounded-full group-hover:bg-fuchsia-100 transition-colors" />
              
              <div className="w-16 h-16 bg-fuchsia-100 rounded-2xl flex items-center justify-center mb-8 border border-fuchsia-200/50 shadow-sm">
                <Database className="w-8 h-8 text-fuchsia-600" />
              </div>
              
              <h2 className="text-3xl font-extrabold mb-4 text-slate-900">{erp.name}</h2>
              <p className="text-slate-500 mb-8 h-20 font-medium leading-relaxed">
                {erp.description}
              </p>
              
              <div className="mb-8 flex items-baseline gap-2">
                <span className="text-5xl font-black text-slate-900">₮{Number(erp.price).toLocaleString()}</span>
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-sm">/ шууд авах</span>
              </div>

              <ul className="space-y-4 mb-10 text-slate-600 font-medium">
                {['Санхүүгийн цогц удирдлага', 'Хүний нөөцийн систем', 'Агуулахын нэгдсэн хяналт', 'Автоматжуулалт'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-fuchsia-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handlePurchase(erp)}
                className="w-full py-4 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-600/30 hover:shadow-fuchsia-600/40"
              >
                Худалдан авах <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

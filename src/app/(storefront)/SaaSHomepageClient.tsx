"use client"

import { useCart } from "@/context/CartContext"
import { useRouter } from "next/navigation"
import { CheckCircle2, ArrowRight, Zap, Shield, BarChart3, Database, Users, Globe, HeadphonesIcon, Building2 } from "lucide-react"

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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden flex flex-col items-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-200 blur-[100px] rounded-full mix-blend-multiply" />
        </div>

        <div className="max-w-6xl w-full px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-sm border border-slate-200 text-indigo-600 text-sm font-semibold mb-8">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Бизнесээ дараагийн түвшинд гарга</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 text-slate-900 leading-tight">
            Байгууллагынхаа үйл ажиллагааг <br className="hidden md:block"/> бүрэн автоматжуул
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium mb-10 leading-relaxed">
            Танай байгууллагын онцлогт тохирсон ухаалаг CRM болон ERP системээр өдөр тутмын ажлаа хялбарчилж, борлуулалтаа өсгө.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="#systems" className="px-8 py-4 bg-slate-900 text-white rounded-full font-bold text-lg hover:bg-slate-800 transition-colors flex items-center gap-2">
              Системүүдтэй танилцах <ArrowRight className="w-5 h-5" />
            </a>
            <a href="#benefits" className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-bold text-lg hover:bg-slate-50 transition-colors">
              Давуу талууд
            </a>
          </div>
        </div>
      </section>

      {/* Stats / Social Proof */}
      <section className="py-12 border-y border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-100">
          <div className="text-center px-4">
            <div className="text-4xl font-black text-indigo-600 mb-2">500+</div>
            <div className="text-sm text-slate-500 font-medium">Харилцагч байгууллага</div>
          </div>
          <div className="text-center px-4">
            <div className="text-4xl font-black text-indigo-600 mb-2">99.9%</div>
            <div className="text-sm text-slate-500 font-medium">Найдвартай ажиллагаа</div>
          </div>
          <div className="text-center px-4">
            <div className="text-4xl font-black text-indigo-600 mb-2">24/7</div>
            <div className="text-sm text-slate-500 font-medium">Техникийн тусламж</div>
          </div>
          <div className="text-center px-4">
            <div className="text-4xl font-black text-indigo-600 mb-2">10+</div>
            <div className="text-sm text-slate-500 font-medium">Жилийн туршлага</div>
          </div>
        </div>
      </section>

      {/* Systems / Products Section */}
      <section id="systems" className="py-24 max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-slate-900 mb-4">Бидний санал болгож буй шийдлүүд</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">Бизнесийнхээ цар хүрээнээс хамааран өөрт тохирох системийг сонгоно уу.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* CRM Card */}
          {crm && (
            <div className="relative group rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 p-8 md:p-10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 blur-[80px] rounded-full group-hover:bg-indigo-100 transition-colors" />
              
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-8 border border-indigo-200/50 shadow-sm relative z-10">
                <BarChart3 className="w-8 h-8 text-indigo-600" />
              </div>
              
              <h3 className="text-3xl font-extrabold mb-4 text-slate-900 relative z-10">{crm.name}</h3>
              <div 
                className="text-slate-500 mb-8 font-medium leading-relaxed relative z-10 line-clamp-3"
                dangerouslySetInnerHTML={{ __html: crm.description || '' }}
              />
              
              <div className="mb-8 flex items-baseline gap-2 relative z-10">
                <span className="text-5xl font-black text-slate-900">₮{Number(crm.price).toLocaleString()}</span>
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-sm">/ шууд авах</span>
              </div>

              <ul className="space-y-4 mb-10 text-slate-600 font-medium relative z-10 flex-1">
                {['Хэрэглэгчийн нэгдсэн сан', 'Борлуулалтын урсгалын удирдлага', 'Тайлан аналитик', 'Хязгааргүй хэрэглэгч'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-indigo-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="grid grid-cols-2 gap-3 relative z-10">
                <button 
                  onClick={() => router.push(`/product/${crm.slug || crm.id}`)}
                  className="w-full py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base transition-all flex items-center justify-center"
                >
                  Дэлгэрэнгүй
                </button>
                <button 
                  onClick={() => handlePurchase(crm)}
                  className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base transition-all flex items-center justify-center shadow-lg shadow-indigo-600/30"
                >
                  Захиалах
                </button>
              </div>
            </div>
          )}

          {/* ERP Card */}
          {erp && (
            <div className="relative group rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 p-8 md:p-10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-50 blur-[80px] rounded-full group-hover:bg-fuchsia-100 transition-colors" />
              
              <div className="w-16 h-16 bg-fuchsia-100 rounded-2xl flex items-center justify-center mb-8 border border-fuchsia-200/50 shadow-sm relative z-10">
                <Database className="w-8 h-8 text-fuchsia-600" />
              </div>
              
              <h3 className="text-3xl font-extrabold mb-4 text-slate-900 relative z-10">{erp.name}</h3>
              <div 
                className="text-slate-500 mb-8 font-medium leading-relaxed relative z-10 line-clamp-3"
                dangerouslySetInnerHTML={{ __html: erp.description || '' }}
              />
              
              <div className="mb-8 flex items-baseline gap-2 relative z-10">
                <span className="text-5xl font-black text-slate-900">₮{Number(erp.price).toLocaleString()}</span>
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-sm">/ шууд авах</span>
              </div>

              <ul className="space-y-4 mb-10 text-slate-600 font-medium relative z-10 flex-1">
                {['Санхүүгийн цогц удирдлага', 'Хүний нөөцийн систем', 'Агуулахын нэгдсэн хяналт', 'Автоматжуулалт'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-fuchsia-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="grid grid-cols-2 gap-3 relative z-10">
                <button 
                  onClick={() => router.push(`/product/${erp.slug || erp.id}`)}
                  className="w-full py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base transition-all flex items-center justify-center"
                >
                  Дэлгэрэнгүй
                </button>
                <button 
                  onClick={() => handlePurchase(erp)}
                  className="w-full py-4 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold text-base transition-all flex items-center justify-center shadow-lg shadow-fuchsia-600/30"
                >
                  Захиалах
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">Яагаад манайхыг сонгох вэ?</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Монголын тэргүүлэх байгууллагуудын итгэлт түнш.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-blue-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Өндөр нууцлал</h4>
              <p className="text-slate-600 leading-relaxed">AWS үүлэн технологид суурилсан мэдээллийн аюулгүй байдал, өндөр нууцлал хамгаалалт.</p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <Globe className="w-7 h-7 text-green-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Хаанаас ч хандах</h4>
              <p className="text-slate-600 leading-relaxed">Вэб болон гар утасны аппликэйшнээр дамжуулан дэлхийн хаанаас ч бизнесийн мэдээллээ хянах, удирдах боломжтой.</p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-6">
                <HeadphonesIcon className="w-7 h-7 text-orange-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Найдвартай тусламж</h4>
              <p className="text-slate-600 leading-relaxed">Туршлагатай инженерүүдийн баг танд 24/7 цагийн турш зөвлөгөө мэдээлэл өгч, техникийн туслалцаа үзүүлнэ.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-900" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-600/30 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Дижитал шилжилтээ яг одоо эхлүүл</h2>
          <p className="text-xl text-slate-300 mb-10 font-medium">
            Орчин үеийн ухаалаг системээр бизнесээ удирдаж, зах зээлд тэргүүлэгч болоорой.
          </p>
          <a href="#systems" className="inline-flex items-center gap-2 bg-indigo-500 text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-indigo-400 transition-colors shadow-xl shadow-indigo-500/20">
            Системүүд харах <ArrowRight className="w-6 h-6" />
          </a>
        </div>
      </section>

    </div>
  )
}

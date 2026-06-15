import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { CheckCircle2, ShieldCheck, Zap, Server, BarChart3, Users, Database, ArrowRight, LayoutDashboard, Lock, Globe, Clock, MessageSquare, HeadphonesIcon } from "lucide-react"
import { BackButton } from "@/components/storefront/product/BackButton"
import { ProductActions } from "./ProductActions"

export const dynamic = "force-dynamic"

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const product = await db.product.findFirst({
    where: {
      OR: [
        { id },
        { slug: id },
      ],
      status: { in: ["ACTIVE", "OUT_OF_STOCK"] },
    },
    include: {
      category: true,
      variants: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!product) {
    notFound()
  }

  const unitPrice = Number(product.price)
  const isErp = product.slug === "erp-system"

  // Танилцуулга мэдээллүүд (Модулиуд)
  const crmFeatures = [
    { title: "Хэрэглэгчийн сан", desc: "Бүх харилцагчийн мэдээллийг нэгтгэн удирдах, түүх хадгалах.", icon: <Users className="w-6 h-6 text-indigo-500" /> },
    { title: "Борлуулалтын урсгал", desc: "Сэжмээс борлуулалт хүртэлх үе шатыг хянах ухаалаг pipeline.", icon: <BarChart3 className="w-6 h-6 text-indigo-500" /> },
    { title: "Тайлан аналитик", desc: "Борлуулалтын орлого болон ажилтнуудын гүйцэтгэлийн нарийвчилсан тайлан.", icon: <LayoutDashboard className="w-6 h-6 text-indigo-500" /> },
    { title: "Маркетинг, И-Мэйл", desc: "Хэрэглэгч рүү автоматаар мэйл, мессеж илгээх маркетингийн модуль.", icon: <MessageSquare className="w-6 h-6 text-indigo-500" /> },
  ]

  const erpFeatures = [
    { title: "Санхүүгийн удирдлага", desc: "Орлого, зарлага, цалин хөлсний нэгдсэн хяналт болон НӨАТ-ын баримт хэвлэлт.", icon: <Database className="w-6 h-6 text-fuchsia-500" /> },
    { title: "Хүний нөөц", desc: "Ажилтны мэдээлэл, ирц, гүйцэтгэлийн үнэлгээ, цалин бодолтын систем.", icon: <Users className="w-6 h-6 text-fuchsia-500" /> },
    { title: "Агуулахын бүртгэл", desc: "Бараа материалын үлдэгдэл, хөдөлгөөний нарийвчилсан бүртгэл (олон агуулах).", icon: <Server className="w-6 h-6 text-fuchsia-500" /> },
    { title: "Үйлдвэрлэл", desc: "Орц норм, хаягдлын бүртгэл, үйлдвэрлэлийн өртөг тооцоолох.", icon: <Globe className="w-6 h-6 text-fuchsia-500" /> },
  ]

  const features = isErp ? erpFeatures : crmFeatures
  const badgeClasses = isErp ? "bg-fuchsia-100 text-fuchsia-700" : "bg-indigo-100 text-indigo-700"
  const iconWrapperClasses = isErp ? "bg-fuchsia-50" : "bg-indigo-50"
  const checkIconClasses = isErp ? "text-fuchsia-500" : "text-indigo-500"

  return (
    <div className="bg-slate-50 min-h-screen pb-20 md:pb-0 text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <BackButton />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 lg:pb-24">
        <div className="lg:grid lg:grid-cols-12 lg:gap-16">
          
          {/* Product Info - Left Side */}
          <div className="lg:col-span-7">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${badgeClasses} text-sm font-bold mb-6`}>
              <Zap className="w-4 h-4" />
              <span>Шууд нэвтрүүлэх боломжтой</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-6 leading-tight">
              {product.name}
            </h1>
            
            <div 
              className="prose prose-slate prose-lg text-slate-600 mb-10 leading-relaxed font-medium"
              dangerouslySetInnerHTML={{ __html: product.description || "Байгууллагын үйл ажиллагааг автоматжуулах ухаалаг шийдэл." }}
            />

            {/* Features / Modules Grid */}
            <div className="space-y-6 mb-12">
              <h3 className="text-2xl font-bold text-slate-900">Системийн үндсэн модулиуд</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {features.map((feat, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className={`w-12 h-12 rounded-xl ${iconWrapperClasses} flex items-center justify-center mb-4`}>
                      {feat.icon}
                    </div>
                    <h4 className="font-bold text-slate-900 mb-2">{feat.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">{feat.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Presentation Section */}
            <div className="mt-16 bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Яагаад манай системийг сонгох вэ?</h3>
              
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className={`w-12 h-12 shrink-0 rounded-full ${iconWrapperClasses} flex items-center justify-center`}>
                    <Lock className={`w-6 h-6 ${checkIconClasses}`} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">Найдвартай ажиллагаа ба Нууцлал</h4>
                    <p className="text-slate-600">AWS үүлэн серверт таны мэдээлэл өндөр нууцлалтай хадгалагдах бөгөөд 99.9% тасралтгүй ажиллагааг амлана.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className={`w-12 h-12 shrink-0 rounded-full ${iconWrapperClasses} flex items-center justify-center`}>
                    <Clock className={`w-6 h-6 ${checkIconClasses}`} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">Шуурхай нэвтрүүлэлт</h4>
                    <p className="text-slate-600">Гэрээ байгуулсан өдрөөс хойш ажлын 3 хоногт багтаан системийг бүрэн тохируулж, танай байгууллагын онцлогт тохирсон анхан шатны сургалтыг хийнэ.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className={`w-12 h-12 shrink-0 rounded-full ${iconWrapperClasses} flex items-center justify-center`}>
                    <HeadphonesIcon className={`w-6 h-6 ${checkIconClasses}`} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">24/7 Техникийн тусламж</h4>
                    <p className="text-slate-600">Ашиглалтын явцад гарах аливаа асуудлыг тухай бүрт нь түргэн шуурхай шийдвэрлэх мэргэжлийн инженерүүдийн баг танд туслахад бэлэн байна.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Checkout Panel - Right Side */}
          <div className="lg:col-span-5 mt-12 lg:mt-0">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl shadow-slate-200/50 sticky top-24">
              
              <div className="mb-8">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Нэг удаагийн төлбөр</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-black text-slate-900 tracking-tighter">
                    ₮{unitPrice.toLocaleString()}
                  </p>
                </div>
                {product.comparePrice && Number(product.comparePrice) > unitPrice && (
                  <p className="text-lg text-slate-400 line-through decoration-slate-300 font-medium mt-1">
                    ₮{Number(product.comparePrice).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="bg-slate-50 rounded-xl p-5 mb-8 border border-slate-100">
                <p className="text-sm font-bold text-slate-900 mb-4">Төлбөрт багтсан эрхүүд:</p>
                <ul className="space-y-3">
                  {['Хязгааргүй хэрэглэгчийн эрх', 'Үнэгүй сургалт, нэвтрүүлэлт', '1 жилийн үнэгүй засвар үйлчилгээ', 'Үндсэн модулиуд бүгд нээлттэй'].map((perk, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                      <CheckCircle2 className={`w-5 h-5 ${checkIconClasses} shrink-0`} />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div id="order-form">
                <ProductActions
                  productId={product.id}
                  name={product.name}
                  imageUrl={product.imageUrl}
                  unitPrice={unitPrice}
                  remainingQuantity={999}
                />
              </div>
              <div className="mt-4 text-center">
                <p className="text-xs text-slate-400">Та захиалга хийсний дараа манай борлуулалтын баг тантай шууд холбогдох болно.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

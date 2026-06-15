import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { ArrowLeft, CheckCircle2, ShieldCheck, Zap, Server, BarChart3, Users, Database } from "lucide-react"
import Link from "next/link"
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
  const isCrm = product.slug === "crm-system"
  const isErp = product.slug === "erp-system"

  // Танилцуулга мэдээллүүд (Модулиуд)
  const crmFeatures = [
    { title: "Хэрэглэгчийн сан", desc: "Бүх харилцагчийн мэдээллийг нэгтгэн удирдах, түүх хадгалах.", icon: <Users className="w-6 h-6 text-indigo-500" /> },
    { title: "Борлуулалтын урсгал", desc: "Сэжмээс борлуулалт хүртэлх үе шатыг хянах ухаалаг pipeline.", icon: <BarChart3 className="w-6 h-6 text-indigo-500" /> },
    { title: "Тайлан аналитик", desc: "Борлуулалтын орлого болон ажилтнуудын гүйцэтгэлийн тайлан.", icon: <Server className="w-6 h-6 text-indigo-500" /> },
  ]

  const erpFeatures = [
    { title: "Санхүүгийн удирдлага", desc: "Орлого, зарлага, цалин хөлсний нэгдсэн хяналт.", icon: <Database className="w-6 h-6 text-fuchsia-500" /> },
    { title: "Хүний нөөц", desc: "Ажилтны мэдээлэл, ирц, гүйцэтгэлийн үнэлгээний систем.", icon: <Users className="w-6 h-6 text-fuchsia-500" /> },
    { title: "Агуулахын бүртгэл", desc: "Бараа материалын үлдэгдэл, хөдөлгөөний нарийвчилсан бүртгэл.", icon: <Server className="w-6 h-6 text-fuchsia-500" /> },
  ]

  const features = isErp ? erpFeatures : crmFeatures
  const accentColor = isErp ? "fuchsia" : "indigo"
  const badgeClasses = isErp ? "bg-fuchsia-100 text-fuchsia-700" : "bg-indigo-100 text-indigo-700"
  const iconWrapperClasses = isErp ? "bg-fuchsia-50" : "bg-indigo-50"
  const checkIconClasses = isErp ? "text-fuchsia-500" : "text-indigo-500"
  const AccentIcon = isErp ? Database : BarChart3

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
            
            <p className="text-lg sm:text-xl text-slate-600 mb-10 leading-relaxed font-medium">
              {product.description || "Байгууллагын үйл ажиллагааг автоматжуулах ухаалаг шийдэл."}
            </p>

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

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-4 border-y border-slate-200 py-6">
              <div className="flex items-center gap-2 text-slate-600 font-medium">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <span>Найдвартай хамгаалалт</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 font-medium">
                <Server className="w-5 h-5 text-blue-500" />
                <span>Үүлэн технологи (Cloud)</span>
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

              <ul className="space-y-4 mb-8">
                {['Хязгааргүй хэрэглэгч', 'Үнэгүй сургалт, нэвтрүүлэлт', '1 жилийн үнэгүй засвар үйлчилгээ', '24/7 техникийн тусламж'].map((perk, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                    <CheckCircle2 className={`w-5 h-5 ${checkIconClasses} shrink-0`} />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-6 border-t border-slate-100" id="order-form">
                <ProductActions
                  productId={product.id}
                  name={product.name}
                  imageUrl={product.imageUrl}
                  unitPrice={unitPrice}
                  remainingQuantity={999}
                  isPreOrder={false}
                  options={undefined}
                  variants={undefined}
                />
              </div>
              <p className="text-center text-xs text-slate-400 mt-4">Товчийг дарснаар шууд сагсанд нэмэгдэнэ</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

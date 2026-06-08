import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Package, Truck, ArrowLeft, ShieldCheck, Zap } from "lucide-react"
import Link from "next/link"
import { ProductGallery } from "@/components/storefront/product/ProductGallery"
import { ProductImage } from "@/components/storefront/ProductImage"
import { BackButton } from "@/components/storefront/product/BackButton"
import { ProductActions } from "./ProductActions"
import { getShopSettings } from "@/app/actions/settings-actions"

export const dynamic = "force-dynamic"

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // id нь slug эсвэл cuid байж болно
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

  const [relatedProducts, shopSettings] = await Promise.all([
    db.product.findMany({
      where: {
        status: "ACTIVE",
        id: { not: product.id },
        ...(product.categoryId && { categoryId: product.categoryId }),
      },
      include: { category: true },
      take: 4,
      orderBy: { createdAt: "desc" },
    }),
    getShopSettings(),
  ])

  const unitPrice = Number(product.price)
  const availableStock = product.stockQuantity - product.reservedStock
  const deliveryFee = Number(shopSettings.delivery_fee_below_threshold || 8000)

  return (
    <div className="bg-white min-h-screen pb-20 md:pb-0">
      {/* Premium Breadcrumb / Back button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <BackButton />
      </div>

      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 pb-16 lg:pb-24">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
          
          {/* Product Gallery - Left Side */}
          <div className="lg:max-w-lg lg:self-start lg:sticky lg:top-24 w-full">
            <div className="sm:rounded-3xl overflow-hidden sm:border sm:border-slate-100 bg-slate-50 relative group">
              <ProductGallery product={{
                name: product.name,
                imageUrl: product.imageUrl,
                images: product.images,
                isPreOrder: product.isPreOrder
              }} />
            </div>
            
            {/* Trust Badges - Desktop only */}
            <div className="hidden lg:grid grid-cols-2 gap-4 mt-8">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Баталгаат</h4>
                  <p className="text-xs text-slate-500">100% найдвартай</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Шуурхай</h4>
                  <p className="text-xs text-slate-500">Шууд бэлэн</p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Info - Right Side */}
          <div className="mt-8 px-4 sm:px-0 lg:mt-0">
            {product.category && (
              <p className="text-sm font-semibold text-[#F26522] tracking-wide uppercase mb-2">
                {product.category.displayName || product.category.name}
              </p>
            )}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4 leading-tight">
              {product.name}
            </h1>
            
            <div className="flex items-end gap-3 mb-6">
              <p className="text-4xl font-black text-[#1B3561] tracking-tighter">
                ₮{unitPrice.toLocaleString()} <span className="text-xl md:text-2xl font-bold text-slate-400">/ {product.unit || "ширхэг"}</span>
              </p>
              {product.comparePrice && Number(product.comparePrice) > unitPrice && (
                <p className="text-lg text-slate-400 line-through decoration-slate-300 font-medium mb-1">
                  ₮{Number(product.comparePrice).toLocaleString()}
                </p>
              )}
            </div>

            <div className="prose prose-sm sm:prose-base text-slate-600 mb-8 max-w-none">
              <p className="leading-relaxed whitespace-pre-wrap">
                {product.description || "Тайлбар оруулаагүй байна."}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-600 font-medium">Үлдэгдэл</span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${product.isPreOrder || availableStock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {product.isPreOrder 
                    ? "Хязгааргүй"
                    : availableStock > 0 ? `${availableStock} ширхэг бэлэн` : "Дууссан"
                  }
                </span>
              </div>
              
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-slate-600 font-medium">Хүргэлт</span>
                </div>
                <span className="font-bold text-slate-900">
                  {deliveryFee > 0 ? `₮${deliveryFee.toLocaleString()}` : "Үнэгүй"}
                </span>
              </div>
            </div>

            <div id="order-form" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                Сонголт
              </h2>
              <ProductActions
                productId={product.id}
                name={product.name}
                imageUrl={product.imageUrl}
                unitPrice={unitPrice}
                remainingQuantity={availableStock}
                isPreOrder={product.isPreOrder}
                options={product.options ? JSON.parse(JSON.stringify(product.options)) : undefined}
                variants={product.variants ? JSON.parse(JSON.stringify(product.variants)) : undefined}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Buy Button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200/50 p-4 z-40 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] pb-safe-bottom">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500 font-medium truncate mb-0.5">
              {product.name}
            </p>
            <p className="text-lg font-black text-[#1B3561] tracking-tight leading-none">
              ₮{unitPrice.toLocaleString()}
            </p>
          </div>
          <Link href="#order-form" className="bg-[#F26522] hover:bg-[#E85B1C] active:scale-95 transition-all text-white px-8 py-3 rounded-xl font-bold text-sm shrink-0 shadow-lg shadow-red-200">
            Сонгох
          </Link>
        </div>
      </div>
      
      {relatedProducts.length > 0 && (
        <div className="bg-slate-50 border-t border-slate-100 py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-8 tracking-tight">Танд санал болгох</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {relatedProducts.map(p => (
                <Link key={p.id} href={`/product/${p.slug}`} className="group bg-white rounded-2xl border border-slate-200/50 p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  <div className="aspect-[4/5] bg-slate-100 rounded-xl overflow-hidden mb-4 relative">
                    {p.imageUrl ? (
                      <ProductImage src={p.imageUrl} alt={p.name} fill className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-slate-800 line-clamp-2 mb-2 group-hover:text-[#F26522] transition-colors">{p.name}</p>
                  <div className="mt-auto">
                    <p className="text-base sm:text-lg font-black text-[#1B3561] tracking-tight">₮{Number(p.price).toLocaleString()} <span className="text-xs sm:text-sm font-bold text-slate-400">/ {p.unit || "ширхэг"}</span></p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

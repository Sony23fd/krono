import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Package, Truck, ShoppingBag, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ProductGallery } from "@/components/storefront/product/ProductGallery"
import { ProductImage } from "@/components/storefront/ProductImage"
import { ProductOrderForm } from "./ProductOrderForm"
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
  const globalFee = Number(shopSettings.delivery_fee || 0)
  const deliveryFee = globalFee

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-6 font-medium bg-white px-4 py-2 rounded-xl border shadow-sm">
        <ArrowLeft className="w-4 h-4" />
        Буцах
      </Link>
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col md:flex-row">

        {/* Product Info Side */}
        <div className="md:w-1/2 p-8 bg-slate-50 border-r flex flex-col">
          <ProductGallery product={{
            name: product.name,
            imageUrl: product.imageUrl,
            images: product.images,
            isPreOrder: product.isPreOrder
          }} />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{product.name}</h1>
          <p className="text-slate-600 mb-6 flex-1">
            {product.description || "Тайлбар оруулаагүй байна."}
          </p>

          <div className="space-y-3 bg-white p-4 rounded-lg border">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm">Нэгж үнэ:</span>
              <div className="flex items-center gap-2">
                {product.comparePrice && Number(product.comparePrice) > unitPrice && (
                  <span className="text-sm text-slate-400 line-through">₮{Number(product.comparePrice).toLocaleString()}</span>
                )}
                <span className="font-bold text-xl text-slate-900">₮{unitPrice.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm">Үлдэгдэл:</span>
              <span className={`font-bold ${product.isPreOrder || availableStock > 0 ? "text-green-600" : "text-red-500"}`}>
                {product.isPreOrder 
                  ? "Хязгааргүй (Урьдчилсан)"
                  : availableStock > 0 ? `${availableStock} ширхэг` : "Дууссан"
                }
              </span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                <span className="text-slate-500 text-sm flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-indigo-400" /> Хүргэлтийн үнэ:
                </span>
                <span className="font-semibold text-slate-800">
                  ₮{deliveryFee.toLocaleString()}
                </span>
              </div>
            )}
            
            {/* Delivery Estimate */}
            <div className="flex items-center gap-2 mt-2 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Хүргэгдэх хугацаа</p>
                <p className="text-sm font-bold text-slate-800">
                  {(() => {
                    const DAY_NAMES = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"]
                    const scheduleDays = (shopSettings.delivery_schedule_days || "3,6").split(",").map(Number)
                    const dayNames = scheduleDays.map((d: number) => DAY_NAMES[d]).filter(Boolean).join(", ")
                    return dayNames ? `🚚 Хүргэлт ${dayNames} гарагт гарна` : "Бэлэн байгаа"
                  })()}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Товлосон өдрөөс 24-72 цагийн дотор хүргэгдэнэ</p>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 p-2 rounded-md">
                <span className="text-green-500 text-lg leading-none">✓</span> 100% Баталгаат
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 p-2 rounded-md">
                <span className="text-green-500 text-lg leading-none">✓</span> Найдвартай
              </div>
            </div>
          </div>
        </div>

        {/* Checkout Form Side */}
        <div id="order-form" className="md:w-1/2 p-8 scroll-mt-6 hover:scroll-mt-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-500" /> Захиалга өгөх
          </h2>
          <ProductOrderForm
            productId={product.id}
            unitPrice={unitPrice}
            deliveryFee={deliveryFee}
            remainingQuantity={availableStock}
            termsOfService={shopSettings.terms_of_service}
            deliveryTerms={shopSettings.delivery_terms}
            isPreOrder={product.isPreOrder}
            options={product.options as any}
            variants={product.variants as any}
            deliveryScheduleDays={shopSettings.delivery_schedule_days || "3,6"}
          />
        </div>

      </div>
    </div>

    {/* Sticky Mobile Buy Button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-40 shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.1)] pb-safe-bottom">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500 font-medium truncate mb-0.5">
              {product.name}
            </p>
            <p className="text-lg font-bold text-slate-900 leading-none">
              ₮{unitPrice.toLocaleString()}
            </p>
          </div>
          <Link href="#order-form" className="bg-[#4F46E5] text-white px-8 py-3 rounded-xl font-bold text-sm shrink-0 shadow-sm shadow-indigo-200">
            Захиалах
          </Link>
        </div>
      </div>
      
      {relatedProducts.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pb-12">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Танд санал болгох</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map(p => (
              <Link key={p.id} href={`/product/${p.slug}`} className="bg-white rounded-xl border p-3 hover:shadow-md transition-shadow">
                <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden mb-2">
                  {p.imageUrl ? (
                    <ProductImage src={p.imageUrl} alt={p.name} width={200} height={200} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Package className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                <p className="text-sm font-bold text-indigo-600">₮{Number(p.price).toLocaleString()}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

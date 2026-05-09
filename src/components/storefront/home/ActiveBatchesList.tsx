import Link from "next/link"
import { ProductImage } from "@/components/storefront/ProductImage"
import { AddToCartButton } from "@/components/storefront/AddToCartButton"
import { Clock, TrendingUp } from "lucide-react"
import { PreOrderCountdown } from "@/components/storefront/home/PreOrderCountdown"

export function ActiveBatchesList({ 
  batches,
  title = "Яг одоо захиалах",
  subtitle = "Хамгийн эрэлттэй, захиалга нь нээлттэй байгаа бараанууд",
  badge = "Тренд бараанууд",
  theme = "ready",
  viewAllLink
}: { 
  batches: any[],
  title?: string,
  subtitle?: string,
  badge?: string,
  theme?: "ready" | "preorder" | string,
  viewAllLink?: string
}) {
  if (!batches || batches.length === 0) return null;

  return (
    <div id="batches" className="pt-12 pb-16 border-b border-indigo-50/50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            {badge && (
              <div className={`inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full border ${theme === "preorder" ? "bg-amber-100/50 border-amber-200/50 text-amber-600" : "bg-indigo-100/50 border-indigo-200/50 text-[#4e3dc7]"}`}>
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">{badge}</span>
              </div>
            )}
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{title}</h2>
            {subtitle && <p className="text-slate-500 mt-2 text-lg">{subtitle}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {batches.map((batch: any, index: number) => {
            const isPreOrder = Boolean(batch.isPreOrder);
            const progress = batch.targetQuantity > 0 
              ? Number(Math.min(100, Math.max(0, ((batch.targetQuantity - batch.remainingQuantity) / batch.targetQuantity) * 100)).toFixed(2))
              : 0;
            
            // If it's a pre-order, you might want to hide the quantity text or just show a different message
            const showQty = !batch.isPreOrder || batch.remainingQuantity > 0;

            return (
              <div 
                key={batch.id} 
                className="bg-white rounded-2xl p-4 flex flex-col group border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                suppressHydrationWarning
              >
                <Link href={`/product/${batch.id}`} className="block relative bg-slate-100 rounded-xl overflow-hidden aspect-square mb-4">
                  {batch.videoUrl ? (
                    <video
                      src={batch.videoUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                    />
                  ) : batch.imageUrl ? (
                    <ProductImage
                      src={batch.imageUrl}
                      alt={batch.name || "Бараа"}
                      fill
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      priority={index < 4}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium">Зураггүй</div>
                  )}
                  {/* Urgency Badge */}
                  {isPreOrder ? (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 flex items-center gap-1.5 shadow-sm border border-slate-200/50" suppressHydrationWarning>
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Урьдчилсан захиалга</span>
                    </div>
                  ) : (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 flex items-center gap-1.5 shadow-sm border border-slate-200/50" suppressHydrationWarning>
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      <span>Нээлттэй</span>
                    </div>
                  )}
                </Link>

                <div className="flex-1 flex flex-col gap-3">
                  <Link href={`/product/${batch.id}`}>
                    <h3 className="font-semibold text-slate-900 leading-snug hover:text-[#4e3dc7] transition-colors line-clamp-2">
                      {batch.name}
                    </h3>
                  </Link>

                  <div className="mt-auto">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <p className="text-xl font-black text-slate-900 tracking-tight">
                          ₮{Number(batch.price).toLocaleString()}
                        </p>
                        {Number(batch.deliveryFee) > 0 && (
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">+₮{Number(batch.deliveryFee).toLocaleString()} хүргэлт</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 mb-4" suppressHydrationWarning>
                      {isPreOrder ? (
                        <div className="space-y-2">
                           {batch.closingDate ? (
                             <PreOrderCountdown closingDate={batch.closingDate} />
                           ) : (
                             <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider text-center py-2 bg-amber-50 rounded-lg border border-amber-100">
                                🎉 Захиалга нээлттэй хадгалагдсан
                             </div>
                           )}
                           <p className="text-[10px] text-center text-slate-500 font-medium leading-relaxed bg-slate-50 border border-slate-100 p-1.5 rounded-lg">
                             Захиалга хаагдсанаас хойш<br/>7-14 хоногт ирнэ
                           </p>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <span>Захиалга дүүрэлт</span>
                            <span className="text-[#4e3dc7]">{batch.remainingQuantity ?? batch.stockQuantity} үлдсэн</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[#4e3dc7] to-indigo-400 rounded-full transition-all duration-1000" 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </>
                      )}
                    </div>

                    <AddToCartButton
                      batchId={batch.id}
                      name={batch.name}
                      imageUrl={batch.imageUrl}
                      unitPrice={Number(batch.price)}
                      deliveryFee={Number(batch.deliveryFee || 0)}
                      isPreOrder={batch.isPreOrder}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {viewAllLink && (
          <div className="mt-10 text-center">
            <Link 
              href={viewAllLink}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-indigo-100 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors"
            >
              Бүх барааг үзэх
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

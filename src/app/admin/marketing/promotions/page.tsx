import { getDiscountedProducts } from "@/app/actions/promotion-actions"
import { getProducts } from "@/app/actions/product-actions"
import { PromotionsClient } from "./PromotionsClient"
import { Tag } from "lucide-react"

export default async function PromotionsPage() {
  const [discountedRes, allProductsRes] = await Promise.all([
    getDiscountedProducts(),
    getProducts({ limit: 1000 })
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-[#4F46E5]" /> Хямдрал & Урамшуулал
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Бараануудын үнийг хямдруулах, хямдралын хугацааг удирдах хэсэг.
          </p>
        </div>
      </div>

      <PromotionsClient 
        discountedProducts={discountedRes.success ? discountedRes.products : []} 
        allProducts={allProductsRes.success ? allProductsRes.products : []} 
      />
    </div>
  )
}

import { getBanners, getFeaturedProducts, getSaleProducts, getPromoSettings } from "@/app/actions/home-actions"
import { HeroSlider } from "@/components/storefront/home/HeroSlider"
import { ProductSliderSection } from "@/components/storefront/home/ProductSliderSection"
import { PromoSliderSection } from "@/components/storefront/home/PromoSliderSection"
import { HowItWorks } from "@/components/storefront/home/HowItWorks"

export const dynamic = "force-dynamic"

export default async function StorefrontHomePage() {
  const [{ banners }, { products: featuredProducts }, { products: saleProducts }, { config }] = await Promise.all([
    getBanners(),
    getFeaturedProducts(),
    getSaleProducts(),
    getPromoSettings()
  ])

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto md:px-4">
        <HeroSlider banners={banners || []} />
      </div>

      <ProductSliderSection
        title="Онцлох бараа"
        products={featuredProducts || []}
        viewAllLink="/shop"
      />

      <PromoSliderSection
        title="Онцгой санал"
        promoTitle={config?.promo_title || "СУПЕР ХЯМДРАЛ"}
        promoSubtitle={config?.promo_subtitle || "Зөвхөн өнөөдөр"}
        promoLink={config?.promo_link || "/shop?sale=true"}
        products={saleProducts || []}
      />

      <HowItWorks />
    </div>
  )
}


import { getBanners, getFeaturedProducts, getSaleProducts, getPromoSettings } from "@/app/actions/home-actions"
import { HeroSlider } from "@/components/storefront/home/HeroSlider"
import { ProductSliderSection } from "@/components/storefront/home/ProductSliderSection"
import { PromoSliderSection } from "@/components/storefront/home/PromoSliderSection"
import { ThinBannerSlider } from "@/components/storefront/home/ThinBannerSlider"
import { HowItWorks } from "@/components/storefront/home/HowItWorks"
import { StoryCategoryMenu } from "@/components/storefront/home/StoryCategoryMenu"
import { getCategories } from "@/app/actions/category-actions"

export const dynamic = "force-dynamic"

export default async function StorefrontHomePage() {
  const [{ banners }, { products: featuredProducts }, { products: saleProducts }, { config }, categoriesResult] = await Promise.all([
    getBanners(),
    getFeaturedProducts(),
    getSaleProducts(),
    getPromoSettings(),
    getCategories()
  ])

  const categories = categoriesResult?.categories || []

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <HeroSlider banners={banners || []} />

      <div className="mt-6 md:mt-10">
        <StoryCategoryMenu categories={categories} />
      </div>

      <div className="mt-12 md:mt-20">
        <ProductSliderSection
          title="Онцлох бараа"
          products={featuredProducts || []}
          viewAllLink="/shop"
        />
      </div>

      <div className="mt-12 md:mt-20">
        <ThinBannerSlider banners={banners || []} />
      </div>

      <div className="mt-12 md:mt-20">
        <PromoSliderSection
          title="Онцгой санал"
          promoTitle={config?.promo_title || "СУПЕР ХЯМДРАЛ"}
          promoSubtitle={config?.promo_subtitle || "Зөвхөн өнөөдөр"}
          promoLink={config?.promo_link || "/shop?sale=true"}
          products={saleProducts || []}
        />
      </div>

      <div>
        <HowItWorks />
      </div>
    </div>
  )
}


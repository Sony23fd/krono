import { getBanners } from "@/app/actions/home-actions"
import { getStorefrontHomePageSections } from "@/app/actions/homepage-section-actions"
import { HeroSlider } from "@/components/storefront/home/HeroSlider"
import { ProductSliderSection } from "@/components/storefront/home/ProductSliderSection"
import { PromoSliderSection } from "@/components/storefront/home/PromoSliderSection"
import { ThinBannerSlider } from "@/components/storefront/home/ThinBannerSlider"
import { HowItWorks } from "@/components/storefront/home/HowItWorks"
import { StoryCategoryMenu } from "@/components/storefront/home/StoryCategoryMenu"
import { getCategories } from "@/app/actions/category-actions"

export const dynamic = "force-dynamic"

export default async function StorefrontHomePage() {
  const [{ banners, thinBanners }, { sections }, categoriesResult] = await Promise.all([
    getBanners(),
    getStorefrontHomePageSections(),
    getCategories()
  ])

  const categories = categoriesResult?.categories || []

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <HeroSlider banners={banners || []} />

      <div className="mt-6 md:mt-10">
        <StoryCategoryMenu categories={categories} />
      </div>

      {sections?.map((section) => (
        <div key={section.id} className="mt-12 md:mt-20">
          {section.type === "PRODUCT_SLIDER" ? (
            <ProductSliderSection
              title={section.title}
              products={section.products || []}
              viewAllLink={section.categoryId ? `/categories/${section.category?.slug}` : "/shop"}
            />
          ) : (
            <PromoSliderSection
              title={section.title}
              promoTitle={section.title}
              promoSubtitle={section.category ? section.category.name : "Онцгой санал"}
              promoLink={section.bannerLink || (section.categoryId ? `/categories/${section.category?.slug}` : "/shop")}
              promoImage={section.bannerImageUrl || undefined}
              products={section.products || []}
            />
          )}
        </div>
      ))}

      {thinBanners && thinBanners.length > 0 && (
        <div className="mt-12 md:mt-20">
          <ThinBannerSlider banners={thinBanners} />
        </div>
      )}

      <div>
        <HowItWorks />
      </div>
    </div>
  )
}


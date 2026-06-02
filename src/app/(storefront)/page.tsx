import { getBanners } from "@/app/actions/home-actions"
import { getStorefrontHomePageSections } from "@/app/actions/homepage-section-actions"
import { getCategories } from "@/app/actions/category-actions"
import { getCustomerSession } from "@/lib/customer-session"

import { HeroSlider } from "@/components/storefront/home/HeroSlider"
import { ProductSliderSection } from "@/components/storefront/home/ProductSliderSection"
import { PromoSliderSection } from "@/components/storefront/home/PromoSliderSection"
import { ThinBannerSlider } from "@/components/storefront/home/ThinBannerSlider"
import { HowItWorks } from "@/components/storefront/home/HowItWorks"
import { StoryCategoryMenu } from "@/components/storefront/home/StoryCategoryMenu"

export const dynamic = "force-dynamic"

export default async function StorefrontHomePage() {
  const [{ banners, thinBanners }, { sections }, categoriesResult, session] = await Promise.all([
    getBanners(),
    getStorefrontHomePageSections(),
    getCategories(),
    getCustomerSession()
  ])

  const categories = categoriesResult?.categories || []
  const isLoggedIn = session.isLoggedIn === true

  const visibleSections = (sections || []).filter(section => {
    if (section.visibilityTarget === "LOGGED_IN_ONLY" && !isLoggedIn) return false
    if (section.visibilityTarget === "GUEST_ONLY" && isLoggedIn) return false
    return true
  })

  // Group sections by checking what type they are and rendering
  return (
    <div className="bg-white min-h-screen flex flex-col pb-10">
      {visibleSections.map((section) => {
        let deviceClass = "";
        if (section.deviceTarget === "MOBILE_ONLY") deviceClass = "block md:hidden";
        if (section.deviceTarget === "DESKTOP_ONLY") deviceClass = "hidden md:block";

        switch (section.type) {
          case "HERO_BANNER":
            return (
              <div key={section.id} className={deviceClass}>
                <HeroSlider banners={banners || []} />
              </div>
            )
          
          case "CATEGORY_MENU":
            return (
              <div key={section.id} className={`mt-6 md:mt-10 ${deviceClass}`}>
                <StoryCategoryMenu categories={categories} />
              </div>
            )

          case "THIN_BANNER":
            return thinBanners && thinBanners.length > 0 ? (
              <div key={section.id} className={`mt-12 md:mt-20 ${deviceClass}`}>
                <ThinBannerSlider banners={thinBanners} />
              </div>
            ) : null

          case "HOW_IT_WORKS":
            return (
              <div key={section.id} className={deviceClass}>
                <HowItWorks />
              </div>
            )

          case "PRODUCT_SLIDER":
            return (
              <div key={section.id} className={`mt-12 md:mt-20 ${deviceClass}`}>
                <ProductSliderSection
                  title={section.title}
                  products={section.products || []}
                  viewAllLink={section.categoryId ? `/categories/${section.category?.slug}` : "/shop"}
                  rowCount={section.rowCount}
                  autoScroll={section.autoScroll}
                  layoutVariant={section.layoutVariant}
                />
              </div>
            )

          case "PROMO_SLIDER":
            return (
              <div key={section.id} className={`mt-12 md:mt-20 ${deviceClass}`}>
                <PromoSliderSection
                  title={section.title}
                  promoTitle={section.title}
                  promoSubtitle={section.category ? ((section.category as any).displayName || section.category.name) : "Онцгой санал"}
                  promoLink={section.bannerLink || (section.categoryId ? `/categories/${section.category?.slug}` : "/shop")}
                  promoImage={section.bannerImageUrl || undefined}
                  products={section.products || []}
                  rowCount={section.rowCount}
                  autoScroll={section.autoScroll}
                  layoutVariant={section.layoutVariant}
                  bannerText={section.bannerText}
                  showBannerText={section.showBannerText}
                  bannerTextColor={section.bannerTextColor || undefined}
                  bannerTextPosition={section.bannerTextPosition || undefined}
                  bannerTextSize={section.bannerTextSize || undefined}
                  bannerPosition={section.bannerPosition || "LEFT"}
                />
              </div>
            )
            
          default:
            return null
        }
      })}
    </div>
  )
}


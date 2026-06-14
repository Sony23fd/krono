import { ReactNode } from "react"
import { MapPin, Clock, Truck, ShieldCheck, Mail, Phone, Instagram, Facebook, Search, Heart, User, LogOut, ChevronDown, ShoppingCart } from "lucide-react"
import { CartProvider } from "@/context/CartContext"
import { FavoritesProvider } from "@/context/FavoritesContext"
import { AgeVerificationProvider } from "@/context/AgeVerificationContext"
import { CustomerAuthProvider } from "@/context/CustomerAuthContext"
import { CartIcon } from "@/components/storefront/CartIcon"
import { CartBadgeIcon } from "@/components/storefront/CartBadgeIcon"
import { HeaderSearchBar } from "@/components/storefront/HeaderSearchBar"
import { getCategories } from "@/app/actions/category-actions"
import { CategoryBar } from "@/components/storefront/CategoryBar"
import Link from "next/link"
import Image from "next/image"
import { db } from "@/lib/db"

import { AnimatedHeroBackground } from "@/components/storefront/home/AnimatedHeroBackground"
import { VisitorTracker } from "@/components/storefront/VisitorTracker"
import { SocialProofToast } from "@/components/storefront/SocialProofToast"
import { BottomNavigation } from "@/components/storefront/BottomNavigation"
import { FooterMap } from "@/components/storefront/FooterMap"
import { PopupBannerModal } from "@/components/storefront/PopupBannerModal"

export const dynamic = "force-dynamic"

export default async function StorefrontLayout({ children }: { children: ReactNode }) {
  let siteLogo = null;
  let isMaintenanceMode = false;
  let categories: any[] = []
  let popupBanner = null;

  try {
    const [settings, categoriesResult, popupResult] = await Promise.all([
      db.shopSettings.findMany({
        where: { key: { in: ["site_logo", "maintenance_mode"] } }
      }),
      getCategories(),
      db.banner.findFirst({
        where: { type: "POPUP", isActive: true },
        orderBy: { sortOrder: "asc" }
      })
    ])

    siteLogo = settings.find(s => s.key === "site_logo")?.value;
    isMaintenanceMode = settings.find(s => s.key === "maintenance_mode")?.value === "true";
    categories = categoriesResult.categories || []
    popupBanner = popupResult ? JSON.parse(JSON.stringify(popupResult)) : null;
  } catch (error) {
    console.error("Failed to load settings in layout:", error)
  }

  if (isMaintenanceMode) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-lg w-full text-center border border-[#1B3561]/20">
          <div className="w-20 h-20 bg-[#1B3561]/5 border border-[#1B3561]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
            <span className="text-4xl text-[#F26522] font-black">🛠️</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1B3561] mb-3 tracking-tight">Түр засвартай байна</h1>
          <p className="text-slate-600 mb-8 text-sm md:text-base leading-relaxed">
            Эрхэм харилцагч танд энэ өдрийн мэнд хүргэе. Манай сайт дээр одоогоор өгөгдлийн шинэчлэл хийгдэж байгаа тул түр хугацаанд хаагдлаа. Та хэсэг хугацааны дараа дахин хандана уу. Баярлалаа!
          </p>
          <div className="flex justify-center gap-3">
            <a href="#" className="hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 hover:bg-[#F26522] hover:text-white transition-all">
                <Facebook className="w-5 h-5" />
              </div>
            </a>
            <a href="#" className="hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 hover:bg-[#F26522] hover:text-white transition-all">
                <Instagram className="w-5 h-5" />
              </div>
            </a>
          </div>
          <p className="text-xs text-slate-400 mt-8">Онлайн дэлгүүр © {new Date().getFullYear()}</p>
        </div>
      </div>
    )
  }

  return (
    <CustomerAuthProvider>
      <FavoritesProvider>
        <CartProvider>
        <AgeVerificationProvider>
        {/* Navigation / Top Header */}
      {/* Navigation / Top Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100/50 shadow-sm" suppressHydrationWarning>
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-2.5 md:py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-6" suppressHydrationWarning>
          
          {/* No Logo as requested */}
          <div className="hidden md:block shrink-0 w-4"></div>

          {/* Search Bar Removed */}
          <div className="w-full md:flex-1 max-w-3xl hidden">
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 shrink-0">
            <Link href="/" className="text-sm font-semibold text-gray-700 hover:text-[#F26522] transition-colors whitespace-nowrap">
              Дэлгүүр
            </Link>
            <Link href="/?sale=true" className="text-sm font-semibold text-red-500 hover:text-red-600 transition-colors whitespace-nowrap">
              Хямдрал
            </Link>
          </nav>

          {/* Right: Desktop Icon Buttons */}
          <div className="hidden md:flex items-center gap-3 shrink-0 border-l border-slate-200 pl-5">
            <CartBadgeIcon />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-[60vh] pb-20 md:pb-10 bg-slate-50" suppressHydrationWarning>
        {children}
      </main>

      {/* Global FAB Cart Icon (Hidden on mobile to avoid overlapping bottom nav) */}
      <div className="hidden md:block">
        <CartIcon />
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation />

      {/* Global Analytics & Social Proof */}
      <VisitorTracker />
      <SocialProofToast />
      
      {/* Pop-up Banner */}
      <PopupBannerModal banner={popupBanner} />

      {/* Footer removed as requested */}
      </AgeVerificationProvider>
      </CartProvider>
    </FavoritesProvider>
    </CustomerAuthProvider>
  )
}

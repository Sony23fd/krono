import { ReactNode } from "react"
import { MapPin, Clock, Truck, ShieldCheck, Mail, Phone, Instagram, Facebook, Search, Heart, User, LogOut, ChevronDown, ShoppingCart } from "lucide-react"
import { CartProvider } from "@/context/CartContext"
import { FavoritesProvider } from "@/context/FavoritesContext"
import { AgeVerificationProvider } from "@/context/AgeVerificationContext"
import { CustomerAuthProvider } from "@/context/CustomerAuthContext"
import { CartIcon } from "@/components/storefront/CartIcon"
import { CartBadgeIcon } from "@/components/storefront/CartBadgeIcon"
import { FavoritesBadgeIcon } from "@/components/storefront/FavoritesBadgeIcon"
import { ProfileMenuIcon } from "@/components/storefront/ProfileMenuIcon"
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
          <p className="text-xs text-slate-400 mt-8">Bileg Supermarket © {new Date().getFullYear()}</p>
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
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            {siteLogo ? (
              <div className="relative flex items-center h-8 md:h-12" suppressHydrationWarning>
                <img
                  src={siteLogo}
                  alt="Bileg Logo"
                  className="object-contain h-full w-auto drop-shadow-sm max-w-[150px] md:max-w-[200px]"
                />
              </div>
            ) : (
              <div className="relative flex items-center h-8 md:h-12" suppressHydrationWarning>
                <img
                  src="/logo.png"
                  alt="Bileg Logo"
                  className="object-contain h-full w-auto drop-shadow-sm max-w-[150px] md:max-w-[200px]"
                />
              </div>
            )}
          </Link>

          {/* Search Bar — full width on mobile, flexible on desktop */}
          <div className="w-full md:flex-1 max-w-3xl">
            <HeaderSearchBar categories={categories} />
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 shrink-0">
            <Link href="/shop" className="text-sm font-semibold text-gray-700 hover:text-[#F26522] transition-colors whitespace-nowrap">
              Дэлгүүр
            </Link>
            <Link href="/categories" className="text-sm font-semibold text-gray-700 hover:text-[#F26522] transition-colors whitespace-nowrap">
              Ангилал
            </Link>
            <Link href="/shop?sale=true" className="text-sm font-semibold text-red-500 hover:text-red-600 transition-colors whitespace-nowrap">
              Хямдрал
            </Link>
          </nav>

          {/* Right: Desktop Icon Buttons */}
          <div className="hidden md:flex items-center gap-3 shrink-0 border-l border-slate-200 pl-5">
            <FavoritesBadgeIcon />
            <CartBadgeIcon />
            <ProfileMenuIcon />
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

      {/* Modern Premium Footer */}
      <footer className="bg-slate-900 text-slate-300 pt-16 pb-24 md:pb-8 px-4 md:px-8 lg:px-16 mt-auto" suppressHydrationWarning>
        <div className="max-w-7xl mx-auto" suppressHydrationWarning>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 mb-16" suppressHydrationWarning>
            
            {/* Column 1: Brand & About */}
            <div className="lg:col-span-4 flex flex-col h-full" suppressHydrationWarning>
              <div className="flex items-center gap-2 mb-6" suppressHydrationWarning>
                <div className="relative flex items-center h-16 bg-white/10 p-3 rounded-xl backdrop-blur-sm w-fit" suppressHydrationWarning>
                  <img
                    src="/logobtm.png"
                    alt="Bileg Logo"
                    className="object-contain h-full w-auto max-w-[240px]"
                  />
                </div>
              </div>
              
              <p className="text-sm leading-relaxed text-slate-400 mb-8 text-justify">
                Манай дэлгүүр 2020 онд үүд хаалгаа нээж, нээсэн цагаасаа нэг ч өдөр алгасалгүй 24 цагийн турш үйл ажиллагаагаа явуулж байна. 2023 онд 2 дахь салбараа нээж үйлчлүүлэгчидтэйгээ илүү ойртсон бол 2026 онд bileghurgelt.mn сайт ашиглан 3000 гаруй бараа бүтээгдэхүүнийг онлайн захиалга үүсгэн аюулгүй, түргэн шуурхай хүргүүлэн авах боломжийг бүрдүүлсэн. Хэрэглэгчдийг хэрэгцээт бараа бүтээгдэхүүнээр ханган, хүргэлтийн нөхцөлийг хамгийн хурднаар буюу 24 цагийн дотор хүргэхээр зорин ажилладаг.
              </p>
              
              <div className="flex gap-4 mb-10">
                <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[#F26522] hover:border-[#F26522] shadow-sm transition-all" title="Instagram">
                  <Instagram className="w-5 h-5 drop-shadow-sm" />
                </a>
                <a href="https://www.facebook.com/profile.php?id=61584428347590" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[#F26522] hover:border-[#F26522] shadow-sm transition-all" title="Facebook">
                  <Facebook className="w-5 h-5 fill-white drop-shadow-sm" />
                </a>
              </div>

              <div className="flex items-start gap-4 mt-auto p-4 rounded-2xl bg-white/5 border border-white/10">
                <ShieldCheck className="w-8 h-8 text-[#F26522] shrink-0" />
                <div>
                  <h4 className="text-slate-200 font-bold text-sm mb-1 uppercase tracking-wide">Шинэ, Найдвартай</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Өдөр бүр шинэ бараа бүтээгдэхүүн, чанарын өндөр стандарт.
                  </p>
                </div>
              </div>
            </div>

            {/* Column 2: Contact & Schedule */}
            <div className="lg:col-span-3 lg:pl-4 space-y-10">
              <div>
                <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#F26522]"></span>
                  Холбоо барих
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 text-sm group">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#F26522]/20 transition-colors">
                      <MapPin className="w-4 h-4 text-[#F26522]" />
                    </div>
                    <div className="leading-relaxed text-slate-300 pt-1 flex flex-col gap-2">
                      <a href="https://www.google.mn/maps/place/49%C2%B027'41.1%22N+105%C2%B056'58.4%22E/@49.4614167,105.9495556,706m/data=!3m2!1e3!4b1!4m4!3m3!8m2!3d49.4614167!4d105.9495556?entry=ttu&g_ep=EgoyMDI2MDUyMC4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noopener noreferrer" className="hover:text-[#F26522] transition-colors flex items-center gap-1 group/link">
                        Салбар 1 (380) <span className="text-[10px] uppercase tracking-wider opacity-0 group-hover/link:opacity-100 transition-opacity ml-1 bg-[#F26522]/20 text-[#F26522] px-1.5 py-0.5 rounded">Чиглэл</span>
                      </a>
                      <a href="https://maps.app.goo.gl/bcpAhTWCQX4mchge6" target="_blank" rel="noopener noreferrer" className="hover:text-[#F26522] transition-colors flex items-center gap-1 group/link">
                        Салбар 2 (Парк таун) <span className="text-[10px] uppercase tracking-wider opacity-0 group-hover/link:opacity-100 transition-opacity ml-1 bg-[#F26522]/20 text-[#F26522] px-1.5 py-0.5 rounded">Чиглэл</span>
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm group">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-[#F26522]/20 transition-colors">
                      <Phone className="w-4 h-4 text-[#F26522]" />
                    </div>
                    <a href="tel:80230077" className="hover:text-[#F26522] transition-colors text-base font-semibold text-white tracking-wide">
                      8023-0077
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#F26522]"></span>
                  Цагийн хуваарь
                </h3>
                <ul className="text-sm space-y-4">
                  <li className="flex flex-col gap-1 pb-3 border-b border-white/5">
                    <span className="text-slate-400 text-xs uppercase tracking-wider">Салбарын цагийн хуваарь</span>
                    <span className="text-[#F26522] font-semibold text-base">Өдөр бүр 24 цаг</span>
                  </li>
                  <li className="flex flex-col gap-1 pt-1">
                    <span className="text-slate-400 text-xs uppercase tracking-wider">Хүргэлтийн цагийн хуваарь</span>
                    <span className="text-[#F26522] font-semibold text-base">09:00 - 22:00</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Column 3: Map */}
            <div className="lg:col-span-5 h-full min-h-[350px]">
              <FooterMap />
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 w-full">
            <div className="md:w-1/3 text-center md:text-left">
              <p>© {new Date().getFullYear()} <strong className="text-white font-medium">Bileg Supermarket</strong>.</p>
            </div>
            <div className="md:w-1/3 text-center">
            </div>
            <div className="md:w-1/3 flex justify-center md:justify-end gap-4 md:gap-6 flex-wrap">
              <Link href="/delivery-terms" className="hover:text-white transition-colors">Хүргэлтийн нөхцөл</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Үйлчилгээний нөхцөл</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Нууцлалын бодлого</Link>
            </div>
          </div>
        </div>
      </footer>
      </AgeVerificationProvider>
      </CartProvider>
    </FavoritesProvider>
    </CustomerAuthProvider>
  )
}

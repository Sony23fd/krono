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
import Link from "next/link"
import Image from "next/image"
import { db } from "@/lib/db"

import { AnimatedHeroBackground } from "@/components/storefront/home/AnimatedHeroBackground"
import { VisitorTracker } from "@/components/storefront/VisitorTracker"
import { SocialProofToast } from "@/components/storefront/SocialProofToast"
import { BottomNavigation } from "@/components/storefront/BottomNavigation"

export const dynamic = "force-dynamic"

export default async function StorefrontLayout({ children }: { children: ReactNode }) {
  let siteLogo = null;
  let isMaintenanceMode = false;
  let categories: any[] = []

  try {
    const [settings, categoriesResult] = await Promise.all([
      db.shopSettings.findMany({
        where: { key: { in: ["site_logo", "maintenance_mode"] } }
      }),
      getCategories(),
    ])

    siteLogo = settings.find(s => s.key === "site_logo")?.value;
    isMaintenanceMode = settings.find(s => s.key === "maintenance_mode")?.value === "true";
    categories = categoriesResult.categories || []
  } catch (error) {
    console.error("Failed to load settings in layout:", error)
  }

  if (isMaintenanceMode) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-lg w-full text-center border border-[#1B3561]/20">
          <div className="w-20 h-20 bg-[#1B3561]/5 border border-[#1B3561]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
            <span className="text-4xl text-[#E21B22] font-black">🛠️</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1B3561] mb-3 tracking-tight">Түр засвартай байна</h1>
          <p className="text-slate-600 mb-8 text-sm md:text-base leading-relaxed">
            Эрхэм харилцагч танд энэ өдрийн мэнд хүргэе. Манай сайт дээр одоогоор өгөгдлийн шинэчлэл хийгдэж байгаа тул түр хугацаанд хаагдлаа. Та хэсэг хугацааны дараа дахин хандана уу. Баярлалаа!
          </p>
          <div className="flex justify-center gap-3">
            <a href="#" className="hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-[#1B3561] hover:bg-[#E21B22] hover:text-white transition-all">
                <Facebook className="w-5 h-5" />
              </div>
            </a>
            <a href="#" className="hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-[#1B3561] hover:bg-[#E21B22] hover:text-white transition-all">
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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-slate-100 shadow-sm" suppressHydrationWarning>
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-2.5 md:py-3 flex items-center justify-between gap-3 md:gap-6" suppressHydrationWarning>
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            {siteLogo ? (
              <div className="relative flex items-center h-8 md:h-12" suppressHydrationWarning>
                <img
                  src={siteLogo}
                  alt="Bileg Logo"
                  className="object-contain h-full w-auto drop-shadow-sm max-w-[100px] md:max-w-[200px]"
                />
              </div>
            ) : (
              <div className="relative flex items-center h-8 md:h-12" suppressHydrationWarning>
                <img
                  src="/logo.png"
                  alt="Bileg Logo"
                  className="object-contain h-full w-auto drop-shadow-sm max-w-[100px] md:max-w-[200px]"
                />
              </div>
            )}
          </Link>

          {/* Search Bar — always visible */}
          <div className="flex-1 max-w-2xl">
            <HeaderSearchBar categories={categories} />
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 shrink-0">
            <Link href="/shop" className="text-sm font-semibold text-gray-700 hover:text-[#e63946] transition-colors whitespace-nowrap">
              Дэлгүүр
            </Link>
            <Link href="/categories" className="text-sm font-semibold text-gray-700 hover:text-[#e63946] transition-colors whitespace-nowrap">
              Ангилал
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

      {/* Modern Premium Footer */}
      <footer className="bg-[#1B3561] text-slate-300 pt-16 pb-8 px-4 md:px-8 lg:px-16 mt-auto hidden md:block" suppressHydrationWarning>
        <div className="max-w-6xl mx-auto">
          {/* Top border decor */}
          <div className="h-1 w-20 bg-[#E21B22] rounded-full mb-12"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6">
                {siteLogo ? (
                  <div className="relative flex items-center h-10">
                    <img
                      src={siteLogo}
                      alt="Bileg Logo"
                      className="object-contain h-full w-auto max-w-[200px]"
                    />
                  </div>
                ) : (
                  <div className="relative flex items-center h-10">
                    <img
                      src="/logo.png"
                      alt="Bileg Logo"
                      className="object-contain h-full w-auto max-w-[200px]"
                    />
                  </div>
                )}
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                Бичил хорооллын хамгийн том супермаркет. Чанартай, шинэ, хямд бараа бүтээгдэхүүнээр үйлчилж байна.
              </p>
              <div className="flex gap-4 pt-2">
                <a href="#" className="w-9 h-9 rounded-full bg-[#E21B22] flex items-center justify-center text-white hover:scale-110 shadow-sm transition-transform" title="Instagram">
                  <Instagram className="w-5 h-5 drop-shadow-sm" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-[#E21B22] flex items-center justify-center text-white hover:scale-110 shadow-sm transition-transform" title="Facebook">
                  <Facebook className="w-5 h-5 fill-white drop-shadow-sm" />
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-6">Холбоо барих</h3>
              <div className="flex items-start gap-3 text-sm group">
                <MapPin className="w-5 h-5 text-[#E21B22] shrink-0 mt-0.5" />
                <a href="#" className="leading-relaxed hover:text-[#E21B22] transition-colors">
                  Улаанбаатар хот
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm group">
                <Phone className="w-5 h-5 text-[#E21B22] shrink-0" />
                <a href="tel:+97612345678" className="hover:text-[#E21B22] transition-colors">
                  +976 1234 5678
                </a>
              </div>
              <div className="mt-4 rounded-xl overflow-hidden shadow-sm h-32 relative">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src="https://maps.google.com/maps?q=Bileg+Supermarket+Ulaanbaatar&t=&z=13&ie=UTF8&iwloc=&output=embed"
                  allowFullScreen
                ></iframe>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-6">Цагийн хуваарь</h3>
              <ul className="text-sm space-y-3">
                <li className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-slate-400">Дэлгүүр (Даваа - Ням)</span>
                  <span className="text-[#00A651] font-medium">24 Цаг</span>
                </li>
                <li className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-slate-400">Хүргэлт (Өдөр бүр)</span>
                  <span className="text-[#00A651] font-medium">09:00 - 22:00</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-6">Баталгаа</h3>
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-8 h-8 text-[#00A651] shrink-0" />
                <div>
                  <h4 className="text-slate-200 font-medium text-sm mb-1">Шинэ, Найдвартай</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Өдөр бүр шинэ бараа бүтээгдэхүүн, чанарын өндөр стандарт.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 w-full">
            <div className="md:w-1/3 text-center md:text-left">
              <p>© {new Date().getFullYear()} <strong className="text-white font-medium">Bileg Supermarket</strong>.</p>
            </div>
            <div className="md:w-1/3 text-center">
            </div>
            <div className="md:w-1/3 flex justify-center md:justify-end gap-6">
              <Link href="/terms" className="hover:text-white transition-colors">Үйлчилгээний нөхцөл</Link>
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

"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import Link from "next/link"

interface PopupBannerModalProps {
  banner: {
    id: string
    title?: string | null
    imageUrl: string
    linkUrl?: string | null
    showTitle?: boolean | null
    titleColor?: string | null
    titlePosition?: string | null
    titleSize?: string | null
  } | null
}

export function PopupBannerModal({ banner }: PopupBannerModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!banner) return

    // Check if the user has already seen the popup in this session
    const hasSeenPopup = sessionStorage.getItem(`popup_seen_${banner.id}`)
    
    if (!hasSeenPopup) {
      // Small delay to make it feel more natural and not block initial render
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [banner])

  if (!banner || !isOpen) return null

  const closePopup = () => {
    setIsOpen(false)
    sessionStorage.setItem(`popup_seen_${banner.id}`, "true")
  }

  // Text Config
  let alignClass = "items-start text-left";
  if (banner.titlePosition?.includes("CENTER") && !banner.titlePosition?.includes("LEFT") && !banner.titlePosition?.includes("RIGHT")) {
    alignClass = "items-center text-center";
  } else if (banner.titlePosition?.includes("RIGHT")) {
    alignClass = "items-end text-right";
  }
  
  let justifyClass = "justify-start pt-8";
  if (banner.titlePosition?.includes("BOTTOM")) {
    justifyClass = "justify-end pb-8";
  } else if (banner.titlePosition?.startsWith("CENTER")) {
    justifyClass = "justify-center";
  }

  let sizeClass = "text-2xl md:text-4xl";
  if (banner.titleSize === "SMALL") sizeClass = "text-lg md:text-xl";
  if (banner.titleSize === "MEDIUM") sizeClass = "text-xl md:text-3xl";
  if (banner.titleSize === "XLARGE") sizeClass = "text-3xl md:text-5xl lg:text-6xl";

  const showTitle = banner.showTitle ?? true;

  const BannerContent = () => (
    <>
      <button 
        onClick={(e) => {
          e.preventDefault();
          closePopup();
        }}
        className="absolute -top-3 -right-3 md:-top-4 md:-right-4 w-8 h-8 md:w-10 md:h-10 bg-white text-slate-800 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-100 hover:text-red-500 hover:scale-110 transition-all z-20 border border-slate-200"
        aria-label="Хаах"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="w-full relative group rounded-2xl overflow-hidden bg-white flex flex-col">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <div className="relative w-full">
          <img 
            src={banner.imageUrl} 
            alt={banner.title || "Popup Banner"} 
            className="w-full h-auto max-h-[70vh] object-contain relative z-0"
          />
          {banner.linkUrl && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 z-10 pointer-events-none" />
          )}
        </div>
        
        {showTitle && banner.title && (
          <div className={`w-full p-6 md:p-8 flex flex-col ${alignClass} bg-white border-t border-slate-100`}>
            <h2 
              className={`${sizeClass} font-black leading-tight tracking-tight text-slate-900`} 
              style={{ color: banner.titleColor && banner.titleColor !== "#FFFFFF" ? banner.titleColor : undefined }}
            >
              {banner.title.split('\\n').map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </h2>
            {banner.linkUrl && (
              <div className="mt-4">
                <span className="inline-flex items-center text-sm font-semibold text-[#F26522] hover:text-[#E85B1C] transition-colors">
                  Дэлгэрэнгүй үзэх
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" suppressHydrationWarning>
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closePopup}
      />
      <div className="relative z-10 w-full max-w-[600px] bg-transparent rounded-2xl animate-in zoom-in-95 fade-in duration-300">
        {banner.linkUrl ? (
          <Link href={banner.linkUrl} onClick={() => sessionStorage.setItem(`popup_seen_${banner.id}`, "true")}>
            <BannerContent />
          </Link>
        ) : (
          <BannerContent />
        )}
      </div>
    </div>
  )
}

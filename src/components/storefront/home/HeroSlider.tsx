"use client"

import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import 'swiper/css/effect-fade'
import Link from 'next/link'
import Image from 'next/image'

export interface Banner {
  id: string
  title: string | null
  imageUrl: string
  linkUrl: string | null
  showTitle?: boolean | null
  titleColor?: string | null
  titlePosition?: string | null
  titleSize?: string | null
}

export function HeroSlider({ banners }: { banners: Banner[] }) {
  if (!banners || banners.length === 0) return null

  return (
    <div className="w-full relative group bg-slate-900 shadow-md">
      <Swiper
        spaceBetween={0}
        slidesPerView={1}
        loop={true}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          bulletActiveClass: 'bg-white opacity-100',
          bulletClass: 'swiper-pagination-bullet bg-white opacity-50',
        }}
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        effect="fade"
        navigation={{
          nextEl: '.swiper-button-next-custom',
          prevEl: '.swiper-button-prev-custom',
        }}
        className="w-full aspect-[4/3] sm:aspect-[21/9] md:aspect-[3/1] max-h-[450px]"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            {({ isActive }) => (
              <div className="relative w-full h-full cursor-pointer">
                {banner.linkUrl ? (
                  <Link href={banner.linkUrl} className="block w-full h-full relative">
                    <SlideContent banner={banner} isActive={isActive} />
                  </Link>
                ) : (
                  <SlideContent banner={banner} isActive={isActive} />
                )}
              </div>
            )}
          </SwiperSlide>
        ))}
        
        {/* Custom Navigation Arrows */}
        <div className="swiper-button-prev-custom absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-4 group-hover:translate-x-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </div>
        <div className="swiper-button-next-custom absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </div>
      </Swiper>
      <style jsx global>{`
        .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          border-radius: 4px;
          transition: all 0.3s;
        }
        .swiper-pagination-bullet-active {
          width: 24px;
          background-color: #F26522 !important;
        }

      `}</style>
    </div>
  )
}

function SlideContent({ banner, isActive }: { banner: Banner, isActive: boolean }) {
  // Horizontal alignment
  let alignClass = "items-start text-left"; // default left
  if (banner.titlePosition?.includes("CENTER") && !banner.titlePosition?.includes("LEFT") && !banner.titlePosition?.includes("RIGHT")) {
    alignClass = "items-center text-center mx-auto";
  } else if (banner.titlePosition?.includes("RIGHT")) {
    alignClass = "items-end text-right ml-auto";
  }
  
  // Vertical alignment
  let justifyClass = "justify-start pt-12 md:pt-16"; // default top
  if (banner.titlePosition?.includes("BOTTOM")) {
    justifyClass = "justify-end pb-12 md:pb-16";
  } else if (banner.titlePosition?.startsWith("CENTER")) {
    justifyClass = "justify-center";
  }

  // Size
  let sizeClass = "text-2xl md:text-4xl";
  if (banner.titleSize === "SMALL") sizeClass = "text-lg md:text-xl";
  if (banner.titleSize === "MEDIUM") sizeClass = "text-xl md:text-3xl";
  if (banner.titleSize === "XLARGE") sizeClass = "text-3xl md:text-5xl lg:text-7xl";

  const showTitle = banner.showTitle ?? true;

  return (
    <div className="relative w-full h-full overflow-hidden group/slide">
      {/* Background Gradient for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 z-[1] pointer-events-none" />

      <Image 
        src={banner.imageUrl} 
        alt={banner.title || "Banner"} 
        fill
        className={`object-cover transform transition-transform duration-[10000ms] ease-out ${isActive ? 'scale-105' : 'scale-100'}`}
        priority
      />
      
      {/* Overlay to hold the text */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className={`max-w-7xl mx-auto h-full flex flex-col ${justifyClass} p-6 md:px-8 lg:px-12`}>
          {showTitle && banner.title && (
            <div className={`max-w-2xl flex flex-col ${alignClass}`}>
              <div className={`backdrop-blur-md bg-white/10 p-5 md:p-8 rounded-3xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transform transition-all duration-1000 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                <h2 className={`${sizeClass} font-black leading-[1.15] drop-shadow-lg tracking-tight`} style={{ color: banner.titleColor || "#FFFFFF" }}>
                  {banner.title.split('\\n').map((line, i) => (
                    <span key={i} className="block">{line}</span>
                  ))}
                </h2>
                
                {banner.linkUrl && (
                  <div className={`mt-6 transform transition-all duration-1000 delay-300 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                    <span className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold text-white bg-[#F26522] rounded-full hover:bg-[#E85B1C] transition-colors shadow-lg shadow-[#F26522]/30 pointer-events-auto">
                      Дэлгэрэнгүй үзэх
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

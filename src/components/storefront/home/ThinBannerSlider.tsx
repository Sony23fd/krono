"use client"

import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectFade } from 'swiper/modules'
import 'swiper/css'
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

export function ThinBannerSlider({ banners }: { banners: Banner[] }) {
  if (!banners || banners.length === 0) return null

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="w-full relative rounded-2xl overflow-hidden shadow-sm border border-gray-100 group">
        <Swiper
          spaceBetween={0}
          slidesPerView={1}
          loop={true}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          autoplay={{
            delay: 6000,
            disableOnInteraction: false,
          }}
          modules={[Autoplay, EffectFade]}
          className="w-full aspect-[4/1] md:aspect-[8/1] lg:aspect-[10/1]"
        >
          {banners.map((banner) => (
            <SwiperSlide key={`thin-banner-${banner.id}`}>
              <div className="relative w-full h-full cursor-pointer bg-slate-100">
                {banner.linkUrl ? (
                  <Link href={banner.linkUrl} className="block w-full h-full relative">
                    <SlideContent banner={banner} />
                  </Link>
                ) : (
                  <SlideContent banner={banner} />
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  )
}

function SlideContent({ banner }: { banner: Banner }) {
  // Horizontal alignment
  let alignClass = "items-start text-left"; // default left
  if (banner.titlePosition?.includes("CENTER") && !banner.titlePosition?.includes("LEFT") && !banner.titlePosition?.includes("RIGHT")) {
    alignClass = "items-center text-center mx-auto";
  } else if (banner.titlePosition?.includes("RIGHT")) {
    alignClass = "items-end text-right ml-auto";
  }
  
  // Vertical alignment
  let justifyClass = "justify-center"; // default center for thin banner
  if (banner.titlePosition?.includes("BOTTOM")) {
    justifyClass = "justify-end";
  } else if (banner.titlePosition?.includes("TOP")) {
    justifyClass = "justify-start";
  }

  // Size
  let sizeClass = "text-lg md:text-2xl lg:text-3xl";
  if (banner.titleSize === "SMALL") sizeClass = "text-base md:text-lg lg:text-xl";
  if (banner.titleSize === "MEDIUM") sizeClass = "text-lg md:text-xl lg:text-2xl";
  if (banner.titleSize === "XLARGE") sizeClass = "text-xl md:text-3xl lg:text-4xl";

  const showTitle = banner.showTitle ?? true;

  return (
    <div className="relative w-full h-full overflow-hidden group/slide">
      <Image 
        src={banner.imageUrl} 
        alt={banner.title || "Banner"} 
        fill
        className="object-cover object-center transform group-hover/slide:scale-105 transition-transform duration-[8000ms] ease-out"
      />
      {showTitle && banner.title && (
        <div className="absolute inset-0 pointer-events-none p-6 md:p-10 flex flex-col">
          <div className={`w-full h-full flex flex-col ${justifyClass} ${alignClass}`}>
            <div className="backdrop-blur-sm bg-black/30 p-3 md:p-4 rounded-xl border border-white/10 shadow-lg">
              <h3 className={`${sizeClass} font-extrabold drop-shadow-md tracking-tight`} style={{ color: banner.titleColor || "#FFFFFF" }}>
                {banner.title}
              </h3>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

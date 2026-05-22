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
  return (
    <div className="relative w-full h-full overflow-hidden group/slide">
      <Image 
        src={banner.imageUrl} 
        alt={banner.title || "Banner"} 
        fill
        className="object-cover object-center transform group-hover/slide:scale-105 transition-transform duration-[8000ms] ease-out"
      />
      {/* Soft overlay for contrast if title exists */}
      {banner.title && (
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent flex items-center p-6 md:p-10">
          <h3 className="text-white text-lg md:text-2xl lg:text-3xl font-extrabold drop-shadow-md tracking-tight max-w-xl">
            {banner.title}
          </h3>
        </div>
      )}
    </div>
  )
}

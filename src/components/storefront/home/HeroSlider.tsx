"use client"

import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import Link from 'next/link'
import Image from 'next/image'

export interface Banner {
  id: string
  title: string | null
  imageUrl: string
  linkUrl: string | null
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
        modules={[Autoplay, Pagination]}
        className="w-full aspect-[4/3] sm:aspect-[21/9] md:aspect-[3/1] max-h-[450px]"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <div className="relative w-full h-full cursor-pointer">
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
        
        {/* Custom Navigation Arrows Removed for cleaner look */}
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

function SlideContent({ banner }: { banner: Banner }) {
  return (
    <div className="relative w-full h-full overflow-hidden group/slide">
      <Image 
        src={banner.imageUrl} 
        alt={banner.title || "Banner"} 
        fill
        className="object-cover transform group-hover/slide:scale-105 transition-transform duration-[10000ms] ease-out"
        priority
      />
      {/* Refined gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent">
        <div className="max-w-7xl mx-auto h-full flex flex-col justify-end p-6 md:px-4 pb-12 md:pb-14">
          {banner.title && (
            <div className="max-w-2xl transform translate-y-4 opacity-0 animate-[slideUp_0.8s_ease-out_forwards] backdrop-blur-sm bg-black/20 p-4 md:p-5 rounded-2xl border border-white/10 shadow-2xl">
              <h2 className="text-white text-xl md:text-3xl font-extrabold leading-snug drop-shadow-md tracking-tight">
                {banner.title}
              </h2>
            </div>
          )}
        </div>
      </div>
      <style jsx global>{`
        @keyframes slideUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

"use client"

import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
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
    <div className="w-full relative group bg-slate-900 rounded-b-2xl md:rounded-2xl overflow-hidden mb-6 md:mb-10 shadow-lg">
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
        navigation={{
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        }}
        modules={[Autoplay, Pagination, Navigation]}
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
        
        {/* Custom Navigation Arrows */}
        <div className="swiper-button-prev !text-white !w-10 !h-10 !bg-black/20 hover:!bg-black/50 !rounded-full !hidden md:group-hover:!flex transition-all after:!text-sm backdrop-blur-sm shadow-md !left-4" />
        <div className="swiper-button-next !text-white !w-10 !h-10 !bg-black/20 hover:!bg-black/50 !rounded-full !hidden md:group-hover:!flex transition-all after:!text-sm backdrop-blur-sm shadow-md !right-4" />
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
          background-color: #E21B22 !important;
        }
      `}</style>
    </div>
  )
}

function SlideContent({ banner }: { banner: Banner }) {
  return (
    <>
      <Image 
        src={banner.imageUrl} 
        alt={banner.title || "Banner"} 
        fill
        className="object-cover"
        priority
      />
      {/* Dark overlay for readable text */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-12">
        {banner.title && (
          <h2 className="text-white text-2xl md:text-4xl font-extrabold mb-2 md:mb-4 drop-shadow-md translate-y-2 opacity-90">
            {banner.title}
          </h2>
        )}
      </div>
    </>
  )
}

"use client"

import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, FreeMode } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/free-mode'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { SliderProductCard } from './SliderProductCard'
import { useRef } from 'react'

interface PromoSliderSectionProps {
  title?: string
  promoTitle: string
  promoSubtitle?: string
  promoLink: string
  promoLinkText?: string
  promoImage?: string
  products: any[]
}

export function PromoSliderSection({
  title = "Онцгой санал",
  promoTitle,
  promoSubtitle,
  promoLink,
  promoLinkText = "Бүгдийг үзэх",
  promoImage,
  products,
}: PromoSliderSectionProps) {
  const prevRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)

  if (!products || products.length === 0) return null

  return (
    <div className="max-w-7xl mx-auto px-4 mb-12 md:mb-16">
      
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
          {title}
        </h2>

        {/* Right Actions */}
        <div className="flex items-center gap-4 md:gap-6">
          {promoLink && (
            <Link href={promoLink} className="text-sm font-semibold text-[#E21B22] hover:underline transition-all whitespace-nowrap">
              Бүгдийг харах
            </Link>
          )}

          {/* Custom Navigation (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-2">
          <button
            ref={prevRef}
            className="w-10 h-10 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center hover:bg-gray-100 hover:border-gray-300 transition-colors text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            ref={nextRef}
            className="w-10 h-10 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center hover:bg-gray-100 hover:border-gray-300 transition-colors text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 items-stretch">
        
        {/* Left Promotional Banner Card */}
        <div className="lg:col-span-1 rounded-2xl bg-gradient-to-br from-[#E21B22] to-[#FF4B2B] p-6 md:p-8 flex flex-col justify-between relative overflow-hidden shadow-md text-white min-h-[300px] lg:min-h-full">
          {/* Optional decorative shapes or image */}
          {promoImage && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-20 pointer-events-none mix-blend-overlay">
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src={promoImage} alt="" className="object-cover w-full h-full" />
             </div>
          )}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            {promoSubtitle && (
              <p className="text-white/80 font-semibold uppercase tracking-wider text-sm mb-2">{promoSubtitle}</p>
            )}
            <h3 className="text-3xl md:text-4xl font-black leading-tight drop-shadow-sm">
              {promoTitle}
            </h3>
          </div>

          <div className="relative z-10 mt-8">
            <Link 
              href={promoLink}
              className="inline-flex items-center gap-2 bg-white text-[#E21B22] font-bold py-3 px-6 rounded-full hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all shadow-sm"
            >
              {promoLinkText}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Right Product Slider */}
        <div className="lg:col-span-3 -mx-4 px-4 md:mx-0 md:px-0 flex flex-col">
          <Swiper
            modules={[Navigation, FreeMode]}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            onInit={(swiper) => {
              // @ts-ignore
              swiper.params.navigation.prevEl = prevRef.current
              // @ts-ignore
              swiper.params.navigation.nextEl = nextRef.current
              swiper.navigation.init()
              swiper.navigation.update()
            }}
            freeMode={true}
            slidesPerView="auto"
            spaceBetween={16}
            className="w-full h-full !pb-4"
            breakpoints={{
              320: {
                slidesPerView: 2.2,
                spaceBetween: 12,
              },
              640: {
                slidesPerView: 3.2,
                spaceBetween: 16,
              },
              768: {
                slidesPerView: 3.2,
                spaceBetween: 16,
                freeMode: false,
              },
              1024: {
                slidesPerView: 3.5,
                spaceBetween: 20,
                freeMode: false,
              },
              1280: {
                slidesPerView: 4,
                spaceBetween: 20,
                freeMode: false,
              },
            }}
          >
            {products.map((product) => (
              <SwiperSlide key={product.id} className="!h-auto">
                <SliderProductCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

      </div>
    </div>
  )
}

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

interface ProductSliderSectionProps {
  title: string
  products: any[]
  viewAllLink?: string
}

export function ProductSliderSection({
  title,
  products,
  viewAllLink = "/shop",
}: ProductSliderSectionProps) {
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
          {viewAllLink && (
            <Link href={viewAllLink} className="text-sm font-semibold text-[#E21B22] hover:underline transition-all whitespace-nowrap">
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

      {/* Slider */}
      <div className="-mx-4 px-4 md:mx-0 md:px-0">
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
          className="w-full !pb-4"
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
              slidesPerView: 4,
              spaceBetween: 16,
              freeMode: false,
            },
            1024: {
              slidesPerView: 5,
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
  )
}

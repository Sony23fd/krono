"use client"

import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, FreeMode, Autoplay } from 'swiper/modules'
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
  rowCount?: number
  autoScroll?: boolean
  layoutVariant?: string
  bannerText?: string | null
  showBannerText?: boolean
  bannerTextColor?: string
  bannerTextPosition?: string
  bannerTextSize?: string
  bannerPosition?: string
}

export function PromoSliderSection({
  title = "Онцгой санал",
  promoTitle,
  promoSubtitle,
  promoLink,
  promoLinkText = "Бүгдийг үзэх",
  promoImage,
  products,
  rowCount = 2,
  autoScroll = false,
  layoutVariant = "DEFAULT",
  bannerText,
  showBannerText = true,
  bannerTextColor = "#FFFFFF",
  bannerTextPosition = "TOP_LEFT",
  bannerTextSize = "LARGE",
  bannerPosition = "LEFT"
}: PromoSliderSectionProps) {
  const prevRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)

  if (!products || products.length === 0) return null

  return (
    <div className="max-w-7xl mx-auto px-4">
      
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 mb-5 md:mb-6 w-full">
        <h2 className="text-xl md:text-2xl font-extrabold text-[#1B3561] tracking-tight uppercase flex-1 min-w-[200px]">
          {title}
        </h2>
        
        {/* Connecting Line */}
        <div className="h-[1px] bg-gray-200 flex-[2] hidden sm:block"></div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 md:gap-6 shrink-0 ml-auto">
          {promoLink && (
            <Link href={promoLink} className="text-sm font-semibold text-slate-700 hover:text-[#F26522] transition-colors flex items-center gap-1 group">
              Бүгдийг үзэх
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}

          {/* Custom Navigation (Hidden on Mobile) - Only show for DEFAULT layout */}
          {layoutVariant === "DEFAULT" && (
            <div className="hidden md:flex items-center gap-2">
              <button
                ref={prevRef}
                className="w-9 h-9 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                ref={nextRef}
                className="w-9 h-9 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 items-stretch ${bannerPosition === "RIGHT" ? "lg:flex-row-reverse" : ""}`}>
        
        {/* Left/Right Promotional Banner Card */}
        {(() => {
          const BannerWrapper = promoLink ? Link : "div" as any;
          const displayTitle = bannerText || promoTitle;

          // Horizontal alignment
          let alignClass = "items-start text-left"; // default left
          if (bannerTextPosition?.includes("CENTER") && !bannerTextPosition?.includes("LEFT") && !bannerTextPosition?.includes("RIGHT")) {
            alignClass = "items-center text-center";
          } else if (bannerTextPosition?.includes("RIGHT")) {
            alignClass = "items-end text-right";
          }
          
          // Vertical alignment
          let justifyClass = "justify-start"; // default top
          if (bannerTextPosition?.includes("BOTTOM")) {
            justifyClass = "justify-end";
          } else if (bannerTextPosition?.startsWith("CENTER")) {
            justifyClass = "justify-center";
          }

          // Size
          let sizeClass = "text-3xl md:text-4xl";
          if (bannerTextSize === "SMALL") sizeClass = "text-xl md:text-2xl";
          if (bannerTextSize === "MEDIUM") sizeClass = "text-2xl md:text-3xl";
          if (bannerTextSize === "XLARGE") sizeClass = "text-4xl md:text-5xl lg:text-6xl";

          return (
            <BannerWrapper 
              href={promoLink || "#"} 
              className={`lg:col-span-1 rounded-2xl p-6 md:p-8 flex flex-col ${justifyClass} ${alignClass} relative overflow-hidden shadow-md text-white min-h-[300px] lg:min-h-full ${promoImage ? 'bg-slate-100' : 'bg-gradient-to-br from-[#F26522] to-[#FF4B2B]'} ${promoLink ? 'hover:shadow-lg transition-shadow cursor-pointer' : ''}`}
            >
              {promoImage ? (
                 <div className="absolute inset-0 w-full h-full pointer-events-none">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img src={promoImage} alt="" className="object-cover w-full h-full" />
                 </div>
              ) : (
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
              )}
              
              {showBannerText && displayTitle && (
                <div className="relative z-10 w-full">
                  <h3 
                    className={`${sizeClass} font-black leading-tight drop-shadow-md`} 
                    style={{ color: bannerTextColor }}
                  >
                    {displayTitle}
                  </h3>
                </div>
              )}
            </BannerWrapper>
          )
        })()}

        {/* Product Slider / Grid */}
        <div className={`lg:col-span-3 -mx-4 px-4 md:mx-0 md:px-0 flex flex-col ${bannerPosition === "RIGHT" ? "lg:order-first" : ""}`}>
          {layoutVariant === "GRID" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-5 pb-4">
              {products.map((product, index) => (
                <div key={`grid-${index}`}>
                  <SliderProductCard product={product} />
                </div>
              ))}
            </div>
          ) : layoutVariant === "MASONRY" ? (
            <div className="columns-2 sm:columns-3 md:columns-4 gap-3 md:gap-5 space-y-3 md:space-y-5 pb-4">
              {products.map((product, index) => (
                <div key={`masonry-${index}`} className="break-inside-avoid">
                  <SliderProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <Swiper
              modules={[Navigation, FreeMode, Autoplay]}
              navigation={{
                prevEl: prevRef.current,
                nextEl: nextRef.current,
              }}
              autoplay={autoScroll ? { delay: 3000, disableOnInteraction: false } : false}
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
              {rowCount === 1 ? (
                products.map((product, index) => (
                  <SwiperSlide key={`slide-${index}`} className="h-auto">
                    <SliderProductCard product={product} />
                  </SwiperSlide>
                ))
              ) : (
                Array.from({ length: Math.ceil(products.length / 2) }).map((_, index) => {
                  const p1 = products[index * 2]
                  const p2 = products[index * 2 + 1]
                  return (
                    <SwiperSlide key={`slide-${index}`} className="h-auto">
                      <div className="flex flex-col gap-4 h-full">
                        {p1 && <SliderProductCard product={p1} />}
                        {p2 && <SliderProductCard product={p2} />}
                      </div>
                    </SwiperSlide>
                  )
                })
              )}
            </Swiper>
          )}
        </div>

      </div>
    </div>
  )
}

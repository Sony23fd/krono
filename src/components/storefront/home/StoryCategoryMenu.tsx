"use client"

import Link from "next/link"
import { useRef } from "react"
import { Apple, Beef, Cake, Coffee, Milk, ShoppingBasket, Wine, Carrot, Fish } from "lucide-react"

import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, FreeMode } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/free-mode'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const iconMap: Record<string, any> = {
  "huns": ShoppingBasket,
  "jinms-hunsnii-nogoo": Carrot,
  "syy-tsagaan-idee": Milk,
  "mah-mahan-byteegdehyyn": Beef,
  "chixer-shokolad": Cake,
  "uuh-yum": Coffee,
  "arhi-pivnii-zereg": Wine,
  "zagas-dalain-garaltai": Fish,
  "default": ShoppingBasket
}

export function StoryCategoryMenu({ categories }: { categories: any[] }) {
  const prevRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)

  if (!categories || categories.length === 0) return null

  return (
    <div className="pb-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-lg md:text-xl font-bold text-slate-800">Бүх ангилал</h2>
          
          <div className="flex items-center gap-4">
            <Link href="/categories" className="text-sm font-semibold text-[#F26522] hover:underline transition-all whitespace-nowrap">
              Бүгдийг харах
            </Link>
            <div className="hidden md:flex items-center gap-2">
              <button
                ref={prevRef}
                className="w-8 h-8 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center hover:bg-gray-100 hover:border-gray-300 transition-colors text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous category"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                ref={nextRef}
                className="w-8 h-8 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center hover:bg-gray-100 hover:border-gray-300 transition-colors text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next category"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

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
          >
            {categories.map((cat, idx) => {
              const Icon = iconMap[cat.slug] || iconMap.default
              return (
                <SwiperSlide key={cat.id || idx} className="!w-auto">
                  <Link 
                    href={`/shop?category=${cat.slug}`}
                    className="flex flex-col items-center gap-2 group w-[72px] md:w-[88px]"
                  >
                    <div className="w-[64px] h-[64px] md:w-[76px] md:h-[76px] rounded-full p-[3px] bg-gradient-to-tr from-[#F26522] to-yellow-400 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                      <div className="w-full h-full rounded-full border-2 border-white bg-orange-50 flex items-center justify-center overflow-hidden text-[#F26522]">
                        {cat.imageUrl ? (
                          <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <Icon className="w-7 h-7 md:w-8 md:h-8 stroke-[1.5px]" />
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] md:text-xs font-semibold text-center text-slate-700 leading-tight group-hover:text-[#F26522] transition-colors line-clamp-2">
                      {cat.name}
                    </span>
                  </Link>
                </SwiperSlide>
              )
            })}
          </Swiper>
        </div>
      </div>
    </div>
  )
}

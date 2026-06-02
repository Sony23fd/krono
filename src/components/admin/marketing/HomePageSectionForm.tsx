"use client"

import { useState } from "react"
import { ActionForm } from "@/components/admin/ActionForm"
import { Input } from "@/components/ui/input"
import { GenericImageUploader } from "@/components/admin/GenericImageUploader"
import { Button } from "@/components/ui/button"

export function HomePageSectionForm({
  action,
  categories,
  initialData,
  onSuccess,
  submitLabel = "Хадгалах"
}: {
  action: (formData: FormData) => Promise<any>
  categories: { id: string; name: string }[]
  initialData?: any
  onSuccess?: () => void
  submitLabel?: string
}) {
  const [type, setType] = useState(initialData?.type || "PRODUCT_SLIDER")
  const [showBannerText, setShowBannerText] = useState(initialData?.showBannerText ?? true)

  const isSlider = type === "PRODUCT_SLIDER" || type === "PROMO_SLIDER"
  const hasBanner = type === "PROMO_SLIDER" || type === "HERO_BANNER" || type === "THIN_BANNER"
  const hasTextConfig = type === "PROMO_SLIDER" || type === "HERO_BANNER"

  return (
    <ActionForm action={action} onSuccess={onSuccess} className="space-y-6 mt-6">
      {/* 1. Үндсэн мэдээлэл */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">Ерөнхий мэдээлэл</h3>
        
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">Гарчиг *</label>
          <Input id="title" name="title" required defaultValue={initialData?.title} placeholder="Ж: Онцлох бараа" />
        </div>

        <div className="space-y-2">
          <label htmlFor="type" className="text-sm font-medium">Төрөл *</label>
          <select 
            id="type" 
            name="type" 
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30"
          >
            <option value="PRODUCT_SLIDER">Энгийн слайдер (Зөвхөн бараанууд)</option>
            <option value="PROMO_SLIDER">Онцгой санал (Хажуудаа баннертай)</option>
            <option value="HERO_BANNER">Том баннер (Hero Slider)</option>
            <option value="THIN_BANNER">Нарийн баннер (Thin Banner)</option>
            <option value="CATEGORY_MENU">Ангиллын цэс (Story Style)</option>
            <option value="HOW_IT_WORKS">Хэрхэн захиалах вэ? (How it works)</option>
          </select>
        </div>

        {isSlider && (
          <div className="space-y-2">
            <label htmlFor="categoryId" className="text-sm font-medium">Ангилал сонгох</label>
            <select id="categoryId" name="categoryId" defaultValue={initialData?.categoryId || ""} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30">
              <option value="">Бүх бараанаас (эсвэл тусгай)</option>
              {categories?.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">Хэрэв ангилал сонговол тухайн ангиллын бараанууд харагдана.</p>
          </div>
        )}
      </div>

      {/* 2. Слайдер тохиргоо */}
      {isSlider && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">Слайдер тохиргоо</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="rowCount" className="text-sm font-medium">Эгнээний тоо</label>
              <select id="rowCount" name="rowCount" defaultValue={initialData?.rowCount?.toString() || "2"} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30">
                <option value="1">1 эгнээ (Урт)</option>
                <option value="2">2 эгнээ (Давхарласан)</option>
              </select>
            </div>

            <div className="space-y-2 flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer h-10">
                <input type="checkbox" name="autoScroll" id="autoScroll" defaultChecked={initialData?.autoScroll} className="rounded border-gray-300 text-[#4F46E5] focus:ring-[#4F46E5] w-4 h-4" />
                <span className="text-sm font-medium">Автоматаар гүйх</span>
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="layoutVariant" className="text-sm font-medium">Загвар (Layout)</label>
            <select id="layoutVariant" name="layoutVariant" defaultValue={initialData?.layoutVariant || "DEFAULT"} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30">
              <option value="DEFAULT">Үндсэн загвар (Default)</option>
              <option value="GRID">Тор (Grid)</option>
              <option value="MASONRY">Зөрүүтэй (Masonry)</option>
            </select>
          </div>
        </div>
      )}

      {/* 3. Баннер тохиргоо */}
      {hasBanner && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">Баннерын мэдээлэл</h3>
          
          {hasTextConfig && (
            <div className="space-y-4 mb-4 bg-slate-50/80 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-800">Текстийн тохиргоо</h4>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="showBannerText" id="showBannerText" checked={showBannerText} onChange={(e) => setShowBannerText(e.target.checked)} className="rounded border-gray-300 text-[#4F46E5] focus:ring-[#4F46E5] w-4 h-4" />
                  <span className="text-sm font-medium">Текст харуулах</span>
                </label>
              </div>
              
              {showBannerText && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  <div className="space-y-2 col-span-2">
                    <label htmlFor="bannerText" className="text-sm font-medium">Текст (хоосон бол Гарчиг гарна)</label>
                    <Input id="bannerText" name="bannerText" defaultValue={initialData?.bannerText || ""} placeholder="Онцгой санал..." />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="bannerTextColor" className="text-sm font-medium">Текстийн өнгө</label>
                    <div className="flex items-center gap-2">
                      <Input type="color" id="bannerTextColor" name="bannerTextColor" defaultValue={initialData?.bannerTextColor || "#FFFFFF"} className="w-12 p-1 h-10" />
                      <span className="text-xs text-gray-500">HEX өнгө</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="bannerTextSize" className="text-sm font-medium">Хэмжээ</label>
                    <select id="bannerTextSize" name="bannerTextSize" defaultValue={initialData?.bannerTextSize || "LARGE"} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30">
                      <option value="SMALL">Жижиг</option>
                      <option value="MEDIUM">Дунд</option>
                      <option value="LARGE">Том</option>
                      <option value="XLARGE">Хэт том</option>
                    </select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label htmlFor="bannerTextPosition" className="text-sm font-medium">Байрлал</label>
                    <select id="bannerTextPosition" name="bannerTextPosition" defaultValue={initialData?.bannerTextPosition || "TOP_LEFT"} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30">
                      <option value="TOP_LEFT">Зүүн дээд</option>
                      <option value="TOP_CENTER">Гол дээд</option>
                      <option value="TOP_RIGHT">Баруун дээд</option>
                      <option value="CENTER_LEFT">Зүүн гол</option>
                      <option value="CENTER">Тэг дунд</option>
                      <option value="CENTER_RIGHT">Баруун гол</option>
                      <option value="BOTTOM_LEFT">Зүүн доод</option>
                      <option value="BOTTOM_CENTER">Гол доод</option>
                      <option value="BOTTOM_RIGHT">Баруун доод</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Баннер зураг</label>
              <GenericImageUploader name="bannerImageUrl" defaultValue={initialData?.bannerImageUrl || ""} folder="homepage" />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="bannerPosition" className="text-sm font-medium">Баннерын байрлал</label>
              <select id="bannerPosition" name="bannerPosition" defaultValue={initialData?.bannerPosition || "LEFT"} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30">
                <option value="LEFT">Зүүн талд</option>
                <option value="RIGHT">Баруун талд</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="bannerLink" className="text-sm font-medium">Баннер үсрэх линк</label>
            <Input id="bannerLink" name="bannerLink" defaultValue={initialData?.bannerLink || ""} placeholder="Ж: /shop?sale=true" />
          </div>
        </div>
      )}

      {/* 4. Цаг болон харагдах байдал */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">Цаг хугацаа ба Харагдах тохиргоо</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="startDate" className="text-sm font-medium">Эхлэх огноо (Сонголттой)</label>
            <Input type="datetime-local" id="startDate" name="startDate" defaultValue={initialData?.startDate ? new Date(initialData.startDate).toISOString().slice(0, 16) : ""} />
          </div>
          <div className="space-y-2">
            <label htmlFor="endDate" className="text-sm font-medium">Дуусах огноо (Сонголттой)</label>
            <Input type="datetime-local" id="endDate" name="endDate" defaultValue={initialData?.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : ""} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="visibilityTarget" className="text-sm font-medium">Хэнд харагдах</label>
            <select id="visibilityTarget" name="visibilityTarget" defaultValue={initialData?.visibilityTarget || "ALL"} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30">
              <option value="ALL">Бүх хүнд</option>
              <option value="LOGGED_IN_ONLY">Зөвхөн нэвтэрсэн хүнд</option>
              <option value="GUEST_ONLY">Зөвхөн нэвтрээгүй хүнд</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="deviceTarget" className="text-sm font-medium">Төхөөрөмж</label>
            <select id="deviceTarget" name="deviceTarget" defaultValue={initialData?.deviceTarget || "ALL"} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30">
              <option value="ALL">Бүгд (Утас + PC)</option>
              <option value="MOBILE_ONLY">Зөвхөн гар утас</option>
              <option value="DESKTOP_ONLY">Зөвхөн компьютер</option>
            </select>
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full bg-[#4F46E5] text-white hover:bg-[#4338ca] mt-6">{submitLabel}</Button>
    </ActionForm>
  )
}

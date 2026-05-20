"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2, Upload, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { Switch } from "@/components/ui/switch"

import { SystemUpdateCard } from "@/components/admin/SystemUpdateCard"
import { Role } from "@prisma/client"

interface Props {
  initialSettings: Record<string, string>
  userRole?: Role
}

export function GeneralSettingsClient({ initialSettings, userRole }: Props) {
  const router = useRouter()
  
  const [shopName, setShopName] = useState(initialSettings["shop_name"] || "Билэг Супермаркет")
  const [logoUrl, setLogoUrl] = useState(initialSettings["site_logo"] || "")
  // Default to true if not explicitly set to "false"
  const [showHeroText, setShowHeroText] = useState(initialSettings["hero_text_visible"] !== "false")
  
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(initialSettings["maintenance_mode"] === "true")
  const [phoneVerificationEnabled, setPhoneVerificationEnabled] = useState(initialSettings["phone_verification_enabled"] !== "false")
  
  const [heroBgColor, setHeroBgColor] = useState(initialSettings["hero_bg_color"] || "#5442cc")
  
  // Delivery schedule days
  const [deliveryScheduleDays, setDeliveryScheduleDays] = useState<number[]>(() => {
    const str = initialSettings["delivery_schedule_days"] || "3,6"
    return str.split(",").map(Number).filter(n => !isNaN(n))
  })

  const DAY_NAMES = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"]

  const initialCarouselStr = initialSettings["hero_carousel_images"]
  const [carouselImages, setCarouselImages] = useState<string[]>(
    initialCarouselStr ? JSON.parse(initialCarouselStr) : []
  )

  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [promoTitle, setPromoTitle] = useState(initialSettings["promo_title"] || "СУПЕР ХЯМДРАЛ")
  const [promoSubtitle, setPromoSubtitle] = useState(initialSettings["promo_subtitle"] || "Зөвхөн өнөөдөр")
  const [promoLink, setPromoLink] = useState(initialSettings["promo_link"] || "/shop?sale=true")

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/admin/settings/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Унших үед алдаа гарлаа")

      setLogoUrl(data.url)
      toast.success("Зураг хуулагдлаа. 'Хадгалах' товчийг дарна уу.")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsUploading(false)
    }
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      // Save shop name
      const resName = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "shop_name", value: shopName }),
      })
      if (!resName.ok) throw new Error("Дэлгүүрийн нэр хадгалахад алдаа гарлаа")

      // Save logo
      const resLogo = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "site_logo", value: logoUrl }),
      })
      if (!resLogo.ok) throw new Error("Лого хадгалахад алдаа гарлаа")

      // Save hero text visibility
      const resHero = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "hero_text_visible", value: showHeroText ? "true" : "false" }),
      })
      if (!resHero.ok) throw new Error("Нүүрний текстийн тохиргоо хадгалахад алдаа гарлаа")

      // Save maintenance mode
      const resMaint = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "maintenance_mode", value: isMaintenanceMode ? "true" : "false" }),
      })
      if (!resMaint.ok) throw new Error("Засварын горим хадгалахад алдаа гарлаа")
      
      // Save phone verification toggle
      const resPhone = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "phone_verification_enabled", value: phoneVerificationEnabled ? "true" : "false" }),
      })
      if (!resPhone.ok) throw new Error("Утас баталгаажуулалтын тохиргоо хадгалахад алдаа гарлаа")

      // Save hero bg color
      const resColor = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "hero_bg_color", value: heroBgColor }),
      })
      if (!resColor.ok) throw new Error("Арын өнгө хадгалахад алдаа гарлаа")

      // Save delivery schedule days
      const resSchedule = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "delivery_schedule_days", value: deliveryScheduleDays.join(",") }),
      })
      if (!resSchedule.ok) throw new Error("Хүргэлтийн хуваарь хадгалахад алдаа гарлаа")

      // Save carousel images
      const resCarousel = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "hero_carousel_images", value: JSON.stringify(carouselImages) }),
      })
      if (!resCarousel.ok) throw new Error("Carousel хадгалахад алдаа гарлаа")

      // Save promo settings
      await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "promo_title", value: promoTitle }) })
      await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "promo_subtitle", value: promoSubtitle }) })
      await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "promo_link", value: promoLink }) })

      toast.success("Тохиргоонууд хадгалагдлаа")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Shop Name */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Дэлгүүрийн нэр</CardTitle>
          <CardDescription>
            Browser tab, footer, мэдэгдлүүд дээр гарч ирэх дэлгүүрийн нэр.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            type="text"
            value={shopName}
            onChange={e => setShopName(e.target.value)}
            placeholder="Билэг Супермаркет"
            className="w-full max-w-md px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e63946]/30 focus:border-[#e63946]/50"
          />
        </CardContent>
      </Card>

      {/* Logo */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Сайтын Лого</CardTitle>
          <CardDescription>
            Сайтын зүүн дээд буланд байрлах үндсэн лого. (Хэмжээ нь 16:9 эсвэл 1:1 харьцаатай байвал тохиромжтой)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-32 h-32 shrink-0 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50 relative overflow-hidden group">
              {logoUrl ? (
                <>
                  <Image src={logoUrl} alt="Лого" fill className="object-contain p-2" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-white opacity-80" />
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <span className="text-xs text-slate-500">Лого байхгүй</span>
                </div>
              )}
              
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-700">Шинэ лого оруулах</h4>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Зурган дээр дарж шинэ зураг оруулна уу. Лого хуулагдсаны дараа Хадгалах товчийг дарж баталгаажуулна. PNG, JPG өргөтгэлтэй, дээд тал нь 5MB зураг оруулна уу.
              </p>
              {isUploading && (
                <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium mt-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Хуулж байна...
                </div>
              )}
            </div>
          </div>
          
          <div className="pt-6 border-t border-slate-100 space-y-4 flex flex-col items-start">
            <div className="w-full flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-base font-semibold text-slate-800">Нүүр хуудасны текст</label>
                <p className="text-sm text-slate-500">
                  Сайтын хамгийн эхэнд байрлах том текстийг (уриа үг) нуух эсвэл харуулах
                </p>
              </div>
              <Switch 
                checked={showHeroText} 
                onCheckedChange={setShowHeroText} 
              />
            </div>

            <div className="w-full pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-base font-semibold text-slate-800">Сайтыг түр хаах (Засвартай горим)</label>
                <p className="text-sm text-slate-500">
                  Идэвхжүүлсэн үед хэрэглэгчдэд "Түр засвартай" гэсэн хуудас харагдах ба худалдан авалт хийх боломжгүй болно.
                </p>
              </div>
              <Switch 
                checked={isMaintenanceMode} 
                onCheckedChange={setIsMaintenanceMode} 
              />
            </div>

            <div className="w-full pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-base font-semibold text-slate-800">📱 Утасны дугаар баталгаажуулах (Verify.mn)</label>
                <p className="text-sm text-slate-500">
                  Сагс болон захиалга хянах хэсэгт утасны дугаарыг SMS-ээр баталгаажуулах эсэх
                </p>
              </div>
              <Switch 
                checked={phoneVerificationEnabled} 
                onCheckedChange={setPhoneVerificationEnabled} 
              />
            </div>

            <div className="w-full pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-base font-semibold text-slate-800">Арын өнгө (Background Color)</label>
                <p className="text-sm text-slate-500">
                  Нүүр хуудасны хөдөлгөөнтэй арын фон өнгийг сонгох
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full border border-slate-200 shadow-sm"
                  style={{ backgroundColor: heroBgColor }}
                />
                <input 
                  type="color" 
                  value={heroBgColor}
                  onChange={(e) => setHeroBgColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer rounded overflow-hidden" 
                />
              </div>
            </div>

            <div className="w-full pt-4 border-t border-slate-100 space-y-3">
              <div className="space-y-0.5">
                <label className="text-base font-semibold text-slate-800">🚚 Хүргэлтийн Хуваарь</label>
                <p className="text-sm text-slate-500">
                  Хүргэлт ямар гарагуудад гарахыг сонгоно уу. Хэрэглэгчдэд энэ мэдээлэл автоматаар харагдана.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {DAY_NAMES.map((name, idx) => {
                  const isActive = deliveryScheduleDays.includes(idx)
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDeliveryScheduleDays(prev =>
                          isActive ? prev.filter(d => d !== idx) : [...prev, idx].sort()
                        )
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                        isActive
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                      }`}
                    >
                      {name}
                    </button>
                  )
                })}
              </div>
              {deliveryScheduleDays.length === 0 && (
                <p className="text-xs text-amber-600 font-medium">⚠️ Хүргэлтийн өдөр сонгогдоогүй байна!</p>
              )}
            </div>

            <div className="w-full pt-4 border-t border-slate-100 space-y-4">
              <div className="space-y-0.5">
                <label className="text-base font-semibold text-slate-800">Carousel зургууд (Слайд)</label>
                <p className="text-sm text-slate-500">
                  Нүүр хуудсанд текстийн оронд буюу нийтдээ харагдах слайд зургуудыг энд оруулна.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 items-center">
                {carouselImages.map((img, idx) => (
                  <div key={idx} className="relative w-32 h-20 rounded-lg overflow-hidden border border-slate-200 group">
                    <Image src={img} alt={`Slide ${idx}`} fill className="object-cover" />
                    <button 
                      onClick={() => setCarouselImages(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity shadow-sm z-10 text-xs font-bold hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
                
                <div className="relative w-32 h-20 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setIsUploading(true)
                      const formData = new FormData()
                      formData.append("file", file)
                      try {
                        const res = await fetch("/api/admin/settings/upload", { method: "POST", body: formData })
                        const data = await res.json()
                        if (!res.ok) throw new Error(data.error)
                        setCarouselImages(prev => [...prev, data.url])
                      } catch (error: any) {
                        toast.error(error.message)
                      } finally {
                        setIsUploading(false)
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={isUploading}
                  />
                  <div className="text-center text-slate-400">
                    <Upload className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-[10px] font-semibold uppercase">Оруулах</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div className="space-y-0.5">
              <label className="text-base font-semibold text-slate-800">"СУПЕР ХЯМДРАЛ" Баннер (Promo Slider)</label>
              <p className="text-sm text-slate-500">
                Нүүр хуудасны хямдралтай барааны хажуудах онцгой саналын текстийг солих
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Том Гарчиг</label>
                <input
                  type="text"
                  value={promoTitle}
                  onChange={e => setPromoTitle(e.target.value)}
                  placeholder="СУПЕР ХЯМДРАЛ"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Дэд Гарчиг</label>
                <input
                  type="text"
                  value={promoSubtitle}
                  onChange={e => setPromoSubtitle(e.target.value)}
                  placeholder="Зөвхөн өнөөдөр"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Холбоос (Линк)</label>
                <input
                  type="text"
                  value={promoLink}
                  onChange={e => setPromoLink(e.target.value)}
                  placeholder="/shop?sale=true"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 border-t border-slate-100 flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isUploading || isSaving}
            className="bg-[#4e3dc7] hover:bg-indigo-700 text-white shadow-sm font-medium px-6"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Хадгалах
          </Button>
        </CardFooter>
      </Card>

      {userRole === "DATAADMIN" && <SystemUpdateCard />}
    </div>
  )
}

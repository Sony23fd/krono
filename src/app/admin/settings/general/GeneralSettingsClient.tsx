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

  // Delivery Fees
  const [deliveryThreshold, setDeliveryThreshold] = useState(initialSettings["delivery_threshold"] || "50000")
  const [deliveryFeeBelow, setDeliveryFeeBelow] = useState(initialSettings["delivery_fee_below_threshold"] || "8000")
  const [deliveryFeeAbove, setDeliveryFeeAbove] = useState(initialSettings["delivery_fee_above_threshold"] || "5000")

  // Map Images
  const [mapNewDarkhan, setMapNewDarkhan] = useState(initialSettings["map_new_darkhan"] || "")
  const [mapOldDarkhan, setMapOldDarkhan] = useState(initialSettings["map_old_darkhan"] || "")

  const DAY_NAMES = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"]

  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [loyaltyDiscountPercent, setLoyaltyDiscountPercent] = useState(initialSettings["loyalty_discount_percent"] || "3")

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

  async function handleMapUpload(e: React.ChangeEvent<HTMLInputElement>, type: "NEW" | "OLD") {
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

      if (type === "NEW") {
        setMapNewDarkhan(data.url)
      } else {
        setMapOldDarkhan(data.url)
      }
      toast.success("Зураг амжилттай хуулагдлаа. 'Хадгалах' товчийг дарж баталгаажуулна уу.")
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

      // Save conditional delivery fees
      await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "delivery_threshold", value: deliveryThreshold }) })
      await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "delivery_fee_below_threshold", value: deliveryFeeBelow }) })
      await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "delivery_fee_above_threshold", value: deliveryFeeAbove }) })

      // Save loyalty settings
      await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "loyalty_discount_percent", value: loyaltyDiscountPercent }) })

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
            className="w-full max-w-md px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F26522]/30 focus:border-[#F26522]/50"
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

            <div className="w-full pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5 flex-1">
                <label className="text-base font-semibold text-slate-800">💳 Хөнгөлөлтийн хувь (Loyalty)</label>
                <p className="text-sm text-slate-500">
                  Хэрэглэгч сагсны хуудсанд хөнгөлөлтийн карт оруулбал нийт дүнгээс хасагдах хөнгөлөлтийн хувь.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  value={loyaltyDiscountPercent} 
                  onChange={(e) => setLoyaltyDiscountPercent(e.target.value)} 
                  className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm text-center"
                />
                <span className="text-slate-600 font-medium">%</span>
              </div>
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
              <div className="space-y-0.5 mb-2">
                <label className="text-base font-semibold text-slate-800">🚚 Хүргэлтийн үнийн нөхцөл</label>
                <p className="text-sm text-slate-500">
                  Сагсан дахь нийт дүнгээс хамааруулан хүргэлтийн төлбөрийг өөр өөрөөр бодох тохиргоо.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Босго дүн (₮)</label>
                  <input
                    type="number"
                    value={deliveryThreshold}
                    onChange={e => setDeliveryThreshold(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Босгоос доош үед (₮)</label>
                  <input
                    type="number"
                    value={deliveryFeeBelow}
                    onChange={e => setDeliveryFeeBelow(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Босгоос дээш үед (₮)</label>
                  <input
                    type="number"
                    value={deliveryFeeAbove}
                    onChange={e => setDeliveryFeeAbove(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
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

      <Card className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 pt-5">
          <CardTitle className="text-lg font-bold text-slate-800">Бүсчлэлийн газрын зураг</CardTitle>
          <CardDescription>Шинэ болон Хуучин Дархан бүсийн газрын зургийг оруулах. Хэрэглэгч бүсээ сонгохдоо эдгээр зургийг харах болно.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-800">Шинэ Дархан газрын зураг</h4>
              <div className="relative w-full aspect-video rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors group flex items-center justify-center">
                {mapNewDarkhan ? (
                  <img src={mapNewDarkhan} alt="Шинэ Дархан" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-xs font-medium">Зураг оруулах</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-bold text-sm bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-sm flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Өөрчлөх
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => handleMapUpload(e, "NEW")}
                  disabled={isUploading}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-800">Хуучин Дархан газрын зураг</h4>
              <div className="relative w-full aspect-video rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors group flex items-center justify-center">
                {mapOldDarkhan ? (
                  <img src={mapOldDarkhan} alt="Хуучин Дархан" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-xs font-medium">Зураг оруулах</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-bold text-sm bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-sm flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Өөрчлөх
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => handleMapUpload(e, "OLD")}
                  disabled={isUploading}
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

import { Button } from "@/components/ui/button"
import { Plus, Image as ImageIcon } from "lucide-react"
import { getBanners, createBanner } from "@/app/actions/banner-actions"
import { Input } from "@/components/ui/input"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet"
import { ActionForm } from "@/components/admin/ActionForm"
import { GenericImageUploader } from "@/components/admin/GenericImageUploader"
import { BannerTableClient } from "./BannerTableClient"

import Link from "next/link"

export default async function BannersPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const params = await searchParams;
  let currentType = "HERO";
  if (params.type === "THIN") currentType = "THIN";
  else if (params.type === "POPUP") currentType = "POPUP";
  
  const { banners, success } = await getBanners(currentType);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-[#4F46E5]" /> Баннер удирдах
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Дэлгүүрийн нүүр хуудсанд гарах үндсэн болон нарийн баннеруудыг удирдах хэсэг.
          </p>
        </div>
        <Sheet>
          <SheetTrigger className="inline-flex items-center justify-center rounded-lg bg-[#4F46E5] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 hover:bg-[#4338ca] transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            Шинэ баннер
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Шинэ баннер нэмэх</SheetTitle>
            </SheetHeader>
            <ActionForm action={async (formData) => {
              "use server"
              const title = formData.get("title") as string;
              const imageUrl = formData.get("imageUrl") as string;
              const linkUrl = formData.get("linkUrl") as string;
              const type = formData.get("type") as string;
              const showTitle = formData.get("showTitle") === "on";
              const titleColor = formData.get("titleColor") as string || "#FFFFFF";
              const titlePosition = formData.get("titlePosition") as string || "CENTER";
              const titleSize = formData.get("titleSize") as string || "LARGE";
              if (imageUrl) return await createBanner({ 
                title, imageUrl, linkUrl, type,
                showTitle, titleColor, titlePosition, titleSize
              });
              return { success: false, error: "Зургийн URL заавал оруулна уу" }
            }} className="space-y-4 mt-6" successMessage="Баннер үүсгэлээ">
              <input type="hidden" name="type" value={currentType} />
              <div className="space-y-2">
                <label className="text-sm font-medium">Зураг *</label>
                <GenericImageUploader name="imageUrl" folder="banners" required />
                <p className="text-[11px] text-slate-400">Баннерын зураг (Хэмжээ 1920x600px байвал тохиромжтой)</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">Гарчиг (Заавал биш)</label>
                <Input id="title" name="title" placeholder="Ж: Хаврын хямдрал" />
              </div>
              <div className="space-y-2">
                <label htmlFor="linkUrl" className="text-sm font-medium">Үсрэх линк (Заавал биш)</label>
                <Input id="linkUrl" name="linkUrl" placeholder="Ж: /category/electronics" />
                <p className="text-[11px] text-slate-400">Баннер дээр дарах үед очих хуудасны линк.</p>
              </div>

              {/* Text Config */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">Текст тохиргоо</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="showTitle" id="showTitle" defaultChecked className="rounded border-gray-300 text-[#4F46E5] focus:ring-[#4F46E5] w-4 h-4" />
                    <span className="text-sm font-medium">Гарчиг харуулах</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="titleColor" className="text-sm font-medium">Өнгө</label>
                    <div className="flex items-center gap-2">
                      <Input type="color" id="titleColor" name="titleColor" defaultValue="#FFFFFF" className="w-12 p-1 h-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="titleSize" className="text-sm font-medium">Хэмжээ</label>
                    <select id="titleSize" name="titleSize" defaultValue="LARGE" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30">
                      <option value="SMALL">Жижиг</option>
                      <option value="MEDIUM">Дунд</option>
                      <option value="LARGE">Том</option>
                      <option value="XLARGE">Хэт том</option>
                    </select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label htmlFor="titlePosition" className="text-sm font-medium">Байрлал</label>
                    <select id="titlePosition" name="titlePosition" defaultValue="CENTER" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30">
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
              </div>

              <Button type="submit" className="w-full bg-[#4F46E5] text-white hover:bg-[#4338ca]">Үүсгэх</Button>
            </ActionForm>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200">
        <Link href="?type=HERO" className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${currentType === 'HERO' ? 'border-[#4F46E5] text-[#4F46E5]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Үндсэн баннер (Том)
        </Link>
        <Link href="?type=THIN" className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${currentType === 'THIN' ? 'border-[#4F46E5] text-[#4F46E5]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Нарийн баннер
        </Link>
        <Link href="?type=POPUP" className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${currentType === 'POPUP' ? 'border-[#4F46E5] text-[#4F46E5]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Попап баннер
        </Link>
      </div>

      <BannerTableClient initialBanners={success ? banners : []} currentType={currentType} />
    </div>
  )
}

import { getHomePageSections, createHomePageSection } from "@/app/actions/homepage-section-actions"
import { getCategories } from "@/app/actions/category-actions"
import { LayoutDashboard, Plus } from "lucide-react"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet"
import { ActionForm } from "@/components/admin/ActionForm"
import { Input } from "@/components/ui/input"
import { GenericImageUploader } from "@/components/admin/GenericImageUploader"
import { Button } from "@/components/ui/button"
import { HomePageSectionTableClient } from "./HomePageSectionTableClient"

export default async function HomePageSectionsPage() {
  const [{ sections, success }, { categories }] = await Promise.all([
    getHomePageSections(),
    getCategories()
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-[#4F46E5]" /> Нүүр хуудасны хэсгүүд
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Нүүр хуудсанд харагдах бүтээгдэхүүний жагсаалт, онцгой санал зэрэг хэсгүүдийг удирдах.
          </p>
        </div>
        <Sheet>
          <SheetTrigger className="inline-flex items-center justify-center rounded-lg bg-[#4F46E5] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 hover:bg-[#4338ca] transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            Шинэ хэсэг үүсгэх
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Шинэ хэсэг нэмэх</SheetTitle>
            </SheetHeader>
            <ActionForm action={async (formData) => {
              "use server"
              const title = formData.get("title") as string;
              const type = formData.get("type") as any;
              const categoryId = formData.get("categoryId") as string;
              const bannerImageUrl = formData.get("bannerImageUrl") as string;
              const bannerLink = formData.get("bannerLink") as string;
              const rowCount = parseInt(formData.get("rowCount") as string || "2", 10);
              const autoScroll = formData.get("autoScroll") === "on";
              const startDate = formData.get("startDate") ? new Date(formData.get("startDate") as string) : null;
              const endDate = formData.get("endDate") ? new Date(formData.get("endDate") as string) : null;
              const visibilityTarget = formData.get("visibilityTarget") as any;
              const deviceTarget = formData.get("deviceTarget") as any;
              const layoutVariant = formData.get("layoutVariant") as any;
              const bannerText = formData.get("bannerText") as string || null;
              const showBannerText = formData.get("showBannerText") === "on";
              const bannerTextColor = formData.get("bannerTextColor") as string || "#FFFFFF";
              const bannerTextPosition = formData.get("bannerTextPosition") as any;
              const bannerTextSize = formData.get("bannerTextSize") as any;
              
              if (!title) return { success: false, error: "Гарчиг заавал оруулна уу" }
              if (!type) return { success: false, error: "Төрөл заавал сонгоно уу" }

              return await createHomePageSection({ 
                title, 
                type, 
                categoryId, 
                bannerImageUrl, 
                bannerLink,
                rowCount,
                autoScroll,
                startDate,
                endDate,
                visibilityTarget,
                deviceTarget,
                layoutVariant,
                bannerText,
                showBannerText,
                bannerTextColor,
                bannerTextPosition,
                bannerTextSize
              });
            }} className="space-y-4 mt-6" successMessage="Хэсэг амжилттай үүсгэлээ">
              
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">Гарчиг *</label>
                <Input id="title" name="title" required placeholder="Ж: Онцлох бараа" />
              </div>

              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium">Төрөл *</label>
                <select id="type" name="type" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30">
                  <option value="PRODUCT_SLIDER">Энгийн слайдер (Зөвхөн бараанууд)</option>
                  <option value="PROMO_SLIDER">Онцгой санал (Хажуудаа баннертай)</option>
                  <option value="HERO_BANNER">Том баннер (Hero Slider)</option>
                  <option value="THIN_BANNER">Нарийн баннер (Thin Banner)</option>
                  <option value="CATEGORY_MENU">Ангиллын цэс (Story Style)</option>
                  <option value="HOW_IT_WORKS">Хэрхэн захиалах вэ? (How it works)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="categoryId" className="text-sm font-medium">Ангилал сонгох (Заавал биш)</label>
                <select id="categoryId" name="categoryId" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30">
                  <option value="">Бүх бараанаас (эсвэл тусгай)</option>
                  {categories?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">Хэрэв ангилал сонговол тухайн ангиллын бараанууд харагдана.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="rowCount" className="text-sm font-medium">Эгнээний тоо (Слайдеруудад)</label>
                  <select id="rowCount" name="rowCount" defaultValue="2" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30">
                    <option value="1">1 эгнээ (Урт)</option>
                    <option value="2">2 эгнээ (Давхарласан)</option>
                  </select>
                </div>

                <div className="space-y-2 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer h-10">
                    <input type="checkbox" name="autoScroll" id="autoScroll" className="rounded border-gray-300 text-[#4F46E5] focus:ring-[#4F46E5] w-4 h-4" />
                    <span className="text-sm font-medium">Автоматаар гүйх</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <label htmlFor="startDate" className="text-sm font-medium">Эхлэх огноо (Сонголттой)</label>
                  <Input type="datetime-local" id="startDate" name="startDate" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="endDate" className="text-sm font-medium">Дуусах огноо (Сонголттой)</label>
                  <Input type="datetime-local" id="endDate" name="endDate" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="visibilityTarget" className="text-sm font-medium">Хэнд харагдах</label>
                  <select id="visibilityTarget" name="visibilityTarget" defaultValue="ALL" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30">
                    <option value="ALL">Бүх хүнд</option>
                    <option value="LOGGED_IN_ONLY">Зөвхөн нэвтэрсэн хүнд</option>
                    <option value="GUEST_ONLY">Зөвхөн нэвтрээгүй хүнд</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="deviceTarget" className="text-sm font-medium">Төхөөрөмж</label>
                  <select id="deviceTarget" name="deviceTarget" defaultValue="ALL" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30">
                    <option value="ALL">Бүгд (Утас + PC)</option>
                    <option value="MOBILE_ONLY">Зөвхөн гар утас</option>
                    <option value="DESKTOP_ONLY">Зөвхөн компьютер</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="layoutVariant" className="text-sm font-medium">Загвар (Layout)</label>
                <select id="layoutVariant" name="layoutVariant" defaultValue="DEFAULT" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30">
                  <option value="DEFAULT">Үндсэн загвар (Default)</option>
                  <option value="GRID">Тор (Grid)</option>
                  <option value="MASONRY">Зөрүүтэй (Masonry)</option>
                </select>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-700">Баннерийн мэдээлэл (Зөвхөн "Онцгой санал" төрөлд харагдана)</h3>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Баннер зураг</label>
                <GenericImageUploader name="bannerImageUrl" folder="homepage" />
              </div>

              <div className="space-y-2">
                <label htmlFor="bannerLink" className="text-sm font-medium">Баннер үсрэх линк</label>
                <Input id="bannerLink" name="bannerLink" placeholder="Ж: /shop?sale=true" />
              </div>

              <Button type="submit" className="w-full bg-[#4F46E5] text-white hover:bg-[#4338ca] mt-4">Хадгалах</Button>
            </ActionForm>
          </SheetContent>
        </Sheet>
      </div>

      <HomePageSectionTableClient initialSections={sections || []} categories={categories || []} />
    </div>
  )
}

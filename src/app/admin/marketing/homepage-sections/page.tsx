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
              const type = formData.get("type") as "PRODUCT_SLIDER" | "PROMO_SLIDER";
              const categoryId = formData.get("categoryId") as string;
              const bannerImageUrl = formData.get("bannerImageUrl") as string;
              const bannerLink = formData.get("bannerLink") as string;
              
              if (!title) return { success: false, error: "Гарчиг заавал оруулна уу" }
              if (!type) return { success: false, error: "Төрөл заавал сонгоно уу" }

              return await createHomePageSection({ 
                title, 
                type, 
                categoryId, 
                bannerImageUrl, 
                bannerLink 
              });
            }} className="space-y-4 mt-6" successMessage="Хэсэг амжилттай үүсгэлээ" onSuccess={() => {
              window.location.reload()
            }}>
              
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">Гарчиг *</label>
                <Input id="title" name="title" required placeholder="Ж: Онцлох бараа" />
              </div>

              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium">Төрөл *</label>
                <select id="type" name="type" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30">
                  <option value="PRODUCT_SLIDER">Энгийн слайдер (Зөвхөн бараанууд)</option>
                  <option value="PROMO_SLIDER">Онцгой санал (Хажуудаа баннертай)</option>
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

              <div className="space-y-2 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-700">Баннерийн мэдээлэл (Зөвхөн "Онцгой санал" төрөлд харагдана)</h3>
              </div>

              <div className="space-y-2">
                <label htmlFor="bannerImageUrl" className="text-sm font-medium">Баннер зургийн URL</label>
                <Input id="bannerImageUrl" name="bannerImageUrl" placeholder="https://..." />
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

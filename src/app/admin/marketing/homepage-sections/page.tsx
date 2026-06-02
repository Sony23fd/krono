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
import { HomePageSectionForm } from "@/components/admin/marketing/HomePageSectionForm"
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
            <HomePageSectionForm 
              categories={categories || []}
              action={async (formData) => {
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
              const bannerPosition = formData.get("bannerPosition") as string || "LEFT";
              
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
                bannerTextSize,
                bannerPosition
              });
            }} />
          </SheetContent>
        </Sheet>
      </div>

      <HomePageSectionTableClient initialSections={sections || []} categories={categories || []} />
    </div>
  )
}

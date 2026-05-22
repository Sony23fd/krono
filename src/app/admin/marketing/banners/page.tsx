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
import { BannerTableClient } from "./BannerTableClient"

export default async function BannersPage() {
  const { banners, success } = await getBanners()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-[#4F46E5]" /> Нүүрний баннер
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Дэлгүүрийн нүүр хуудсанд гарах урамшуулал, онцлох баннеруудыг удирдах хэсэг.
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
              if (imageUrl) return await createBanner({ title, imageUrl, linkUrl });
              return { success: false, error: "Зургийн URL заавал оруулна уу" }
            }} className="space-y-4 mt-6" successMessage="Баннер үүсгэлээ">
              <div className="space-y-2">
                <label htmlFor="imageUrl" className="text-sm font-medium">Зургийн URL *</label>
                <Input id="imageUrl" name="imageUrl" required placeholder="https://..." />
                <p className="text-[11px] text-slate-400">Баннерын зургийн холбоосыг оруулна уу. (Хэмжээ 1920x600px байвал тохиромжтой)</p>
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
              <Button type="submit" className="w-full bg-[#4F46E5] text-white hover:bg-[#4338ca]">Үүсгэх</Button>
            </ActionForm>
          </SheetContent>
        </Sheet>
      </div>

      <BannerTableClient initialBanners={success ? banners : []} />
    </div>
  )
}

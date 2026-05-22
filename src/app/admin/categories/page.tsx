import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getCategories, createCategory } from "@/app/actions/category-actions"
import { Input } from "@/components/ui/input"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet"
import { ActionForm } from "@/components/admin/ActionForm"
import { CategoryTableClient } from "./CategoryTableClient"

export default async function OrderCategoriesPage() {
  const { categories, success } = await getCategories()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-3xl font-bold tracking-tight">Барааны ангилал</h1>
        <Sheet>
          <SheetTrigger className="inline-flex items-center justify-center rounded-md bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white hover:bg-[#4338ca]">
            <Plus className="w-4 h-4 mr-2" />
            Ангилал үүсгэх
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Шинэ ангилал нэмэх</SheetTitle>
            </SheetHeader>
            <ActionForm action={async (formData) => {
              "use server"
              const name = formData.get("name") as string;
              const imageUrl = formData.get("imageUrl") as string;
              const metaTitle = formData.get("metaTitle") as string;
              const metaDescription = formData.get("metaDescription") as string;
              if (name) return await createCategory({ name, imageUrl, metaTitle, metaDescription });
              return { success: false, error: "Нэр оруулна уу" }
            }} className="space-y-4 mt-6" successMessage="Ангилал үүсгэлээ">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Ангиллын нэр</label>
                <Input id="name" name="name" required placeholder="Ж: Электрон бараа" />
              </div>
              <div className="space-y-2">
                <label htmlFor="imageUrl" className="text-sm font-medium">Зургийн URL</label>
                <Input id="imageUrl" name="imageUrl" placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <label htmlFor="metaTitle" className="text-sm font-medium">SEO Title</label>
                <Input id="metaTitle" name="metaTitle" placeholder="Хайлтын гарчиг" />
              </div>
              <div className="space-y-2">
                <label htmlFor="metaDescription" className="text-sm font-medium">SEO Description</label>
                <Input id="metaDescription" name="metaDescription" placeholder="Хайлтын тайлбар" />
              </div>
              <Button type="submit" className="w-full bg-[#4F46E5] text-white hover:bg-[#4338ca]">Үүсгэх</Button>
            </ActionForm>
          </SheetContent>
        </Sheet>
      </div>

      <CategoryTableClient initialCategories={success ? categories : []} />
    </div>
  )
}


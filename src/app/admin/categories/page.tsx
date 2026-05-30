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
import { GenericImageUploader } from "@/components/admin/GenericImageUploader"
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
              const parentId = formData.get("parentId") as string;
              const displayName = formData.get("displayName") as string;
              if (name) return await createCategory({ 
                name, 
                imageUrl, 
                metaTitle, 
                metaDescription, 
                parentId: parentId || undefined, 
                displayName: displayName || undefined 
              });
              return { success: false, error: "Нэр оруулна уу" }
            }} className="space-y-4 mt-6" successMessage="Ангилал үүсгэлээ">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Ангиллын нэр (ERP код)</label>
                <Input id="name" name="name" required placeholder="Ж: Электрон бараа" />
                <p className="text-[10px] text-slate-500">Excel импортод энэ нэрийг ашиглана.</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="displayName" className="text-sm font-medium">Вэбсайт дээр харагдах нэр</label>
                <Input id="displayName" name="displayName" placeholder="Сонголттой (Хоосон бол ERP нэрээрээ харагдана)" />
              </div>
              <div className="space-y-2">
                <label htmlFor="parentId" className="text-sm font-medium">Эцэг ангилал (Дэд ангилал болгох)</label>
                <select
                  id="parentId"
                  name="parentId"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">-- Үндсэн ангилал --</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ангиллын зураг</label>
                <GenericImageUploader name="imageUrl" folder="categories" imageClassName="h-32" />
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


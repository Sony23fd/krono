import { Button } from "@/components/ui/button"
import { Plus, Eye, Edit2, Trash2 } from "lucide-react"
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/app/actions/category-actions"
import { Input } from "@/components/ui/input"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ActionForm } from "@/components/admin/ActionForm"

export default async function OrderCategoriesPage() {
  const { categories, success } = await getCategories()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-3xl font-bold tracking-tight">Захиалгын ангилал</h1>
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
              if (name) return await createCategory({ name });
              return { success: false, error: "Нэр оруулна уу" }
            }} className="space-y-4 mt-6" successMessage="Ангилал үүсгэлээ">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Ангиллын нэр</label>
                <Input id="name" name="name" required placeholder="Ж: 2026.03 сар" />
              </div>
              <div className="space-y-2">
                <label htmlFor="deliveryFee" className="text-sm font-medium">Хүргэлтийн үнэ (₮)</label>
                <Input id="deliveryFee" name="deliveryFee" type="number" defaultValue="0" />
              </div>
              <Button type="submit" className="w-full bg-[#4F46E5] text-white hover:bg-[#4338ca]">Үүсгэх</Button>
            </ActionForm>
          </SheetContent>
        </Sheet>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-white border-b text-xs uppercase text-slate-500 font-medium whitespace-nowrap">
            <tr>
              <th className="px-6 py-4 font-normal">Нэр</th>
              <th className="px-6 py-4 font-normal">Хүргэлтийн үнэ</th>
              <th className="px-6 py-4 font-normal">Үүсгэсэн</th>
              <th className="px-6 py-4 font-normal">Өөрчлөгдсөн</th>
              <th className="px-6 py-4 font-normal text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y relative">
            {success && categories && categories.length > 0 ? (
              categories.map((cat: any) => (
                <tr key={cat.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-slate-900">{cat.name}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {Number(cat.deliveryFee || 0).toLocaleString()} ₮
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(cat.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(cat.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    <Dialog>
                      <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 text-amber-500">
                        <Edit2 className="w-4 h-4" />
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Ангилал засах</DialogTitle>
                        </DialogHeader>
                        <ActionForm action={async (formData) => {
                          "use server"
                          const { updateCategory } = await import("@/app/actions/category-actions")
                          const id = formData.get("id") as string
                          const name = formData.get("name") as string
                          const deliveryFee = formData.get("deliveryFee") as string
                          if (id && name) return await updateCategory(id, { name, deliveryFee: Number(deliveryFee) || 0 } as any)
                          return { success: false, error: "Мэдээлэл дутуу байна" }
                        }} className="space-y-4" successMessage="Амжилттай заслаа">
                          <input type="hidden" name="id" value={cat.id} />
                          <div className="space-y-2">
                            <label htmlFor={`edit-name-${cat.id}`} className="text-sm font-medium">Ангиллын нэр</label>
                            <Input key={`name-${cat.id}-${cat.name}`} id={`edit-name-${cat.id}`} name="name" defaultValue={cat.name || ""} required />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor={`edit-fee-${cat.id}`} className="text-sm font-medium">Хүргэлтийн үнэ (₮)</label>
                            <Input key={`fee-${cat.id}-${cat.deliveryFee}`} id={`edit-fee-${cat.id}`} name="deliveryFee" type="number" defaultValue={cat.deliveryFee?.toString() ?? "0"} />
                          </div>
                          <DialogFooter>
                            <Button type="submit" className="bg-[#4F46E5] hover:bg-[#4338ca] text-white">Хадгалах</Button>
                          </DialogFooter>
                        </ActionForm>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Ангилал устгах</DialogTitle>
                          <DialogDescription>
                            Та "{cat.name}" ангиллыг устгахдаа итгэлтэй байна уу?
                          </DialogDescription>
                        </DialogHeader>
                        <ActionForm action={async (formData) => {
                          "use server"
                          const { deleteCategory } = await import("@/app/actions/category-actions")
                          const id = formData.get("id") as string
                          if (id) return await deleteCategory(id)
                          return { success: false, error: "Алдаа гарлаа" }
                        }} successMessage="Амжилттай устгагдлаа">
                          <input type="hidden" name="id" value={cat.id} />
                          <DialogFooter className="mt-4">
                            <Button type="submit" variant="destructive">Тийм, устгах</Button>
                          </DialogFooter>
                        </ActionForm>
                      </DialogContent>
                    </Dialog>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  Одоогоор ангилал нэмэгдээгүй байна.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

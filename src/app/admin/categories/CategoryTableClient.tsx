"use client"

import { useState } from "react"
import { Edit2, Trash2, GripVertical, ImagePlus } from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { updateCategoryOrder } from "@/app/actions/category-actions"
import { CategoryExcelImport } from "@/components/admin/CategoryExcelImport"
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function CategoryTableClient({ initialCategories }: { initialCategories: any[] }) {
  const [categories, setCategories] = useState(initialCategories)

  const onDragEnd = async (result: any) => {
    if (!result.destination) return
    const items = Array.from(categories)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update state immediately
    const updatedItems = items.map((item, index) => ({ ...item, sortOrder: index }))
    setCategories(updatedItems)

    // Sync to DB
    const orderData = updatedItems.map(i => ({ id: i.id, sortOrder: i.sortOrder }))
    await updateCategoryOrder(orderData)
  }

  // Sync state if props change (e.g. after create/delete)
  if (initialCategories !== categories && !categories.every((cat, i) => cat.id === initialCategories[i]?.id)) {
      setCategories(initialCategories)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-white border-b text-xs uppercase text-slate-500 font-medium whitespace-nowrap">
          <tr>
            <th className="w-10 px-4 py-4"></th>
            <th className="px-6 py-4 font-normal">Зураг</th>
            <th className="px-6 py-4 font-normal">Нэр</th>
            <th className="px-6 py-4 font-normal text-center">Барааны тоо</th>
            <th className="px-6 py-4 font-normal">Үүсгэсэн</th>
            <th className="px-6 py-4 font-normal text-right">Үйлдэл</th>
          </tr>
        </thead>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="categories-list">
            {(provided) => (
              <tbody 
                className="divide-y relative" 
                {...provided.droppableProps} 
                ref={provided.innerRef}
              >
                {categories && categories.length > 0 ? (
                  categories.map((cat, index) => (
                    <Draggable key={cat.id} draggableId={cat.id} index={index}>
                      {(provided, snapshot) => (
                        <tr 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`hover:bg-slate-50/50 transition-colors ${snapshot.isDragging ? 'bg-indigo-50/80 shadow-md' : ''}`}
                        >
                          <td className="px-4 py-4 w-10">
                            <div 
                              {...provided.dragHandleProps}
                              className="p-1.5 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing rounded"
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {cat.imageUrl ? (
                              <img src={cat.imageUrl} alt={cat.name} className="w-10 h-10 object-cover rounded-md border" />
                            ) : (
                              <div className="w-10 h-10 bg-slate-100 border border-dashed border-slate-300 rounded-md flex items-center justify-center text-slate-400">
                                <ImagePlus className="w-4 h-4" />
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-900">{cat.name}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full text-[11px]">
                              {cat._count?.products || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {new Date(cat.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                            <CategoryExcelImport categoryId={cat.id} categoryName={cat.name} />
                            
                            <Dialog>
                              <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 text-amber-500">
                                <Edit2 className="w-4 h-4" />
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Ангилал засах</DialogTitle>
                                </DialogHeader>
                                <ActionForm action={async (formData) => {
                                  const { updateCategory } = await import("@/app/actions/category-actions")
                                  const id = formData.get("id") as string
                                  const name = formData.get("name") as string
                                  const imageUrl = formData.get("imageUrl") as string
                                  const metaTitle = formData.get("metaTitle") as string
                                  const metaDescription = formData.get("metaDescription") as string
                                  if (id && name) return await updateCategory(id, { name, imageUrl, metaTitle, metaDescription })
                                  return { success: false, error: "Мэдээлэл дутуу байна" }
                                }} className="space-y-4" successMessage="Амжилттай заслаа">
                                  <input type="hidden" name="id" value={cat.id} />
                                  <div className="space-y-2">
                                    <label htmlFor={`edit-name-${cat.id}`} className="text-sm font-medium">Ангиллын нэр</label>
                                    <Input key={`name-${cat.id}-${cat.name}`} id={`edit-name-${cat.id}`} name="name" defaultValue={cat.name || ""} required />
                                  </div>
                                  <div className="space-y-2">
                                    <label htmlFor={`edit-img-${cat.id}`} className="text-sm font-medium">Зургийн URL (Image URL)</label>
                                    <Input key={`img-${cat.id}-${cat.imageUrl}`} id={`edit-img-${cat.id}`} name="imageUrl" defaultValue={cat.imageUrl || ""} placeholder="https://..." />
                                  </div>
                                  <div className="space-y-2">
                                    <label htmlFor={`edit-metaTitle-${cat.id}`} className="text-sm font-medium">SEO Title</label>
                                    <Input key={`metaTitle-${cat.id}-${cat.metaTitle}`} id={`edit-metaTitle-${cat.id}`} name="metaTitle" defaultValue={cat.metaTitle || ""} placeholder="Хайлтын гарчиг" />
                                  </div>
                                  <div className="space-y-2">
                                    <label htmlFor={`edit-metaDesc-${cat.id}`} className="text-sm font-medium">SEO Description</label>
                                    <Input key={`metaDesc-${cat.id}-${cat.metaDescription}`} id={`edit-metaDesc-${cat.id}`} name="metaDescription" defaultValue={cat.metaDescription || ""} placeholder="Хайлтын тайлбар" />
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
                      )}
                    </Draggable>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      Одоогоор ангилал нэмэгдээгүй байна.
                    </td>
                  </tr>
                )}
                {provided.placeholder}
              </tbody>
            )}
          </Droppable>
        </DragDropContext>
      </table>
    </div>
  )
}

"use client"

import { useState, useMemo, useEffect } from "react"
import { Edit2, Trash2, GripVertical, ImagePlus } from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { updateCategoryOrder } from "@/app/actions/category-actions"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CategoryExcelImport } from "@/components/admin/CategoryExcelImport"
import { CategoryProductsSheet } from "./CategoryProductsSheet"
import { GenericImageUploader } from "@/components/admin/GenericImageUploader"
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
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Sync state if props change (e.g. after create/delete)
  if (initialCategories !== categories && !categories.every((cat, i) => cat.id === initialCategories[i]?.id)) {
      setCategories(initialCategories)
  }

  // Hierarchically sort categories for display
  const sortedCategories = useMemo(() => {
    const parents = categories.filter(c => !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
    const result: any[] = [];
    for (const parent of parents) {
      result.push(parent);
      const children = categories.filter(c => c.parentId === parent.id).sort((a, b) => a.sortOrder - b.sortOrder);
      for (const child of children) {
        result.push({ ...child, _isChild: true });
      }
    }
    // Also append any categories whose parent wasn't found (orphans)
    const processedIds = new Set(result.map(c => c.id));
    const orphans = categories.filter(c => !processedIds.has(c.id));
    return [...result, ...orphans];
  }, [categories]);

  const onDragEnd = async (result: any) => {
    if (!result.destination) return
    
    // We update the original categories array to match the new sorted order
    const items = Array.from(sortedCategories)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update state immediately
    const updatedItems = items.map((item, index) => ({ ...item, sortOrder: index }))
    // We need to map back to the 'categories' state shape
    const cleanItems = updatedItems.map(item => {
      const { _isChild, ...rest } = item
      return rest
    })
    setCategories(cleanItems)

    // Sync to DB
    const orderData = cleanItems.map(i => ({ id: i.id, sortOrder: i.sortOrder }))
    await updateCategoryOrder(orderData)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-white border-b text-xs uppercase text-slate-500 font-medium whitespace-nowrap">
          <tr>
            <th className="w-10 px-4 py-4"></th>
            <th className="px-6 py-4 font-normal">Зураг</th>
            <th className="px-6 py-4 font-normal">Нэр / Дэд ангилал</th>
            <th className="px-6 py-4 font-normal text-center">Барааны тоо</th>
            <th className="px-6 py-4 font-normal">Үүсгэсэн</th>
            <th className="px-6 py-4 font-normal text-right">Үйлдэл</th>
          </tr>
        </thead>
        {!isMounted ? (
          <tbody className="divide-y relative">
            {sortedCategories && sortedCategories.length > 0 ? (
              sortedCategories.map((cat, index) => (
                <tr key={cat.id} className={`hover:bg-slate-50/50 transition-colors ${cat._isChild ? 'bg-slate-50/30' : ''}`}>
                  <td className="px-4 py-4 w-10">
                    <div className="p-1.5 text-slate-400 rounded"><GripVertical className="w-4 h-4" /></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-3 ${cat._isChild ? 'ml-6' : ''}`}>
                      {cat._isChild && <div className="w-4 h-4 border-l-2 border-b-2 border-slate-300 rounded-bl-md"></div>}
                      {cat.imageUrl ? <img src={cat.imageUrl} alt={cat.name} className="w-10 h-10 object-cover rounded-md border shrink-0" /> : <div className="w-10 h-10 bg-slate-100 border border-dashed border-slate-300 rounded-md flex items-center justify-center text-slate-400 shrink-0"><ImagePlus className="w-4 h-4" /></div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {cat.displayName ? (
                      <Link href={`/admin/products?category=${cat.id}`} className="flex flex-col hover:text-[#001f3f] transition-colors group">
                        <span className="group-hover:underline">{cat.displayName}</span>
                        <span className="text-xs text-slate-400 font-normal mt-0.5 group-hover:text-slate-600">({cat.name})</span>
                      </Link>
                    ) : (
                      <Link href={`/admin/products?category=${cat.id}`} className="hover:text-[#001f3f] hover:underline transition-colors block">
                        {cat.name}
                      </Link>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <CategoryProductsSheet categoryId={cat.id} categoryName={cat.name} productCount={cat._count?.products || 0} />
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(cat.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                    {/* Render static action buttons on server to avoid mismatch, interaction will happen after hydration */}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Одоогоор ангилал нэмэгдээгүй байна.</td></tr>
            )}
          </tbody>
        ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="categories-list">
            {(provided) => (
              <tbody 
                className="divide-y relative" 
                {...provided.droppableProps} 
                ref={provided.innerRef}
              >
                {sortedCategories && sortedCategories.length > 0 ? (
                  sortedCategories.map((cat, index) => (
                    <Draggable key={cat.id} draggableId={cat.id} index={index}>
                      {(provided, snapshot) => (
                        <tr 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`hover:bg-slate-50/50 transition-colors ${snapshot.isDragging ? 'bg-indigo-50/80 shadow-md' : ''} ${cat._isChild ? 'bg-slate-50/30' : ''}`}
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
                            <div className={`flex items-center gap-3 ${cat._isChild ? 'ml-6' : ''}`}>
                              {cat._isChild && (
                                <div className="w-4 h-4 border-l-2 border-b-2 border-slate-300 rounded-bl-md"></div>
                              )}
                              {cat.imageUrl ? (
                                <img src={cat.imageUrl} alt={cat.name} className="w-10 h-10 object-cover rounded-md border shrink-0" />
                              ) : (
                                <div className="w-10 h-10 bg-slate-100 border border-dashed border-slate-300 rounded-md flex items-center justify-center text-slate-400 shrink-0">
                                  <ImagePlus className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {cat.displayName ? (
                              <Link href={`/admin/products?category=${cat.id}`} className="flex flex-col hover:text-[#001f3f] transition-colors group w-fit">
                                <span className="group-hover:underline">{cat.displayName}</span>
                                <span className="text-xs text-slate-400 font-normal mt-0.5 group-hover:text-slate-600">({cat.name})</span>
                              </Link>
                            ) : (
                              <Link href={`/admin/products?category=${cat.id}`} className="hover:text-[#001f3f] hover:underline transition-colors block w-fit">
                                {cat.name}
                              </Link>
                            )}
                            {cat.parentId && (
                              <div className="text-xs text-indigo-500 font-normal mt-1 flex items-center gap-1">
                                <span>↳ Дэд ангилал:</span>
                                <Link href={`/admin/products?category=${cat.parentId}`} className="font-medium hover:underline hover:text-indigo-700">
                                  {categories.find(c => c.id === cat.parentId)?.name || "Тодорхойгүй"}
                                </Link>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <CategoryProductsSheet 
                              categoryId={cat.id} 
                              categoryName={cat.name} 
                              productCount={cat._count?.products || 0} 
                            />
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {new Date(cat.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                            <CategoryExcelImport categoryId={cat.id} categoryName={cat.name} />
                            
                            <Dialog open={editingCategoryId === cat.id} onOpenChange={(open) => setEditingCategoryId(open ? cat.id : null)}>
                              <DialogTrigger onClick={() => setEditingCategoryId(cat.id)} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 text-amber-500">
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
                                  const parentId = formData.get("parentId") as string
                                  const displayName = formData.get("displayName") as string
                                  if (id && name) return await updateCategory(id, { 
                                    name, 
                                    imageUrl, 
                                    metaTitle, 
                                    metaDescription, 
                                    parentId: parentId || null, 
                                    displayName: displayName || null 
                                  })
                                  return { success: false, error: "Мэдээлэл дутуу байна" }
                                }} className="space-y-4" successMessage="Амжилттай заслаа" onSuccess={() => { setEditingCategoryId(null); router.refresh(); }}>
                                  <input type="hidden" name="id" value={cat.id} />
                                  <div className="space-y-2">
                                    <label htmlFor={`edit-name-${cat.id}`} className="text-sm font-medium">Ангиллын нэр (ERP код)</label>
                                    <Input key={`name-${cat.id}-${cat.name}`} id={`edit-name-${cat.id}`} name="name" defaultValue={cat.name || ""} required />
                                    <p className="text-[10px] text-slate-500">Үүнийг өөрчилвөл Excel-тэй зөрнө!</p>
                                  </div>
                                  <div className="space-y-2">
                                    <label htmlFor={`edit-displayName-${cat.id}`} className="text-sm font-medium">Вэбсайт дээр харагдах нэр</label>
                                    <Input key={`displayName-${cat.id}-${cat.displayName}`} id={`edit-displayName-${cat.id}`} name="displayName" defaultValue={cat.displayName || ""} placeholder="Сонголттой (Хоосон бол ERP нэрээрээ харагдана)" />
                                  </div>
                                  <div className="space-y-2">
                                    <label htmlFor={`edit-parent-${cat.id}`} className="text-sm font-medium">Эцэг ангилал (Дэд ангилал болгох)</label>
                                    <select
                                      id={`edit-parent-${cat.id}`}
                                      name="parentId"
                                      defaultValue={cat.parentId || ""}
                                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    >
                                      <option value="">-- Үндсэн ангилал --</option>
                                      {categories.filter(c => c.id !== cat.id).map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Ангиллын зураг (Image)</label>
                                    <GenericImageUploader key={`img-${cat.id}-${cat.imageUrl}`} name="imageUrl" defaultValue={cat.imageUrl || ""} folder="categories" imageClassName="h-32" />
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

                            <Dialog open={deletingCategoryId === cat.id} onOpenChange={(open) => setDeletingCategoryId(open ? cat.id : null)}>
                              <DialogTrigger onClick={() => setDeletingCategoryId(cat.id)} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 text-red-500">
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
                                }} successMessage="Амжилттай устгагдлаа" onSuccess={() => { setDeletingCategoryId(null); router.refresh(); }}>
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
        )}
      </table>
    </div>
  )
}

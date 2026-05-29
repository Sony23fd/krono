"use client"

import { useState } from "react"
import { MoreHorizontal, Pencil, Trash2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { updateHomePageSection, deleteHomePageSection, updateHomePageSectionOrder } from "@/app/actions/homepage-section-actions"
import { SectionType } from "@prisma/client"
import { ActionForm } from "@/components/admin/ActionForm"
import { Input } from "@/components/ui/input"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type SectionWithCategory = {
  id: string
  title: string
  type: SectionType
  categoryId: string | null
  bannerImageUrl: string | null
  bannerLink: string | null
  isActive: boolean
  sortOrder: number
  rowCount: number
  autoScroll: boolean
  category: { id: string, name: string } | null
}

export function HomePageSectionTableClient({ 
  initialSections, 
  categories 
}: { 
  initialSections: SectionWithCategory[],
  categories: { id: string, name: string }[]
}) {
  const [sections, setSections] = useState(initialSections)
  const [editingSection, setEditingSection] = useState<SectionWithCategory | null>(null)

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setSections(items);
    
    // Save to DB
    const orderedIds = items.map(item => item.id);
    const res = await updateHomePageSectionOrder(orderedIds);
    if (!res.success) {
      toast.error("Дараалал хадгалахад алдаа гарлаа");
      setSections(initialSections); // revert on error
    } else {
      toast.success("Дараалал хадгалагдлаа");
    }
  };

  async function handleToggleStatus(id: string, currentStatus: boolean) {
    toast.promise(
      updateHomePageSection(id, { isActive: !currentStatus }),
      {
        loading: "Шинэчилж байна...",
        success: (result) => {
          if (result.success) {
            setSections(prev => prev.map(s => s.id === id ? { ...s, isActive: !currentStatus } : s))
            return "Төлөв шинэчлэгдлээ"
          }
          throw new Error(result.error)
        },
        error: "Алдаа гарлаа"
      }
    )
  }

  async function handleDelete(id: string) {
    if (!confirm("Энэ хэсгийг устгахдаа итгэлтэй байна уу?")) return
    
    toast.promise(
      deleteHomePageSection(id),
      {
        loading: "Устгаж байна...",
        success: (result) => {
          if (result.success) {
            setSections(prev => prev.filter(s => s.id !== id))
            return "Амжилттай устгалаа"
          }
          throw new Error(result.error)
        },
        error: "Устгах үед алдаа гарлаа"
      }
    )
  }

  if (sections.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
        <p className="text-slate-500">Нүүр хуудсанд харуулах хэсэг бүртгэгдээгүй байна.</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3">Гарчиг</th>
                <th className="px-4 py-3">Төрөл</th>
                <th className="px-4 py-3">Ангилал</th>
                <th className="px-4 py-3">Баннер зураг</th>
                <th className="px-4 py-3 text-center">Төлөв</th>
                <th className="px-4 py-3 text-right">Үйлдэл</th>
              </tr>
            </thead>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sections-list">
                {(provided) => (
                  <tbody 
                    className="divide-y divide-slate-100"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {sections.map((section, index) => (
                      <Draggable key={section.id} draggableId={section.id} index={index}>
                        {(provided, snapshot) => (
                          <tr 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`hover:bg-slate-50/50 transition-colors ${snapshot.isDragging ? 'bg-white shadow-lg z-10 relative' : ''}`}
                          >
                            <td className="px-4 py-3" {...provided.dragHandleProps}>
                              <GripVertical className="w-4 h-4 text-slate-300 cursor-grab active:cursor-grabbing" />
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {section.title}
                            </td>
                            <td className="px-4 py-3">
                              {section.type === "PRODUCT_SLIDER" ? (
                                <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[11px] font-bold">ЭНГИЙН СЛАЙДЕР</span>
                              ) : (
                                <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded text-[11px] font-bold">ОНЦГОЙ САНАЛ</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {section.category ? section.category.name : <span className="text-slate-400 italic">Сонгоогүй</span>}
                            </td>
                            <td className="px-4 py-3">
                              {section.bannerImageUrl ? (
                                <div className="w-16 h-8 rounded bg-slate-100 border overflow-hidden">
                                  <img src={section.bannerImageUrl} alt={section.title} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-xs">Байхгүй</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleToggleStatus(section.id, section.isActive)}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  section.isActive 
                                    ? "bg-green-100 text-green-800 hover:bg-green-200" 
                                    : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                                } transition-colors`}
                              >
                                {section.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditingSection(section)}>
                                    <Pencil className="mr-2 h-4 w-4" /> Засах
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDelete(section.id)} className="text-red-600 focus:bg-red-50 focus:text-red-700">
                                    <Trash2 className="mr-2 h-4 w-4" /> Устгах
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </tbody>
                )}
              </Droppable>
            </DragDropContext>
          </table>
        </div>
      </div>

      <Sheet open={!!editingSection} onOpenChange={(o) => !o && setEditingSection(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Хэсэг засах</SheetTitle>
          </SheetHeader>
          {editingSection && (
            <ActionForm action={async (formData) => {
              const title = formData.get("title") as string;
              const type = formData.get("type") as "PRODUCT_SLIDER" | "PROMO_SLIDER";
              const categoryId = formData.get("categoryId") as string;
              const bannerImageUrl = formData.get("bannerImageUrl") as string;
              const bannerLink = formData.get("bannerLink") as string;
              const rowCount = parseInt(formData.get("rowCount") as string || "2", 10);
              const autoScroll = formData.get("autoScroll") === "on";
              
              if (!title) return { success: false, error: "Гарчиг заавал оруулна уу" }

              const result = await updateHomePageSection(editingSection.id, { 
                title, 
                type, 
                categoryId, 
                bannerImageUrl, 
                bannerLink,
                rowCount,
                autoScroll
              });
              
              return result;
            }} 
            className="space-y-4 mt-6" 
            successMessage="Амжилттай засагдлаа"
            onSuccess={() => {
               setEditingSection(null)
               window.location.reload()
            }}>
              
              <div className="space-y-2">
                <label htmlFor="edit-title" className="text-sm font-medium">Гарчиг *</label>
                <Input id="edit-title" name="title" required defaultValue={editingSection.title} />
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-type" className="text-sm font-medium">Төрөл *</label>
                <select id="edit-type" name="type" defaultValue={editingSection.type} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30">
                  <option value="PRODUCT_SLIDER">Энгийн слайдер (Зөвхөн бараанууд)</option>
                  <option value="PROMO_SLIDER">Онцгой санал (Хажуудаа баннертай)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-categoryId" className="text-sm font-medium">Ангилал сонгох</label>
                <select id="edit-categoryId" name="categoryId" defaultValue={editingSection.categoryId || ""} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30">
                  <option value="">Бүх бараанаас (эсвэл тусгай)</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="edit-rowCount" className="text-sm font-medium">Эгнээний тоо</label>
                  <select id="edit-rowCount" name="rowCount" defaultValue={editingSection.rowCount?.toString() || "2"} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30">
                    <option value="1">1 эгнээ (Урт)</option>
                    <option value="2">2 эгнээ (Давхарласан)</option>
                  </select>
                </div>

                <div className="space-y-2 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer h-10">
                    <input type="checkbox" name="autoScroll" id="edit-autoScroll" defaultChecked={!!editingSection.autoScroll} className="rounded border-gray-300 text-[#4F46E5] focus:ring-[#4F46E5] w-4 h-4" />
                    <span className="text-sm font-medium">Автоматаар гүйх</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-700">Баннерийн мэдээлэл (Зөвхөн "Онцгой санал" төрөлд харагдана)</h3>
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-bannerImageUrl" className="text-sm font-medium">Баннер зургийн URL</label>
                <Input id="edit-bannerImageUrl" name="bannerImageUrl" defaultValue={editingSection.bannerImageUrl || ""} />
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-bannerLink" className="text-sm font-medium">Баннер үсрэх линк</label>
                <Input id="edit-bannerLink" name="bannerLink" defaultValue={editingSection.bannerLink || ""} />
              </div>

              <Button type="submit" className="w-full bg-[#4F46E5] text-white hover:bg-[#4338ca] mt-4">Хадгалах</Button>
            </ActionForm>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

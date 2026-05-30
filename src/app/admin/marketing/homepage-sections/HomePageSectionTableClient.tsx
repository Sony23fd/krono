"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal, Pencil, Trash2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { updateHomePageSection, deleteHomePageSection, updateHomePageSectionOrder } from "@/app/actions/homepage-section-actions"
import { SectionType, VisibilityTarget, DeviceTarget, LayoutVariant } from "@prisma/client"
import { ActionForm } from "@/components/admin/ActionForm"
import { GenericImageUploader } from "@/components/admin/GenericImageUploader"
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
  startDate: Date | null
  endDate: Date | null
  visibilityTarget: VisibilityTarget
  deviceTarget: DeviceTarget
  layoutVariant: LayoutVariant
  bannerText: string | null
  showBannerText: boolean
  bannerTextColor: string | null
  bannerTextPosition: any
  bannerTextSize: any
  category: {
    name: string
    id: string
    slug?: string
  } | null
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
  const [editType, setEditType] = useState<string>("PRODUCT_SLIDER")

  // Sync editType when editingSection changes
  useEffect(() => {
    if (editingSection) setEditType(editingSection.type)
  }, [editingSection])
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
              const startDate = formData.get("startDate") ? new Date(formData.get("startDate") as string) : null;
              const endDate = formData.get("endDate") ? new Date(formData.get("endDate") as string) : null;
              const visibilityTarget = formData.get("visibilityTarget") as VisibilityTarget;
              const deviceTarget = formData.get("deviceTarget") as DeviceTarget;
              const layoutVariant = formData.get("layoutVariant") as LayoutVariant;
              const bannerText = formData.get("bannerText") as string || null;
              const showBannerText = formData.get("showBannerText") === "on";
              const bannerTextColor = formData.get("bannerTextColor") as string || "#FFFFFF";
              const bannerTextPosition = formData.get("bannerTextPosition") as any;
              const bannerTextSize = formData.get("bannerTextSize") as any;
              
              if (!title) return { success: false, error: "Гарчиг заавал оруулна уу" }

              const result = await updateHomePageSection(editingSection.id, { 
                title, 
                type: type as any, 
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
                <select 
                  id="edit-type" 
                  name="type" 
                  defaultValue={editingSection.type} 
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30"
                >
                  <option value="PRODUCT_SLIDER">Энгийн слайдер (Зөвхөн бараанууд)</option>
                  <option value="PROMO_SLIDER">Онцгой санал (Хажуудаа баннертай)</option>
                  <option value="HERO_BANNER">Том баннер (Hero Slider)</option>
                  <option value="THIN_BANNER">Нарийн баннер (Thin Banner)</option>
                  <option value="CATEGORY_MENU">Ангиллын цэс (Story Style)</option>
                  <option value="HOW_IT_WORKS">Хэрхэн захиалах вэ? (How it works)</option>
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
                  <label htmlFor="edit-rowCount" className="text-sm font-medium">Эгнээний тоо (Слайдеруудад)</label>
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

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <label htmlFor="edit-startDate" className="text-sm font-medium">Эхлэх огноо (Сонголттой)</label>
                  <Input type="datetime-local" id="edit-startDate" name="startDate" defaultValue={editingSection.startDate ? new Date(editingSection.startDate).toISOString().slice(0, 16) : ""} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-endDate" className="text-sm font-medium">Дуусах огноо (Сонголттой)</label>
                  <Input type="datetime-local" id="edit-endDate" name="endDate" defaultValue={editingSection.endDate ? new Date(editingSection.endDate).toISOString().slice(0, 16) : ""} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="edit-visibilityTarget" className="text-sm font-medium">Хэнд харагдах</label>
                  <select id="edit-visibilityTarget" name="visibilityTarget" defaultValue={editingSection.visibilityTarget} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30">
                    <option value="ALL">Бүх хүнд</option>
                    <option value="LOGGED_IN_ONLY">Зөвхөн нэвтэрсэн хүнд</option>
                    <option value="GUEST_ONLY">Зөвхөн нэвтрээгүй хүнд</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-deviceTarget" className="text-sm font-medium">Төхөөрөмж</label>
                  <select id="edit-deviceTarget" name="deviceTarget" defaultValue={editingSection.deviceTarget} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30">
                    <option value="ALL">Бүгд (Утас + PC)</option>
                    <option value="MOBILE_ONLY">Зөвхөн гар утас</option>
                    <option value="DESKTOP_ONLY">Зөвхөн компьютер</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-layoutVariant" className="text-sm font-medium">Загвар (Layout)</label>
                <select id="edit-layoutVariant" name="layoutVariant" defaultValue={editingSection.layoutVariant} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30">
                  <option value="DEFAULT">Үндсэн загвар (Default)</option>
                  <option value="GRID">Тор (Grid)</option>
                  <option value="MASONRY">Зөрүүтэй (Masonry)</option>
                </select>
              </div>

              {editType === "PROMO_SLIDER" && (
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800">Баннерын текст тохиргоо (Зөвхөн "Онцгой санал" төрөлд)</h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="showBannerText" id="edit-showBannerText" defaultChecked={editingSection.showBannerText ?? true} className="rounded border-gray-300 text-[#4F46E5] focus:ring-[#4F46E5] w-4 h-4" />
                      <span className="text-sm font-medium">Текст харуулах</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2 col-span-2">
                      <label htmlFor="edit-bannerText" className="text-sm font-medium">Текст (хоосон бол Гарчиг гарна)</label>
                      <Input id="edit-bannerText" name="bannerText" defaultValue={editingSection.bannerText || ""} placeholder="Онцгой санал..." />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="edit-bannerTextColor" className="text-sm font-medium">Текстийн өнгө</label>
                      <div className="flex items-center gap-2">
                        <Input type="color" id="edit-bannerTextColor" name="bannerTextColor" defaultValue={editingSection.bannerTextColor || "#FFFFFF"} className="w-12 p-1 h-10" />
                        <span className="text-xs text-gray-500">HEX өнгө</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="edit-bannerTextSize" className="text-sm font-medium">Хэмжээ</label>
                      <select id="edit-bannerTextSize" name="bannerTextSize" defaultValue={editingSection.bannerTextSize || "LARGE"} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30">
                        <option value="SMALL">Жижиг</option>
                        <option value="MEDIUM">Дунд</option>
                        <option value="LARGE">Том</option>
                        <option value="XLARGE">Хэт том</option>
                      </select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label htmlFor="edit-bannerTextPosition" className="text-sm font-medium">Байрлал</label>
                      <select id="edit-bannerTextPosition" name="bannerTextPosition" defaultValue={editingSection.bannerTextPosition || "TOP_LEFT"} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30">
                        <option value="TOP_LEFT">Зүүн дээд</option>
                        <option value="TOP_CENTER">Гол дээд</option>
                        <option value="TOP_RIGHT">Баруун дээд</option>
                        <option value="CENTER_LEFT">Зүүн гол</option>
                        <option value="CENTER">Тэг дунд</option>
                        <option value="CENTER_RIGHT">Баруун гол</option>
                        <option value="BOTTOM_LEFT">Зүүн доод</option>
                        <option value="BOTTOM_CENTER">Гол доод</option>
                        <option value="BOTTOM_RIGHT">Баруун доод</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Баннер зураг</label>
                <GenericImageUploader name="bannerImageUrl" defaultValue={editingSection.bannerImageUrl || ""} folder="homepage" />
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

"use client"

import { useState, useEffect } from "react"
import { Edit2, Trash2, GripVertical, ImagePlus, EyeOff, Eye, Image as ImageIcon } from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { updateBannerOrder } from "@/app/actions/banner-actions"
import { useRouter } from "next/navigation"
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
import { Switch } from "@/components/ui/switch"

export function BannerTableClient({ initialBanners, currentType }: { initialBanners: any[], currentType: string }) {
  const [banners, setBanners] = useState(initialBanners)
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null)
  const [deletingBannerId, setDeletingBannerId] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const onDragEnd = async (result: any) => {
    if (!result.destination) return
    const items = Array.from(banners)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update state immediately
    const updatedItems = items.map((item, index) => ({ ...item, sortOrder: index }))
    setBanners(updatedItems)

    // Sync to DB
    const orderData = updatedItems.map(i => ({ id: i.id, sortOrder: i.sortOrder }))
    await updateBannerOrder(orderData)
  }

  if (initialBanners !== banners && !banners.every((b, i) => b.id === initialBanners[i]?.id)) {
      setBanners(initialBanners)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
          <tr>
            <th className="w-10 px-4 py-3.5"></th>
            <th className="px-6 py-3.5">Зураг</th>
            <th className="px-6 py-3.5">Гарчиг</th>
            <th className="px-6 py-3.5">Холбоос (Link)</th>
            <th className="px-6 py-3.5 text-center">Төлөв</th>
            <th className="px-6 py-3.5 text-right">Үйлдэл</th>
          </tr>
        </thead>
        {!isMounted ? (
          <tbody className="divide-y divide-slate-100 relative">
            {banners && banners.length > 0 ? (
              banners.map((banner, index) => (
                <tr key={banner.id} className={`hover:bg-slate-50/50 transition-colors ${!banner.isActive ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-4 w-10">
                    <div className="p-1.5 text-slate-400 rounded"><GripVertical className="w-4 h-4" /></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-32 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                      {banner.imageUrl ? <img src={banner.imageUrl} alt={banner.title || "Banner"} className="w-full h-full object-cover" /> : <ImagePlus className="w-5 h-5 text-slate-400" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">{banner.title || <span className="text-slate-400 font-normal italic">Гарчиггүй</span>}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {banner.linkUrl ? <a href={banner.linkUrl} target="_blank" rel="noreferrer" className="hover:text-blue-600 hover:underline">{banner.linkUrl}</a> : "-"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button type="button" className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${banner.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {banner.isActive ? <><Eye className="w-3 h-3"/> Идэвхтэй</> : <><EyeOff className="w-3 h-3"/> Идэвхгүй</>}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                    {/* Render static action buttons on server to avoid mismatch */}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-500"><ImageIcon className="w-10 h-10 mx-auto text-slate-200 mb-3" /><p className="font-medium text-slate-600">Одоогоор баннер нэмэгдээгүй байна.</p></td></tr>
            )}
          </tbody>
        ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="banners-list">
            {(provided) => (
              <tbody 
                className="divide-y divide-slate-100 relative" 
                {...provided.droppableProps} 
                ref={provided.innerRef}
              >
                {banners && banners.length > 0 ? (
                  banners.map((banner, index) => (
                    <Draggable key={banner.id} draggableId={banner.id} index={index}>
                      {(provided, snapshot) => (
                        <tr 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`hover:bg-slate-50/50 transition-colors ${snapshot.isDragging ? 'bg-indigo-50/80 shadow-md z-10' : ''} ${!banner.isActive ? 'opacity-60' : ''}`}
                        >
                          <td className="px-4 py-4 w-10">
                            <div 
                              {...provided.dragHandleProps}
                              className="p-1.5 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing rounded bg-white border border-transparent hover:border-slate-200"
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-32 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                              {banner.imageUrl ? (
                                <img src={banner.imageUrl} alt={banner.title || "Banner"} className="w-full h-full object-cover" />
                              ) : (
                                <ImagePlus className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900">{banner.title || <span className="text-slate-400 font-normal italic">Гарчиггүй</span>}</td>
                          <td className="px-6 py-4 text-slate-500 text-xs">
                            {banner.linkUrl ? (
                              <a href={banner.linkUrl} target="_blank" rel="noreferrer" className="hover:text-blue-600 hover:underline">
                                {banner.linkUrl}
                              </a>
                            ) : "-"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <ActionForm action={async () => {
                              const { updateBanner } = await import("@/app/actions/banner-actions")
                              return await updateBanner(banner.id, { isActive: !banner.isActive })
                            }} className="inline-block">
                              <button type="submit" className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${banner.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                                {banner.isActive ? <><Eye className="w-3 h-3"/> Идэвхтэй</> : <><EyeOff className="w-3 h-3"/> Идэвхгүй</>}
                              </button>
                            </ActionForm>
                          </td>
                          <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                            <Dialog open={editingBannerId === banner.id} onOpenChange={(open) => setEditingBannerId(open ? banner.id : null)}>
                              <DialogTrigger onClick={() => setEditingBannerId(banner.id)} className="inline-flex items-center justify-center rounded-md hover:bg-slate-100 h-8 w-8 text-amber-500 transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Баннер засах</DialogTitle>
                                </DialogHeader>
                                <ActionForm action={async (formData) => {
                                  const { updateBanner } = await import("@/app/actions/banner-actions")
                                  const id = formData.get("id") as string
                                  const title = formData.get("title") as string
                                  const imageUrl = formData.get("imageUrl") as string
                                  const linkUrl = formData.get("linkUrl") as string
                                  const type = formData.get("type") as string
                                  if (id && imageUrl) return await updateBanner(id, { title, imageUrl, linkUrl, type })
                                  return { success: false, error: "Зургийн URL заавал оруулна уу" }
                                }} className="space-y-4" successMessage="Амжилттай заслаа" onSuccess={() => { setEditingBannerId(null); router.refresh(); }}>
                                  <input type="hidden" name="id" value={banner.id} />
                                  <input type="hidden" name="type" value={banner.type || currentType} />
                                  <div className="space-y-2">
                                    <label htmlFor={`edit-img-${banner.id}`} className="text-sm font-medium">Зургийн URL *</label>
                                    <Input key={`img-${banner.id}-${banner.imageUrl}`} id={`edit-img-${banner.id}`} name="imageUrl" defaultValue={banner.imageUrl} required placeholder="https://..." />
                                  </div>
                                  <div className="space-y-2">
                                    <label htmlFor={`edit-title-${banner.id}`} className="text-sm font-medium">Гарчиг (Заавал биш)</label>
                                    <Input key={`title-${banner.id}-${banner.title}`} id={`edit-title-${banner.id}`} name="title" defaultValue={banner.title || ""} />
                                  </div>
                                  <div className="space-y-2">
                                    <label htmlFor={`edit-link-${banner.id}`} className="text-sm font-medium">Үсрэх линк (Заавал биш)</label>
                                    <Input key={`link-${banner.id}-${banner.linkUrl}`} id={`edit-link-${banner.id}`} name="linkUrl" defaultValue={banner.linkUrl || ""} placeholder="/category/electronics" />
                                  </div>
                                  <DialogFooter>
                                    <Button type="submit" className="bg-[#4F46E5] hover:bg-[#4338ca] text-white">Хадгалах</Button>
                                  </DialogFooter>
                                </ActionForm>
                              </DialogContent>
                            </Dialog>

                            <Dialog open={deletingBannerId === banner.id} onOpenChange={(open) => setDeletingBannerId(open ? banner.id : null)}>
                              <DialogTrigger onClick={() => setDeletingBannerId(banner.id)} className="inline-flex items-center justify-center rounded-md hover:bg-slate-100 h-8 w-8 text-red-500 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Баннер устгах</DialogTitle>
                                  <DialogDescription>
                                    Та энэ баннерыг устгахдаа итгэлтэй байна уу?
                                  </DialogDescription>
                                </DialogHeader>
                                <ActionForm action={async (formData) => {
                                  const { deleteBanner } = await import("@/app/actions/banner-actions")
                                  const id = formData.get("id") as string
                                  if (id) return await deleteBanner(id)
                                  return { success: false, error: "Алдаа гарлаа" }
                                }} successMessage="Амжилттай устгагдлаа" onSuccess={() => { setDeletingBannerId(null); router.refresh(); }}>
                                  <input type="hidden" name="id" value={banner.id} />
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
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                      <ImageIcon className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                      <p className="font-medium text-slate-600">Одоогоор баннер нэмэгдээгүй байна.</p>
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

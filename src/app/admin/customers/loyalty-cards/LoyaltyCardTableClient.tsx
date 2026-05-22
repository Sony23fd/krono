"use client"

import { useState } from "react"
import { Edit2, Trash2, CreditCard } from "lucide-react"
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

export function LoyaltyCardTableClient({ cards }: { cards: any[] }) {
  const [search, setSearch] = useState("")

  const filteredCards = cards.filter(c => 
    c.cardNumber.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone && c.phone.includes(search))
  )

  return (
    <div className="space-y-4">
      <Input 
        placeholder="Картын дугаар эсвэл утсаар хайх..." 
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
            <tr>
              <th className="px-6 py-3.5">Картын дугаар</th>
              <th className="px-6 py-3.5">Утас</th>
              <th className="px-6 py-3.5 text-right">Онооны үлдэгдэл</th>
              <th className="px-6 py-3.5">Үүсгэсэн</th>
              <th className="px-6 py-3.5 text-right">Үйлдэл</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCards.length > 0 ? filteredCards.map((card) => (
              <tr key={card.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-mono font-bold text-slate-900">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-500" />
                    {card.cardNumber}
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600 font-medium">
                  {card.phone || <span className="text-slate-400 italic">Бүртгээгүй</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-bold text-[#F26522] text-base">{Number(card.pointsBalance).toLocaleString()}</span>
                </td>
                <td className="px-6 py-4 text-slate-500 text-xs">
                  {new Date(card.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                  <Dialog>
                    <DialogTrigger className="inline-flex items-center justify-center rounded-md hover:bg-slate-100 h-8 w-8 text-amber-500 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Карт засах</DialogTitle>
                      </DialogHeader>
                      <ActionForm action={async (formData) => {
                        const { updateLoyaltyCard } = await import("@/app/actions/loyalty-actions")
                        const id = formData.get("id") as string
                        const phone = formData.get("phone") as string
                        const pointsBalance = formData.get("pointsBalance") as string
                        return await updateLoyaltyCard(id, { 
                          phone, 
                          pointsBalance: pointsBalance ? parseInt(pointsBalance) : undefined 
                        })
                      }} className="space-y-4" successMessage="Амжилттай заслаа">
                        <input type="hidden" name="id" value={card.id} />
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Картын дугаар (засагдахгүй)</label>
                          <Input value={card.cardNumber} disabled />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor={`edit-phone-${card.id}`} className="text-sm font-medium">Утасны дугаар</label>
                          <Input key={`phone-${card.id}-${card.phone}`} id={`edit-phone-${card.id}`} name="phone" defaultValue={card.phone || ""} />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor={`edit-points-${card.id}`} className="text-sm font-medium">Онооны үлдэгдэл</label>
                          <Input key={`points-${card.id}-${card.pointsBalance}`} id={`edit-points-${card.id}`} name="pointsBalance" type="number" defaultValue={card.pointsBalance} required />
                        </div>
                        <DialogFooter>
                          <Button type="submit" className="bg-[#4F46E5] hover:bg-[#4338ca] text-white">Хадгалах</Button>
                        </DialogFooter>
                      </ActionForm>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger className="inline-flex items-center justify-center rounded-md hover:bg-slate-100 h-8 w-8 text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Карт устгах</DialogTitle>
                        <DialogDescription>
                          Та {card.cardNumber} дугаартай картыг устгахдаа итгэлтэй байна уу?
                        </DialogDescription>
                      </DialogHeader>
                      <ActionForm action={async (formData) => {
                        const { deleteLoyaltyCard } = await import("@/app/actions/loyalty-actions")
                        const id = formData.get("id") as string
                        return await deleteLoyaltyCard(id)
                      }} successMessage="Амжилттай устгагдлаа">
                        <input type="hidden" name="id" value={card.id} />
                        <DialogFooter className="mt-4">
                          <Button type="submit" variant="destructive">Тийм, устгах</Button>
                        </DialogFooter>
                      </ActionForm>
                    </DialogContent>
                  </Dialog>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                  <CreditCard className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                  <p className="font-medium text-slate-600">Одоогоор хөнгөлөлтийн карт алга байна.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, ArrowRight } from "lucide-react"

export function NewTransferForm({ branches, products }: { branches: any[], products: any[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fromBranch, setFromBranch] = useState("")
  const [toBranch, setToBranch] = useState("")
  const [note, setNote] = useState("")
  const [items, setItems] = useState<{productId: string, quantity: number}[]>([])

  const addItem = () => {
    setItems([...items, { productId: "", quantity: 1 }])
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fromBranch || !toBranch) return alert("Салбаруудыг сонгоно уу")
    if (fromBranch === toBranch) return alert("Ижил салбар хооронд шилжүүлэх боломжгүй")
    if (items.length === 0) return alert("Шилжүүлэх бараа нэмнэ үү")
    if (items.some(item => !item.productId || item.quantity <= 0)) return alert("Барааны мэдээллийг гүйцэд оруулна уу")

    setLoading(true)
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromBranchId: fromBranch,
          toBranchId: toBranch,
          note,
          items
        })
      })
      if (!res.ok) {
        const err = await res.json()
        alert("Алдаа гарлаа: " + err.error)
      } else {
        router.push("/admin/transfers")
        router.refresh()
      }
    } catch (err) {
      alert("Алдаа гарлаа")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Гаргах салбар</label>
            <select 
              value={fromBranch} 
              onChange={e => setFromBranch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F26522]/20"
              required
            >
              <option value="">Сонгох...</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          
          <div className="hidden md:flex justify-center pt-6">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Хүлээн авах салбар</label>
            <select 
              value={toBranch} 
              onChange={e => setToBranch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F26522]/20"
              required
            >
              <option value="">Сонгох...</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Тэмдэглэл</label>
          <textarea 
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F26522]/20 resize-none h-20"
            placeholder="Шилжүүлгийн талаар нэмэлт мэдээлэл..."
          ></textarea>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-lg">Бараанууд</h3>
          <button 
            type="button" 
            onClick={addItem}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#F26522] hover:bg-[#F26522]/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Нэмэх
          </button>
        </div>

        {items.length === 0 ? (
          <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-500">
            Бараа нэмэгдээгүй байна
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex-1 w-full">
                  <select
                    value={item.productId}
                    onChange={e => updateItem(index, "productId", e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="">Бараа сонгох...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-32">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e => updateItem(index, "quantity", parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    placeholder="Тоо"
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => removeItem(index)}
                  className="w-full sm:w-auto p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors flex justify-center"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button 
          type="button" 
          onClick={() => router.back()}
          className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          Буцах
        </button>
        <button 
          type="submit" 
          disabled={loading}
          className="px-6 py-2.5 rounded-xl font-semibold text-white bg-[#F26522] hover:bg-[#d9551a] transition-colors disabled:opacity-50"
        >
          {loading ? "Үүсгэж байна..." : "Шилжүүлэг үүсгэх"}
        </button>
      </div>
    </form>
  )
}

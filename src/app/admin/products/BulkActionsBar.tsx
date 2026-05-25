"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FolderInput, Star, StarOff, ShieldAlert, ShieldOff, Trash2, ChevronDown, X, Loader2, CheckSquare } from "lucide-react"

interface BulkActionsBarProps {
  selectedIds: string[]
  categories: { id: string; name: string }[]
  onClear: () => void
}

export function BulkActionsBar({ selectedIds, categories, onClear }: BulkActionsBarProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState("")

  const count = selectedIds.length
  if (count === 0) return null

  async function executeBulkAction(action: string, extra: Record<string, any> = {}) {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, productIds: selectedIds, ...extra }),
      })
      const data = await res.json()
      if (data.success) {
        onClear()
        router.refresh()
      } else {
        alert(data.error || "Алдаа гарлаа")
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Bulk Actions Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#001f3f] text-white rounded-2xl shadow-2xl shadow-slate-900/30 px-5 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-2 pr-4 border-r border-white/20">
          <CheckSquare className="w-4 h-4 text-blue-300" />
          <span className="text-sm font-bold">{count} сонгосон</span>
        </div>

        {/* Move to Category */}
        <button
          onClick={() => setShowCategoryModal(true)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
        >
          <FolderInput className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ангилал шилжүүлэх</span>
        </button>

        {/* Mark as Featured */}
        <button
          onClick={() => executeBulkAction("set_featured", { value: true })}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold transition-colors"
        >
          <Star className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Онцлох</span>
        </button>

        {/* Remove from Featured */}
        <button
          onClick={() => executeBulkAction("set_featured", { value: false })}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
        >
          <StarOff className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Онцлохоос хасах</span>
        </button>

        {/* Set 21+ Age Verification */}
        <button
          onClick={() => executeBulkAction("set_age_verification", { value: true })}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold transition-colors"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">21+ тэмдэглэх</span>
        </button>

        {/* Remove 21+ */}
        <button
          onClick={() => executeBulkAction("set_age_verification", { value: false })}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
        >
          <ShieldOff className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">21+ хасах</span>
        </button>

        {/* Set Active */}
        <button
          onClick={() => executeBulkAction("set_status", { value: "ACTIVE" })}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 text-xs font-semibold transition-colors"
        >
          <span className="hidden sm:inline">Идэвхтэй</span>
        </button>

        {/* Set Draft */}
        <button
          onClick={() => executeBulkAction("set_status", { value: "DRAFT" })}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
        >
          <span className="hidden sm:inline">Ноорог</span>
        </button>

        {/* Archive / Delete */}
        <button
          onClick={() => {
            if (confirm("Сонгосон бараануудыг устгах уу? (Архивлагдсан барааг бүр мөсөн устгана)")) {
              executeBulkAction("delete_products")
            }
          }}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Устгах</span>
        </button>

        {/* Loading spinner */}
        {loading && <Loader2 className="w-4 h-4 animate-spin text-white/60" />}

        {/* Close */}
        <button
          onClick={onClear}
          className="ml-1 p-1.5 rounded-lg hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Category Move Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowCategoryModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold text-slate-900 mb-1">Ангилал шилжүүлэх</h3>
            <p className="text-xs text-slate-500 mb-4">{count} бараа сонгосон</p>

            <select
              value={selectedCategoryId}
              onChange={e => setSelectedCategoryId(e.target.value)}
              className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm font-medium focus:ring-2 focus:ring-[#F26522] focus:border-transparent outline-none mb-4"
            >
              <option value="">Ангилал сонгох...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Болих
              </button>
              <button
                onClick={async () => {
                  if (!selectedCategoryId) return alert("Ангилал сонгоно уу")
                  await executeBulkAction("move_category", { categoryId: selectedCategoryId })
                  setShowCategoryModal(false)
                  setSelectedCategoryId("")
                }}
                disabled={loading || !selectedCategoryId}
                className="flex-1 h-10 rounded-xl bg-[#F26522] text-white text-sm font-bold hover:bg-[#E85B1C] disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : "Шилжүүлэх"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

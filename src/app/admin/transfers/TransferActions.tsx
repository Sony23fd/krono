"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function TransferActions({ transferId, status }: { transferId: string, status: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleAction = async (action: "approve" | "receive") => {
    if (!confirm(action === "approve" ? "Энэхүү шилжүүлгийг илгээх үү? (Үлдэгдэл хасагдана)" : "Энэхүү шилжүүлгийг хүлээн авах уу? (Үлдэгдэл нэмэгдэнэ)")) return;
    
    setLoading(true)
    try {
      const res = await fetch(`/api/transfers/${transferId}/${action}`, {
        method: "PUT"
      })
      if (!res.ok) {
        const error = await res.json()
        alert("Алдаа гарлаа: " + error.error)
      } else {
        router.refresh()
      }
    } catch (err) {
      alert("Алдаа гарлаа")
    } finally {
      setLoading(false)
    }
  }

  if (status === "PENDING") {
    return (
      <button 
        onClick={() => handleAction("approve")} 
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
      >
        {loading ? "Түр хүлээнэ үү..." : "Илгээх (Батлах)"}
      </button>
    )
  }

  if (status === "IN_TRANSIT") {
    return (
      <button 
        onClick={() => handleAction("receive")} 
        disabled={loading}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
      >
        {loading ? "Түр хүлээнэ үү..." : "Хүлээн авах"}
      </button>
    )
  }

  return null
}

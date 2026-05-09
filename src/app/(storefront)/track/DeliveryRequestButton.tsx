"use client"

import { useState } from "react"
import { Truck, Loader2 } from "lucide-react"

// Шинэ системд хүргэлт захиалах → orderId-ууд дээр wantsDelivery=true тохируулна
export default function DeliveryRequestButton({ 
  orderIds, 
  deliveryScheduleDays = "3,6" 
}: { 
  orderIds: string[]
  deliveryScheduleDays?: string 
}) {
  const [loading, setLoading] = useState(false)

  return (
    <div className="space-y-2">
      <button
        disabled={loading || orderIds.length === 0}
        onClick={async () => {
          setLoading(true)
          // TODO: Implement delivery request action
          alert("Хүргэлт захиалах функц хэрэгжүүлэх шаардлагатай")
          setLoading(false)
        }}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
        Хүргэлт захиалах ({orderIds.length} бараа)
      </button>
    </div>
  )
}

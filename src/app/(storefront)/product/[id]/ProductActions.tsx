"use client"

import { Zap } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { useRouter } from "next/navigation"

interface Props {
  productId: string
  name: string
  imageUrl?: string | null
  unitPrice: number
  remainingQuantity: number
  isPreOrder?: boolean
  options?: Array<{ name: string, values: string[] }>
  variants?: Array<{ id: string; sku: string; name: string; stockQuantity: number; price?: number }>
}

export function ProductActions({ productId, name, imageUrl, unitPrice, remainingQuantity, isPreOrder, options, variants }: Props) {
  const router = useRouter()
  const { addItem } = useCart()

  const canSubmit = isPreOrder || remainingQuantity > 0

  function handleBuyNow() {
    if (!canSubmit) return
    
    addItem({
      batchId: productId,
      productId: productId,
      variantId: undefined,
      name: name,
      imageUrl: imageUrl,
      unitPrice: unitPrice,
      isPreOrder,
      qty: 1, // Fix quantity to 1 for SaaS
    })
    
    router.push("/cart")
  }

  return (
    <div className="pt-4">
      <button
        onClick={handleBuyNow}
        disabled={!canSubmit}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white bg-[#F26522] hover:bg-[#E85B1C] shadow-lg shadow-red-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Zap className="w-5 h-5" /> Шууд захиалах
      </button>
    </div>
  )
}

"use client"
import { useCart } from "@/context/CartContext"
import { useAgeVerification } from "@/context/AgeVerificationContext"
import { ShoppingCart, Check, Plus, Minus } from "lucide-react"
import { useState } from "react"

interface Props {
  batchId: string
  name: string
  imageUrl?: string | null
  unitPrice: number
  deliveryFee: number
  isPreOrder?: boolean
  requiresAgeVerification?: boolean
}

export function AddToCartButton({ batchId, name, imageUrl, unitPrice, deliveryFee, isPreOrder, requiresAgeVerification }: Props) {
  const { addItem, items, updateQty, removeItem } = useCart()
  const { checkAge } = useAgeVerification()
  const cartItem = items.find(i => i.batchId === batchId)
  const inCart = !!cartItem

  function doAdd() {
    addItem({ batchId, productId: batchId, name, imageUrl, unitPrice, deliveryFee, isPreOrder, qty: 1 })
  }

  function handleAdd() {
    if (requiresAgeVerification) {
      checkAge(() => doAdd())
    } else {
      doAdd()
    }
  }

  if (inCart && cartItem) {
    return (
      <div className="flex items-center h-9 md:h-10 rounded-lg border border-[#F26522] bg-orange-50 overflow-hidden w-full">
        <button
          type="button"
          onClick={() => {
            if (cartItem.qty <= 1) {
              removeItem(batchId)
            } else {
              updateQty(batchId, cartItem.qty - 1)
            }
          }}
          className="w-10 md:w-12 h-full flex items-center justify-center text-[#F26522] hover:bg-[#F26522] hover:text-white transition-colors shrink-0"
        >
          <Minus className="w-4 h-4 md:w-4.5 md:h-4.5" />
        </button>
        <span className="flex-1 h-full flex items-center justify-center text-sm md:text-base font-bold text-slate-900 bg-white select-none border-x border-[#F26522]/20">
          {cartItem.qty}
        </span>
        <button
          type="button"
          onClick={() => updateQty(batchId, cartItem.qty + 1)}
          className="w-10 md:w-12 h-full flex items-center justify-center text-[#F26522] hover:bg-[#F26522] hover:text-white transition-colors shrink-0"
        >
          <Plus className="w-4 h-4 md:w-4.5 md:h-4.5" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleAdd}
      className="w-full flex items-center justify-center gap-2 h-9 md:h-10 rounded-lg font-bold text-xs md:text-sm bg-[#F26522] text-white hover:bg-[#E85B1C] transition-all active:scale-[0.97] shadow-sm shadow-orange-500/20"
    >
      <ShoppingCart className="w-4 h-4 md:w-4.5 md:h-4.5 shrink-0" />
      <span>Сагсанд нэмэх</span>
    </button>
  )
}

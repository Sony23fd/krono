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
  const { addItem, items } = useCart()
  const { checkAge } = useAgeVerification()
  const [added, setAdded] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const inCart = items.some(i => i.batchId === batchId)

  function doAdd() {
    addItem({ batchId, productId: batchId, name, imageUrl, unitPrice, deliveryFee, isPreOrder, qty: quantity })
    setAdded(true)
    setQuantity(1)
    setTimeout(() => setAdded(false), 1500)
  }

  function handleAdd() {
    if (requiresAgeVerification) {
      checkAge(() => doAdd())
    } else {
      doAdd()
    }
  }

  if (inCart) {
    return (
      <button
        onClick={handleAdd}
        className="w-full flex items-center justify-center gap-1.5 h-9 md:h-10 rounded-lg font-bold text-xs md:text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all active:scale-[0.97]"
      >
        <Check className="w-4 h-4 shrink-0" />
        <span>Сагсанд байна</span>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Quantity selector */}
      <div className="flex items-center h-9 md:h-10 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden flex-1 min-w-0">
        <button
          type="button"
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="w-9 md:w-10 h-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors shrink-0"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="flex-1 h-full flex items-center justify-center text-xs md:text-sm font-bold text-slate-800 border-x border-slate-200 bg-white select-none">
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => setQuantity(quantity + 1)}
          className="w-9 md:w-10 h-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Add to Cart icon button */}
      <button
        onClick={handleAdd}
        className={`h-9 md:h-10 w-10 md:w-11 rounded-lg flex items-center justify-center shrink-0 transition-all active:scale-90 ${
          added
            ? "bg-emerald-500 text-white"
            : "bg-[#E21B22] text-white hover:bg-[#c8161d] shadow-sm shadow-red-500/20"
        }`}
        title="Сагслах"
      >
        {added ? (
          <Check className="w-4 h-4 md:w-[18px] md:h-[18px]" />
        ) : (
          <ShoppingCart className="w-4 h-4 md:w-[18px] md:h-[18px]" />
        )}
      </button>
    </div>
  )
}

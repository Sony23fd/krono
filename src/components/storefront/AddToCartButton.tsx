"use client"
import { useCart } from "@/context/CartContext"
import { ShoppingCart, Check } from "lucide-react"
import { useState } from "react"

interface Props {
  batchId: string
  name: string
  imageUrl?: string | null
  unitPrice: number
  deliveryFee: number
  isPreOrder?: boolean
}

export function AddToCartButton({ batchId, name, imageUrl, unitPrice, deliveryFee, isPreOrder }: Props) {
  const { addItem, items } = useCart()
  const [added, setAdded] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const inCart = items.some(i => i.batchId === batchId)

  function handleAdd() {
    addItem({ batchId, productId: batchId, name, imageUrl, unitPrice, deliveryFee, isPreOrder, qty: quantity })
    setAdded(true)
    setQuantity(1)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="flex items-center gap-1.5 md:gap-2">
      {!inCart && (
        <div className="flex items-center border border-slate-200 rounded-full overflow-hidden bg-gray-50 h-9 md:h-10 w-20 md:w-24 shrink-0">
          <button 
            type="button" 
            onClick={() => setQuantity(Math.max(1, quantity - 1))} 
            className="w-7 md:w-8 h-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700 font-medium active:bg-slate-200 text-sm"
          >
            −
          </button>
          <input 
            type="number" 
            min="1" 
            value={quantity} 
            onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} 
            className="flex-1 h-full w-full text-center bg-transparent border-none focus:outline-none text-xs md:text-sm font-bold text-slate-700 p-0 appearance-none m-0"
            style={{ MozAppearance: 'textfield' }}
          />
          <button 
            type="button" 
            onClick={() => setQuantity(quantity + 1)} 
            className="w-7 md:w-8 h-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700 font-medium active:bg-slate-200 text-sm"
          >
            +
          </button>
        </div>
      )}
      <button
        onClick={handleAdd}
        className={`w-full flex items-center justify-center gap-1.5 h-9 md:h-10 px-3 rounded-full font-bold text-xs md:text-sm transition-all active:scale-[0.97] ${
          inCart
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
            : "bg-[#E21B22] text-white hover:bg-[#c8161d] shadow-md shadow-red-500/20"
        }`}
      >
        {added ? (
          <><Check className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" /> <span className="truncate">Нэмэгдлээ!</span></>
        ) : inCart ? (
          <><ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" /> <span className="truncate">Сагсанд</span></>
        ) : (
          <><ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" /> <span className="truncate">Сагслах</span></>
        )}
      </button>
    </div>
  )
}

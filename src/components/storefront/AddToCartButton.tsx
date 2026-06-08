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
  variant?: "full" | "icon"
}

export function AddToCartButton({ batchId, name, imageUrl, unitPrice, deliveryFee, isPreOrder, requiresAgeVerification, variant = "full" }: Props) {
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
    if (variant === "icon") {
      return (
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="flex items-center h-8 w-[4.5rem] md:h-10 md:w-20 lg:w-24 rounded-full border border-[#F26522] bg-orange-50 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (cartItem.qty <= 1) {
                  removeItem(batchId);
                } else {
                  updateQty(batchId, cartItem.qty - 1);
                }
              }}
              className="flex-1 h-full flex items-center justify-center text-[#F26522] hover:bg-[#F26522] hover:text-white transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-5 md:w-6 h-full flex items-center justify-center text-xs md:text-sm font-bold text-slate-900 bg-white select-none border-x border-[#F26522]/20">
              {cartItem.qty}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                updateQty(batchId, cartItem.qty + 1);
              }}
              className="flex-1 h-full flex items-center justify-center text-[#F26522] hover:bg-[#F26522] hover:text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-center h-9 md:h-10 rounded-lg border border-[#F26522] bg-orange-50 overflow-hidden w-full">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            updateQty(batchId, cartItem.qty + 1)
          }}
          className="w-10 md:w-12 h-full flex items-center justify-center text-[#F26522] hover:bg-[#F26522] hover:text-white transition-colors shrink-0"
        >
          <Plus className="w-4 h-4 md:w-4.5 md:h-4.5" />
        </button>
      </div>
    )
  }

  if (variant === "icon") {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleAdd();
        }}
        className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-[#F26522] text-white hover:bg-[#E85B1C] transition-transform hover:scale-105 active:scale-95 shadow-md shadow-orange-500/30 shrink-0"
      >
        <ShoppingCart className="w-4 h-4 md:w-4.5 md:h-4.5" />
      </button>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleAdd();
      }}
      className="w-full flex items-center justify-center gap-2 h-9 md:h-10 rounded-lg font-bold text-xs md:text-sm bg-[#F26522] text-white hover:bg-[#E85B1C] transition-all active:scale-[0.97] shadow-sm shadow-orange-500/20"
    >
      <ShoppingCart className="w-4 h-4 md:w-4.5 md:h-4.5 shrink-0" />
      <span>Сагсанд нэмэх</span>
    </button>
  )
}

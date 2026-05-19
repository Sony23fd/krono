"use client"

import { useState, useMemo } from "react"
// Removed invalid Button import
import { Package, ShoppingCart, Zap, Plus, Minus } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Props {
  productId: string
  name: string
  imageUrl?: string | null
  unitPrice: number
  deliveryFee: number
  remainingQuantity: number
  isPreOrder?: boolean
  options?: Array<{ name: string, values: string[] }>
  variants?: Array<{ id: string; sku: string; name: string; stockQuantity: number; price?: number }>
}

export function ProductActions({ productId, name, imageUrl, unitPrice, deliveryFee, remainingQuantity, isPreOrder, options, variants }: Props) {
  const router = useRouter()
  const { addItem, items } = useCart()
  const [qty, setQty] = useState(1)

  // Build variantStock map from variants array
  const variantStock = variants?.reduce((acc, v) => ({ ...acc, [v.name]: v.stockQuantity }), {} as Record<string, number>) || null

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const defaultOpts: Record<string, string> = {}
    if (options) {
      options.forEach(opt => {
        if (opt.values.length > 0) defaultOpts[opt.name] = opt.values[0]
      })
    }
    return defaultOpts
  })

  // Compute variant key from selected options
  const currentVariantKey = useMemo(() => {
    if (!options || options.length === 0) return null
    return Object.values(selectedOptions).join('-')
  }, [selectedOptions, options])

  // Determine stock for current variant
  const currentStock = useMemo(() => {
    if (!variantStock || !currentVariantKey) return remainingQuantity
    return variantStock[currentVariantKey] ?? 0
  }, [variantStock, currentVariantKey, remainingQuantity])

  // Check if a specific option value is sold out
  const isOptionSoldOut = (optName: string, optValue: string): boolean => {
    if (!variantStock || !options) return false
    const tempSelection = { ...selectedOptions, [optName]: optValue }
    const key = Object.values(tempSelection).join('-')
    return (variantStock[key] ?? 0) <= 0
  }

  const canSubmit = isPreOrder || currentStock > 0

  function handleAddToCart() {
    if (!canSubmit) return

    const selectedVariant = variants?.find(v => v.name === currentVariantKey)
    const displayName = currentVariantKey ? `${name} (${currentVariantKey})` : name

    addItem({
      batchId: selectedVariant ? `${productId}-${selectedVariant.id}` : productId,
      productId: productId,
      variantId: selectedVariant?.id,
      name: displayName,
      imageUrl: imageUrl,
      unitPrice: selectedVariant?.price ?? unitPrice,
      deliveryFee,
      isPreOrder,
      qty,
    })

    toast.success("Сагсанд амжилттай нэмэгдлээ", {
      description: displayName,
      action: {
        label: "Сагс руу очих",
        onClick: () => router.push("/cart")
      }
    })
  }

  function handleBuyNow() {
    if (!canSubmit) return
    
    const selectedVariant = variants?.find(v => v.name === currentVariantKey)
    const displayName = currentVariantKey ? `${name} (${currentVariantKey})` : name

    addItem({
      batchId: selectedVariant ? `${productId}-${selectedVariant.id}` : productId,
      productId: productId,
      variantId: selectedVariant?.id,
      name: displayName,
      imageUrl: imageUrl,
      unitPrice: selectedVariant?.price ?? unitPrice,
      deliveryFee,
      isPreOrder,
      qty,
    })
    
    router.push("/cart")
  }

  return (
    <div className="space-y-6">
      {/* Product Options (Variants) */}
      {options && options.length > 0 && (
        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-[#1B3561]" /> Сонголт
          </h3>
          <div className="space-y-3">
            {options.map((opt, i) => (
              <div key={i} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{opt.name}</label>
                <div className="flex flex-wrap gap-2">
                  {opt.values.map(val => {
                    const soldOut = isOptionSoldOut(opt.name, val)
                    const isSelected = selectedOptions[opt.name] === val
                    return (
                      <button
                        key={val}
                        type="button"
                        disabled={soldOut}
                        onClick={() => {
                          setSelectedOptions({ ...selectedOptions, [opt.name]: val })
                          setQty(1) // Reset qty when changing variant
                        }}
                        className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-all ${soldOut
                            ? "bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed line-through"
                            : isSelected
                              ? "bg-[#1B3561] border-[#1B3561] text-white shadow-md shadow-blue-900/20"
                              : "bg-white border-slate-200 text-slate-700 hover:border-[#1B3561] hover:bg-slate-50"
                          }`}
                      >
                        {val}
                        {soldOut && <span className="ml-1 text-[10px] no-underline">(дууссан)</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-bold text-slate-800">Тоо ширхэг:</label>
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden h-12">
          <button
            type="button"
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="w-12 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="w-12 h-full flex items-center justify-center font-bold text-slate-900 bg-white border-x border-slate-200 text-lg">
            {qty}
          </div>
          <button
            type="button"
            onClick={() => setQty(isPreOrder ? qty + 1 : Math.min(currentStock, qty + 1))}
            disabled={!isPreOrder && qty >= currentStock}
            className="w-12 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-4">
        <button
          onClick={handleAddToCart}
          disabled={!canSubmit}
          className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-[#1B3561] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-5 h-5" /> Сагслах
        </button>
        <button
          onClick={handleBuyNow}
          disabled={!canSubmit}
          className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white bg-[#E21B22] hover:bg-[#c8161d] shadow-lg shadow-red-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Zap className="w-5 h-5" /> Шууд захиалах
        </button>
      </div>
    </div>
  )
}

"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export interface CartItem {
  batchId: string // Used as unique identifier for the cart line item (productId or productId-variantId)
  productId: string // The actual database productId
  variantId?: string // Optional variantId
  name: string
  imageUrl?: string | null
  unitPrice: number
  deliveryFee?: number
  qty: number
  isPreOrder?: boolean
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "qty"> & { qty?: number }) => void
  removeItem: (batchId: string) => void
  updateQty: (batchId: string, qty: number) => void
  clearCart: () => void
  totalCount: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | null>(null)

const STORAGE_KEY = "anar_cart"

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setItems(JSON.parse(stored))
    } catch {}
  }, [])

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {}
  }, [items])

  function addItem(incoming: Omit<CartItem, "qty"> & { qty?: number }) {
    setItems(prev => {
      const existing = prev.find(i => i.batchId === incoming.batchId)
      if (existing) {
        return prev.map(i =>
          i.batchId === incoming.batchId
            ? { ...i, qty: i.qty + (incoming.qty ?? 1) }
            : i
        )
      }
      return [...prev, { ...incoming, qty: incoming.qty ?? 1 }]
    })
  }

  function removeItem(batchId: string) {
    setItems(prev => prev.filter(i => i.batchId !== batchId))
  }

  function updateQty(batchId: string, qty: number) {
    if (qty < 1) return removeItem(batchId)
    setItems(prev => prev.map(i => i.batchId === batchId ? { ...i, qty } : i))
  }

  function clearCart() {
    setItems([])
  }

  const totalCount = items.reduce((s, i) => s + i.qty, 0)
  const totalPrice = items.reduce((s, i) => s + i.unitPrice * i.qty, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, totalCount, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be inside CartProvider")
  return ctx
}

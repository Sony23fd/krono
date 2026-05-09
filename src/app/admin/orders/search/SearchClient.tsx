"use client"

import { useState, useEffect } from "react"
import { Search, Loader2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getOrdersByQuery } from "@/app/actions/track-actions"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Хүлээгдэж буй",
  PAID: "Баталгаажсан",
  PROCESSING: "Боловсруулж буй",
  SHIPPED: "Илгээгдсэн",
  DELIVERED: "Хүргэгдсэн",
  CANCELLED: "Цуцлагдсан",
  REFUNDED: "Буцаагдсан",
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-indigo-100 text-indigo-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-slate-100 text-slate-700",
}

export default function SearchClient({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const { toast } = useToast()

  async function handleSearch(e?: React.FormEvent, searchQuery?: string) {
    if (e) e.preventDefault()
    const q = searchQuery ?? query
    if (!q) return

    setLoading(true)
    const result = await getOrdersByQuery(q)
    setLoading(false)
    setHasSearched(true)
    
    if (result.success) {
      setOrders(result.orders)
    } else {
      toast({ variant: "destructive", title: "Алдаа", description: "Хайлт хийхэд алдаа гарлаа" })
    }
  }

  useEffect(() => {
    if (initialQuery && !hasSearched) {
      handleSearch(undefined, initialQuery)
    }
  }, [initialQuery])

  return (
    <div className="space-y-6 max-w-5xl mx-auto mt-4">
      {/* Search */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-3">
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-slate-50 text-lg py-6" 
            placeholder="Утас, данс, захиалгын дугаар..." 
          />
          <Button type="submit" disabled={loading} className="bg-[#4F46E5] hover:bg-[#4338ca] text-white px-8 h-auto">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Хайх
          </Button>
        </form>
      </div>

      {!hasSearched ? null : orders.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border shadow-sm border-dashed flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-2">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-medium text-slate-700">Илэрц олдсонгүй</h3>
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-slate-50">
            <span className="text-sm font-bold text-slate-700">{orders.length} захиалга олдлоо</span>
          </div>
          <div className="divide-y">
            {orders.map((order: any) => (
              <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-indigo-600">#{order.orderNumber}</span>
                      <span className="font-semibold text-slate-800">{order.customerName}</span>
                      <span className="text-xs text-slate-400 font-mono">{order.customerPhone}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 truncate max-w-md">
                      {order.items?.map((i: any) => `${i.productName} (${i.quantity})`).join(", ") || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.orderStatus] || "bg-slate-100"}`}>
                    {STATUS_LABELS[order.orderStatus] || order.orderStatus}
                  </span>
                  <span className="font-bold text-slate-800">₮{Number(order.totalAmount).toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Bell, CheckCircle2, Truck, User } from "lucide-react"
import Link from "next/link"
import { getRecentNotifications } from "@/app/actions/order-actions"

interface OrderItem {
  orderId: string
  productName: string
  quantity: number
  totalAmount: number
  batchId: string
}

interface OrderNotification {
  type: "new-order" | "order-confirmed" | "delivery-request" | "system-alert"
  // new-order fields
  transactionRef?: string
  customerName?: string
  customerPhone?: string
  items?: OrderItem[]
  totalAmount: number
  wantsDelivery?: boolean
  createdAt?: string
  // order-confirmed fields
  name?: string
  phone?: string
  // delivery-request fields
  address?: string
  orderCount?: number
  // system-alert fields
  message?: string
  details?: string
}

export function OrderNotificationListener() {
  const [notifications, setNotifications] = useState<OrderNotification[]>([])
  const [visible, setVisible] = useState(false)
  const [seenCount, setSeenCount] = useState(0)
  const [showToast, setShowToast] = useState<OrderNotification | null>(null)

  const unread = notifications.length - seenCount

  const pendingGroupRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const formatTime = (isoString?: string) => {
    if (!isoString) return ""
    return new Date(isoString).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })
  }

  const addNotification = useCallback((n: OrderNotification) => {
    // For new-order events, debounce-group by transactionRef (same cart checkout)
    if (n.type === "new-order" && n.transactionRef) {
      const ref = n.transactionRef
      setNotifications(prev => {
        const existingIdx = prev.findIndex(p => p.type === "new-order" && p.transactionRef === ref)
        if (existingIdx >= 0) {
          // Merge items into existing notification
          const updated = [...prev]
          const existing = { ...updated[existingIdx] }
          existing.items = [...(existing.items || []), ...(n.items || [])]
          existing.totalAmount = (existing.totalAmount || 0) + (n.totalAmount || 0)
          updated[existingIdx] = existing
          return updated
        }
        return [n, ...prev].slice(0, 20)
      })
      // Only show/refresh the toast once after merging settles
      if (pendingGroupRef.current[ref]) clearTimeout(pendingGroupRef.current[ref])
      pendingGroupRef.current[ref] = setTimeout(() => {
        setNotifications(prev => {
          const found = prev.find(p => p.type === "new-order" && p.transactionRef === ref)
          if (found) setShowToast(found)
          return prev
        })
        setTimeout(() => setShowToast(null), 7000)
        delete pendingGroupRef.current[ref]
      }, 1500)
    } else {
      setNotifications(prev => [n, ...prev].slice(0, 20))
      setShowToast(n)
      setTimeout(() => setShowToast(null), 7000)
    }
  }, [])

  useEffect(() => {
    getRecentNotifications().then(res => {
      if (res.success && res.notifications) {
        setNotifications(res.notifications as OrderNotification[])
      }
    })

    const es = new EventSource("/api/notifications/stream")
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        // Valid types: new-order, order-confirmed, delivery-request, system-alert
        if (data.type === "new-order" || data.type === "order-confirmed" || data.type === "delivery-request" || data.type === "system-alert") {
          addNotification(data as OrderNotification)
        }
      } catch {}
    }
    return () => es.close()
  }, [addNotification])

  return (
    <>
      {/* Bell */}
      <div className="relative">
        <button
          onClick={() => {
            setVisible(v => {
              if (!v) setSeenCount(notifications.length)
              return !v
            })
          }}
          className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Bell className={`w-5 h-5 ${unread > 0 ? "text-indigo-600" : "text-slate-500"}`} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {visible && (
          <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
              <span className="font-semibold text-slate-800 text-sm">Мэдэгдэл</span>
              {notifications.length > 0 && (
                <button onClick={() => setNotifications([])} className="text-xs text-slate-400 hover:text-slate-600">
                  Цэвэрлэх
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-400 text-sm">Одоогоор мэдэгдэл алга</div>
            ) : (
              <ul className="max-h-80 overflow-y-auto divide-y">
                {notifications.map((n, i) => (
                  <li key={`${n.transactionRef || n.type}-${i}`} className="hover:bg-slate-50 transition-colors">
                    {n.type === "new-order" ? (
                      <Link
                        href="/admin/orders/pending"
                        onClick={() => setVisible(false)}
                        className="block px-4 py-3"
                      >
                        <div className="flex justify-between items-start mb-1.5">
                          <p className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                            🛒 Шинэ захиалга
                          </p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                            {formatTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {n.customerName}
                          {n.customerPhone && <span className="text-slate-400 font-normal text-xs ml-1">{n.customerPhone}</span>}
                        </p>
                        {(n.items || []).map((item, j) => (
                          <p key={j} className="text-xs text-slate-500 mt-0.5 truncate pl-4">
                            · {item.productName} × {item.quantity}
                          </p>
                        ))}
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs font-bold text-indigo-600">₮{Number(n.totalAmount).toLocaleString()}</p>
                          {n.wantsDelivery && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                              <Truck className="w-2.5 h-2.5" /> Хүргэлт
                            </span>
                          )}
                        </div>
                      </Link>
                    ) : n.type === "order-confirmed" ? (
                      <Link href="/admin/orders/pending" onClick={() => setVisible(false)} className="block px-4 py-3">
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-green-700 text-sm flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Төлбөр орлоо
                          </p>
                          <span className="text-xs text-slate-400 ml-2">Одоо</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-700 mt-1">{n.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">{n.transactionRef}</p>
                        <p className="text-xs font-bold text-green-600 mt-0.5">₮{Number(n.totalAmount).toLocaleString()}</p>
                      </Link>
                    ) : n.type === "system-alert" ? (
                      <Link href="/admin/products?status=DRAFT" onClick={() => setVisible(false)} className="block px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900 leading-tight">Системийн мэдээлэл</p>
                        <p className="text-xs font-medium text-slate-700 mt-0.5">{n.message}</p>
                        {n.details && <p className="text-[11px] text-slate-500 mt-0.5">{n.details}</p>}
                        <p className="text-[10px] text-slate-400 mt-1">{formatTime(n.createdAt)}</p>
                      </Link>
                    ) : (
                      <Link href="/admin/orders" onClick={() => setVisible(false)} className="block px-4 py-3">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-semibold text-amber-700 text-sm flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-amber-500" /> 🚚 Хүргэлт захиалга
                          </p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                            {formatTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {n.customerName}
                          {n.customerPhone && <span className="text-slate-400 font-normal text-xs ml-1">{n.customerPhone}</span>}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">📍 {n.address}</p>
                        <p className="text-xs font-bold text-amber-600 mt-0.5">{n.orderCount} бараа хүргүүлнэ</p>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-white border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className={`h-1 ${showToast.type === "new-order" ? "bg-gradient-to-r from-indigo-500 to-purple-500" : showToast.type === "delivery-request" ? "bg-gradient-to-r from-amber-400 to-orange-500" : showToast.type === "system-alert" ? "bg-gradient-to-r from-blue-400 to-cyan-500" : "bg-gradient-to-r from-green-400 to-emerald-500"}`} />
          <div className="p-4 flex gap-4">
            <div className="flex-shrink-0 pt-0.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${showToast.type === "new-order" ? "bg-indigo-100" : showToast.type === "delivery-request" ? "bg-amber-100" : showToast.type === "system-alert" ? "bg-blue-100" : "bg-green-100"}`}>
                {showToast.type === "new-order" ? <Bell className="w-4 h-4 text-indigo-600" /> : showToast.type === "delivery-request" ? <Truck className="w-4 h-4 text-amber-600" /> : showToast.type === "system-alert" ? <Bell className="w-4 h-4 text-blue-600" /> : <CheckCircle2 className="w-4 h-4 text-green-600" />}
              </div>
            </div>
            <div className="flex-1 min-w-0">
                {showToast.type === "new-order" ? (
                  <>
                    <p className="font-semibold text-slate-900 text-sm">🛒 Шинэ захиалга!</p>
                    <p className="text-sm text-slate-700 font-medium mt-0.5">{showToast.customerName}</p>
                    {(showToast.items || []).map((item, j) => (
                      <p key={j} className="text-xs text-slate-500 truncate">· {item.productName} × {item.quantity}</p>
                    ))}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-indigo-600 font-bold text-xs">₮{Number(showToast.totalAmount).toLocaleString()}</span>
                      {showToast.wantsDelivery && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <Truck className="w-2.5 h-2.5" /> Хүргэлт
                        </span>
                      )}
                    </div>
                  </>
                ) : showToast.type === "order-confirmed" ? (
                  <>
                    <p className="font-semibold text-slate-900 text-sm">✅ Төлбөр орлоо!</p>
                    <p className="text-sm text-slate-600 mt-0.5">{showToast.name}</p>
                    <p className="text-xs text-green-600 font-bold mt-0.5">₮{Number(showToast.totalAmount).toLocaleString()}</p>
                  </>
                ) : showToast.type === "delivery-request" ? (
                  <>
                    <p className="font-semibold text-slate-900 text-sm">🚚 Хүргэлт захиалга!</p>
                    <p className="text-sm text-slate-700 font-medium mt-0.5">{showToast.customerName}</p>
                    <p className="text-xs text-slate-500 truncate">📍 {showToast.address}</p>
                    <p className="text-xs text-amber-600 font-bold mt-0.5">{showToast.orderCount} бараа хүргүүлнэ</p>
                  </>
                ) : showToast.type === "system-alert" ? (
                  <>
                    <p className="font-semibold text-slate-900 text-sm">Системийн мэдээлэл</p>
                    <p className="text-xs font-medium text-slate-700 mt-0.5">{showToast.message}</p>
                    {showToast.details && <p className="text-[11px] text-slate-500 mt-1">{showToast.details}</p>}
                    <p className="text-[10px] text-slate-400 mt-1.5">{formatTime(showToast.createdAt)}</p>
                  </>
                ) : null}
              </div>
              <button onClick={() => setShowToast(null)} className="text-slate-300 hover:text-slate-500 mt-0.5 flex-shrink-0">✕</button>
            </div>
            <Link
              href={showToast.type === "system-alert" ? "/admin/products?status=DRAFT" : "/admin/orders/pending"}
              onClick={() => setShowToast(null)}
              className={`mt-3 flex items-center justify-center w-full py-2 text-xs font-semibold rounded-lg transition-colors ${
                showToast.type === "new-order"
                  ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                  : showToast.type === "delivery-request"
                    ? "bg-amber-50 hover:bg-amber-100 text-amber-700"
                    : showToast.type === "system-alert"
                      ? "bg-blue-50 hover:bg-blue-100 text-blue-700"
                      : "bg-green-50 hover:bg-green-100 text-green-700"
              }`}
            >
              {showToast.type === "system-alert" ? "Ноорог харах →" : "Хүлээгдэж буй захиалга харах →"}
            </Link>
          </div>
      )}
    </>
  )
}

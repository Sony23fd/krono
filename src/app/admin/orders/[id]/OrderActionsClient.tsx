"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Truck, Package, RotateCcw, Loader2, AlertTriangle, ArrowRight } from "lucide-react"

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Хүлээгдэж буй",
  PAID: "Төлбөр баталгаажсан",
  PROCESSING: "Боловсруулж буй",
  SHIPPED: "Илгээгдсэн",
  DELIVERED: "Хүргэгдсэн",
  CANCELLED: "Цуцлагдсан",
  REFUNDED: "Буцаагдсан",
}

const STATUS_ICONS: Record<string, any> = {
  PAID: CheckCircle2,
  PROCESSING: Package,
  SHIPPED: Truck,
  DELIVERED: CheckCircle2,
  CANCELLED: XCircle,
  REFUNDED: RotateCcw,
}

const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-blue-600 hover:bg-blue-700 text-white",
  PROCESSING: "bg-indigo-600 hover:bg-indigo-700 text-white",
  SHIPPED: "bg-purple-600 hover:bg-purple-700 text-white",
  DELIVERED: "bg-green-600 hover:bg-green-700 text-white",
  CANCELLED: "bg-red-600 hover:bg-red-700 text-white",
  REFUNDED: "bg-slate-600 hover:bg-slate-700 text-white",
}

// Зөвшөөрөгдөх шилжилтүүд
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
  PROCESSING: ["SHIPPED", "DELIVERED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
}

interface OrderActionsClientProps {
  orderId: string
  currentStatus: string
  orderNumber: number
  paymentMethod?: string
}

export function OrderActionsClient({ orderId, currentStatus, orderNumber, paymentMethod }: OrderActionsClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const allowedStatuses = VALID_TRANSITIONS[currentStatus] || []

  async function handleConfirmPayment() {
    setLoading("PAID")
    try {
      const { adminConfirmPayment } = await import("@/app/actions/order-actions")
      const result = await adminConfirmPayment(orderId)
      if (result.success) {
        toast.success(`#${orderNumber} — Төлбөр баталгаажуулагдлаа`)
        router.refresh()
      } else {
        toast.error(result.error || "Алдаа гарлаа")
      }
    } catch (e: any) {
      toast.error(e.message || "Алдаа гарлаа")
    } finally {
      setLoading(null)
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (newStatus === "CANCELLED") {
      setShowCancelConfirm(true)
      return
    }
    setLoading(newStatus)
    try {
      const { updateOrderStatus } = await import("@/app/actions/order-actions")
      const result = await updateOrderStatus(orderId, newStatus)
      if (result.success) {
        toast.success(`#${orderNumber} — ${STATUS_LABELS[newStatus]}`)
        router.refresh()
      } else {
        toast.error(result.error || "Алдаа гарлаа")
      }
    } catch (e: any) {
      toast.error(e.message || "Алдаа гарлаа")
    } finally {
      setLoading(null)
    }
  }

  async function handleCancel() {
    setLoading("CANCELLED")
    try {
      const { cancelOrder } = await import("@/app/actions/order-actions")
      const result = await cancelOrder(orderId, cancelReason || "Админ цуцалсан")
      if (result.success) {
        toast.success(`#${orderNumber} — Захиалга цуцлагдлаа`)
        setShowCancelConfirm(false)
        router.refresh()
      } else {
        toast.error(result.error || "Алдаа гарлаа")
      }
    } catch (e: any) {
      toast.error(e.message || "Алдаа гарлаа")
    } finally {
      setLoading(null)
    }
  }

  if (allowedStatuses.length === 0) {
    return (
      <div className="bg-slate-50 rounded-xl border p-5 text-center">
        <p className="text-slate-400 text-sm font-medium">Энэ захиалганд хийх үйлдэл байхгүй</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border p-6 space-y-4">
      <h2 className="font-bold text-slate-900 flex items-center gap-2">
        <ArrowRight className="w-4 h-4 text-indigo-500" />
        Үйлдлүүд
      </h2>

      {/* Status Flow Indicator */}
      <div className="bg-slate-50 rounded-lg p-3">
        <p className="text-xs text-slate-500 mb-2 font-medium">Одоогийн статус → Шилжүүлэх боломжтой:</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
            {STATUS_LABELS[currentStatus]}
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          {allowedStatuses.map(s => (
            <span key={s} className="text-xs font-medium px-2 py-0.5 rounded-full bg-white border text-slate-600">
              {STATUS_LABELS[s]}
            </span>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {/* PENDING → PAID: Тусгай "Төлбөр баталгаажуулах" товч */}
        {currentStatus === "PENDING" && allowedStatuses.includes("PAID") && (
          <button
            onClick={handleConfirmPayment}
            disabled={!!loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50 shadow-sm"
          >
            {loading === "PAID" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            ✅ Төлбөр баталгаажуулах
          </button>
        )}

        {/* Бусад статус шилжилтүүд */}
        {allowedStatuses.filter(s => !(currentStatus === "PENDING" && s === "PAID")).filter(s => s !== "CANCELLED").map(status => {
          const Icon = STATUS_ICONS[status] || Package
          return (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={!!loading}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 shadow-sm ${STATUS_STYLES[status]}`}
            >
              {loading === status ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
              {STATUS_LABELS[status]}
            </button>
          )
        })}

        {/* Цуцлах */}
        {allowedStatuses.includes("CANCELLED") && (
          <button
            onClick={() => setShowCancelConfirm(true)}
            disabled={!!loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            Цуцлах
          </button>
        )}
      </div>

      {/* Cancel confirmation */}
      {showCancelConfirm && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3 animate-in slide-in-from-top-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-red-800 text-sm">Захиалга #{orderNumber}-г цуцлахдаа итгэлтэй юу?</p>
              <p className="text-xs text-red-600 mt-1">Цуцласан захиалгын нөөцлөгдсөн бараа буцаагдах болно.</p>
            </div>
          </div>
          <input
            type="text"
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder="Цуцлах шалтгаан (заавал биш)"
            className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={!!loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
            >
              {loading === "CANCELLED" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Тийм, цуцлах
            </button>
            <button
              onClick={() => { setShowCancelConfirm(false); setCancelReason("") }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white border text-slate-700 hover:bg-slate-50"
            >
              Болих
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

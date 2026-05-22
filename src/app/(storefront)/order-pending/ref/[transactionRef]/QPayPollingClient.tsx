"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { checkQPayPaymentStatus } from "@/app/actions/qpay-actions"
import { CheckCircle2, Loader2, RefreshCw, Smartphone, Clock, AlertCircle, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

interface QPayPollingClientProps {
  paymentId: string
  qrImage?: string
  urls?: any[]
  customerPhone: string
}

type PaymentStatus = "CHECKING" | "PENDING" | "VERIFIED" | "FAILED"

export function QPayPollingClient({ paymentId, qrImage, urls, customerPhone }: QPayPollingClientProps) {
  const router = useRouter()
  const [status, setStatus] = useState<PaymentStatus>("CHECKING")
  const [message, setMessage] = useState("Төлбөрийг шалгаж байна...")
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null)
  const [verifiedBy, setVerifiedBy] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState<number | null>(null)
  const [countdown, setCountdown] = useState(5)
  const [isManualChecking, setIsManualChecking] = useState(false)
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  const checkPaymentStatus = useCallback(async () => {
    try {
      const result = await checkQPayPaymentStatus(paymentId)

      if (!result.success) {
        setStatus("PENDING")
        setMessage(result.error || "Шалгаж байна...")
        return
      }

      if (result.status === "VERIFIED" || result.paid) {
        setStatus("VERIFIED")
        setVerifiedAt(result.verifiedAt || new Date().toISOString())
        setVerifiedBy(result.verifiedBy || "UNKNOWN")
        setOrderNumber(result.orderNumber || null)

        if (pollRef.current) clearInterval(pollRef.current)
        if (countdownRef.current) clearInterval(countdownRef.current)

        toast.success("Төлбөр баталгаажлаа!")
        setTimeout(() => {
          router.push(`/track?q=${customerPhone}`)
        }, 3000)
        return
      }

      if (result.status === "FAILED") {
        setStatus("FAILED")
        setMessage(result.error || "Алдаа гарлаа")
        return
      }

      // PENDING - continue polling
      setStatus("PENDING")
      setMessage("Төлбөр хүлээгдэж байна. QPay апп-аар төлнө үү.")

    } catch (error: any) {
      setStatus("PENDING")
      setMessage("Шалгаж байна...")
    }

    setLastCheckTime(new Date())
  }, [paymentId, customerPhone, router])

  // Initial check and polling
  useEffect(() => {
    // Initial check
    checkPaymentStatus()

    // Countdown timer
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return 5
        return prev - 1
      })
    }, 1000)

    // Polling: every 5 seconds
    pollRef.current = setInterval(() => {
      checkPaymentStatus()
      setCountdown(5) // Reset countdown after each poll
    }, 5000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [checkPaymentStatus])

  // Manual check
  async function handleManualCheck() {
    setIsManualChecking(true)
    await checkPaymentStatus()
    setIsManualChecking(false)
  }

  // Format verified time
  function formatVerifiedTime(isoString: string): string {
    const date = new Date(isoString)
    return date.toLocaleString("mn-MN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  // Get verification method label
  function getVerificationMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      "AUTO": "QPay Callback",
      "CLIENT": "Автомат шалгалт",
      "MANUAL": "Админ шалгалт",
      "ADMIN": "Админ шалгалт",
      "UNKNOWN": "Тодорхойгүй",
    }
    return labels[method] || method
  }

  // ═══ VERIFIED STATE ═══
  if (status === "VERIFIED") {
    return (
      <div className="text-center space-y-4 py-6 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-emerald-800">Төлбөр баталгаажлаа!</h2>
        <p className="text-sm text-emerald-600 font-medium">Захиалга амжилттай баталгаажлаа</p>

        {/* Verification details */}
        {verifiedAt && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-left space-y-2">
            <div className="flex items-center gap-2 text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">Баталгаажуулалтын мэдээлэл</span>
            </div>
            <div className="text-xs text-emerald-600 space-y-1">
              <p>✅ <strong>Баталгаажсан:</strong> {formatVerifiedTime(verifiedAt)}</p>
              {verifiedBy && (
                <p>🔐 <strong>Арга:</strong> {getVerificationMethodLabel(verifiedBy)}</p>
              )}
              {orderNumber && (
                <p>📋 <strong>Захиалга:</strong> #{orderNumber}</p>
              )}
            </div>
          </div>
        )}

        <Loader2 className="w-5 h-5 text-emerald-600 animate-spin mx-auto" />
        <p className="text-sm text-slate-500">Захиалгын хуудас руу шилжиж байна...</p>
      </div>
    )
  }

  // ═══ FAILED STATE ═══
  if (status === "FAILED") {
    return (
      <div className="text-center space-y-4 py-6">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-red-800">Төлбөр баталгаажлаагүй</h2>
        <p className="text-sm text-red-600">{message}</p>
        <button
          onClick={handleManualCheck}
          disabled={isManualChecking}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
        >
          Дахин шалгах
        </button>
      </div>
    )
  }

  // ═══ PENDING / CHECKING STATE ═══
  return (
    <div className="space-y-5">
      {/* QPay QR Image */}
      {qrImage && (
        <div className="flex flex-col items-center space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">QPay QR код</p>
          <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
            <img src={`data:image/png;base64,${qrImage}`} alt="QPay QR" className="w-48 h-48" />
          </div>
          <p className="text-xs text-slate-400">Банкны аппаар сканнердаж төлнө үү</p>
        </div>
      )}

      {/* Bank App Deep Links */}
      {urls && urls.length > 0 && (
        <div>
          <p className="text-xs text-center font-semibold text-slate-500 mb-3 uppercase tracking-wider flex items-center justify-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" /> Гар утаснаас нээх
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {urls.map((bank: any) => (
              <a
                key={bank.name}
                href={bank.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 p-1.5 hover:bg-slate-50 rounded-lg transition-colors"
              >
                {bank.logo && <img src={bank.logo} alt={bank.name} className="w-10 h-10 rounded-lg shadow-sm" />}
                <span className="text-[9px] text-slate-500 text-center leading-tight line-clamp-2">{bank.description || bank.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Status indicator */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
        {/* Status header */}
        <div className="flex items-center justify-center gap-2">
          {status === "CHECKING" ? (
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          ) : (
            <Clock className="w-5 h-5 text-blue-600" />
          )}
          <span className="text-blue-800 font-semibold text-sm">
            {status === "CHECKING" ? "Төлбөрийг шалгаж байна..." : "Төлбөр хүлээгдэж байна"}
          </span>
        </div>

        {/* Message */}
        <p className="text-xs text-blue-700 text-center">{message}</p>

        {/* Last check time */}
        {lastCheckTime && (
          <div className="text-center">
            <p className="text-[10px] text-blue-500">
              Сүүлд шалгасан: {lastCheckTime.toLocaleString("mn-MN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          </div>
        )}

        {/* Countdown indicator */}
        <div className="flex items-center justify-center gap-1.5">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i <= countdown ? "bg-blue-500" : "bg-blue-200"
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] text-blue-600">{countdown}с</span>
        </div>
      </div>

      {/* Manual check button */}
      <button
        onClick={handleManualCheck}
        disabled={isManualChecking}
        className="w-full bg-[#1B3561] hover:bg-blue-900 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
      >
        {isManualChecking ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Шалгаж байна...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            Гараар шалгах
          </>
        )}
      </button>

      {/* Instructions */}
      <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 space-y-1">
        <p className="font-medium text-slate-600 mb-1">📋 Заавар:</p>
        <p>1. QPay апп нээнэ үү</p>
        <p>2. QR код сканнердах эсвэл дансаар төлөх</p>
        <p>3. Төлбөр хийсний дараа автоматаар баталгаажна</p>
      </div>
    </div>
  )
}
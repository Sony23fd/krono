"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { checkPaylinkPaymentStatus } from "@/app/actions/paylink-actions"
import { CheckCircle2, Loader2, RefreshCw, Clock, AlertCircle, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

interface PaylinkPollingClientProps {
  paymentId: string
  qrImage?: string
  paymentUrl?: string
  customerPhone: string
}

type PaymentStatus = "CHECKING" | "PENDING" | "VERIFIED" | "FAILED"

export function PaylinkPollingClient({ paymentId, qrImage, paymentUrl, customerPhone }: PaylinkPollingClientProps) {
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
  const popupRef = useRef<Window | null>(null)

  const openPaymentPopup = () => {
    if (!paymentUrl) return
    
    // Calculate center position for popup
    const width = 600
    const height = 800
    const left = (window.innerWidth - width) / 2
    const top = (window.innerHeight - height) / 2
    
    popupRef.current = window.open(
      paymentUrl,
      'PaylinkPayment',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    )
  }

  const checkPaymentStatus = useCallback(async () => {
    try {
      const result = await checkPaylinkPaymentStatus(paymentId)

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

        // Close the popup window if it is still open
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close()
        }

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

      // PENDING
      setStatus("PENDING")
      setMessage("Төлбөр хүлээгдэж байна. Цонхыг нээж төлбөрөө төлнө үү.")

    } catch (error: any) {
      setStatus("PENDING")
      setMessage("Шалгаж байна...")
    }

    setLastCheckTime(new Date())
  }, [paymentId, customerPhone, router])

  // Initial check and polling
  useEffect(() => {
    checkPaymentStatus()

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return 5
        return prev - 1
      })
    }, 1000)

    pollRef.current = setInterval(() => {
      checkPaymentStatus()
      setCountdown(5)
    }, 5000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
      // Do not force close popup on unmount if they are still paying
    }
  }, [checkPaymentStatus])

  async function handleManualCheck() {
    setIsManualChecking(true)
    await checkPaymentStatus()
    setIsManualChecking(false)
  }

  function formatVerifiedTime(isoString: string): string {
    const date = new Date(isoString)
    return date.toLocaleString("mn-MN", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    })
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
        <Loader2 className="w-5 h-5 text-emerald-600 animate-spin mx-auto" />
      </div>
    )
  }

  // ═══ PENDING / CHECKING STATE ═══
  return (
    <div className="space-y-5">
      {/* Paylink Payment Popup Button */}
      {paymentUrl && (
        <div className="text-center">
          <button
            onClick={openPaymentPopup}
            className="inline-block bg-[#1B3561] hover:bg-blue-900 text-white px-6 py-4 w-full rounded-xl font-bold text-[15px] shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all"
          >
            Төлбөр төлөх цонх нээх
          </button>
        </div>
      )}

      {/* Status indicator */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
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
        <p className="text-xs text-blue-700 text-center">{message}</p>
        
        <div className="flex items-center justify-center gap-1.5">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i <= countdown ? "bg-blue-500" : "bg-blue-200"}`} />
            ))}
          </div>
          <span className="text-[10px] text-blue-600">{countdown}с</span>
        </div>
      </div>

      <button
        onClick={handleManualCheck}
        disabled={isManualChecking}
        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
      >
        {isManualChecking ? "Шалгаж байна..." : "Гараар шалгах"}
      </button>
    </div>
  )
}

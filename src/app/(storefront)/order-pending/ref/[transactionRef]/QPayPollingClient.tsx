"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { checkQPayPaymentStatus } from "@/app/actions/qpay-actions"
import { CheckCircle2, Loader2, RefreshCw, Smartphone } from "lucide-react"
import { toast } from "sonner"

interface QPayPollingClientProps {
  paymentId: string
  qrImage?: string
  urls?: any[]
  customerPhone: string
}

export function QPayPollingClient({ paymentId, qrImage, urls, customerPhone }: QPayPollingClientProps) {
  const router = useRouter()
  const [paid, setPaid] = useState(false)
  const [checking, setChecking] = useState(false)
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)

  // Auto-polling: 5 секунд тутам шалгах
  useEffect(() => {
    const poll = async () => {
      try {
        const result = await checkQPayPaymentStatus(paymentId)
        if (result.success && result.paid) {
          setPaid(true)
          if (pollRef.current) clearInterval(pollRef.current)
          toast.success("Төлбөр амжилттай баталгаажлаа! 🎉")
          setTimeout(() => {
            router.push(`/track?q=${customerPhone}`)
          }, 2000)
        }
      } catch {}
    }

    // Шууд нэг удаа шалгах
    poll()

    // 5 секунд тутам давтах
    pollRef.current = setInterval(poll, 5000)

    // Countdown timer (visual)
    const countdownRef = setInterval(() => {
      setSecondsLeft(prev => (prev <= 0 ? 5 : prev - 1))
    }, 1000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      clearInterval(countdownRef)
    }
  }, [paymentId, customerPhone, router])

  // Гараар шалгах
  async function handleManualCheck() {
    setChecking(true)
    try {
      const result = await checkQPayPaymentStatus(paymentId)
      if (result.success && result.paid) {
        setPaid(true)
        toast.success("Төлбөр амжилттай баталгаажлаа! 🎉")
        setTimeout(() => router.push(`/track?q=${customerPhone}`), 2000)
      } else {
        toast.info("Төлбөр хүлээгдэж байна. Банкны апп-аас QPay-ээр төлнө үү.")
      }
    } catch {
      toast.error("Шалгахад алдаа гарлаа")
    } finally {
      setChecking(false)
    }
  }

  if (paid) {
    return (
      <div className="text-center space-y-4 py-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-in zoom-in">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-green-800">Төлбөр баталгаажлаа! 🎉</h2>
        <p className="text-sm text-slate-500">Захиалгын хуудас руу шилжиж байна...</p>
        <Loader2 className="w-5 h-5 text-green-600 animate-spin mx-auto" />
      </div>
    )
  }

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

      {/* Polling indicator + Manual check */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-center gap-2 text-blue-700 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin" />
          Төлбөр хүлээж байна... ({secondsLeft}с)
        </div>
        <button
          onClick={handleManualCheck}
          disabled={checking}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
          {checking ? "Шалгаж байна..." : "Гараар шалгах"}
        </button>
      </div>
    </div>
  )
}

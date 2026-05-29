"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, AlertCircle, MessageSquare, ArrowLeft, ArrowRight, Lock, Phone } from "lucide-react"
import Link from "next/link"
import { startPhoneVerification } from "@/app/actions/verify-actions"
import { resetPassword } from "@/app/actions/auth-actions"
import { isValidPhone } from "@/lib/customer-utils"
import { toast } from "sonner"
import { useCustomerAuth } from "@/context/CustomerAuthContext"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { refreshCustomer } = useCustomerAuth()
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const [step, setStep] = useState<"info" | "verify" | "resetting">("info")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [infoLoading, setInfoLoading] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)

  // Step 2: SMS verification
  const [verifySessionId, setVerifySessionId] = useState<string | null>(null)
  const [verifySmsUri, setVerifySmsUri] = useState<string | null>(null)
  const [verifyInstruction, setVerifyInstruction] = useState<string | null>(null)
  const [verifyExpiresAt, setVerifyExpiresAt] = useState<string | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [verifyingManually, setVerifyingManually] = useState(false)

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const startPolling = useCallback((sessionId: string, expiresAt: string) => {
    if (pollRef.current) clearInterval(pollRef.current)

    pollRef.current = setInterval(async () => {
      if (Date.now() > new Date(expiresAt).getTime()) {
        if (pollRef.current) clearInterval(pollRef.current)
        setVerifyError("Хугацаа дууссан. Дахин оролдоно уу.")
        setVerifySessionId(null)
        setVerifySmsUri(null)
        setVerifyInstruction(null)
        return
      }

      try {
        const res = await fetch(`/api/verify-mn/status/${sessionId}`, { cache: "no-store" })
        const data = await res.json()

        if (data.status === "VERIFIED") {
          if (pollRef.current) clearInterval(pollRef.current)
          setVerifySessionId(null)
          setVerifySmsUri(null)
          setVerifyInstruction(null)
          toast.success("Утас амжилттай баталгаажлаа!")
          handleReset()
        } else if (data.status === "EXPIRED") {
          if (pollRef.current) clearInterval(pollRef.current)
          setVerifyError("Хугацаа дууссан. Дахин оролдоно уу.")
          setVerifySessionId(null)
          setVerifySmsUri(null)
          setVerifyInstruction(null)
        }
      } catch {
        // Silent
      }
    }, 3000)
  }, [phone, password])

  async function handleStartVerification(e: React.FormEvent) {
    e.preventDefault()
    setGeneralError(null)

    const digits = phone.replace(/\D/g, "")
    if (digits.length !== 8) {
      setPhoneError("Утасны дугаар 8 оронтой байх ёстой")
      return
    }
    if (!isValidPhone(digits)) {
      setPhoneError("Зөв утасны дугаар оруулна уу")
      return
    }
    if (password.length < 6) {
      toast.error("Шинэ нууц үг дор хаяж 6 тэмдэгт байх ёстой")
      return
    }

    setInfoLoading(true)
    setPhoneError(null)

    // For forgot password, we ALWAYS require SMS verification to prove ownership
    const result = await startPhoneVerification(digits)

    if (!result.success) {
      setGeneralError(result.error || "Алдаа гарлаа")
      setInfoLoading(false)
      return
    }

    if (result.sessionId === "already-verified" || result.sessionId === "skipped" || result.status === "VERIFIED") {
      toast.success("Утас баталгаажлаа!")
      setInfoLoading(false)
      handleReset()
      return
    }

    setVerifySessionId(result.sessionId!)
    setVerifySmsUri(result.smsUri || null)
    setVerifyInstruction(result.displayInstruction || null)
    setVerifyExpiresAt(result.expiresAt || null)
    setStep("verify")
    setInfoLoading(false)

    if (result.sessionId && result.expiresAt) {
      startPolling(result.sessionId, result.expiresAt)
    }
  }

  async function handleManualVerify() {
    if (!verifySessionId) return
    setVerifyingManually(true)

    try {
      const res = await fetch(`/api/verify-mn/status/${verifySessionId}`, { cache: "no-store" })
      const data = await res.json()

      if (data.status === "VERIFIED") {
        setVerifySessionId(null)
        toast.success("Утас амжилттай баталгаажлаа!")
        handleReset()
      } else if (data.status === "EXPIRED") {
        setVerifyError("Хугацаа дууссан. Дахин оролдоно уу.")
        setVerifySessionId(null)
      } else {
        toast.info("Баталгаажаагүй байна. SMS илгээсэн бол түр хүлээнэ үү.")
      }
    } catch {
      toast.error("Алдаа гарлаа")
    }
    setVerifyingManually(false)
  }

  async function handleReset() {
    setStep("resetting")
    const digits = phone.replace(/\D/g, "")
    
    const result = await resetPassword(digits, password)

    if (!result.success) {
      toast.error(result.error || "Нууц үг сэргээхэд алдаа гарлаа")
      setStep("info")
      return
    }

    // Refresh context
    await refreshCustomer()
    toast.success("Нууц үг амжилттай солигдлоо!")
    router.push("/")
  }

  function handlePhoneChange(value: string) {
    const digits = value.replace(/\D/g, "")
    setPhone(digits)
    if (digits.length === 8) {
      if (!isValidPhone(digits)) {
        setPhoneError("Зөв утасны дугаар оруулна уу")
      } else {
        setPhoneError(null)
      }
    } else if (digits.length > 0) {
      setPhoneError("Утасны дугаар 8 оронтой байх ёстой")
    } else {
      setPhoneError(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#F26522] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Нууц үг үүсгэх / сэргээх</h1>
          <p className="text-slate-500 text-sm mt-1">Та утасны дугаараа баталгаажуулан шинэ нууц үг үүсгэнэ үү.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8">
          {step === "info" && (
            <form onSubmit={handleStartVerification} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Утасны дугаар</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={e => handlePhoneChange(e.target.value)}
                    maxLength={8}
                    placeholder="99112233"
                    className={`w-full border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 transition ${
                      phoneError ? "border-red-400 focus:ring-red-300" : "border-slate-200 focus:ring-[#1B3561]/30"
                    }`}
                  />
                </div>
                {phoneError && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" /> {phoneError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Шинэ нууц үг</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Хамгийн багадаа 6 тэмдэгт"
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3561]/30 transition"
                  />
                </div>
              </div>

              {generalError && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
                  {generalError}
                </div>
              )}

              <button
                type="submit"
                disabled={infoLoading || !!phoneError || phone.length !== 8 || password.length < 6}
                className="w-full py-3 bg-[#1B3561] text-white font-bold rounded-xl hover:bg-blue-900 disabled:opacity-60 transition-colors shadow-md flex items-center justify-center gap-2 mt-4"
              >
                {infoLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {infoLoading ? "Уншиж байна..." : "Утсаа баталгаажуулах"}
                {!infoLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {step === "verify" && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-[#1B3561] shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-[#1B3561]">
                      Таны утас: {phone.replace(/(\d{4})(\d{4})/, "$1 $2")}
                    </p>
                    {verifyInstruction ? (
                      <p className="text-xs text-blue-700 leading-relaxed">{verifyInstruction}</p>
                    ) : (
                      <p className="text-xs text-blue-700 leading-relaxed">
                        144773 руу SMS мессеж илгээнэ үү.
                      </p>
                    )}
                  </div>
                </div>

                {verifySmsUri && (
                  <a href={verifySmsUri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-[#1B3561] text-white rounded-lg font-semibold text-sm hover:bg-blue-900 transition-colors">
                    <MessageSquare className="w-4 h-4" /> SMS илгээх (144773)
                  </a>
                )}

                {verifyError && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {verifyError}
                  </p>
                )}

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-blue-200">
                  <div className="flex items-center gap-2 text-xs text-[#1B3561]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> SMS хүлээж байна...
                  </div>
                  <button type="button" disabled={verifyingManually} onClick={handleManualVerify} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-200 transition-colors">
                    {verifyingManually ? "Шалгаж байна..." : "Гараар шалгах"}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (pollRef.current) clearInterval(pollRef.current)
                  setStep("info")
                  setVerifySessionId(null)
                  setVerifySmsUri(null)
                  setVerifyInstruction(null)
                  setVerifyError(null)
                }}
                className="w-full py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Буцах
              </button>
            </div>
          )}

          {step === "resetting" && (
            <div className="text-center py-8 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin mx-auto text-[#F26522]" />
              <p className="text-slate-600 font-medium">Нууц үгийг хадгалж байна...</p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <Link
            href="/login"
            className="w-full py-3 text-slate-500 font-medium hover:text-[#1B3561] hover:bg-white rounded-xl transition-colors flex items-center justify-center"
          >
            Буцаад нэвтрэх рүү очих
          </Link>
        </div>
      </div>
    </div>
  )
}

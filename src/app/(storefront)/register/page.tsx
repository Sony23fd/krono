"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, CheckCircle2, AlertCircle, MessageSquare, ArrowLeft, ArrowRight, Lock } from "lucide-react"
import Link from "next/link"
import { startPhoneVerification } from "@/app/actions/verify-actions"
import { registerWithPassword } from "@/app/actions/auth-actions"
import { isValidPhone } from "@/lib/customer-utils"
import { toast } from "sonner"
import { useCustomerAuth } from "@/context/CustomerAuthContext"

const VERIFY_STORAGE_KEY = "bileg_pending_verified_phone"
const VERIFY_TTL_MS = 10 * 60 * 1000 // 10 minutes

function getStoredPendingPhone(): { phone: string; name: string; savedAt: number } | null {
  try {
    const raw = sessionStorage.getItem(VERIFY_STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (Date.now() - data.savedAt > VERIFY_TTL_MS) {
      sessionStorage.removeItem(VERIFY_STORAGE_KEY)
      return null
    }
    return data
  } catch { return null }
}

function savePendingPhone(phone: string, name: string) {
  sessionStorage.setItem(VERIFY_STORAGE_KEY, JSON.stringify({ phone, name, savedAt: Date.now() }))
}

function clearPendingPhone() {
  sessionStorage.removeItem(VERIFY_STORAGE_KEY)
}

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || "/"
  const refCode = searchParams.get('ref')
  const { refreshCustomer } = useCustomerAuth()
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const [phoneVerificationEnabled, setPhoneVerificationEnabled] = useState(true)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  // Step 1: Info
  const [step, setStep] = useState<"info" | "verify" | "registering">("info")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [inputRefCode, setInputRefCode] = useState(refCode || "")
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [infoLoading, setInfoLoading] = useState(false)

  // Step 2: SMS verification
  const [verifySessionId, setVerifySessionId] = useState<string | null>(null)
  const [verifySmsUri, setVerifySmsUri] = useState<string | null>(null)
  const [verifyInstruction, setVerifyInstruction] = useState<string | null>(null)
  const [verifyExpiresAt, setVerifyExpiresAt] = useState<string | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [verifyingManually, setVerifyingManually] = useState(false)

  useEffect(() => {
    fetch("/api/settings/phone-verification")
      .then(res => res.json())
      .then(data => setPhoneVerificationEnabled(data.enabled !== false))
      .catch(() => setPhoneVerificationEnabled(true))
      .finally(() => setSettingsLoaded(true))

    const pending = getStoredPendingPhone()
    if (pending) {
      setName(pending.name)
      setPhone(pending.phone)
      // We don't restore password from sessionStorage for security, so they might need to go back to info step
      // To simplify, let's just keep them on info step so they can fill password again.
      clearPendingPhone()
    }
  }, [])

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
          clearPendingPhone()
          toast.success("Утас амжилттай баталгаажлаа!")
          handleRegister()
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
  }, [name, phone, password, phoneVerificationEnabled]) // Dependencies needed since handleRegister uses state

  async function handleStartVerification() {
    const digits = phone.replace(/\D/g, "")
    if (digits.length !== 8) {
      setPhoneError("Утасны дугаар 8 оронтой байх ёстой")
      return
    }
    if (!isValidPhone(digits)) {
      setPhoneError("Зөв утасны дугаар оруулна уу")
      return
    }
    if (!name.trim()) {
      toast.error("Нэр оруулна уу")
      return
    }
    if (password.length < 6) {
      toast.error("Нууц үг дор хаяж 6 тэмдэгт байх ёстой")
      return
    }

    setInfoLoading(true)
    setPhoneError(null)

    savePendingPhone(digits, name.trim())

    if (!phoneVerificationEnabled) {
      clearPendingPhone()
      toast.success("Утас баталгаажлаа!")
      setInfoLoading(false)
      handleRegister()
      return
    }

    const result = await startPhoneVerification(digits)

    if (!result.success) {
      setPhoneError(result.error || "Алдаа гарлаа")
      setInfoLoading(false)
      return
    }

    if (result.sessionId === "already-verified" || result.sessionId === "skipped" || result.status === "VERIFIED") {
      clearPendingPhone()
      toast.success("Утас баталгаажлаа!")
      setInfoLoading(false)
      handleRegister()
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
        clearPendingPhone()
        toast.success("Утас амжилттай баталгаажлаа!")
        handleRegister()
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

  async function handleRegister() {
    setStep("registering")
    const digits = phone.replace(/\D/g, "")
    
    // Call the new password-based register action
    const result = await registerWithPassword(digits, name.trim(), password, phoneVerificationEnabled, inputRefCode || undefined)

    if (!result.success) {
      toast.error(result.error || "Бүртгэл амжилтгүй боллоо")
      setStep("info")
      return
    }

    await refreshCustomer()
    toast.success("Та амжилттай бүртгэгдлээ!")
    router.push(callbackUrl)
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

  if (!settingsLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-8">
        <Loader2 className="w-8 h-8 animate-spin text-[#F26522]" />
      </div>
    )
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
          <h1 className="text-2xl font-bold text-slate-800">Бүртгүүлэх</h1>
          <p className="text-slate-500 text-sm mt-1">Шинэ хэрэглэгч болох</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            step === "info" ? "bg-[#1B3561] text-white" : "bg-emerald-500 text-white"
          }`}>
            {step === "info" ? "1" : <CheckCircle2 className="w-4 h-4" />}
          </div>
          <div className="w-12 h-0.5 bg-slate-200">
            <div className={`h-full bg-emerald-500 transition-all ${step !== "info" ? "w-full" : "w-0"}`} />
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            step === "info" ? "bg-slate-200 text-slate-500" : "bg-[#1B3561] text-white"
          }`}>
            2
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8">
          {step === "info" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Таны нэр</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Жишээ: Отгоо"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3561]/30 transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Утасны дугаар</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={e => handlePhoneChange(e.target.value)}
                  maxLength={8}
                  placeholder="99112233"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition ${
                    phoneError ? "border-red-400 focus:ring-red-300" : "border-slate-200 focus:ring-[#1B3561]/30"
                  }`}
                />
                {phoneError && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {phoneError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Нууц үг зохиох</label>
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

              <button
                type="button"
                onClick={handleStartVerification}
                disabled={infoLoading || !!phoneError || !name.trim() || phone.length !== 8 || password.length < 6}
                className="w-full py-3 bg-[#F26522] text-white font-bold rounded-xl hover:bg-[#E85B1C] disabled:opacity-60 transition-colors shadow-md flex items-center justify-center gap-2 mt-2"
              >
                {infoLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {infoLoading ? "Уншиж байна..." : phoneVerificationEnabled ? "Баталгаажуулалт эхлүүлэх" : "Бүртгүүлэх"}
                {!infoLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
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

          {step === "registering" && (
            <div className="text-center py-8 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin mx-auto text-[#F26522]" />
              <p className="text-slate-600 font-medium">Бүртгэл үүсгэж байна...</p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-center text-sm text-slate-500 mb-4">Бүртгэлтэй хэрэглэгч үү?</p>
          <Link
            href={`/login${callbackUrl !== '/' ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
            className="w-full py-3 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center"
          >
            Нэвтрэх
          </Link>
        </div>
      </div>
    </div>
  )
}
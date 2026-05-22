"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle, ArrowRight, User } from "lucide-react"
import Link from "next/link"
import { beginCustomerAuth } from "@/app/actions/customer-auth-actions"
import { useCustomerAuth } from "@/context/CustomerAuthContext"
import { isValidPhone } from "@/lib/customer-utils"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useCustomerAuth()

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [phoneVerificationEnabled, setPhoneVerificationEnabled] = useState(true)

  // Check if user already logged in
  const { customer, isReady } = useCustomerAuth()

  useEffect(() => {
    // Check if user already logged in
    if (isReady && customer) {
      router.push("/")
      return
    }
    // Load phone verification setting
    fetch("/api/settings/phone-verification")
      .then(res => res.json())
      .then(data => setPhoneVerificationEnabled(data.enabled !== false))
      .catch(() => setPhoneVerificationEnabled(true))
  }, [isReady, customer, router])

  function handlePhoneChange(value: string) {
    const digits = value.replace(/\D/g, "")
    setPhone(digits)
    if (digits.length === 8) {
      if (!isValidPhone(digits)) {
        setPhoneError("Зөв утасны дугаар оруулна уу (жишээ: 99112233)")
      } else {
        setPhoneError(null)
      }
    } else if (digits.length > 0) {
      setPhoneError("Утасны дугаар 8 оронтой байх ёстой")
    } else {
      setPhoneError(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGeneralError(null)

    const digits = phone.replace(/\D/g, "")
    if (digits.length !== 8) {
      setPhoneError("Утасны дугаар заавал 8 оронтой байх ёстой")
      return
    }
    if (!isValidPhone(digits)) {
      setPhoneError("Зөв утасны дугаар оруулна уу (жишээ: 99112233)")
      return
    }
    if (!name.trim()) {
      setGeneralError("Нэр оруулна уу")
      return
    }

    setLoading(true)

    // If phone verification is disabled, skip verification and just login/register
    if (!phoneVerificationEnabled) {
      const { registerOrLoginCustomer } = await import("@/app/actions/customer-auth-actions")
      const result = await registerOrLoginCustomer(digits, name.trim())
      if (result.success) {
        setShowSuccess(true)
        await login(name.trim(), digits)
        setTimeout(() => router.push("/"), 1000)
      } else {
        setGeneralError(result.error || "Алдаа гарлаа")
      }
      setLoading(false)
      return
    }

    const result = await beginCustomerAuth(digits, name.trim())

    if (result.success && result.customer) {
      // Already verified - login successful
      setShowSuccess(true)
      await login(name.trim(), digits)
      setTimeout(() => {
        router.push("/")
      }, 1000)
    } else if ("verificationRequired" in result && result.verificationRequired) {
      // Need phone verification - redirect to register with phone
      localStorage.setItem("bileg_login_pending", JSON.stringify({
        name: name.trim(),
        phone: digits
      }))
      router.push("/register")
    } else {
      const errorResult = result as { success: false; error?: string }
      setGeneralError(errorResult.error || "Нэвтрэхэд алдаа гарлаа")
    }

    setLoading(false)
  }

  if (!isReady || customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-8">
        <Loader2 className="w-8 h-8 animate-spin text-[#F26522]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#F26522] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-900/30">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Нэвтрэх</h1>
          <p className="text-slate-500 text-sm mt-1">Таны бүртгэлд нэвтрэх</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {showSuccess ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircleIcon className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-slate-700 font-medium">Амжилттай нэвтрлээ!</p>
              <p className="text-slate-500 text-sm">Таны хуудс руу шилжиж байна...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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
                <div className="flex flex-col gap-2">
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
                <p className="text-xs text-slate-400">
                  {phoneVerificationEnabled
                    ? "Бүртгэлтэй хэрэглэгч бол та утасны дугаараа баталгаажуулах шаардлагатай."
                    : "Утасны дугаараа оруулна уу."}
                </p>
              </div>

              {generalError && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
                  {generalError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !!phoneError || !name.trim() || phone.length !== 8}
                className="w-full py-3 bg-[#F26522] text-white font-semibold rounded-xl hover:bg-[#E85B1C] disabled:opacity-60 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Бүртгэлгүй хэрэглэгч?{" "}
          <Link href="/register" className="text-[#1B3561] font-medium hover:underline">
            Бүртгүүлэх
          </Link>
        </p>
      </div>
    </div>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
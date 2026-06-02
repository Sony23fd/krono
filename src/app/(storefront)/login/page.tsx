"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, AlertCircle, ArrowRight, Lock, Phone } from "lucide-react"
import Link from "next/link"
import { loginWithPassword } from "@/app/actions/auth-actions"
import { useCustomerAuth } from "@/context/CustomerAuthContext"
import { isValidPhone } from "@/lib/customer-utils"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || "/"
  
  const { customer, isReady, refreshCustomer } = useCustomerAuth()

  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (isReady && customer) {
      router.push(callbackUrl)
    }
  }, [isReady, customer, router, callbackUrl])

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
    if (password.length < 6) {
      setGeneralError("Нууц үг буруу байна")
      return
    }

    setLoading(true)

    const result = await loginWithPassword(digits, password)

    if (result.success) {
      setShowSuccess(true)
      await refreshCustomer() // Update context from JWT
      setTimeout(() => {
        router.push(callbackUrl)
      }, 1000)
    } else {
      setGeneralError(result.error || "Нэвтрэхэд алдаа гарлаа")
      setLoading(false)
    }
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
          <div className="w-14 h-14 bg-[#F26522] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Нэвтрэх</h1>
          <p className="text-slate-500 text-sm mt-1">Өөрийн бүртгэлд нэвтэрнэ үү</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8">
          {showSuccess ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircleIcon className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-slate-700 font-bold text-lg">Амжилттай нэвтэрлээ!</p>
              <p className="text-slate-500 text-sm">Түр хүлээнэ үү...</p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
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
                  <label className="text-sm font-medium text-slate-700">Нууц үг</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Нууц үгээ оруулна уу"
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3561]/30 transition"
                    />
                  </div>
                </div>

                {generalError && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
                    {generalError}
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <Link href="/forgot-password" className="text-sm text-[#1B3561] hover:underline font-medium">
                    Нууц үгээ мартсан уу? / Хуучин хэрэглэгч
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading || !!phoneError || phone.length !== 8 || password.length < 6}
                  className="w-full py-3 bg-[#F26522] text-white font-bold rounded-xl hover:bg-[#E85B1C] disabled:opacity-60 transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
              
              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-center text-sm text-slate-500 mb-4">Бүртгэлгүй бол шинээр бүртгүүлэх</p>
                <Link
                  href={`/register${callbackUrl !== '/' ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
                  className="w-full py-3 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center"
                >
                  Бүртгүүлэх
                </Link>
              </div>
            </>
          )}
        </div>
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
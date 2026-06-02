"use client"

import { useState, useEffect, useRef } from "react"
import { useCustomerAuth } from "@/context/CustomerAuthContext"
import { User, Phone, LogOut, Loader2, Package, Shield, RefreshCcw, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { LoyaltySection } from "@/components/storefront/LoyaltySection"
import { RegionMapModal } from "@/components/storefront/RegionMapModal"

export default function ProfilePage() {
  const { customer, login, logout, isReady, isLoggingIn } = useCustomerAuth()
  const router = useRouter()
  
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [verificationSessionId, setVerificationSessionId] = useState<string | null>(null)
  const [verificationSmsUri, setVerificationSmsUri] = useState<string | null>(null)
  const [verificationInstruction, setVerificationInstruction] = useState<string | null>(null)
  const [verificationExpiresAt, setVerificationExpiresAt] = useState<string | null>(null)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [verificationSuccess, setVerificationSuccess] = useState(false)
  const [pendingName, setPendingName] = useState("")
  const [pendingPhone, setPendingPhone] = useState("")
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
      }
    }
  }, [])

  if (!isReady) return <div className="min-h-[50vh] flex items-center justify-center">Ачаалж байна...</div>

  const startPolling = (sessionId: string, expiresAt: number) => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
    }

    pollRef.current = setInterval(async () => {
      if (Date.now() > expiresAt) {
        if (pollRef.current) {
          clearInterval(pollRef.current)
        }
        setVerificationError("Хугацаа дууслаа. Дахин оролдоно уу.")
        setVerificationSessionId(null)
        setVerificationSmsUri(null)
        setVerificationInstruction(null)
        setVerificationExpiresAt(null)
        return
      }

      try {
        const res = await fetch(`/api/verify-mn/status/${sessionId}`, { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        if (data.status === "VERIFIED") {
          if (pollRef.current) {
            clearInterval(pollRef.current)
          }
          setVerificationSuccess(true)
          setVerificationError(null)
          setVerificationLoading(true)
          const finalResult = await login(pendingName, pendingPhone)
          setVerificationLoading(false)
          if (finalResult.success) {
            toast.success("Амжилттай бүртгэгдлээ!")
            router.push("/")
          } else {
            toast.error(finalResult.error || "Бүртгэлд алдаа гарлаа")
          }
        } else if (data.status === "EXPIRED") {
          if (pollRef.current) {
            clearInterval(pollRef.current)
          }
          setVerificationError("Хугацаа дууслаа. Дахин оролдоно уу.")
          setVerificationSessionId(null)
          setVerificationSmsUri(null)
          setVerificationInstruction(null)
          setVerificationExpiresAt(null)
        }
      } catch {
        // ignore polling errors
      }
    }, 3000)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !phone) return

    setVerificationError(null)
    setVerificationLoading(true)

    const result = await login(name, phone)
    setVerificationLoading(false)

    if (result.success) {
      toast.success("Амжилттай нэвтэрлээ!")
      router.push("/")
      return
    }

    if (result.verificationRequired && result.sessionId) {
      setPendingName(name)
      setPendingPhone(phone)
      setVerificationSessionId(result.sessionId)
      setVerificationSmsUri(result.smsUri || null)
      setVerificationInstruction(result.displayInstruction || null)
      setVerificationExpiresAt(result.expiresAt || null)
      setVerificationError(null)
      setVerificationSuccess(false)

      if (result.expiresAt) {
        startPolling(result.sessionId, new Date(result.expiresAt).getTime())
      }
      return
    }

    toast.error(result.error || "Нэвтрэхэд алдаа гарлаа")
  }

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editAddress, setEditAddress] = useState("")
  const [editRegion, setEditRegion] = useState("Шинэ Дархан")
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { updateProfile } = useCustomerAuth()

  // Set default values when entering edit mode
  const startEditing = () => {
    setEditName(customer?.name || "")
    if (customer?.address) {
      const match = customer.address.match(/^\[(.*?)\]\s*(.*)$/)
      if (match) {
        setEditRegion(match[1])
        setEditAddress(match[2])
      } else {
        setEditRegion("Шинэ Дархан")
        setEditAddress(customer.address)
      }
    } else {
      setEditRegion("Шинэ Дархан")
      setEditAddress("")
    }
    setIsEditing(true)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const fullAddress = `[${editRegion}] ${editAddress}`
      await updateProfile(editName, fullAddress)
      toast.success("Профайл амжилттай шинэчлэгдлээ!")
      setIsEditing(false)
    } catch (error) {
      toast.error("Алдаа гарлаа. Дахин оролдоно уу.")
    } finally {
      setIsSaving(false)
    }
  }

  if (customer) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        {/* Cover & Avatar Header */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-[#1B3561]/5 border border-slate-100 mb-8">
          <div className="h-32 bg-gradient-to-r from-[#1B3561] to-[#2a5298] w-full relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          </div>
          <div className="px-8 pb-8 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-16 mb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full flex items-center justify-center p-2 shadow-lg relative z-10 border-4 border-white">
                  <div className="w-full h-full bg-blue-50 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 sm:w-12 sm:h-12 text-[#1B3561]" />
                  </div>
                </div>
                <div className="pb-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-800">{customer.name}</h1>
                  <p className="text-slate-500 font-medium flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                    <Phone className="w-4 h-4" /> {customer.phone}
                  </p>
                </div>
              </div>
              {!isEditing && (
                <button 
                  onClick={startEditing}
                  className="px-6 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl transition-colors text-sm"
                >
                  Мэдээлэл засах
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-200 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-lg font-bold text-[#1B3561] mb-5">Профайл шинэчлэх</h3>
                <div className="grid grid-cols-1 gap-5 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Нэр</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      placeholder="Таны нэр"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3561]/30 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Утасны дугаар <span className="text-xs font-normal text-slate-400 ml-1">(Өөрчлөх боломжгүй)</span></label>
                    <input 
                      type="tel" 
                      value={customer.phone}
                      disabled
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-slate-700">Бүсчлэл сонгох</label>
                      <button
                        type="button"
                        onClick={() => setIsMapModalOpen(true)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors"
                      >
                        🗺️ Газрын зургаар харах
                      </button>
                    </div>
                    <div className="flex gap-4 mb-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="editRegion" value="Шинэ Дархан" checked={editRegion === "Шинэ Дархан"} onChange={e => setEditRegion(e.target.value)} className="accent-[#1B3561] w-4 h-4" />
                        <span className="text-sm font-medium text-slate-700">Шинэ Дархан</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="editRegion" value="Хуучин Дархан" checked={editRegion === "Хуучин Дархан"} onChange={e => setEditRegion(e.target.value)} className="accent-[#1B3561] w-4 h-4" />
                        <span className="text-sm font-medium text-slate-700">Хуучин Дархан</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Дэлгэрэнгүй хаяг</label>
                    <textarea 
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      rows={3}
                      placeholder="Дүүрэг, Хороо, Байр, Тоот..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B3561]/30 resize-none bg-white"
                    />
                    <p className="text-xs text-slate-500 mt-2">Энэ хаяг нь таны дараагийн худалдан авалтуудад автоматаар бөглөгдөх болно.</p>
                  </div>
                </div>
                
                <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 bg-slate-100 font-bold rounded-xl transition-colors"
                  >
                    Цуцлах
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="px-8 py-2.5 bg-[#1B3561] text-white font-bold rounded-xl hover:bg-[#152b4e] transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-70 flex items-center gap-2"
                  >
                    {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Хадгалж байна...</> : "Хадгалах"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Үндсэн хаяг</p>
                  {customer.address ? (
                    <p className="text-slate-700 font-medium leading-relaxed">{customer.address}</p>
                  ) : (
                    <p className="text-slate-400 italic text-sm">Хаяг оруулаагүй байна.</p>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <Link
                    href={`/track?q=${customer.phone}`}
                    className="flex-1 flex items-center justify-between px-6 py-4 bg-[#1B3561]/5 border border-[#1B3561]/10 text-[#1B3561] font-bold rounded-2xl hover:bg-[#1B3561]/10 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[#1B3561]">
                        <Package className="w-5 h-5" />
                      </div>
                      <span>Захиалгын түүх харах</span>
                    </div>
                    <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                  <button 
                    onClick={logout}
                    className="flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 font-bold rounded-2xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Гарах
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <RegionMapModal 
          isOpen={isMapModalOpen} 
          onClose={() => setIsMapModalOpen(false)} 
          defaultTab={editRegion as "Шинэ Дархан" | "Хуучин Дархан"} 
        />
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold text-[#1B3561] mb-2 text-center">Нэвтрэх</h1>
      <p className="text-slate-500 text-center mb-8">Та өөрийн мэдээллээ оруулна уу</p>
      
      <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Нэр</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Таны нэр"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Утасны дугаар</label>
            <input 
              type="tel" 
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="99112233"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
            />
          </div>
        </div>
        
        <button 
          type="submit"
          disabled={isLoggingIn}
          className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isLoggingIn ? <><Loader2 className="w-4 h-4 animate-spin" /> Нэвтэрж байна...</> : "Нэвтрэх"}
        </button>
      </form>

      {verificationSessionId && (
        <div className="mt-6 bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
              {verificationSuccess ? <CheckCircle2 className="w-7 h-7" /> : <Shield className="w-7 h-7" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Утас баталгаажуулах</h2>
              <p className="text-sm text-slate-500">{verificationInstruction || "Та Verify.mn рүү 144773 дугаарт SMS илгээнэ үү."}</p>
            </div>
          </div>

          {verificationError && (
            <div className="mt-4 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
              {verificationError}
            </div>
          )}

          <div className="mt-4 grid gap-3">
            {verificationSmsUri ? (
              <a
                href={verificationSmsUri}
                className="block w-full text-center bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition"
              >
                📱 SMS илгээх
              </a>
            ) : (
              <div className="block w-full text-center bg-slate-200 text-slate-600 py-3 rounded-xl font-bold">
                SMS холбоос бэлэн болоогүй байна
              </div>
            )}

            <button
              type="button"
              onClick={async () => {
                if (!verificationSessionId) return
                setVerificationLoading(true)
                setVerificationError(null)
                try {
                  const res = await fetch(`/api/verify-mn/status/${verificationSessionId}`, { cache: "no-store" })
                  if (!res.ok) {
                    setVerificationError("Статус шалгахад алдаа гарлаа")
                    return
                  }
                  const data = await res.json()
                  if (data.status === "VERIFIED") {
                    setVerificationSuccess(true)
                    const finalResult = await login(pendingName, pendingPhone)
                    if (finalResult.success) {
                      toast.success("Амжилттай бүртгэгдлээ!")
                      router.push("/")
                    } else {
                      setVerificationError(finalResult.error || "Бүртгэлд алдаа гарлаа")
                    }
                  } else if (data.status === "EXPIRED") {
                    setVerificationError("Хугацаа дууслаа. Дахин оролдоно уу.")
                    setVerificationSessionId(null)
                    setVerificationSmsUri(null)
                    setVerificationInstruction(null)
                    setVerificationExpiresAt(null)
                  } else {
                    setVerificationError("Баталгаажаагүй байна. Хэрвээ та мессеж илгээсэн бол түр хүлээгээд дахин шалгана уу.")
                  }
                } catch {
                  setVerificationError("Статус шалгахад алдаа гарлаа")
                } finally {
                  setVerificationLoading(false)
                }
              }}
              className="block w-full bg-indigo-50 text-indigo-700 py-3 rounded-xl font-bold hover:bg-indigo-100 transition"
              disabled={verificationLoading}
            >
              {verificationLoading ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Хүлээж байна...</span> : <span className="inline-flex items-center gap-2"><RefreshCcw className="w-4 h-4" /> Баталгаажсан эсэхийг шалгах</span>}
            </button>

            {process.env.NODE_ENV === "development" && (
              <a
                href={`/api/verify-mn/mock-verify?sessionId=${verificationSessionId}`}
                className="block w-full text-center bg-emerald-100 text-emerald-700 py-3 rounded-xl font-bold hover:bg-emerald-200 transition"
              >
                🧪 DEV: Callback-ыг гараар шалгах
              </a>
            )}
          </div>

          {verificationExpiresAt && (
            <p className="mt-4 text-xs text-slate-400 text-center">
              Баталгаажуулалт дуусах цаг: {new Date(verificationExpiresAt).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

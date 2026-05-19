"use client"

import { useState } from "react"
import { useCustomerAuth } from "@/context/CustomerAuthContext"
import { User, Phone, LogOut, Loader2, Package } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"

export default function ProfilePage() {
  const { customer, login, logout, isReady, isLoggingIn } = useCustomerAuth()
  const router = useRouter()
  
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")

  if (!isReady) return <div className="min-h-[50vh] flex items-center justify-center">Ачаалж байна...</div>

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name && phone) {
      const success = await login(name, phone)
      if (success) {
        toast.success("Амжилттай нэвтэрлээ!")
        router.push("/")
      } else {
        toast.error("Нэвтрэхэд алдаа гарлаа")
      }
    }
  }

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editAddress, setEditAddress] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const { updateProfile } = useCustomerAuth()

  // Set default values when entering edit mode
  const startEditing = () => {
    setEditName(customer?.name || "")
    setEditAddress(customer?.address || "")
    setIsEditing(true)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await updateProfile(editName, editAddress)
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
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Хүргэлтийн хаяг</label>
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
    </div>
  )
}

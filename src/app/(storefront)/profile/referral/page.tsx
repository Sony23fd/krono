"use client"

import { useEffect, useState } from "react"
import { useCustomerAuth } from "@/context/CustomerAuthContext"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, Copy, Check, Facebook, MessageCircle, Share2 } from "lucide-react"
import Link from "next/link"
import { getReferralData } from "@/app/actions/referral-actions"
import { toast } from "sonner"

export default function ReferralPage() {
  const { isReady, customer } = useCustomerAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    referralCode: string,
    referralReward: number,
    referralCount: number,
    referrals: Array<{ id: string, name: string | null, phone: string | null, createdAt: Date }>
  } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isReady) return
    if (!customer) {
      router.push("/login?callbackUrl=/profile/referral")
      return
    }

    getReferralData().then(res => {
      if (res.success && res.data) {
        setData(res.data)
      } else {
        toast.error(res.error || "Урамшууллын мэдээлэл авахад алдаа гарлаа")
      }
      setLoading(false)
    })
  }, [isReady, customer, router])

  if (loading || !data) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#F26522]" />
      </div>
    )
  }

  const referralLink = `${window.location.origin}/register?ref=${data.referralCode}`
  const progressPercent = Math.min((data.referralCount / 5) * 100, 100)

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast.success("Урилгын линк хуулагдлаа")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Bileg Hurgelt",
          text: "Надтай хамт Bileg Hurgelt-ээс худалдан авалт хийгээрэй!",
          url: referralLink,
        })
      } catch (err) {
        // ignore
      }
    } else {
      handleCopy()
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Link href="/profile" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> Буцах
      </Link>

      <div className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-orange-500/5 border border-slate-100">
        <div className="bg-gradient-to-br from-orange-400 to-[#F26522] p-8 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-black mb-2">🎁 Найзаа уриад 1,000₮ аваарай!</h1>
            <p className="text-orange-50 font-medium">
              Таны урилгаар шинээр бүртгүүлсэн найз бүрээс 1,000₮-ийн урамшуулал хүргэлтийн төлбөрөөс хасагдана. (Хамгийн ихдээ 5 найз урих боломжтой.)
            </p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-center">
              <p className="text-slate-500 text-sm font-medium mb-1">Цуглуулсан дүн</p>
              <p className="text-2xl font-black text-[#1B3561]">{data.referralReward.toLocaleString()}₮</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-center">
              <p className="text-slate-500 text-sm font-medium mb-1">Урьсан найз</p>
              <p className="text-2xl font-black text-[#1B3561]">{data.referralCount} <span className="text-base font-bold text-slate-400">/ 5</span></p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="font-bold text-slate-700">Урилгын явц</span>
              <span className="text-sm font-medium text-orange-600">{data.referralCount} найз урьсан байна</span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-[#F26522] rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${progressPercent}%` }}
              >
                {progressPercent > 0 && (
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                )}
              </div>
            </div>
            {data.referralCount >= 5 && (
              <p className="text-sm text-green-600 font-medium flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Та хамгийн дээд хязгаартаа хүрсэн байна. Баярлалаа!
              </p>
            )}
          </div>

          {/* Share Section */}
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6">
            <p className="font-bold text-slate-800 mb-3 text-center">Таны урилгын линк</p>
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="bg-[#1B3561] text-white px-5 rounded-xl font-bold hover:bg-[#122340] transition-colors flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Хуулсан" : "Хуулах"}
              </button>
            </div>

            <p className="text-center text-sm font-medium text-slate-500 mb-4">Эсвэл шууд хуваалцах</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-colors text-slate-600 font-medium text-sm"
              >
                <Facebook className="w-6 h-6 text-blue-600" />
                Facebook
              </a>
              <a
                href={`fb-messenger://share/?link=${encodeURIComponent(referralLink)}`}
                className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:text-blue-500 transition-colors text-slate-600 font-medium text-sm md:hidden"
              >
                <MessageCircle className="w-6 h-6 text-blue-500" />
                Messenger
              </a>
              <a
                href={`http://www.facebook.com/dialog/send?app_id=YOUR_APP_ID&link=${encodeURIComponent(referralLink)}&redirect_uri=${encodeURIComponent(window.location.origin)}`}
                target="_blank"
                rel="noreferrer"
                className="hidden md:flex flex-col items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:text-blue-500 transition-colors text-slate-600 font-medium text-sm"
              >
                <MessageCircle className="w-6 h-6 text-blue-500" />
                Messenger
              </a>
              <button
                onClick={handleShare}
                className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-400 hover:text-slate-800 transition-colors text-slate-600 font-medium text-sm"
              >
                <Share2 className="w-6 h-6" />
                Хуваалцах
              </button>
            </div>
          </div>

          <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Таны хуваалцсан линкээр найз тань шинээр бүртгүүлсэн тохиолдолд урамшуулал бодогдоно.</li>
              <li>Цуглуулсан урамшууллыг дараагийн худалдан авалтынхаа хүргэлтийн төлбөрөөс хасуулан ашиглах боломжтой.</li>
              <li>Нэг хэрэглэгч хамгийн ихдээ 5 найзаа урих эрхтэй.</li>
            </ul>
          </div>

          {/* Invited Friends List */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Урьсан найзуудын жагсаалт</h3>
              <span className="text-xs font-bold bg-[#1B3561] text-white px-2 py-1 rounded-full">{data.referrals.length}</span>
            </div>
            {data.referrals.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {data.referrals.map((friend) => (
                  <li key={friend.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-lg">
                        {friend.name ? friend.name.charAt(0).toUpperCase() : "Н"}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{friend.name || "Нэргүй"}</p>
                        <p className="text-sm text-slate-500 font-mono">
                          {friend.phone ? `${friend.phone.substring(0, 4)}****` : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 mb-1">Бүртгүүлсэн</p>
                      <p className="text-sm font-medium text-slate-700">
                        {new Date(friend.createdAt).toLocaleDateString("mn-MN")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <p className="font-medium">Та одоогоор хүн уриагүй байна.</p>
                <p className="text-sm mt-1">Линкээ хуваалцаад урамшуулал аваарай!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

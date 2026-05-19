"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"

export function PaymentCheckClient({ transactionRef }: { transactionRef: string }) {
  const [isChecking, setIsChecking] = useState(false)
  const router = useRouter()

  async function handleCheck() {
    setIsChecking(true)
    try {
      // Хуудсыг refresh хийнэ → server-side data шинэчлэгдэнэ
      router.refresh()
      toast.info("Төлбөрийн төлөвийг шалгаж байна...")
    } catch {
      toast.error("Сервертэй холбогдож чадсангүй")
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <button
      onClick={handleCheck}
      disabled={isChecking}
      className="mt-4 w-full bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-70"
    >
      <RefreshCw className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`} />
      {isChecking ? "Шалгаж байна..." : "Төлбөр шалгах"}
    </button>
  )
}

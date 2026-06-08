"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export function BackButton() {
  const router = useRouter()
  return (
    <button 
      onClick={() => router.back()} 
      className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#F26522] transition-colors bg-transparent border-none p-0 cursor-pointer"
    >
      <ArrowLeft className="w-4 h-4" />
      Буцах
    </button>
  )
}

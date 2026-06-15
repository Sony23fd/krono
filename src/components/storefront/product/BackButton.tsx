import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export function BackButton() {
  return (
    <Link 
      href="/" 
      className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors bg-transparent border-none p-0 cursor-pointer"
    >
      <ArrowLeft className="w-4 h-4" />
      Нүүр хуудас руу буцах
    </Link>
  )
}

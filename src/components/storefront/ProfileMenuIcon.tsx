"use client"

import { User, LogOut } from "lucide-react"
import { useCustomerAuth } from "@/context/CustomerAuthContext"
import Link from "next/link"

export function ProfileMenuIcon() {
  const { customer, logout, isReady } = useCustomerAuth()

  if (!isReady) {
    return <div className="w-16 h-11" /> // skeleton spacer
  }

  return (
    <>
      {customer ? (
        <>
          <Link href="/profile" className="flex flex-col items-center justify-center px-2 cursor-pointer group">
            <User className="w-6 h-6 text-blue-600 transition-colors" />
            <span className="text-[10px] font-bold mt-0.5 text-blue-600">
              {customer.name.substring(0, 10)}
            </span>
          </Link>

          <button
            onClick={logout}
            title="Гарах"
            className="text-slate-400 hover:text-red-500 ml-2 transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </>
      ) : (
        <div className="flex items-center gap-2 ml-2">
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#1B3561] hover:text-[#F26522] transition-colors border border-slate-200 rounded-lg hover:border-[#F26522]"
          >
            <User className="w-4 h-4" />
            Нэвтрэх
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-[#F26522] hover:bg-[#E85B1C] transition-colors rounded-lg"
          >
            Бүртгүүлэх
          </Link>
        </div>
      )}
    </>
  )
}

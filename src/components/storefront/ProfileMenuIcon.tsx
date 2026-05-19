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
      <Link href="/profile" className="flex flex-col items-center justify-center px-2 cursor-pointer group">
        <User className={`w-6 h-6 transition-colors ${customer ? "text-blue-600" : "text-[#1B3561] group-hover:text-blue-600"}`} />
        <span className={`text-[10px] font-bold mt-0.5 ${customer ? "text-blue-600" : "text-[#1B3561]"}`}>
          {customer ? customer.name.substring(0, 10) : "Нэвтрэх"}
        </span>
      </Link>

      {customer && (
        <button 
          onClick={logout}
          title="Гарах"
          className="text-slate-400 hover:text-red-500 ml-2 transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-red-50"
        >
          <LogOut className="w-5 h-5" />
        </button>
      )}
    </>
  )
}

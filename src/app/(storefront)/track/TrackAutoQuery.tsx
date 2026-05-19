"use client"

import { useCustomerAuth } from "@/context/CustomerAuthContext"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"

/**
 * Нэвтэрсэн хэрэглэгчийн утасыг /track хуудсанд автоматаар хайх
 * Хэрэв ?q= param байхгүй бол хэрэглэгчийн утсыг автоматаар нэмнэ
 */
export function TrackAutoQuery() {
  const { customer, isReady } = useCustomerAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!isReady) return
    
    const q = searchParams.get("q") || searchParams.get("account")
    
    // Хэрэв query байхгүй + нэвтэрсэн бол автоматаар хайх
    if (!q && customer?.phone) {
      router.replace(`/track?q=${customer.phone}`)
    }
  }, [isReady, customer, searchParams, router])

  return null // Энэ component нь зөвхөн логик
}

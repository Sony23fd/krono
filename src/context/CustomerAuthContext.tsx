"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"
import { useRouter } from "next/navigation"

interface Customer {
  id: string
  name: string
  phone: string
  address?: string
}

interface AuthVerificationState {
  verificationRequired?: boolean
  sessionId?: string
  smsUri?: string
  displayInstruction?: string
  expiresAt?: string
  status?: "PENDING" | "VERIFIED" | "EXPIRED"
}

interface CustomerAuthContextType {
  customer: Customer | null
  login: (name: string, phone: string) => Promise<{ success: boolean; error?: string } & AuthVerificationState>
  logout: () => void
  updateAddress: (address: string) => Promise<void>
  updateProfile: (name: string, address: string) => Promise<void>
  isReady: boolean
  isLoggingIn: boolean
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined)

const STORAGE_KEY = "bileg_customer"

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const router = useRouter()

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Хуучин формат (id нь Date.now() байсан) → баазаас шинэчлэх
        if (parsed.id && parsed.phone) {
          setCustomer(parsed)
        }
      }
    } catch {}
    setIsReady(true)
  }, [])

  // Save to localStorage when customer changes
  useEffect(() => {
    if (customer) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customer))
    }
  }, [customer])

  /**
   * Нэвтрэх / Бүртгүүлэх
   * Баазад User бүртгэж, localStorage-д хадгална
   */
  const login = useCallback(async (name: string, phone: string): Promise<{ success: boolean; error?: string } & AuthVerificationState> => {
    setIsLoggingIn(true)
    try {
      const { beginCustomerAuth } = await import("@/app/actions/customer-auth-actions")
      const result = await beginCustomerAuth(phone, name)

      if (result.success) {
        setCustomer(result.customer)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result.customer))
        return { success: true }
      }

      // Check if verification is required
      if ("verificationRequired" in result && result.verificationRequired) {
        return {
          success: false,
          verificationRequired: true,
          sessionId: result.sessionId,
          smsUri: result.smsUri,
          displayInstruction: result.displayInstruction,
          expiresAt: result.expiresAt,
          status: result.status,
        }
      }

      // Error case
      const errorResult = result as { success: false; error?: string }
      return {
        success: false,
        error: errorResult.error || "Нэвтрэхэд алдаа гарлаа",
      }
    } catch {
      return { success: false, error: "Нэвтрэхэд алдаа гарлаа" }
    } finally {
      setIsLoggingIn(false)
    }
  }, [])

  const logout = useCallback(() => {
    setCustomer(null)
    localStorage.removeItem(STORAGE_KEY)
    router.push("/")
  }, [router])

  const updateAddress = useCallback(async (address: string) => {
    if (!customer) return
    const updatedCustomer = { ...customer, address }
    setCustomer(updatedCustomer)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustomer))
    
    // Fire and forget updating the backend
    import("@/app/actions/customer-auth-actions").then(m => {
      m.updateCustomerAddress(customer.phone, address)
    })
  }, [customer])

  const updateProfile = useCallback(async (name: string, address: string) => {
    if (!customer) return
    const updatedCustomer = { ...customer, name, address }
    setCustomer(updatedCustomer)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustomer))

    import("@/app/actions/customer-auth-actions").then(m => {
      m.updateCustomerProfile(customer.phone, { name, address })
    })
  }, [customer])

  return (
    <CustomerAuthContext.Provider value={{ customer, login, logout, updateAddress, updateProfile, isReady, isLoggingIn }}>
      {children}
    </CustomerAuthContext.Provider>
  )
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext)
  if (context === undefined) {
    throw new Error("useCustomerAuth must be used within a CustomerAuthProvider")
  }
  return context
}

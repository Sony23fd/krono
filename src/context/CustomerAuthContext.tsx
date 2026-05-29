"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getCurrentCustomer, logoutCustomer } from "@/app/actions/auth-actions"

interface Customer {
  id: string
  name: string
  phone: string
  address?: string
}

interface CustomerAuthContextType {
  customer: Customer | null
  setCustomer: (c: Customer | null) => void
  logout: () => Promise<void>
  updateAddress: (address: string) => Promise<void>
  updateProfile: (name: string, address: string) => Promise<void>
  refreshCustomer: () => Promise<void>
  isReady: boolean
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined)

const STORAGE_KEY = "bileg_customer"

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomerState] = useState<Customer | null>(null)
  const [isReady, setIsReady] = useState(false)
  const router = useRouter()

  const refreshCustomer = useCallback(async () => {
    try {
      const serverCustomer = await getCurrentCustomer()
      if (serverCustomer) {
        setCustomerState(serverCustomer)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serverCustomer))
      } else {
        setCustomerState(null)
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // fallback
    }
  }, [])

  // Load from server on mount
  useEffect(() => {
    // Optimistic load from local storage
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setCustomerState(JSON.parse(stored))
      }
    } catch {}

    // Verify with server
    refreshCustomer().finally(() => {
      setIsReady(true)
    })
  }, [refreshCustomer])

  const setCustomer = useCallback((c: Customer | null) => {
    setCustomerState(c)
    if (c) localStorage.setItem(STORAGE_KEY, JSON.stringify(c))
    else localStorage.removeItem(STORAGE_KEY)
  }, [])

  const logout = useCallback(async () => {
    setCustomer(null)
    await logoutCustomer()
    router.push("/")
  }, [router, setCustomer])

  const updateAddress = useCallback(async (address: string) => {
    if (!customer) return
    const updatedCustomer = { ...customer, address }
    setCustomer(updatedCustomer)
    
    // Fire and forget updating the backend
    import("@/app/actions/customer-auth-actions").then(m => {
      m.updateCustomerAddress(customer.phone, address)
    })
  }, [customer, setCustomer])

  const updateProfile = useCallback(async (name: string, address: string) => {
    if (!customer) return
    const updatedCustomer = { ...customer, name, address }
    setCustomer(updatedCustomer)

    import("@/app/actions/customer-auth-actions").then(m => {
      m.updateCustomerProfile(customer.phone, { name, address })
    })
  }, [customer, setCustomer])

  return (
    <CustomerAuthContext.Provider value={{ customer, setCustomer, logout, updateAddress, updateProfile, refreshCustomer, isReady }}>
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

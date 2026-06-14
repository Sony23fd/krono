"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { ShieldAlert } from "lucide-react"
import { useRouter } from "next/navigation"

interface AgeVerificationContextType {
  isVerified: boolean
  checkAge: (onSuccess: () => void) => void
}

const AgeVerificationContext = createContext<AgeVerificationContextType>({
  isVerified: false,
  checkAge: () => {},
})

export function useAgeVerification() {
  return useContext(AgeVerificationContext)
}

const STORAGE_KEY = "store_age_verified"

export function AgeVerificationProvider({ children }: { children: ReactNode }) {
  const [isVerified, setIsVerified] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null)
  const router = useRouter()

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored === "true") setIsVerified(true)
    } catch {}
  }, [])

  const checkAge = useCallback((onSuccess: () => void) => {
    if (isVerified) {
      onSuccess()
      return
    }
    setPendingCallback(() => onSuccess)
    setShowModal(true)
  }, [isVerified])

  function handleConfirm() {
    setIsVerified(true)
    try {
      sessionStorage.setItem(STORAGE_KEY, "true")
    } catch {}
    setShowModal(false)
    if (pendingCallback) {
      pendingCallback()
      setPendingCallback(null)
    }
  }

  function handleDeny() {
    setShowModal(false)
    setPendingCallback(null)
    router.push("/")
  }

  return (
    <AgeVerificationContext.Provider value={{ isVerified, checkAge }}>
      {children}

      {/* Non-closable Age Verification Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center animate-in zoom-in-95 duration-200">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-5">
              <ShieldAlert className="w-8 h-8 text-red-600" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">
              Насны хязгаартай бараа
            </h2>

            {/* Description */}
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Энэхүү барааг худалдан авахад <strong className="text-red-600">21 нас</strong> хүрсэн байх шаардлагатай. Та 21 нас хүрсэн үү?
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleDeny}
                className="flex-1 h-12 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                Үгүй
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 h-12 rounded-xl bg-[#F26522] text-white text-sm font-bold hover:bg-[#E85B1C] shadow-lg shadow-red-500/25 transition-all active:scale-[0.97]"
              >
                Тийм, би 21 хүрсэн
              </button>
            </div>

            {/* Legal text */}
            <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
              Монгол улсын хуулийн дагуу 21 хүрээгүй иргэдэд согтууруулах ундаа худалдахыг хориглоно.
            </p>
          </div>
        </div>
      )}
    </AgeVerificationContext.Provider>
  )
}

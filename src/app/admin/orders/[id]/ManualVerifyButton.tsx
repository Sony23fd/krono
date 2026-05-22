"use client"

import { useState } from "react"
import { checkQPayPaymentStatus } from "@/app/actions/qpay-actions"
import { Loader2, ShieldCheck, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface ManualVerifyButtonProps {
  paymentId: string
  orderId: string
  orderNumber: number
}

export function ManualVerifyButton({ paymentId, orderId, orderNumber }: ManualVerifyButtonProps) {
  const [checking, setChecking] = useState(false)
  const [verifying, setVerifying] = useState(false)

  async function handleVerify() {
    setChecking(true)
    try {
      // Check QPay status first
      const result = await checkQPayPaymentStatus(paymentId)

      if (result.status === "VERIFIED" || result.paid) {
        toast.success("Төлбөр аль хэдийн баталгаажсан байна!")
      } else if (result.status === "FAILED") {
        toast.error(result.error || "Төлбөр баталгаажаагүй байна")
      } else {
        // Not paid yet
        toast.info("Төлбөр хүлээгдэж байна. QPay-ээр төлбөр хийсэн эсэхийг шалгана уу.")
      }
    } catch (error: any) {
      toast.error("Шалгахад алдаа гарлаа")
    } finally {
      setChecking(false)
    }
  }

  return (
    <button
      onClick={handleVerify}
      disabled={checking || verifying}
      className="flex items-center gap-2 px-4 py-2 bg-[#1B3561] hover:bg-blue-900 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
    >
      {checking || verifying ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <RefreshCw className="w-4 h-4" />
      )}
      {checking ? "Шалгаж байна..." : "Шалгах"}
    </button>
  )
}
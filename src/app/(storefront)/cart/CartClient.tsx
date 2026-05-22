"use client"

import { useCart } from "@/context/CartContext"
import { useState, useRef, useCallback, useEffect } from "react"
import { Trash2, Minus, Plus, ShoppingCart, Truck, ShoppingBag, Package, AlertCircle, Info, CheckCircle2, Loader2, MessageSquare, CreditCard, Banknote, MapPin } from "lucide-react"
import { checkout, validateCartStock } from "@/app/actions/checkout-actions"
import { startPhoneVerification, checkPhoneVerified } from "@/app/actions/verify-actions"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { getUpcomingDeliveryDates } from "@/lib/utils"
import { isValidPhone } from "@/lib/customer-utils"
import { useCustomerAuth } from "@/context/CustomerAuthContext"

export function CartClient({ 
  termsOfService, 
  deliveryTerms, 
  qpayEnabled, 
  globalDeliveryFee = 0, 
  deliveryScheduleDays = "3,6",
  phoneVerificationEnabled = true,
  loyaltyPercent
}: { 
  termsOfService?: string; 
  deliveryTerms?: string; 
  qpayEnabled?: boolean;
  globalDeliveryFee?: number;
  deliveryScheduleDays?: string;
  phoneVerificationEnabled?: boolean;
  loyaltyPercent?: number;
}) {
  const { items, removeItem, updateQty, clearCart, totalPrice } = useCart()
  const { customer, updateAddress } = useCustomerAuth()
  const router = useRouter()
  const wantsDelivery = true
  const paymentMethod = "QPAY"
  const [submitting, setSubmitting] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState<string | null>(null)
  
  // ─── New Checkout Fields ───
  const [receiptType, setReceiptType] = useState("individual")
  const [companyRegNo, setCompanyRegNo] = useState("")
  const [allowSubstitution, setAllowSubstitution] = useState(true)

  // ─── Loyalty Card State ───
  const [loyaltyCardNumber, setLoyaltyCardNumber] = useState("")
  const [loyaltyStatus, setLoyaltyStatus] = useState<"idle" | "verifying" | "valid" | "invalid">("idle")
  const [loyaltyBalance, setLoyaltyBalance] = useState(0)
  const [loyaltyAction, setLoyaltyAction] = useState<"EARN" | "SPEND">("EARN")
  const [loyaltyError, setLoyaltyError] = useState<string | null>(null)

  // ─── Address State ───
  const [useSavedAddress, setUseSavedAddress] = useState(false)
  useEffect(() => {
    if (customer?.address) setUseSavedAddress(true)
  }, [customer?.address])

  // ─── Phone Verification State ───
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [verifySessionId, setVerifySessionId] = useState<string | null>(null)
  const [verifySmsUri, setVerifySmsUri] = useState<string | null>(null)
  const [verifyInstruction, setVerifyInstruction] = useState<string | null>(null)
  const [verifyExpiresAt, setVerifyExpiresAt] = useState<string | null>(null)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  // ─── localStorage helpers for persistent verification ───
  const VERIFY_STORAGE_KEY = "anar_verified_phone"
  const VERIFY_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

  function getStoredVerifiedPhone(): string | null {
    try {
      const raw = localStorage.getItem(VERIFY_STORAGE_KEY)
      if (!raw) return null
      const { phone, verifiedAt } = JSON.parse(raw)
      if (Date.now() - verifiedAt > VERIFY_TTL_MS) {
        localStorage.removeItem(VERIFY_STORAGE_KEY)
        return null
      }
      return phone
    } catch { return null }
  }

  function saveVerifiedPhone(phone: string) {
    try {
      localStorage.setItem(VERIFY_STORAGE_KEY, JSON.stringify({ phone, verifiedAt: Date.now() }))
    } catch { /* ignore */ }
  }

  // Cleanup polling on unmount
  useEffect(() => {
    // If phone verification is disabled globally, set it as verified immediately
    if (!phoneVerificationEnabled) {
      setPhoneVerified(true)
    }

    // If there are no terms to agree to, set agreedToTerms to true by default
    const hasTerms = Boolean(termsOfService || (wantsDelivery && deliveryTerms));
    if (!hasTerms) {
      setAgreedToTerms(true);
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [phoneVerificationEnabled, termsOfService, deliveryTerms, wantsDelivery])

  // Poll verify.mn status
  const startPolling = useCallback((sessionId: string, expiresAt: string) => {
    if (pollRef.current) clearInterval(pollRef.current)

    pollRef.current = setInterval(async () => {
      // Check if expired
      if (Date.now() > new Date(expiresAt).getTime()) {
        if (pollRef.current) clearInterval(pollRef.current)
        setVerifyError("Хугацаа дууслаа. Дахин оролдоно уу.")
        setVerifySessionId(null)
        setVerifySmsUri(null)
        setVerifyInstruction(null)
        return
      }

      try {
        const res = await fetch(`/api/verify-mn/status/${sessionId}`, { cache: "no-store" })
        const data = await res.json()

        if (data.status === "VERIFIED") {
          if (pollRef.current) clearInterval(pollRef.current)
          setPhoneVerified(true)
          setVerifySessionId(null)
          setVerifySmsUri(null)
          setVerifyInstruction(null)
          // Save to localStorage for persistence
          const phoneInput = document.querySelector('input[name="phoneNumber"]') as HTMLInputElement
          if (phoneInput) saveVerifiedPhone(phoneInput.value.replace(/\D/g, ""))
          toast.success("Утас амжилттай баталгаажлаа!")
        } else if (data.status === "EXPIRED") {
          if (pollRef.current) clearInterval(pollRef.current)
          setVerifyError("Хугацаа дууслаа. Дахин оролдоно уу.")
          setVerifySessionId(null)
          setVerifySmsUri(null)
          setVerifyInstruction(null)
        }
      } catch {
        // Silent — will retry on next interval
      }
    }, 3000)
  }, [toast])

  async function handleVerifyPhone(phoneValue: string) {
    const digits = phoneValue.replace(/\D/g, "")
    if (!isValidPhone(digits)) return

    // Check localStorage first
    const storedPhone = getStoredVerifiedPhone()
    if (storedPhone === digits) {
      setPhoneVerified(true)
      return
    }

    setVerifyLoading(true)
    setVerifyError(null)

    const result = await startPhoneVerification(digits)

    if (!result.success) {
      setVerifyError(result.error || "Алдаа гарлаа")
      setVerifyLoading(false)
      return
    }

    // If already verified or skipped (no API key)
    if (result.sessionId === "already-verified" || result.sessionId === "skipped" || result.status === "VERIFIED") {
      setPhoneVerified(true)
      saveVerifiedPhone(digits)
      setVerifyLoading(false)
      toast.success("Утас амжилттай баталгаажлаа!")
      return
    }

    setVerifySessionId(result.sessionId!)
    setVerifySmsUri(result.smsUri || null)
    setVerifyInstruction(result.displayInstruction || null)
    setVerifyExpiresAt(result.expiresAt || null)
    setVerifyLoading(false)

    // Start polling
    if (result.sessionId && result.expiresAt) {
      startPolling(result.sessionId, result.expiresAt)
    }
  }

  async function validatePhone(value: string) {
    const digits = value.replace(/\D/g, "")
    if (digits.length !== 8) {
      setPhoneError("Утасны дугаар заавал 8 оронтой байх ёстой")
      if (phoneVerificationEnabled) setPhoneVerified(false)
    } else if (!isValidPhone(digits)) {
      setPhoneError("Зөв утасны дугаар оруулна уу (жишээ: 99112233)")
      if (phoneVerificationEnabled) setPhoneVerified(false)
    } else {
      setPhoneError(null)
      if (!phoneVerificationEnabled) {
        setPhoneVerified(true)
        return
      }

      // 1. Check localStorage first
      const storedPhone = getStoredVerifiedPhone()
      if (storedPhone === digits) {
        setPhoneVerified(true)
        return
      } 
      
      // 2. Check Database via server action
      const verified = await checkPhoneVerified(digits)
      if (verified) {
        setPhoneVerified(true)
        saveVerifiedPhone(digits)
        return
      }

      if (phoneVerified) {
        setPhoneVerified(false)
      }
    }
    // Stop any active polling
    if (pollRef.current) clearInterval(pollRef.current)
  }

  async function verifyLoyaltyCard() {
    if (!loyaltyCardNumber.trim()) {
      setLoyaltyError("Картны дугаар оруулна уу.")
      return
    }
    setLoyaltyStatus("verifying")
    setLoyaltyError(null)

    try {
      const res = await fetch("/api/loyalty/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardNumber: loyaltyCardNumber })
      })
      const data = await res.json()
      if (res.ok && data.isValid) {
        setLoyaltyStatus("valid")
        setLoyaltyBalance(data.balance)
        // Auto select EARN or SPEND
        if (data.balance > 0) setLoyaltyAction("SPEND")
        else setLoyaltyAction("EARN")
      } else {
        setLoyaltyStatus("invalid")
        setLoyaltyError(data.error || "Карт олдсонгүй.")
        setLoyaltyBalance(0)
      }
    } catch (error) {
      setLoyaltyStatus("invalid")
      setLoyaltyError("Холболтын алдаа.")
      setLoyaltyBalance(0)
    }
  }

  const hasPreOrder = items.some(i => i.isPreOrder)
  const hasInStock = items.some(i => !i.isPreOrder)
  const isMixedCart = hasPreOrder && hasInStock

  // One-time delivery fee = highest delivery fee among cart items, fallback to global if all are 0
  const maxItemFee = items.length > 0 ? Math.max(0, ...items.map(i => i.deliveryFee || 0)) : 0
  const singleDeliveryFee = (wantsDelivery && !hasPreOrder)
    ? (maxItemFee > 0 ? maxItemFee : globalDeliveryFee)
    : 0
  
  // Base Grand Total
  const baseGrandTotal = totalPrice + singleDeliveryFee

  // Loyalty Calculations
  let loyaltyDiscount = 0
  let expectedPointsEarned = 0

  if (loyaltyStatus === "valid") {
    if (loyaltyAction === "SPEND" && loyaltyBalance > 0) {
      loyaltyDiscount = Math.min(loyaltyBalance, baseGrandTotal)
    } else if (loyaltyAction === "EARN") {
      const earnRate = loyaltyPercent ? (loyaltyPercent / 100) : 0.03;
      expectedPointsEarned = Math.floor(totalPrice * earnRate) 
    }
  }

  const grandTotal = baseGrandTotal - loyaltyDiscount

  if (isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#4F46E5] rounded-full border-t-transparent animate-spin"></div>
          <Package className="absolute inset-0 m-auto w-8 h-8 text-[#4F46E5] animate-pulse" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Захиалга үүсгэж байна...</h2>
        <p className="text-slate-500 text-sm sm:text-base mb-8">Төлбөрийн хуудас руу шилжиж байна, түр хүлээнэ үү</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center flex flex-col items-center">
        <div className="w-48 h-48 mb-6 relative hover:scale-105 transition-transform duration-300">
          <img src="/rabbit-mascot.png" alt="Happy Rabbit" className="object-contain w-full h-full drop-shadow-lg" />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-3 tracking-tight">Таны сагс хоосон байна өө! 🥕</h1>
        <p className="text-slate-500 mb-8 text-base">Манай амттай, шинэхэн бараануудаас сонголтоо хийгээрэй.</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-[#F26522] text-white px-8 py-3.5 rounded-full font-bold hover:bg-[#E85B1C] transition-colors shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50">
          <Package className="w-5 h-5" /> Дэлгүүр хэсэх
        </Link>
      </div>
    )
  }

  async function handleCheckout(formData: FormData) {
    setSubmitting(true)
    setError(null)
    try {
      const customerName = formData.get("customerName") as string
      const phoneNumber = formData.get("phoneNumber") as string
      const accountNumber = ""
      const deliveryAddress = formData.get("deliveryAddress") as string
      const saveAddress = formData.get("saveAddress") === "true"
      
      const deliveryNotes = formData.get("deliveryNotes") as string
      const allowSubst = formData.get("allowSubstitution") === "true"
      const rType = formData.get("receiptType") as string
      const cRegNo = formData.get("companyRegNo") as string

      if (saveAddress && customer) {
        updateAddress(deliveryAddress)
      }

      // Pre-validate stock (non-locking, UI feedback)
      const stockCheck = await validateCartStock(
        items.map(i => ({ productId: i.batchId, quantity: i.qty }))
      )
      if (!stockCheck.success) {
        setError(stockCheck.errors[0])
        setSubmitting(false)
        return
      }

      // Single atomic checkout with idempotency key
      const idempotencyKey = crypto.randomUUID()

      const result = await checkout({
        idempotencyKey,
        customerName,
        phoneNumber,
        accountNumber,
        deliveryAddress: (wantsDelivery && !hasPreOrder) ? deliveryAddress : undefined,
        deliveryDate: (wantsDelivery && !hasPreOrder && selectedDeliveryDate) ? selectedDeliveryDate : undefined,
        wantsDelivery: hasPreOrder ? false : wantsDelivery,
        note: deliveryNotes,
        paymentMethod,
        userId: customer?.id,
        receiptType: rType,
        companyRegistryNumber: rType === "organization" ? cRegNo : undefined,
        allowSubstitution: allowSubst,
        loyaltyCardNumber: loyaltyStatus === "valid" ? loyaltyCardNumber : undefined,
        loyaltyAction: loyaltyStatus === "valid" ? loyaltyAction : undefined,
        items: items.map(item => ({
          productId: item.productId || item.batchId, // fallback for legacy carts
          variantId: item.variantId,
          quantity: item.qty,
        })),
      })

      if (!result.success) {
        setError(result.error ?? "Захиалга үүсгэхэд алдаа гарлаа")
        setSubmitting(false)
        return
      }

      toast.success("Захиалга амжилттай үүсгэгдлээ")
      setIsRedirecting(true)
      clearCart()

      // QPay бол order-pending хуудас руу, банк бол order-manual руу
      router.push(`/order-pending/ref/${result.order.orderNumber}`)
    } catch (e: any) {
      setError(e.message || "Алдаа гарлаа")
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
        <ShoppingCart className="w-6 h-6 text-[#1B3561]" />
        Миний сагс
        <span className="text-base font-normal text-slate-400">({items.length} бараа)</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-3 space-y-3">
          {items.map(item => (
            <div key={item.batchId} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow flex gap-4 items-start">
              <div className="w-20 h-20 bg-slate-50 rounded-xl border border-slate-100/50 overflow-hidden flex-shrink-0">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Package className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900 truncate">{item.name}</p>
                  {item.isPreOrder && (
                    <span className="shrink-0 px-1.5 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold rounded uppercase">Урьдчилсан захиалга</span>
                  )}
                </div>
                <p className="text-sm text-[#F26522] font-semibold mt-1">₮{item.unitPrice.toLocaleString()}</p>

                {/* Qty controls */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => updateQty(item.batchId, item.qty - 1)}
                    className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center justify-center hover:bg-slate-100 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="min-w-[24px] text-center font-semibold text-slate-900 text-sm">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.batchId, item.qty + 1)}
                    className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center justify-center hover:bg-slate-100 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="text-right flex flex-col items-end gap-2">
                <p className="font-bold text-slate-900">₮{(item.unitPrice * item.qty).toLocaleString()}</p>
                <button
                  onClick={() => removeItem(item.batchId)}
                  className="text-slate-300 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const phone = (fd.get("phoneNumber") as string || "").replace(/\D/g, "")
              if (phone.length !== 8) {
                setPhoneError("Утасны дугаар заавал 8 оронтой байх ёстой")
                return
              }
              if (!isValidPhone(phone)) {
                setPhoneError("Зөв утасны дугаар оруулна уу (жишээ: 99112233)")
                return
              }
              if (!agreedToTerms) { setError("Нөхцөлүүдтэй зөвшөөрнө үү"); return }
              await handleCheckout(fd)
            }}
            className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-6 sm:p-8 space-y-6 sticky top-24"
          >
            <h2 className="font-bold text-slate-900 text-lg">Захиалгын мэдээлэл</h2>



            {customer ? (
              <div className="bg-[#1B3561]/5 border border-[#1B3561]/10 rounded-2xl p-4 flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Захиалагч</p>
                  <p className="font-bold text-[#1B3561] text-lg">{customer.name}</p>
                  <p className="text-sm font-medium text-slate-600 mt-0.5">{customer.phone}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#1B3561] flex items-center justify-center shadow-md shadow-blue-900/20">
                  <span className="text-white font-bold text-lg">{customer.name.charAt(0).toUpperCase()}</span>
                </div>
                <input type="hidden" name="customerName" value={customer.name} />
                <input type="hidden" name="phoneNumber" value={customer.phone} />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Таны нэр</label>
                  <input name="customerName" required placeholder="Жишээ: Отгоо" className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B3561]/30" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Утасны дугаар</label>
                  <div className="flex flex-col gap-2">
                    <input
                      name="phoneNumber"
                      type="tel"
                      inputMode="numeric"
                      required
                      maxLength={8}
                      placeholder="Утасны дугаар"
                      onChange={e => validatePhone(e.target.value)}
                      className={`w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm focus:bg-white transition-colors focus:outline-none focus:ring-2 ${phoneVerified ? "bg-green-50 border-green-300 text-green-800" : phoneError ? "border-red-400 focus:ring-red-300" : "focus:ring-[#1B3561]/30"}`}
                    />
                    
                    {phoneError && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {phoneError}
                      </p>
                    )}
                    {verifyError && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {verifyError}
                      </p>
                    )}

                    {!phoneVerified && phoneVerificationEnabled && (
                      <button
                        type="button"
                        disabled={!!phoneError || verifyLoading || !!verifySessionId}
                        onClick={() => {
                          const phoneInput = document.querySelector('input[name="phoneNumber"]') as HTMLInputElement
                          if (phoneInput) handleVerifyPhone(phoneInput.value)
                        }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 w-full bg-[#1B3561] text-white text-sm font-semibold rounded-lg hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {verifyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                        {verifyLoading ? "Уншиж байна..." : "Утасны дугаар баталгаажуулах"}
                      </button>
                    )}

                    {phoneVerified && phoneVerificationEnabled && (
                      <div className="flex items-center justify-center gap-1 text-green-600 text-sm font-semibold px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg w-full">
                        <CheckCircle2 className="w-4 h-4" /> Амжилттай баталгаажсан
                      </div>
                    )}
                  </div>

              {/* SMS Verification Instructions */}
              {verifySessionId && !phoneVerified && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3 mt-2">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-5 h-5 text-[#1B3561] shrink-0 mt-0.5" />
                    <div className="space-y-1.5">
                      <p className="text-sm font-semibold text-[#1B3561]">SMS баталгаажуулалт</p>
                      {verifyInstruction && (
                        <p className="text-xs text-blue-700 leading-relaxed">{verifyInstruction}</p>
                      )}
                      <p className="text-xs text-[#F26522]">
                        Доорх товчийг дарж SMS мессежээ илгээнэ үү. Илгээсний дараа автоматаар баталгаажна.
                      </p>
                    </div>
                  </div>

                  {verifySmsUri && (
                    <a
                      href={verifySmsUri}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-[#1B3561] text-white rounded-lg font-semibold text-sm hover:bg-blue-900 transition-colors shadow-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      📱 SMS илгээх (144773)
                    </a>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-[#1B3561]">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      SMS хүлээж байна...
                    </div>
                    <button
                      type="button"
                      disabled={verifyLoading}
                      onClick={async () => {
                        if(!verifySessionId) return;
                        setVerifyLoading(true);
                        try {
                          const res = await fetch(`/api/verify-mn/status/${verifySessionId}`, { cache: "no-store" });
                          const data = await res.json();
                          if (data.status === "VERIFIED") {
                            setPhoneVerified(true);
                            setVerifySessionId(null);
                            const phoneInput = document.querySelector('input[name="phoneNumber"]') as HTMLInputElement;
                            if (phoneInput) saveVerifiedPhone(phoneInput.value.replace(/\D/g, ""));
                            toast.success("Утас амжилттай баталгаажлаа!")
                          } else {
                            toast.info("Баталгаажаагүй байна. SMS илгээсэн бол түр хүлээнэ үү.")
                          }
                        } catch {}
                        setVerifyLoading(false);
                      }}
                      className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-200 transition-colors"
                    >
                      Гараар шалгах
                    </button>
                  </div>
                </div>
              )}
                </div>
              </>
            )}
            {/* Delivery Form */}
            {!hasPreOrder ? (
              <div className="space-y-3">
                {wantsDelivery && (
                  <div className="space-y-3 mt-4 border-t pt-4">
                    <label className="text-sm font-medium text-slate-700 block mb-2">Хүргүүлэх өдөр сонгох</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {getUpcomingDeliveryDates(deliveryScheduleDays, 2).map((opt, i) => (
                        <label key={i} className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${selectedDeliveryDate === opt.date.toISOString() ? 'border-[#1B3561] bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                          <input 
                            type="radio" 
                            name="deliveryDateChoice" 
                            className="mt-1"
                            required
                            checked={selectedDeliveryDate === opt.date.toISOString()}
                            onChange={() => setSelectedDeliveryDate(opt.date.toISOString())}
                            value={opt.date.toISOString()} 
                          />
                          <div>
                            <p className={`text-sm font-bold ${selectedDeliveryDate === opt.date.toISOString() ? 'text-[#1B3561]' : 'text-slate-700'}`}>{opt.formatted}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Товлосон өдрөөс хойш 24-72ц дотор</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {isMixedCart ? (
                  <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 space-y-2">
                    <div className="flex gap-2 items-start text-amber-800">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p className="text-xs font-semibold leading-relaxed">
                        Сагсанд урьдчилсан захиалгын бараа орсон тул хүргэлтийн товч хаагдлаа.
                      </p>
                    </div>
                    <p className="text-xs text-amber-700 ml-7 leading-relaxed">
                      Урьдчилан захиалсан барааг Монголд ирсний дараа хүргэлтийг шийдэх бөгөөд бэлэн бараагаа яг одоо хүргүүлэх бол <b>урьдчилсан захиалгаа сагснаасаа устгаж тусад нь захиална уу!</b>
                    </p>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 items-start">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800 leading-relaxed">
                      <strong>Урьдчилсан захиалга:</strong> Таны сонгосон бараануудыг Монголд ирсний дараа хүргэлтийн асуудлыг тусад нь шийдэх болно.
                    </div>
                  </div>
                )}
              </div>
            )}

            {wantsDelivery && !hasPreOrder && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Хүргүүлэх хаяг</label>
                    {customer?.address && (
                      <button 
                        type="button" 
                        onClick={() => setUseSavedAddress(!useSavedAddress)}
                        className="text-xs text-[#1B3561] font-medium hover:underline flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" />
                        {useSavedAddress ? "Шинэ хаяг оруулах" : "Хадгалсан хаяг ашиглах"}
                      </button>
                    )}
                  </div>
                  
                  {useSavedAddress && customer?.address ? (
                    <div className="bg-[#1B3561]/5 border border-[#1B3561]/20 rounded-xl p-4 shadow-inner">
                      <div className="flex gap-3">
                        <MapPin className="w-5 h-5 text-[#1B3561] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-[#1B3561] uppercase tracking-wider mb-1">Үндсэн хаяг</p>
                          <p className="text-sm text-slate-800 leading-relaxed font-medium">{customer.address}</p>
                        </div>
                      </div>
                      <input type="hidden" name="deliveryAddress" value={customer.address} />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea name="deliveryAddress" required={wantsDelivery} rows={2}
                        placeholder="Дүүрэг, Хороо, Байр, Тоот..."
                        className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B3561]/30 resize-none shadow-sm" />
                      
                      {customer && (
                        <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <input type="checkbox" name="saveAddress" value="true" className="accent-[#1B3561] rounded w-4 h-4" defaultChecked />
                          <span className="text-xs font-medium text-slate-600">Энэ хаягийг миний бүртгэлд хадгалах</span>
                        </label>
                      )}
                    </div>
                  )}

                  <div className="pt-2">
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Хүргэлтэд нэмэлтээр хэлэх зүйлс</label>
                    <textarea name="deliveryNotes" rows={2}
                        placeholder="Орцны код, нэмэлт зааварчилгаа..."
                        className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B3561]/30 resize-none shadow-sm" />
                  </div>
                </div>
              </div>
            )}

            {/* Loyalty Card Section */}
            <div className="pt-2">
              <label className="text-sm font-medium text-slate-700 block mb-2">Хөнгөлөлтийн карт</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={loyaltyCardNumber}
                  onChange={e => {
                    setLoyaltyCardNumber(e.target.value)
                    if (loyaltyStatus !== "idle") setLoyaltyStatus("idle")
                  }}
                  placeholder="Картын дугаар"
                  className="flex-1 border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B3561]/30 shadow-sm"
                />
                <button
                  type="button"
                  onClick={verifyLoyaltyCard}
                  disabled={loyaltyStatus === "verifying" || !loyaltyCardNumber.trim()}
                  className="bg-[#1B3561] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#1B3561]/90 transition-colors disabled:opacity-50"
                >
                  {loyaltyStatus === "verifying" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Шалгах"}
                </button>
              </div>
              
              {loyaltyError && (
                <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {loyaltyError}
                </p>
              )}

              {loyaltyStatus === "valid" && (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl mt-3 animate-in fade-in slide-in-from-top-2">
                  <p className="text-sm font-bold text-emerald-800 mb-3">Таны үлдэгдэл: {loyaltyBalance.toLocaleString()} оноо</p>
                  
                  <div className="space-y-3">
                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${loyaltyAction === "SPEND" ? "border-emerald-500 bg-white" : "border-emerald-200/50 bg-emerald-50/50 opacity-60"}`}>
                      <input 
                        type="radio" 
                        name="loyaltyAction" 
                        value="SPEND" 
                        checked={loyaltyAction === "SPEND"}
                        onChange={() => setLoyaltyAction("SPEND")}
                        disabled={loyaltyBalance <= 0}
                        className="mt-0.5 accent-emerald-600 w-4 h-4"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-800">Оноог ашиглах</p>
                        <p className="text-xs text-slate-500 mt-0.5">Таны төлөх дүнгээс {Math.min(loyaltyBalance, baseGrandTotal).toLocaleString()} ₮ хасагдана</p>
                      </div>
                    </label>

                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${loyaltyAction === "EARN" ? "border-emerald-500 bg-white" : "border-emerald-200/50 bg-emerald-50/50 opacity-60"}`}>
                      <input 
                        type="radio" 
                        name="loyaltyAction" 
                        value="EARN" 
                        checked={loyaltyAction === "EARN"}
                        onChange={() => setLoyaltyAction("EARN")}
                        className="mt-0.5 accent-emerald-600 w-4 h-4"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-800">Оноо цуглуулах</p>
                        <p className="text-xs text-slate-500 mt-0.5">Энэ худалдан авалтаас {expectedPointsEarned.toLocaleString()} оноо шинээр цугларна</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* E-barimt Section */}
            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium text-slate-700 block">И-Баримт</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="receiptType" 
                    value="individual" 
                    checked={receiptType === "individual"} 
                    onChange={() => setReceiptType("individual")}
                    className="accent-[#1B3561]" 
                  />
                  <span className="text-sm text-slate-700 font-medium">Хувь хүн</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="receiptType" 
                    value="organization" 
                    checked={receiptType === "organization"} 
                    onChange={() => setReceiptType("organization")}
                    className="accent-[#1B3561]" 
                  />
                  <span className="text-sm text-slate-700 font-medium">Байгууллага</span>
                </label>
              </div>

              {receiptType === "organization" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200 mt-2">
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Байгууллагын регистрийн дугаар</label>
                  <input 
                    type="text" 
                    name="companyRegNo" 
                    required 
                    value={companyRegNo}
                    onChange={e => setCompanyRegNo(e.target.value)}
                    placeholder="Жишээ: 1234567"
                    className="w-full border border-slate-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1B3561]/30 shadow-sm transition-all" 
                  />
                </div>
              )}
            </div>

            {/* Substitution Preference */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer bg-slate-50 p-3 rounded-lg border border-slate-200">
                <input 
                  type="checkbox" 
                  name="allowSubstitution" 
                  value="true" 
                  checked={allowSubstitution}
                  onChange={e => setAllowSubstitution(e.target.checked)}
                  className="accent-[#1B3561] mt-0.5 rounded w-4 h-4 shrink-0" 
                />
                <div className="space-y-0.5 flex-1">
                  <span className="text-sm font-medium text-slate-700 block leading-tight">
                    Хэрэв тухайн барааны үлдэгдэл дууссан тохиолдолд ижил төстэй бараагаар орлуулахыг зөвшөөрөх
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Дэлгүүрийн ажилтан аль болох ижил брэнд, хэмжээтэй бараагаар орлуулах болно.
                  </p>
                </div>
              </label>
            </div>

            {/* Combined Terms — ABOVE total */}
            {(termsOfService || (wantsDelivery && deliveryTerms)) && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                {termsOfService && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Үйлчилгээний нөхцөл:</strong> {termsOfService}
                  </p>
                )}
                {wantsDelivery && deliveryTerms && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Хүргэлтийн нөхцөл:</strong> {deliveryTerms}
                  </p>
                )}
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="accent-[#F26522]" />
                  <span className="text-xs text-slate-700 font-medium">Дээрх нөхцөлүүдтэй танилцаж, зөвшөөрч байна</span>
                </label>
              </div>
            )}

            {/* Price Summary */}
            <div className="border-t pt-4 space-y-1.5">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Барааны нийт</span>
                <span>₮{totalPrice.toLocaleString()}</span>
              </div>
              {wantsDelivery && !hasPreOrder && singleDeliveryFee > 0 && (
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Хүргэлт <span className="text-xs text-slate-400">(1 удаа)</span></span>
                  <span>+₮{singleDeliveryFee.toLocaleString()}</span>
                </div>
              )}
              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600 font-medium">
                  <span>Онооны хөнгөлөлт</span>
                  <span>-₮{loyaltyDiscount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 text-base pt-1">
                <span>Нийт төлөх</span>
                <span className="text-[#F26522]">₮{grandTotal.toLocaleString()}</span>
              </div>
              {loyaltyStatus === "valid" && loyaltyAction === "EARN" && expectedPointsEarned > 0 && (
                <div className="text-right text-xs text-emerald-600 mt-1">
                  Та {expectedPointsEarned.toLocaleString()} оноо цуглуулах гэж байна
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !agreedToTerms || !!phoneError}
              className="w-full bg-[#F26522] hover:bg-[#c9181e] text-white py-4 rounded-2xl font-bold text-[15px] shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Илгээж байна..." : "📱 QPay-ээр төлөх"}
            </button>

            {!customer && (
              <p className="text-center text-xs text-slate-500">
                Бүртгэлтэй хэрэглэгч?{" "}
                <Link href="/register" className="text-[#1B3561] font-medium hover:underline">
                  Бүртгүүлэх
                </Link>
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

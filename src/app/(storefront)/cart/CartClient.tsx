"use client"

import { useCart } from "@/context/CartContext"
import { useState, useRef, useCallback, useEffect } from "react"
import { Trash2, Minus, Plus, ShoppingCart, Truck, ShoppingBag, Package, AlertCircle, Info, CheckCircle2, Loader2, MessageSquare } from "lucide-react"
import { checkout, validateCartStock } from "@/app/actions/checkout-actions"
import { startPhoneVerification, checkPhoneVerified } from "@/app/actions/verify-actions"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { getUpcomingDeliveryDates } from "@/lib/utils"
import { isValidPhone } from "@/lib/customer-utils"

export function CartClient({ 
  termsOfService, 
  deliveryTerms, 
  qpayEnabled, 
  globalDeliveryFee = 0, 
  deliveryScheduleDays = "3,6",
  phoneVerificationEnabled = true
}: { 
  termsOfService?: string; 
  deliveryTerms?: string; 
  qpayEnabled?: boolean;
  globalDeliveryFee?: number;
  deliveryScheduleDays?: string;
  phoneVerificationEnabled?: boolean;
}) {
  const { items, removeItem, updateQty, clearCart, totalPrice } = useCart()
  const router = useRouter()
  const { toast } = useToast()
  const [wantsDelivery, setWantsDelivery] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState<string | null>(null)

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
          toast({ title: "✅ Утас баталгаажлаа!", description: "Та захиалгаа үргэлжлүүлж болно." })
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
      toast({ title: "✅ Утас баталгаажлаа!", description: "Та захиалгаа үргэлжлүүлж болно." })
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

  const hasPreOrder = items.some(i => i.isPreOrder)
  const hasInStock = items.some(i => !i.isPreOrder)
  const isMixedCart = hasPreOrder && hasInStock

  // One-time delivery fee = highest delivery fee among cart items, fallback to global if all are 0
  const maxItemFee = items.length > 0 ? Math.max(0, ...items.map(i => i.deliveryFee || 0)) : 0
  const singleDeliveryFee = (wantsDelivery && !hasPreOrder)
    ? (maxItemFee > 0 ? maxItemFee : globalDeliveryFee)
    : 0
  const grandTotal = totalPrice + singleDeliveryFee

  if (isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
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
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="w-9 h-9 text-slate-300" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Таны сагс хоосон байна</h1>
        <p className="text-slate-500 mb-8 text-sm">Нүүр хуудсаас бараа сонгоорой</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-[#4F46E5] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#4338ca] transition-colors">
          <Package className="w-4 h-4" /> Бараа үзэх
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
      const accountNumber = formData.get("accountNumber") as string
      const deliveryAddress = formData.get("deliveryAddress") as string

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
        note: undefined,
        items: items.map(item => ({
          productId: item.batchId,
          quantity: item.qty,
        })),
      })

      if (!result.success) {
        setError(result.error ?? "Захиалга үүсгэхэд алдаа гарлаа")
        setSubmitting(false)
        return
      }

      toast({ title: "Амжилттай", description: "Захиалга үүсгэгдлээ." })
      setIsRedirecting(true)
      clearCart()
      // Redirect to order page
      router.push(`/order-manual/ref/${result.order.orderNumber}`)
    } catch (e: any) {
      setError(e.message || "Алдаа гарлаа")
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
        <ShoppingCart className="w-6 h-6 text-indigo-500" />
        Миний сагс
        <span className="text-base font-normal text-slate-400">({items.length} бараа)</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-3 space-y-3">
          {items.map(item => (
            <div key={item.batchId} className="bg-white rounded-xl border p-4 flex gap-4 items-start">
              <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
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
                <p className="text-sm text-indigo-600 font-semibold mt-1">₮{item.unitPrice.toLocaleString()}</p>

                {/* Qty controls */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => updateQty(item.batchId, item.qty - 1)}
                    className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-slate-100 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="min-w-[24px] text-center font-semibold text-slate-900 text-sm">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.batchId, item.qty + 1)}
                    className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-slate-100 transition-colors"
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
            className="bg-white rounded-xl border p-6 space-y-5 sticky top-6"
          >
            <h2 className="font-bold text-slate-900 text-lg">Захиалгын мэдээлэл</h2>

            {/* Accuracy notice */}
            <div className="flex gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-xs leading-relaxed">
                Мэдээллээ <strong>үнэн зөв</strong> оруулна уу. Утасны болон дансны дугаар нь захиалгыг баталгаажуулах гол баримт болно. Мөн хүргүүлэх хаягаа зөв бичнэ үү. Баярлалаа
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Таны нэр</label>
              <input name="customerName" required placeholder="Жишээ: Отгоо" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
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
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${phoneVerified ? "bg-green-50 border-green-300 text-green-800" : phoneError ? "border-red-400 focus:ring-red-300" : "focus:ring-indigo-300"}`}
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
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 w-full bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3 mt-2">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div className="space-y-1.5">
                      <p className="text-sm font-semibold text-indigo-900">SMS баталгаажуулалт</p>
                      {verifyInstruction && (
                        <p className="text-xs text-indigo-700 leading-relaxed">{verifyInstruction}</p>
                      )}
                      <p className="text-xs text-indigo-600">
                        Доорх товчийг дарж SMS мессежээ илгээнэ үү. Илгээсний дараа автоматаар баталгаажна.
                      </p>
                    </div>
                  </div>

                  {verifySmsUri && (
                    <a
                      href={verifySmsUri}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      📱 SMS илгээх (144773)
                    </a>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-indigo-500">
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
                            toast({ title: "✅ Утас баталгаажлаа!", description: "Та захиалгаа үргэлжлүүлж болно." });
                          } else {
                            toast({ title: "Баталгаажаагүй байна", description: "Хэрэв та мессеж илгээсэн бол түр хүлээгээд дахин шалгана уу." });
                          }
                        } catch {}
                        setVerifyLoading(false);
                      }}
                      className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-200 transition-colors"
                    >
                      Гараар шалгах
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Дансны дугаар</label>
              <input
                name="accountNumber"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                placeholder="Жишээ: 5000123456"
                onInput={(e) => {
                  // Strip non-digit characters as user types
                  const target = e.target as HTMLInputElement
                  target.value = target.value.replace(/\D/g, "")
                }}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <p className="text-xs text-amber-600 flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5">
                <AlertCircle className="w-3 h-3 shrink-0" /> IBAN оруулах шаардлагагүй! Зөвхөн дансны тоон дугаарыг бичнэ үү.
              </p>
            </div>

            {/* Delivery toggle */}
            {!hasPreOrder ? (
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Хүлээн авах хэлбэр</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setWantsDelivery(false)}
                    className={`border-2 rounded-xl p-3 text-center transition-all text-sm ${!wantsDelivery ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:bg-slate-50"}`}>
                    <ShoppingBag className={`w-4 h-4 mx-auto mb-1 ${!wantsDelivery ? "text-indigo-500" : "text-slate-500"}`} />
                    <p className="font-semibold text-slate-700">Өөрөө ирнэ</p>
                    <p className="text-xs text-slate-400">Үнэгүй</p>
                  </button>
                  <button type="button" onClick={() => setWantsDelivery(true)}
                    className={`border-2 rounded-xl p-3 text-center transition-all text-sm ${wantsDelivery ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:bg-slate-50"}`}>
                    <Truck className={`w-4 h-4 mx-auto mb-1 ${wantsDelivery ? "text-indigo-500" : "text-slate-500"}`} />
                    <p className="font-semibold text-slate-700">Хүргэлтээр</p>
                    {singleDeliveryFee > 0
                      ? <p className="text-xs text-indigo-500 font-medium">+₮{singleDeliveryFee.toLocaleString()}</p>
                      : <p className="text-xs text-green-500">+Хүргэлтийн үнэ</p>
                    }
                  </button>
                </div>
                {wantsDelivery && (
                  <div className="space-y-3 mt-4 border-t pt-4">
                    <label className="text-sm font-medium text-slate-700 block mb-2">Хүргүүлэх өдөр сонгох</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {getUpcomingDeliveryDates(deliveryScheduleDays, 2).map((opt, i) => (
                        <label key={i} className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${selectedDeliveryDate === opt.date.toISOString() ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
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
                            <p className={`text-sm font-bold ${selectedDeliveryDate === opt.date.toISOString() ? 'text-indigo-900' : 'text-slate-700'}`}>{opt.formatted}</p>
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
                  <label className="text-sm font-medium text-slate-700">Хүргүүлэх хаяг</label>
                  <textarea name="deliveryAddress" required={wantsDelivery} rows={2}
                    placeholder="Дүүрэг, Хороо, Байр, Тоот..."
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
                </div>
              </div>
            )}

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
                  <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="accent-indigo-600" />
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
              <div className="flex justify-between font-bold text-slate-900 text-base pt-1">
                <span>Нийт төлөх</span>
                <span className="text-indigo-600">₮{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !agreedToTerms || !!phoneError}
              className="w-full bg-[#4F46E5] hover:bg-[#4338ca] text-white py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Илгээж байна..." : "📦 Захиалга илгээх"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

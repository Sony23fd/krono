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

import { RegionMapModal } from "@/components/storefront/RegionMapModal"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
export function CartClient({ 
  termsOfService, 
  deliveryTerms, 
  qpayEnabled,
  paylinkEnabled = true, 
  deliveryScheduleDays = "3,6",
  phoneVerificationEnabled = true,
  loyaltyPercent,
  loyaltyEnabled = true,
  deliveryThreshold,
  deliveryFeeBelowThreshold,
  deliveryFeeAboveThreshold,
  initialReferralReward = 0
}: { 
  termsOfService?: string; 
  deliveryTerms?: string; 
  qpayEnabled?: boolean;
  paylinkEnabled?: boolean;
  deliveryScheduleDays?: string;
  phoneVerificationEnabled?: boolean;
  loyaltyPercent?: number;
  loyaltyEnabled?: boolean;
  deliveryThreshold?: number;
  deliveryFeeBelowThreshold?: number;
  deliveryFeeAboveThreshold?: number;
  initialReferralReward?: number;
}) {
  const { items, removeItem, updateQty, clearCart, totalPrice } = useCart()
  const { customer, updateAddress } = useCustomerAuth()
  const router = useRouter()
  const wantsDelivery = true
  const [paymentMethod, setPaymentMethod] = useState<"QPAY" | "PAYLINK" | "BANK_TRANSFER">(() => {
    if (paylinkEnabled) return "PAYLINK"
    if (qpayEnabled) return "QPAY"
    return "BANK_TRANSFER"
  })
  const [submitting, setSubmitting] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (paymentMethod === "PAYLINK" && !paylinkEnabled) {
      setPaymentMethod(qpayEnabled ? "QPAY" : "BANK_TRANSFER")
    } else if (paymentMethod === "QPAY" && !qpayEnabled) {
      setPaymentMethod(paylinkEnabled ? "PAYLINK" : "BANK_TRANSFER")
    }
  }, [paylinkEnabled, qpayEnabled, paymentMethod])
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

  // ─── Referral State ───
  const [useReferralReward, setUseReferralReward] = useState(false)
  const referralRewardBalance = initialReferralReward || 0

  // ─── Address State ───
  const [deliveryRegion, setDeliveryRegion] = useState("Шинэ Дархан")
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [useSavedAddress, setUseSavedAddress] = useState(false)
  useEffect(() => {
    if (customer?.address) {
      setUseSavedAddress(true)
      const match = customer.address.match(/^\[(.*?)\]\s*(.*)$/)
      if (match) {
        setDeliveryRegion(match[1])
      }
    }
  }, [customer?.address])

  useEffect(() => {
    // If there are no terms to agree to, set agreedToTerms to true by default
    const hasTerms = Boolean(termsOfService || (wantsDelivery && deliveryTerms));
    if (!hasTerms) {
      setAgreedToTerms(true);
    }
  }, [termsOfService, deliveryTerms, wantsDelivery])


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

  // Conditional delivery fee logic removed
  const finalDeliveryFee = 0;
  let singleDeliveryFee = 0;
  
  // Apply referral reward to delivery fee
  let referralRewardUsed = 0;
  if (useReferralReward && referralRewardBalance > 0 && singleDeliveryFee > 0) {
    referralRewardUsed = Math.min(referralRewardBalance, singleDeliveryFee)
    singleDeliveryFee -= referralRewardUsed
  }
  
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
        <div className="w-24 h-24 mb-6 relative hover:scale-105 transition-transform duration-300 text-slate-300">
          <Package className="w-full h-full" />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-3 tracking-tight">Захиалга сонгогдоогүй байна</h1>
        <p className="text-slate-500 mb-8 text-base">Та манай системүүдтэй танилцаад сонголтоо хийнэ үү.</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50">
          <Info className="w-5 h-5" /> Буцах
        </Link>
      </div>
    )
  }

  async function handleCheckout(formData: FormData) {
    setSubmitting(true)
    setError(null)
    
    // Define popup outside try-catch to ensure we can close it on errors
    let paymentPopup: Window | null = null;
    
    try {
      const customerName = formData.get("customerName") as string
      const phoneNumber = formData.get("phoneNumber") as string
      const customerEmail = formData.get("customerEmail") as string
      const accountNumber = ""
      const rawAddress = formData.get("deliveryAddress") as string
      const deliveryRegionValue = formData.get("deliveryRegion") as string
      const deliveryAddress = useSavedAddress ? rawAddress : `[${deliveryRegionValue}] ${rawAddress}`
      const saveAddress = formData.get("saveAddress") === "true"
      
      const deliveryNotes = formData.get("deliveryNotes") as string
      const allowSubst = formData.get("allowSubstitution") === "true"
      const rType = formData.get("receiptType") as string
      const cRegNo = formData.get("companyRegNo") as string

      if (saveAddress && customer) {
        updateAddress(deliveryAddress)
      }

      // Pre-open popup synchronously to bypass popup blockers (especially Safari/iOS)
      if (paymentMethod === "PAYLINK") {
        const width = 600
        const height = 800
        const left = (window.innerWidth - width) / 2
        const top = (window.innerHeight - height) / 2
        // Open empty popup immediately
        paymentPopup = window.open('about:blank', 'PaylinkPayment', `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`)
        
        if (paymentPopup) {
          paymentPopup.document.write('<div style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;color:#333;">Төлбөрийн хуудас руу шилжиж байна...</div>')
        }
      }

      // Pre-validate stock (non-locking, UI feedback)
      const stockCheck = await validateCartStock(
        items.map(i => ({ productId: i.batchId, quantity: i.qty }))
      )
      if (!stockCheck.success) {
        if (paymentPopup) paymentPopup.close();
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
        customerEmail: customerEmail,
        note: deliveryNotes,
        paymentMethod,
        userId: customer?.id,
        receiptType: rType,
        companyRegistryNumber: rType === "organization" ? cRegNo : undefined,
        allowSubstitution: allowSubst,
        loyaltyCardNumber: loyaltyStatus === "valid" ? loyaltyCardNumber : undefined,
        loyaltyAction: loyaltyStatus === "valid" ? loyaltyAction : undefined,
        useReferralReward: useReferralReward,
        items: items.map(item => ({
          productId: item.productId || item.batchId, // fallback for legacy carts
          variantId: item.variantId,
          quantity: item.qty,
        })),
      })

      if (!result.success) {
        if (paymentPopup) paymentPopup.close();
        setError(result.error ?? "Захиалга үүсгэхэд алдаа гарлаа")
        setSubmitting(false)
        return
      }

      toast.success("Захиалга амжилттай үүсгэгдлээ")
      setIsRedirecting(true)
      clearCart()

      // Redirect popup to actual payment URL
      if (result.paymentMethod === "PAYLINK" && result.paylinkData?.paymentUrl) {
        if (paymentPopup) {
          paymentPopup.location.href = result.paylinkData.paymentUrl
        }
      } else if (paymentPopup) {
        paymentPopup.close();
      }

      if (result.paymentMethod === "BANK_TRANSFER") {
        router.push(`/order-manual/ref/${result.order.orderNumber}`)
      } else {
        router.push(`/order-pending/ref/${result.order.orderNumber}`)
      }
    } catch (e: any) {
      if (paymentPopup) paymentPopup.close();
      setError(e.message || "Алдаа гарлаа")
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-indigo-600" />
          Захиалга баталгаажуулах
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
                await handleCheckout(fd)
              }}
              className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-6 sm:p-8 space-y-6 sticky top-24"
            >
              <h2 className="font-bold text-slate-900 text-lg">Захиалгын мэдээлэл</h2>

              {/* Hidden default values to bypass validation */}
              <input type="hidden" name="customerName" value="Зочин" />
              <input type="hidden" name="phoneNumber" value="99999999" />
              <input type="hidden" name="customerEmail" value="digital@krono.com" />
              <input type="hidden" name="paymentMethod" value={paymentMethod} />

              <div className="pt-2 space-y-2.5">
                <span className="text-sm font-bold text-slate-800 block">Төлбөр төлөх хэлбэр</span>
                <div className="grid grid-cols-1 gap-2.5">
                  {paylinkEnabled && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("PAYLINK")}
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${paymentMethod === "PAYLINK" ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-sm" : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"}`}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className={`w-6 h-6 ${paymentMethod === "PAYLINK" ? "text-indigo-600" : "text-slate-400"}`} />
                        <div>
                          <div className="font-bold text-base leading-tight">Paylink төлбөрийн систем</div>
                          <div className="text-xs opacity-75 mt-0.5">Карт болон QR ашиглан төлөх</div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "PAYLINK" ? "border-indigo-600 bg-indigo-600" : "border-slate-300"}`}>
                        {paymentMethod === "PAYLINK" && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  )}

                  {qpayEnabled && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("QPAY")}
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${paymentMethod === "QPAY" ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-sm" : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"}`}
                    >
                      <div className="flex items-center gap-3">
                        <Banknote className={`w-6 h-6 ${paymentMethod === "QPAY" ? "text-indigo-600" : "text-slate-400"}`} />
                        <div>
                          <div className="font-bold text-base leading-tight">QPay (Банкны апп)</div>
                          <div className="text-xs opacity-75 mt-0.5">Бүх банкны аппликэйшнээр уншуулах</div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "QPAY" ? "border-indigo-600 bg-indigo-600" : "border-slate-300"}`}>
                        {paymentMethod === "QPAY" && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("BANK_TRANSFER")}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${paymentMethod === "BANK_TRANSFER" ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-sm" : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"}`}
                  >
                    <div className="flex items-center gap-3">
                      <Banknote className={`w-6 h-6 ${paymentMethod === "BANK_TRANSFER" ? "text-indigo-600" : "text-slate-400"}`} />
                      <div>
                        <div className="font-bold text-base leading-tight">Дансаар шилжүүлэх</div>
                        <div className="text-xs opacity-75 mt-0.5">Хаан банк, Голомт банк г.м</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "BANK_TRANSFER" ? "border-indigo-600 bg-indigo-600" : "border-slate-300"}`}>
                      {paymentMethod === "BANK_TRANSFER" && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                </div>
              </div>

              {/* Terms and conditions removed */}

              {/* Price Summary */}
              <div className="border-t pt-4 space-y-1.5">
                <div className="flex justify-between font-bold text-slate-900 text-base pt-1">
                  <span>Нийт төлөх</span>
                  <span className="text-[#F26522]">₮{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#F26522] hover:bg-[#E85B1C] text-white py-4 rounded-2xl font-bold text-[15px] shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? "Уншиж байна..." : "Төлбөр төлөх"}
              </button>
            </form>

        </div>
      </div>
      <RegionMapModal 
        isOpen={isMapModalOpen} 
        onClose={() => setIsMapModalOpen(false)} 
        defaultTab={deliveryRegion as "Шинэ Дархан" | "Хуучин Дархан"} 
      />
    </div>
  )
}

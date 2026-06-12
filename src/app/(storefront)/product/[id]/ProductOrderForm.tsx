"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Truck, ShoppingBag, AlertCircle, Info } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { checkout } from "@/app/actions/checkout-actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Package } from "lucide-react"
import { isValidPhone } from "@/lib/customer-utils"

interface Props {
  productId: string
  unitPrice: number
  remainingQuantity: number
  termsOfService?: string
  options?: Array<{ name: string, values: string[] }>
  variants?: Array<{ id: string; sku: string; name: string; stockQuantity: number; price?: number }>
}



export function ProductOrderForm({ productId, unitPrice, remainingQuantity, termsOfService, options, variants }: Props) {
  // Build variantStock map from variants array
  const variantStock = variants?.reduce((acc, v) => ({ ...acc, [v.name]: v.stockQuantity }), {} as Record<string, number>) || null
  const router = useRouter()
  const { removeItem } = useCart()
    const [qty, setQty] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(!termsOfService)
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const defaultOpts: Record<string, string> = {}
    if (options) {
      options.forEach(opt => {
        if (opt.values.length > 0) defaultOpts[opt.name] = opt.values[0]
      })
    }
    return defaultOpts
  })




  // Compute variant key from selected options
  const currentVariantKey = useMemo(() => {
    if (!options || options.length === 0) return null
    return Object.values(selectedOptions).join('-')
  }, [selectedOptions, options])

  // Determine stock for current variant
  const currentStock = useMemo(() => {
    if (!variantStock || !currentVariantKey) return remainingQuantity
    return variantStock[currentVariantKey] ?? 0
  }, [variantStock, currentVariantKey, remainingQuantity])

  // Check if a specific option value is sold out
  const isOptionSoldOut = (optName: string, optValue: string): boolean => {
    if (!variantStock || !options) return false
    const tempSelection = { ...selectedOptions, [optName]: optValue }
    const key = Object.values(tempSelection).join('-')
    return (variantStock[key] ?? 0) <= 0
  }

  const itemTotal = qty * unitPrice
  const totalAmount = itemTotal

  function validatePhone(value: string) {
    const digits = value.replace(/\D/g, "")
    if (digits.length !== 8) { setPhoneError("Утасны дугаар заавал 8 оронтой байх ёстой") }
    else if (!isValidPhone(digits)) { setPhoneError("Зөв утасны дугаар оруулна уу (жишээ: 99112233)") }
    else { setPhoneError(null) }
  }

  const canSubmit =
    agreedToTerms &&
    !phoneError &&
    (currentStock > 0)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const data = new FormData(e.currentTarget)
    const phone = (data.get("phoneNumber") as string || "").replace(/\D/g, "")
    if (phone.length !== 8) {
      setPhoneError("Утасны дугаар заавал 8 оронтой байх ёстой")
      return
    }

    if (!agreedToTerms) {
      setError("Нөхцөлүүдтэй зөвшөөрнө үү")
      return
    }

    // Variant stock check
    if (variantStock && currentVariantKey) {
      const available = variantStock[currentVariantKey] ?? 0
      if (available < qty) {
        setError(`Таны сонгосон хослолын үлдэгдэл хүрэлцэхгүй байна (${available} ширхэг)`)
        return
      }
    }

    setSubmitting(true)
    setError(null)

    const idempotencyKey = crypto.randomUUID()

    const result = await checkout({
      idempotencyKey,
      customerName: data.get("customerName") as string,
      customerEmail: data.get("customerEmail") as string,
      phoneNumber: phone,
      accountNumber: data.get("accountNumber") as string,
      items: [{
        productId,
        quantity: qty,
      }],
    })

    if (result.success) {
      removeItem(productId)
      toast.success("Захиалга амжилттай үүсгэлээ")
      setIsRedirecting(true)
      router.push(`/order-pending/ref/${result.order?.orderNumber}`)
    } else {
      setError(result.error ?? "Алдаа гарлаа")
      setSubmitting(false)
    }
  }

  if (isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="relative w-20 h-20 mb-4">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#4F46E5] rounded-full border-t-transparent animate-spin"></div>
          <Package className="absolute inset-0 m-auto w-6 h-6 text-[#4F46E5] animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">Захиалга үүсгэж байна...</h3>
        <p className="text-slate-500 text-sm">Төлбөрийн хуудас руу шилжиж байна</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Accuracy notice */}
      <div className="flex gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2.5">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <p className="text-xs leading-relaxed">
          Мэдээллээ <strong>үнэн зөв</strong> оруулна уу. Утасны дугаар болон дансны дугаар нь таны захиалгыг баталгаажуулах гол баримт болно.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="customerName">Таны нэр</label>
          <Input id="customerName" name="customerName" required placeholder="Жишээ: Отгоо" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="customerEmail">Цахим шуудан (И-мэйл)</label>
          <Input id="customerEmail" name="customerEmail" type="email" required placeholder="Жишээ: name@example.com" />
          <p className="text-xs text-slate-500">Энэ мэйл рүү таны худалдан авсан бараа илгээгдэнэ.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="phoneNumber">Утасны дугаар</label>
          <Input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            inputMode="numeric"
            required
            maxLength={8}
            placeholder="8 оронтой тоо"
            onChange={e => validatePhone(e.target.value)}
            className={phoneError ? "border-red-400 focus-visible:ring-red-300" : ""}
          />
          {phoneError && (<p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {phoneError}</p>)}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="accountNumber">Төлбөр төлсөн дансны дугаар</label>
        <Input id="accountNumber" name="accountNumber" type="tel" inputMode="numeric" pattern="[0-9]*" required placeholder="Жишээ: 5000123456"
          onInput={(e) => { const t = e.target as HTMLInputElement; t.value = t.value.replace(/\D/g, "") }} />
        <p className="text-xs text-amber-600 flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5">
          <AlertCircle className="w-3 h-3 shrink-0" /> IBAN оруулах шаардлагагүй! Зөвхөн дансны тоон дугаарыг бичнэ үү.
        </p>
      </div>

      {/* Product Options (Variants) */}
      {options && options.length > 0 && (
        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-[#1B3561]" /> Сонголт
          </h3>
          <div className="space-y-3">
            {options.map((opt, i) => (
              <div key={i} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{opt.name}</label>
                <div className="flex flex-wrap gap-2">
                  {opt.values.map(val => {
                    const soldOut = isOptionSoldOut(opt.name, val)
                    const isSelected = selectedOptions[opt.name] === val
                    return (
                      <button
                        key={val}
                        type="button"
                        disabled={soldOut}
                        onClick={() => {
                          setSelectedOptions({ ...selectedOptions, [opt.name]: val })
                          setQty(1) // Reset qty when changing variant
                        }}
                        className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-all ${soldOut
                            ? "bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed line-through"
                            : isSelected
                              ? "bg-[#1B3561] border-[#1B3561] text-white shadow-md shadow-blue-900/20"
                              : "bg-white border-slate-200 text-slate-700 hover:border-[#1B3561] hover:bg-slate-50"
                          }`}
                      >
                        {val}
                        {soldOut && <span className="ml-1 text-[10px] no-underline">(дууссан)</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          {/* Show current variant stock */}
          {variantStock && currentVariantKey && (
            <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border mt-2 ${currentStock > 0
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-600"
              }`}>
              {currentStock > 0 ? `Энэ сонголтонд ${currentStock} ширхэг үлдсэн` : "Энэ сонголт дууссан байна"}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Тоо ширхэг</label>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))}
            className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-slate-100 text-lg font-bold">−</button>
          <span className="min-w-[32px] text-center font-bold text-slate-900">{qty}</span>
          <button type="button" onClick={() => setQty(q => Math.min(currentStock, q + 1))}
            className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-slate-100 text-lg font-bold">+</button>
          <span className="text-xs text-slate-400">/ {currentStock} ш үлдсэн</span>
        </div>
      </div>

      {/* Combined Terms */}
      {termsOfService && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
          {termsOfService && (
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Үйлчилгээний нөхцөл:</strong> {termsOfService}
            </p>
          )}

          <label className="flex items-start gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={e => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 accent-indigo-600"
            />
            <span className="text-xs text-slate-700 font-medium">Дээрх нөхцөлүүдтэй танилцаж, зөвшөөрч байна</span>
          </label>
        </div>
      )}

      {/* Total */}
      <div className="bg-slate-50 rounded-xl p-4 border space-y-1.5">
        <div className="flex justify-between text-sm text-slate-500">
          <span>₮{unitPrice.toLocaleString()} × {qty}</span>
          <span>₮{itemTotal.toLocaleString()}</span>
        </div>

        <div className="flex justify-between font-bold text-slate-900 text-base border-t pt-2">
          <span>Нийт төлөх</span>
          <span className="text-[#F26522] text-xl">₮{totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-100 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      <Button
        type="submit"
        disabled={submitting || !canSubmit}
        className="w-full bg-[#F26522] hover:bg-[#E85B1C] active:scale-[0.98] py-7 text-base sm:text-lg font-bold shadow-xl shadow-red-500/20 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all"
      >
        {submitting ? "Илгээж байна..." : (currentStock > 0) ? "Захиалга баталгаажуулах" : "Дууссан"}
      </Button>

      {!agreedToTerms && termsOfService && (
        <p className="text-center text-xs text-slate-400">Үйлчилгээний нөхцөлтэй зөвшөөрснөөр захиалгаа дуусгана уу</p>
      )}
    </form>
  )
}

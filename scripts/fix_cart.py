import re

with open('src/app/(storefront)/cart/CartClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace payment method state
content = re.sub(
    r'const \[paymentMethod, setPaymentMethod\] = useState<"QPAY" \| "BANK_TRANSFER">.*?\n',
    'const [paymentMethod, setPaymentMethod] = useState<"QPAY" | "PAYLINK" | "BANK_TRANSFER">("PAYLINK")\n',
    content
)

# Remove the customer ? logic and replace with standard form
start_idx = content.find('{!customer ? (')
end_idx = content.find('</form>\n          )}\n        </div>')

if start_idx != -1 and end_idx != -1:
    end_idx += len('</form>\n          )}')
    
    new_form = '''
          <form
              onSubmit={async (e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                if (!agreedToTerms) { setError("Нөхцөлүүдтэй зөвшөөрнө үү"); return }
                await handleCheckout(fd)
              }}
              className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-6 sm:p-8 space-y-6 sticky top-24"
            >
              <h2 className="font-bold text-slate-900 text-lg">Захиалгын мэдээлэл</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Таны нэр</label>
                  <input type="text" name="customerName" required defaultValue={customer?.name || ""}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B3561]/30" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Утасны дугаар</label>
                  <input type="tel" name="phoneNumber" required defaultValue={customer?.phone || ""}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B3561]/30" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Имэйл хаяг (Дижитал бараа хүлээн авах)</label>
                  <input type="email" name="customerEmail" required defaultValue={customer?.email || ""}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B3561]/30" />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="pt-2">
                <label className="text-sm font-medium text-slate-700 block mb-2">Төлбөрийн хэлбэр</label>
                <div className="grid grid-cols-3 gap-3">
                  <label className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "PAYLINK" ? "border-[#1B3561] bg-blue-50/50 text-[#1B3561]" : "border-slate-100 bg-white hover:border-slate-200 text-slate-600"}`}>
                    <input type="radio" name="paymentMethod" value="PAYLINK" checked={paymentMethod === "PAYLINK"} onChange={() => setPaymentMethod("PAYLINK")} className="sr-only" />
                    <span className="text-sm font-bold text-center leading-tight">Paylink<br/><span className="text-[10px] font-medium opacity-80">(Карт, QPay)</span></span>
                  </label>
                  {qpayEnabled && (
                    <label className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "QPAY" ? "border-[#1B3561] bg-blue-50/50 text-[#1B3561]" : "border-slate-100 bg-white hover:border-slate-200 text-slate-600"}`}>
                      <input type="radio" name="paymentMethod" value="QPAY" checked={paymentMethod === "QPAY"} onChange={() => setPaymentMethod("QPAY")} className="sr-only" />
                      <span className="text-sm font-bold text-center leading-tight">QPay<br/><span className="text-[10px] font-medium opacity-80">(Апп)</span></span>
                    </label>
                  )}
                  <label className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "BANK_TRANSFER" ? "border-[#1B3561] bg-blue-50/50 text-[#1B3561]" : "border-slate-100 bg-white hover:border-slate-200 text-slate-600"}`}>
                    <input type="radio" name="paymentMethod" value="BANK_TRANSFER" checked={paymentMethod === "BANK_TRANSFER"} onChange={() => setPaymentMethod("BANK_TRANSFER")} className="sr-only" />
                    <span className="text-sm font-bold text-center leading-tight">Шилжүүлэг<br/><span className="text-[10px] font-medium opacity-80">(Гараар)</span></span>
                  </label>
                </div>
              </div>

              {(termsOfService || deliveryTerms) && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="accent-[#F26522] w-4 h-4 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700 font-medium flex-1">
                      Би үйлчилгээний нөхцөлүүдийг уншиж танилцсан бөгөөд зөвшөөрч байна
                    </span>
                  </label>
                </div>
              )}

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
                disabled={submitting || !agreedToTerms}
                className="w-full bg-[#F26522] hover:bg-[#E85B1C] text-white py-4 rounded-2xl font-bold text-[15px] shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? "Уншиж байна..." : "Төлбөр төлөх"}
              </button>
            </form>
'''
    
    content = content[:start_idx] + new_form + content[end_idx:]

with open('src/app/(storefront)/cart/CartClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

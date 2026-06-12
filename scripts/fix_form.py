import re

with open(r"d:\tursh\krono\src\app\(storefront)\product\[id]\ProductOrderForm.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Modify Props
content = re.sub(
    r"interface Props {[\s\S]*?}",
    """interface Props {
  productId: string
  unitPrice: number
  remainingQuantity: number
  termsOfService?: string
  options?: Array<{ name: string, values: string[] }>
  variants?: Array<{ id: string; sku: string; name: string; stockQuantity: number; price?: number }>
}""",
    content
)

# Remove unused imports and functions
content = re.sub(r"const DAY_NAMES[\s\S]*?function getNextDeliveryDate[\s\S]*?return \"\"[\s\n]*?}", "", content)
content = re.sub(r"export function ProductOrderForm\([^)]*\)", "export function ProductOrderForm({ productId, unitPrice, remainingQuantity, termsOfService, options, variants }: Props)", content)

# Remove delivery related states
content = re.sub(r"const \[wantsDelivery, setWantsDelivery\] = useState\(false\)\n", "", content)
content = re.sub(r"const \[selectedDeliveryDate, setSelectedDeliveryDate\] = useState<string \| null>\(null\)\n", "", content)

# Update agreedToTerms
content = re.sub(r"const \[agreedToTerms, setAgreedToTerms\] = useState\(!termsOfService && !deliveryTerms\)", "const [agreedToTerms, setAgreedToTerms] = useState(!termsOfService)", content)

# Fix itemsTotal
content = re.sub(r"const totalAmount = itemTotal \+ \(wantsDelivery \? deliveryFee : 0\)", "const totalAmount = itemTotal", content)

# In handleSubmit, add customerEmail
checkout_call = """
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
"""
content = re.sub(r"const result = await checkout\(\{[\s\S]*?\}\)", checkout_call.strip(), content)

# Remove Delivery UI
content = re.sub(r"\{/\* Delivery Type \*/\}[\s\S]*?(?=\{/\* Address \*/\})", "", content)
content = re.sub(r"\{/\* Address \*/\}[\s\S]*?(?=\{/\* Combined Terms \*/\})", "", content)

# Update email input
email_input = """
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="customerEmail">Цахим шуудан (И-мэйл)</label>
          <Input id="customerEmail" name="customerEmail" type="email" required placeholder="Жишээ: name@example.com" />
          <p className="text-xs text-slate-500">Энэ мэйл рүү таны худалдан авсан бараа илгээгдэнэ.</p>
        </div>
"""
content = re.sub(r"(<Input id=\"customerName\".*?/>\n\s*</div>)", r"\1" + "\n" + email_input, content)

# Fix terms
content = re.sub(r"\{\(termsOfService \|\| \(wantsDelivery && deliveryTerms\)\) && \(", "{termsOfService && (", content)
content = re.sub(r"\{wantsDelivery && deliveryTerms && \([\s\S]*?\}\)", "", content)
content = re.sub(r"!\w+ && \(termsOfService \|\| deliveryTerms\)", "!agreedToTerms && termsOfService", content)

# Fix canSubmit check
content = re.sub(r"\(isPreOrder \|\| currentStock > 0\)", "(currentStock > 0)", content)
content = re.sub(r"if \(variantStock && currentVariantKey && !isPreOrder\) \{", "if (variantStock && currentVariantKey) {", content)

# Fix delivery schedule imports
content = re.sub(r"import \{ getUpcomingDeliveryDates \} from \"@/lib/utils\"\n", "", content)

# Replace remaining deliveryFee UI in Total
content = re.sub(r"\{wantsDelivery && !isPreOrder && deliveryFee > 0 && \([\s\S]*?\}\)", "", content)

with open(r"d:\tursh\krono\src\app\(storefront)\product\[id]\ProductOrderForm.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")

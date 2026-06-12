import re
import os

# Fix ProductOrderForm.tsx
path_form = r"d:\tursh\krono\src\app\(storefront)\product\[id]\ProductOrderForm.tsx"
with open(path_form, "r", encoding="utf-8") as f:
    content = f.read()

# remove deliveryFee UI block completely
content = re.sub(r"\{wantsDelivery && !isPreOrder && deliveryFee > 0 && \([\s\S]*?\}\)", "", content)
with open(path_form, "w", encoding="utf-8") as f:
    f.write(content)

# Fix checkout-actions.ts CheckoutInput type
path_checkout = r"d:\tursh\krono\src\app\actions\checkout-actions.ts"
with open(path_checkout, "r", encoding="utf-8") as f:
    checkout = f.read()

if "customerEmail?: string" not in checkout:
    checkout = checkout.replace("customerName: string", "customerName: string\n  customerEmail?: string")

if '"PAYLINK"' not in checkout:
    checkout = checkout.replace('paymentMethod?: "QPAY" | "BANK_TRANSFER"', 'paymentMethod?: "QPAY" | "BANK_TRANSFER" | "PAYLINK"')

# Also we need to make sure Order has customerEmail in creation
if "customerEmail: input.customerEmail" not in checkout:
    checkout = checkout.replace("customerName: input.customerName,", "customerName: input.customerName,\n          customerEmail: input.customerEmail,")

with open(path_checkout, "w", encoding="utf-8") as f:
    f.write(checkout)

# Fix schema.prisma
path_schema = r"d:\tursh\krono\prisma\schema.prisma"
with open(path_schema, "r", encoding="utf-8") as f:
    schema = f.read()

if "PAYLINK" not in schema:
    schema = schema.replace("BANK_TRANSFER", "BANK_TRANSFER\n  PAYLINK")

if "customerEmail String?" not in schema:
    schema = schema.replace("customerPhone String", "customerPhone String\n  customerEmail String?")

with open(path_schema, "w", encoding="utf-8") as f:
    f.write(schema)

print("Fixes applied.")

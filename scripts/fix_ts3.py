import re

path_checkout = r"d:\tursh\krono\src\app\actions\checkout-actions.ts"
with open(path_checkout, "r", encoding="utf-8") as f:
    content = f.read()

# remove wantsDelivery reference at 132
content = re.sub(r"const deliveryFee = input\.wantsDelivery \? settings\.deliveryFee : 0\n", "const deliveryFee = 0\n", content)

# remove wantsDelivery reference at 156
# example:  if (input.wantsDelivery && !settings.allowPreOrderDelivery) { ... }
content = re.sub(r"if \(input\.wantsDelivery && !settings\.allowPreOrderDelivery\) \{[\s\S]*?\}", "", content)

# remove deliveryAddress etc. at 211
# example:
#           wantsDelivery: input.wantsDelivery,
#           deliveryAddress: input.wantsDelivery ? input.deliveryAddress?.trim() : null,
#           deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : null,
#           deliveryFee: input.wantsDelivery ? deliveryFee : 0,

content = re.sub(r"wantsDelivery:\s*input\.wantsDelivery,\n", "", content)
content = re.sub(r"deliveryAddress:.*?\n", "", content)
content = re.sub(r"deliveryDate:.*?\n", "", content)
content = re.sub(r"deliveryFee:.*?\n", "", content)

with open(path_checkout, "w", encoding="utf-8") as f:
    f.write(content)

print("Fix applied")

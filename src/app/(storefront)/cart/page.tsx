import { getShopSettings } from "@/app/actions/settings-actions"
import { CartClient } from "./CartClient"

export const dynamic = "force-dynamic"

export default async function CartPage() {
  const settings = await getShopSettings()
  return (
    <CartClient
      termsOfService={settings.terms_of_service}
      deliveryTerms={settings.delivery_terms}
      qpayEnabled={settings.qpay_enabled === "true"}
      globalDeliveryFee={Number(settings.delivery_fee || 0)}
      deliveryScheduleDays={settings.delivery_schedule_days || "3,6"}
      phoneVerificationEnabled={settings.phone_verification_enabled !== "false"}
      loyaltyPercent={Number(settings.loyalty_discount_percent || 3)}
      loyaltyEnabled={settings.loyalty_enabled !== "false"}
    />
  )
}

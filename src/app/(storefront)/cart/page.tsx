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
      deliveryScheduleDays={settings.delivery_schedule_days || "3,6"}
      loyaltyPercent={Number(settings.loyalty_discount_percent || 3)}
      loyaltyEnabled={settings.loyalty_enabled !== "false"}
      deliveryThreshold={Number(settings.delivery_threshold || 50000)}
      deliveryFeeBelowThreshold={Number(settings.delivery_fee_below_threshold || 8000)}
      deliveryFeeAboveThreshold={Number(settings.delivery_fee_above_threshold || 5000)}
    />
  )
}

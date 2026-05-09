import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { getCurrentAdmin } from "@/lib/auth"
import { StickerPrintClient } from "./StickerPrintClient"
import { getShopSettings } from "@/app/actions/settings-actions"

export const dynamic = "force-dynamic"

export default async function PrintStickerPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>
}) {
  const admin = await getCurrentAdmin()
  if (!admin || !["ADMIN", "CARGO_ADMIN", "DATAADMIN"].includes(admin.role)) {
    notFound()
  }

  const { ids } = await searchParams
  if (!ids) {
    return <div className="p-8 text-center">Захиалгын ID олдсонгүй!</div>
  }

  const orderIdList = ids.split(',').filter(Boolean)

  const orders = await db.order.findMany({
    where: {
      id: { in: orderIdList }
    },
    include: {
      items: true,
    }
  })

  if (orders.length === 0) {
    return <div className="p-8 text-center">Захиалга олдсонгүй!</div>
  }

  // Get shop settings for phone
  const settings = await getShopSettings()
  const shopPhone = settings["shop_phone"] || "8853 9667"
  const shopName = settings["shop_name"] || "ANAR KOREA SHOP"

  // Group by customer to print one sticker per customer
  const { getCanonicalCustomerId } = await import("@/lib/customer-utils")
  const groupedByCustomer: Record<string, any[]> = {}
  for (const order of orders) {
    const key = getCanonicalCustomerId(order)
    if (!groupedByCustomer[key]) groupedByCustomer[key] = []
    groupedByCustomer[key].push(order)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://anarkoreashop.mn"

  return (
    <StickerPrintClient 
      groups={JSON.parse(JSON.stringify(Object.values(groupedByCustomer)))} 
      shopName={shopName}
      shopPhone={shopPhone}
      appUrl={appUrl}
    />
  )
}

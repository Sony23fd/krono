import { StickerPrintClient } from "../StickerPrintClient"

export const dynamic = "force-dynamic"

/**
 * Demo page for sticker preview — uses mock data, no DB needed
 * Access at: /admin/print/sticker/demo
 */
export default function StickerDemoPage() {
  const demoGroups = [
    // Group 1: БЗД, 2 items, PAID
    [
      {
        id: "demo-1a",
        orderNumber: 10241,
        customerName: "Батболд",
        customerPhone: "99112233",
        deliveryAddress: "БЗД, 26-р хороо, Саруул хороолол, 122-р байр, 3 давхар",
        paymentStatus: "COMPLETED",
        quantity: 2,
        batch: { product: { name: "Солонгос Гоо сайхны тос (50ml)" } }
      },
      {
        id: "demo-1b",
        orderNumber: 10242,
        customerName: "Батболд",
        customerPhone: "99112233",
        deliveryAddress: "БЗД, 26-р хороо, Саруул хороолол, 122-р байр, 3 давхар",
        paymentStatus: "COMPLETED",
        quantity: 1,
        batch: { product: { name: "Алоэ Вера маск (10ш багц)" } }
      },
    ],
    // Group 2: СБД, 1 item, UNPAID
    [
      {
        id: "demo-2a",
        orderNumber: 10305,
        customerName: "Сарангэрэл",
        customerPhone: "88005566",
        deliveryAddress: "СБД, 8-р хороо, Шангри-ла оффис, 12 давхар",
        paymentStatus: "PENDING",
        quantity: 3,
        batch: { product: { name: "Витамин С серум (30ml)" } }
      },
    ],
    // Group 3: ХУД, fragile item
    [
      {
        id: "demo-3a",
        orderNumber: 10410,
        customerName: "Ганболд",
        customerPhone: "95553344",
        deliveryAddress: "ХУД, Зайсан, Ривер гарден хотхон, Б блок 502",
        paymentStatus: "COMPLETED",
        quantity: 1,
        batch: { product: { name: "Солонгос шил савтай шингэн савангийн багц" } }
      },
      {
        id: "demo-3b",
        orderNumber: 10411,
        customerName: "Ганболд",
        customerPhone: "95553344",
        deliveryAddress: "ХУД, Зайсан, Ривер гарден хотхон, Б блок 502",
        paymentStatus: "COMPLETED",
        quantity: 2,
        batch: { product: { name: "Нүүрний тос (гоо сайхан)" } }
      },
      {
        id: "demo-3c",
        orderNumber: 10412,
        customerName: "Ганболд",
        customerPhone: "95553344",
        deliveryAddress: "ХУД, Зайсан, Ривер гарден хотхон, Б блок 502",
        paymentStatus: "COMPLETED",
        quantity: 1,
        batch: { product: { name: "Биоүсний шампунь (250ml)" } }
      },
    ],
  ]

  return (
    <StickerPrintClient
      groups={demoGroups}
      shopName="БИЛЭГ СУПЕРМАРКЕТ"
      shopPhone="8853 9667"
      appUrl="https://anarkoreashop.mn"
    />
  )
}

import { EventEmitter } from "events"

const globalForEmitter = global as unknown as { orderEmitter?: EventEmitter }
if (!globalForEmitter.orderEmitter) {
  globalForEmitter.orderEmitter = new EventEmitter()
  globalForEmitter.orderEmitter.setMaxListeners(100)
}
export const orderEmitter = globalForEmitter.orderEmitter

// ── Types ────────────────────────────────────────────────────────────────────

export interface NewOrderEvent {
  transactionRef: string
  customerName: string
  customerPhone?: string
  items: Array<{
    orderId: string
    productName: string
    quantity: number
    totalAmount: number
    batchId: string
  }>
  totalAmount: number
  wantsDelivery: boolean
  createdAt: string
}

export type OrderConfirmedEvent = {
  transactionRef: string
  name: string
  phone: string
  totalAmount: number
}

export type DeliveryRequestEvent = {
  customerName: string
  customerPhone: string
  address: string
  orderCount: number
  createdAt: string
}

export type SystemAlertEvent = {
  message: string
  details?: string
  createdAt: string
}

// ── Server-side debounce grouping ────────────────────────────────────────────
// Multiple createOrder calls share the same transactionRef (cart checkout).
// We buffer them for 800ms then emit a single grouped notification.

const globalForBuffer = global as unknown as {
  _orderBuffer?: Map<string, { event: NewOrderEvent; timer: ReturnType<typeof setTimeout> }>
}
if (!globalForBuffer._orderBuffer) {
  globalForBuffer._orderBuffer = new Map()
}
const orderBuffer = globalForBuffer._orderBuffer

export function emitNewOrder(event: Omit<NewOrderEvent, "items"> & {
  item: NewOrderEvent["items"][0]
}) {
  const ref = event.transactionRef
  const existing = orderBuffer.get(ref)

  if (existing) {
    // Merge item into existing group
    clearTimeout(existing.timer)
    existing.event.items.push(event.item)
    existing.event.totalAmount += event.item.totalAmount
  } else {
    // New group
    const grouped: NewOrderEvent = {
      transactionRef: ref,
      customerName: event.customerName,
      customerPhone: event.customerPhone,
      items: [event.item],
      totalAmount: event.item.totalAmount,
      wantsDelivery: event.wantsDelivery,
      createdAt: event.createdAt,
    }
    orderBuffer.set(ref, { event: grouped, timer: null as any })
  }

  const entry = orderBuffer.get(ref)!
  entry.timer = setTimeout(() => {
    orderEmitter.emit("new-order", entry.event)
    orderBuffer.delete(ref)
  }, 800) // wait 800ms for any additional items from same checkout
}

export function emitDeliveryRequest(event: DeliveryRequestEvent) {
  orderEmitter.emit("delivery-request", event)
}

import { NextRequest } from "next/server"
import { orderEmitter, NewOrderEvent, OrderConfirmedEvent, DeliveryRequestEvent, SystemAlertEvent } from "@/lib/orderEvents"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Send initial heartbeat
      controller.enqueue(encoder.encode("data: {\"type\":\"connected\"}\n\n"))

      function onNewOrder(event: NewOrderEvent) {
        const data = JSON.stringify({ type: "new-order", ...event })
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      }

      function onOrderConfirmed(event: OrderConfirmedEvent) {
        const data = JSON.stringify({ type: "order-confirmed", ...event })
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      }

      function onDeliveryRequest(event: DeliveryRequestEvent) {
        const data = JSON.stringify({ type: "delivery-request", ...event })
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      }

      function onSystemAlert(event: SystemAlertEvent) {
        const data = JSON.stringify({ type: "system-alert", ...event })
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      }

      // Heartbeat every 25 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode("data: {\"type\":\"heartbeat\"}\n\n"))
        } catch {
          clearInterval(heartbeat)
        }
      }, 25000)

      orderEmitter.on("new-order", onNewOrder)
      orderEmitter.on("order-confirmed", onOrderConfirmed)
      orderEmitter.on("delivery-request", onDeliveryRequest)
      orderEmitter.on("system-alert", onSystemAlert)

      // Cleanup when client disconnects
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat)
        orderEmitter.off("new-order", onNewOrder)
        orderEmitter.off("order-confirmed", onOrderConfirmed)
        orderEmitter.off("delivery-request", onDeliveryRequest)
        orderEmitter.off("system-alert", onSystemAlert)
        try { controller.close() } catch {}
      })
    }
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    }
  })
}

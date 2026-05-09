import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log("Backfilling old deliveryRequestedAt...")
  
  // Find all orders that want delivery but have no deliveryRequestedAt
  const orders = await db.order.findMany({
    where: { 
      wantsDelivery: true,
      deliveryRequestedAt: null
    }
  })

  console.log(`Found ${orders.length} orders to backfill.`)

  let updatedCount = 0
  for (const order of orders) {
    await db.order.update({
      where: { id: order.id },
      data: { deliveryRequestedAt: order.updatedAt }
    })
    updatedCount++
  }

  console.log(`Successfully backfilled ${updatedCount} orders.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })

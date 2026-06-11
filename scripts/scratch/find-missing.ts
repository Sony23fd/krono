import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  // Let's get the max updatedAt date to see when the last sync occurred
  const lastSyncProduct = await db.product.findFirst({
    orderBy: { updatedAt: 'desc' }
  })

  if (!lastSyncProduct) {
    console.log("No products found.")
    return
  }

  // Assuming a sync happened recently (within 1 hour of the max date)
  // Or maybe let's just group by updatedAt dates
  
  const twentyFourHoursAgo = new Date()
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

  const missingProducts = await db.product.findMany({
    where: {
      updatedAt: {
        lt: twentyFourHoursAgo
      }
    },
    select: {
      sku: true,
      name: true,
      status: true,
      updatedAt: true
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  console.log(`Found ${missingProducts.length} products that were NOT updated in the last 24 hours.`)
  if (missingProducts.length > 0) {
    console.log("Here are the first 50:")
    missingProducts.slice(0, 50).forEach(p => {
      console.log(`SKU: ${p.sku} | Name: ${p.name} | Status: ${p.status} | Last Updated: ${p.updatedAt.toISOString()}`)
    })
  }

  // Total products vs recent
  const total = await db.product.count()
  const recent = total - missingProducts.length
  console.log(`Total: ${total}, Recent (Synced): ${recent}, Missing (Old): ${missingProducts.length}`)
}

main().catch(console.error).finally(() => db.$disconnect())

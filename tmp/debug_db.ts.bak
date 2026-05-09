import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("--- DEBUG START ---")
  
  const totalOrders = await prisma.order.count()
  console.log("Total Orders:", totalOrders)
  
  const statuses = await prisma.orderStatusType.findMany()
  console.log("Statuses:", statuses.map(s => ({ id: s.id, name: s.name, isDefault: s.isDefault, isFinal: s.isFinal })))
  
  const nonRejected = await prisma.order.count({
    where: { paymentStatus: { not: "REJECTED" } }
  })
  console.log("Non-Rejected Orders:", nonRejected)
  
  const batches = await prisma.batch.findMany({
    include: { product: true }
  })
  console.log("Batches:", batches.length)
  
  const groupSales = await prisma.order.groupBy({
    by: ['batchId'],
    _sum: { quantity: true }
  })
  console.log("Grouped Sales:", groupSales)
  
  console.log("--- DEBUG END ---")
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())

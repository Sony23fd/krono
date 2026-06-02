import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany({
    where: { sku: '113744' },
    select: {
      name: true,
      sku: true,
      stockQuantity: true,
      status: true,
      isPreOrder: true
    }
  })
  
  console.log("Product:", products)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

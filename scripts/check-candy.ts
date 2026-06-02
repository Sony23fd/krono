import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany({
    where: {
      name: {
        contains: 'Зв',
        mode: 'insensitive'
      }
    },
    select: {
      name: true,
      sku: true
    }
  })
  
  console.log("Products found:", products)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

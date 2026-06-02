import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const q = 'Звёдная парочка'
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
      status: "ACTIVE"
    },
    select: {
      name: true,
      sku: true
    }
  })
  
  console.log("Products found with 'Звёдная парочка':", products)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

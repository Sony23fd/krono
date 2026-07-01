import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.shopSettings.updateMany({
    where: { key: "shop_name" },
    data: { value: "Онлайн дэлгүүр" }
  })
  
  const settings = await prisma.shopSettings.findMany()
  console.log("Current Settings:", settings)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function test() {
   const data = await prisma.order.findMany({
      where: {
         status: { isFinal: true },
         paymentStatus: { not: "REJECTED" }
      },
      select: {
         status: {
            select: { name: true }
         }
      }
   })
   const grouped = data.reduce((acc: any, curr: any) => {
      const name = curr.status?.name || 'NO_STATUS';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
   }, {})
   console.log(JSON.stringify(grouped, null, 2));
}
test()

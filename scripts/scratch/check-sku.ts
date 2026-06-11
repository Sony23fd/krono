import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
db.product.findMany({ 
  where: { sku: { contains: '135015' } }, 
  select: { sku: true, name: true, status: true, id: true } 
})
.then(res => console.log(res))
.catch(console.error)
.finally(() => db.$disconnect());

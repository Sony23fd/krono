import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const item = await prisma.product.findUnique({
    where: { sku: '194144' }
  });
  console.log(item);
}
main().catch(console.error).finally(() => prisma.$disconnect());

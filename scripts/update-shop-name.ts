import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.shopSettings.update({
    where: { key: 'shop_name' },
    data: { value: 'Билэг хүргэлт' }
  });
  console.log('Shop name updated');
}

main().catch(console.error).finally(() => prisma.$disconnect());

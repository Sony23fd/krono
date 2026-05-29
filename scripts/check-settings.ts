import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.shopSettings.findMany();
  console.log(settings);
}

main().catch(console.error).finally(() => prisma.$disconnect());

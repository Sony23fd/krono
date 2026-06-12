import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.shopSettings.findUnique({
    where: { key: 'POS_SYNC_SCRIPT' }
  });
  console.log("DB Value:", result ? "EXISTS" : "NULL", result?.value?.length || 0);
}
main().catch(console.error).finally(() => prisma.$disconnect());

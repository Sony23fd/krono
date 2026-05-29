import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('dataadmin123', 10);
  await prisma.user.update({
    where: { email: 'dataadmin@shop.mn' },
    data: { password }
  });
  console.log('Password updated to dataadmin123');
}

main().catch(console.error).finally(() => prisma.$disconnect());

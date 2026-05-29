import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'DATAADMIN' } });
  if (admin) {
    console.log('Exists:', admin.email);
  } else {
    const password = await bcrypt.hash('dataadmin123', 10);
    const newAdmin = await prisma.user.create({
      data: {
        email: 'dataadmin@bileg.mn',
        password,
        name: 'Data Admin',
        role: 'DATAADMIN',
        phone: '99887766'
      }
    });
    console.log('Created:', newAdmin.email);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('Importing data to Contabo...');

  const data = JSON.parse(fs.readFileSync('catalog.json', 'utf8'));
  const { categories, products, variants } = data;

  console.log(`Found ${categories.length} categories, ${products.length} products to import.`);

  // Clear existing
  console.log('Clearing old data from database...');
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  console.log('Old data cleared successfully.');

  console.log('Inserting categories...');
  for (const c of categories) {
    await prisma.category.create({ data: c });
  }

  console.log('Inserting products in batches...');
  const BATCH_SIZE = 500;
  let insertedCount = 0;
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    try {
      await prisma.product.createMany({
        data: batch,
        skipDuplicates: true
      });
      insertedCount += batch.length;
      console.log(`Inserted ${insertedCount} / ${products.length} products...`);
    } catch (e) {
      console.error(`Error inserting batch ${i}:`, e);
    }
  }

  if (variants && variants.length > 0) {
      console.log('Inserting variants...');
      await prisma.productVariant.createMany({
          data: variants,
          skipDuplicates: true
      });
  }

  console.log('Import to Contabo completed successfully!');
}

main()
  .catch(e => {
    console.error('Error during import:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

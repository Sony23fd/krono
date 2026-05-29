import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('Exporting data from Supabase...');
  
  const categories = await prisma.category.findMany();
  const products = await prisma.product.findMany();
  const variants = await prisma.productVariant.findMany();

  const data = {
    categories,
    products,
    variants,
  };

  fs.writeFileSync('catalog.json', JSON.stringify(data, null, 2));
  console.log(`Exported ${categories.length} categories, ${products.length} products, ${variants.length} variants.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

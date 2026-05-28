import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';

const prisma = new PrismaClient();

function generateSlug(name: string, suffix: string = '') {
  let base = name
    .toLowerCase()
    .replace(/[\s_]+/g, '-') // replace spaces and underscores with hyphens
    .replace(/[^\w\u0400-\u04FF\-]+/g, '') // remove special characters except cyrillic, alphanumeric, hyphens
    .replace(/\-+/g, '-') // remove consecutive hyphens
    .replace(/^-+|-+$/g, ''); // trim hyphens

  if (!base) {
    base = 'item';
  }
  
  if (suffix) {
    return `${base}-${suffix}`;
  }
  return base;
}

async function main() {
  console.log('Starting data import...');

  // 1. Clear existing data
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

  // 2. Read Excel file
  console.log('Reading data.xlsx...');
  const workbook = xlsx.readFile('data.xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = xlsx.utils.sheet_to_json(sheet) as any[];

  // Normalize spaces in keys and values
  const data = rawData.map(row => {
    const newRow: any = {};
    for (const key in row) {
      const newKey = key.replace(/\u00A0/g, ' ').trim();
      newRow[newKey] = typeof row[key] === 'string' ? row[key].replace(/\u00A0/g, ' ').trim() : row[key];
    }
    return newRow;
  });

  let currentCategoryName = '';
  let currentCategoryId = '';
  let sortOrder = 1;
  let categoryCount = 0;
  
  const productsToInsert: any[] = [];
  
  console.log('Processing rows...');
  for (const row of data) {
    const code = row['Код'];
    const rawName = row['Материалын нэр'];

    if (!code) continue;

    if (code === 'Бүлэг:') {
      currentCategoryName = rawName || 'Ангилалгүй';
      const slug = generateSlug(currentCategoryName);
      
      let existing = await prisma.category.findUnique({ where: { name: currentCategoryName } });
      if (!existing) {
        let finalSlug = slug;
        let slugCounter = 1;
        while (await prisma.category.findUnique({ where: { slug: finalSlug } })) {
          finalSlug = `${slug}-${slugCounter}`;
          slugCounter++;
        }

        existing = await prisma.category.create({
          data: {
            name: currentCategoryName,
            slug: finalSlug,
            sortOrder: sortOrder++,
          }
        });
        categoryCount++;
        console.log(`Created Category: ${currentCategoryName}`);
      }
      currentCategoryId = existing.id;
    } else {
      if (!currentCategoryId) {
        currentCategoryName = 'Бусад';
        let existing = await prisma.category.findUnique({ where: { name: currentCategoryName } });
        if (!existing) {
          existing = await prisma.category.create({
            data: {
              name: currentCategoryName,
              slug: 'busad',
              sortOrder: 999,
            }
          });
          categoryCount++;
          console.log(`Created Default Category: ${currentCategoryName}`);
        }
        currentCategoryId = existing.id;
      }

      const sku = String(code);
      const name = rawName || 'Нэргүй бараа';
      const price = Number(row['Худалдах үнэ']) || 0;
      const stockQuantity = Number(row['Эцсийн үлдэгдэл']) || 0;
      const unit = row['Хэмжих нэгж'] || 'ширхэг';

      const slug = generateSlug(name, sku);

      productsToInsert.push({
        sku,
        name,
        slug,
        price,
        stockQuantity,
        unit,
        categoryId: currentCategoryId,
        status: 'ACTIVE',
      });
    }
  }
  
  console.log(`Processed ${productsToInsert.length} products to insert. Starting batch insert...`);
  
  // Insert in batches of 500 to avoid rate limits
  const BATCH_SIZE = 500;
  let insertedCount = 0;
  for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
    const batch = productsToInsert.slice(i, i + BATCH_SIZE);
    try {
       await prisma.product.createMany({
          data: batch,
          skipDuplicates: true
       });
       insertedCount += batch.length;
       console.log(`Inserted ${insertedCount} / ${productsToInsert.length} products...`);
    } catch (e) {
       console.error(`Error inserting batch ${i}:`, e);
    }
  }

  console.log(`\nImport completed successfully!`);
  console.log(`- Categories created: ${categoryCount}`);
  console.log(`- Products attempted to insert: ${productsToInsert.length}`);
}

main()
  .catch(e => {
    console.error('Error during import:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

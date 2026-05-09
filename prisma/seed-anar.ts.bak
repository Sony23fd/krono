import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const db = new PrismaClient();

async function main() {
  console.log("Хуучин датаг цэвэрлэж байна...");
  
  // Find the exact archive category so we only delete its orders/batches 
  let category = await db.category.findFirst({ where: { name: 'Хуучин Бааз (Archive)' } });
  if (!category) {
    category = await db.category.create({
      data: { name: 'Хуучин Бааз (Archive)', isArchived: true }
    });
  }

  // Delete all orders/batches inside this particular legacy category so we don't destroy live new Web orders!
  const legacyBatches = await db.batch.findMany({ where: { categoryId: category.id } });
  const legacyBatchIds = legacyBatches.map(b => b.id);
  const legacyProductIds = legacyBatches.map(b => b.productId);

  await db.order.deleteMany({ where: { batchId: { in: legacyBatchIds } } });
  await db.batch.deleteMany({ where: { id: { in: legacyBatchIds } } });
  await db.product.deleteMany({ where: { id: { in: legacyProductIds } } });

  console.log("Цэвэрлэгээ дууссан! anar.txt уншиж байна...");
  
  const rawData = fs.readFileSync('anar.txt', 'utf8');
  const json = JSON.parse(rawData);
  const oldBatches = json.data.orders;
  
  let finalStatusObj = await db.orderStatusType.findFirst({ where: { name: "Хүргэгдсэн" } });
  if (!finalStatusObj) {
      finalStatusObj = await db.orderStatusType.create({ data: { name: "Хүргэгдсэн", color: "green", isFinal: true } });
  }

  let totalOrdersInserted = 0;

  for (const b of oldBatches) {
    const product = await db.product.create({
      data: {
        name: b.name || "Тодорхойгүй бараа",
        price: Number(b.shippingPrice) || 0,
        weight: Number(b.weight) || 0,
        isActive: false
      }
    });

    const batch = await db.batch.create({
      data: {
        productId: product.id,
        categoryId: category.id,
        description: b.description || "",
        targetQuantity: b.goal || 0,
        remainingQuantity: b.goalLeft || 0,
        status: "CLOSED",
        isAvailableForSale: false,
        createdAt: new Date(b.orderDate || new Date())
      }
    });

    const ordersToInsert = [];
    for (const item of b.orderitemSet) {
      const rawName = item.name || "Тодорхойгүй Худалдан авагч";
      const phoneRegex = /\b([89]\d{7})\b/;
      const phoneMatch = rawName.match(phoneRegex);
      
      let actualAccount = item.phoneNumber || ""; 
      const actualPhone = phoneMatch ? phoneMatch[1] : "";
      
      // Additional check: If account is 8 digits and starts with 8, 9 maybe it's actually phone?
      // But legacy logic explicitly says admins typed account in phoneNumber field.
      let cleanName = rawName.replace(actualPhone, '').trim();
      cleanName = cleanName.replace(/,\s*,/g, ',').replace(/^,+|,+$/g, '').trim();

      ordersToInsert.push({
        batchId: batch.id,
        customerName: cleanName,
        customerPhone: actualPhone || "Утас алга",
        accountNumber: actualAccount,
        quantity: item.quantity || 1,
        statusId: finalStatusObj.id,
        cargoFee: Number(item.shippingPrice) || 0,
        paymentStatus: "CONFIRMED",
        creationSource: "ADMIN",
        createdByAdmin: "Хуучин Бааз",
        createdAt: new Date(item.createdAt || new Date())
      });
    }

    if (ordersToInsert.length > 0) {
      await db.order.createMany({ data: ordersToInsert });
      totalOrdersInserted += ordersToInsert.length;
    }
  }

  console.log(`Амжилттай! ${oldBatches.length} багц болон ${totalOrdersInserted} захиалга шинээр орлоо.`);
}

main().catch(console.error).finally(() => db.$disconnect());

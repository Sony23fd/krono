import { db } from "./src/lib/db";

async function test() {
  const batch = await db.batch.findFirst({ include: { product: true } });
  if (!batch) {
    console.log("No batch found.");
    return;
  }
  
  console.log("Original name:", batch.product?.name);
  
  try {
    const updated = await db.batch.update({
      where: { id: batch.id },
      data: {
        product: {
          update: {
            name: batch.product?.name + " TEST",
          }
        }
      },
      include: { product: true }
    });
    console.log("Updated name:", updated.product?.name);
  } catch (e) {
    console.error("Prisma error:", e);
  }
}

test().catch(console.error);

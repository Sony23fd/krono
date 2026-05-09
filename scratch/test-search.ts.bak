import { searchOrders } from "../src/app/actions/order-actions"
import { db } from "../src/lib/db"

async function test() {
  const sampleOrder = await db.order.findFirst({
    where: { accountNumber: { not: null } }
  });
  console.log("Sample Order Account Number:", sampleOrder?.accountNumber);
  if (sampleOrder?.accountNumber) {
    const res = await searchOrders(sampleOrder.accountNumber);
    console.log("Found:", res.orders?.length);
  }
}

test();


test();

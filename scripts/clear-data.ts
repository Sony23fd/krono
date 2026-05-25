import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

async function main() {
  console.log("🧹 Цэвэрлэж эхэллээ...")

  // Delete all orders & related items
  await db.payment.deleteMany()
  await db.orderItem.deleteMany()
  await db.order.deleteMany()
  console.log("✅ Захиалгууд устгагдлаа")

  // Delete all cart items
  await db.cartItem.deleteMany()
  await db.cart.deleteMany()
  console.log("✅ Сагсны мэдээлэл устгагдлаа")

  // Delete all products & related items
  await db.productVariant.deleteMany()
  await db.product.deleteMany()
  await db.category.deleteMany()
  console.log("✅ Бараа, ангилал устгагдлаа")

  // Optional: clear logs
  await db.activityLog.deleteMany()
  await db.visitorLog.deleteMany()
  console.log("✅ Лог устгагдлаа")

  console.log("🎉 Бүх дата амжилттай цэвэрлэгдлээ!")
}

main()
  .catch((e) => {
    console.error("❌ Цэвэрлэхэд алдаа гарлаа:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })

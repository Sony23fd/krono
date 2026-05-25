import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const db = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // 1. Admin хэрэглэгч
  const adminPassword = await hash("admin123", 12)
  const admin = await db.user.upsert({
    where: { email: "admin@shop.mn" },
    update: {},
    create: {
      email: "admin@shop.mn",
      phone: "99999999",
      name: "Админ",
      password: adminPassword,
      role: "ADMIN",
    },
  })
  console.log(`✅ Admin: ${admin.email}`)

  // 1.5. Data Admin хэрэглэгч
  const dataAdminPassword = await hash("dataadmin123", 12)
  const dataAdmin = await db.user.upsert({
    where: { email: "dataadmin@shop.mn" },
    update: {},
    create: {
      email: "dataadmin@shop.mn",
      phone: "88888888",
      name: "Дата Админ",
      password: dataAdminPassword,
      role: "DATAADMIN",
    },
  })
  console.log(`✅ Data Admin: ${dataAdmin.email}`)

  // 2. Ангилалууд
  const categories = [
    { name: "Гоо сайхан", slug: "goo-saikhan" },
    { name: "Арьс арчилгаа", slug: "aris-archilgaa" },
    { name: "Хоол хүнс", slug: "khool-khuns" },
    { name: "Эрүүл мэнд", slug: "eruul-mend" },
    { name: "Гэр ахуй", slug: "ger-akhui" },
  ]

  for (const cat of categories) {
    await db.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }
  console.log(`✅ ${categories.length} ангилал`)

  // 3. Жишээ бараанууд
  const sampleProducts = [
    { sku: "GS-001", name: "Солонгос нүүрний крем", price: 35000, stockQuantity: 50, categorySlug: "goo-saikhan" },
    { sku: "GS-002", name: "Нүдний тос", price: 28000, stockQuantity: 30, categorySlug: "goo-saikhan" },
    { sku: "AA-001", name: "Витамин C серум", price: 45000, stockQuantity: 25, categorySlug: "aris-archilgaa" },
  ]

  for (const p of sampleProducts) {
    const cat = await db.category.findUnique({ where: { slug: p.categorySlug } })
    const slug = p.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-а-яөүё]/gi, "") + `-${p.sku.toLowerCase()}`

    await db.product.upsert({
      where: { sku: p.sku },
      update: { stockQuantity: p.stockQuantity, price: p.price },
      create: {
        sku: p.sku,
        name: p.name,
        slug,
        price: p.price,
        stockQuantity: p.stockQuantity,
        status: "ACTIVE",
        ...(cat && { categoryId: cat.id }),
      },
    })
  }
  console.log(`✅ ${sampleProducts.length} жишээ бараа`)

  // 4. ShopSettings
  const settings = [
    { key: "shop_name", value: "Энгийн Шоп" },
    { key: "delivery_fee", value: "6000" },
    { key: "qpay_enabled", value: "false" },
  ]

  for (const s of settings) {
    await db.shopSettings.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    })
  }
  console.log(`✅ ${settings.length} тохиргоо`)

  console.log("\n🎉 Seed амжилттай дууслаа!")
}

main()
  .catch((e) => {
    console.error("❌ Seed алдаа:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })

import { PrismaClient } from "@prisma/client"
const db = new PrismaClient()

async function main() {
  console.log("Seeding Banners and Featured/Sale Products...")

  await db.banner.createMany({
    data: [
      {
        title: "Шинэ жилийн урамшуулал",
        imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200&h=400",
        linkUrl: "/shop",
        isActive: true,
        sortOrder: 1,
      },
      {
        title: "Шинэхэн ногоо, жимс",
        imageUrl: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=1200&h=400",
        linkUrl: "/shop?category=huns",
        isActive: true,
        sortOrder: 2,
      }
    ]
  })
  console.log("Created banners")

  const products = await db.product.findMany({ take: 10 })
  
  if (products.length >= 2) {
    await db.product.update({
      where: { id: products[0].id },
      data: { isFeatured: true, comparePrice: Number(products[0].price) + 10000 }
    })
    await db.product.update({
      where: { id: products[1].id },
      data: { isFeatured: true, comparePrice: Number(products[1].price) + 5000 }
    })
    console.log("Updated products")
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())

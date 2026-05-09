import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting full database reset for Demo...")

  // 1. Delete all existing orders, batches, products, categories
  console.log("Deleting existing orders...")
  await prisma.order.deleteMany()
  
  console.log("Deleting existing batches...")
  await prisma.batch.deleteMany()
  
  console.log("Deleting existing products...")
  await prisma.product.deleteMany()
  
  console.log("Deleting existing categories...")
  await prisma.category.deleteMany()

  // 2. Fetch Default Order Status
  let defaultStatus = await prisma.orderStatusType.findFirst({
    where: { isDefault: true }
  })
  
  if (!defaultStatus) {
    defaultStatus = await prisma.orderStatusType.create({
      data: { name: "Хүлээгдэж байгаа", color: "amber", isDefault: true }
    })
    await prisma.orderStatusType.create({
      data: { name: "Баталгаажсан", color: "indigo" }
    })
    await prisma.orderStatusType.create({
      data: { name: "Монгол руу гарсан", color: "blue" }
    })
    await prisma.orderStatusType.create({
      data: { name: "Хүргэгдсэн", color: "green", isFinal: true }
    })
    await prisma.orderStatusType.create({
      data: { name: "Цуцлагдсан", color: "red", isFinal: true }
    })
  }

  // 3. Create 2 Categories
  console.log("Creating 2 clean categories...")
  const catBeauty = await prisma.category.create({
    data: { name: "Гоо сайхан & Арьс арчилгаа" }
  })
  const catFashion = await prisma.category.create({
    data: { name: "Хувцас & Загвар" }
  })

  // 4. Create 6 Products (Batches)
  console.log("Creating 6 products (batches)...")
  
  const products = [
    {
      name: "COSRX Snail Mucin 96% Essence",
      price: 35000,
      description: "Гүн чийгшүүлж, арьсыг нөхөн сэргээнэ.",
      img: "https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=800&auto=format&fit=crop",
      catId: catBeauty.id
    },
    {
      name: "Laneige Lip Sleeping Mask",
      price: 25000,
      description: "Уруул чийгшүүлэх шөнийн маск.",
      img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800&auto=format&fit=crop",
      catId: catBeauty.id
    },
    {
      name: "Beauty of Joseon Sunscreen",
      price: 32000,
      description: "Цагаан үлдэхгүй, нарнаас хамгаалах тос.",
      img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop",
      catId: catBeauty.id
    },
    {
      name: "Оверсайз Солонгос Цамц",
      price: 45000,
      description: "Хавар намрын загварлаг өдөр тутмын цамц.",
      img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
      catId: catFashion.id
    },
    {
      name: "Солонгос Үүргэвч (Хар)",
      price: 65000,
      description: "Хичээл болон өдөр тутамд зориулсан багтаамж сайтай цүнх.",
      img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&auto=format&fit=crop",
      catId: catFashion.id
    },
    {
      name: "Өдөр тутмын классик пүүз",
      price: 85000,
      description: "Хөлд эвтэйхэн, Солонгос классик загварын пүүз.",
      img: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=800&auto=format&fit=crop",
      catId: catFashion.id
    }
  ]

  const createdBatches = []
  for (const p of products) {
    const targetQuantity = 50;
    const batch = await prisma.batch.create({
      data: {
        product: {
          create: {
            name: p.name,
            price: p.price,
            description: p.description,
            imageUrl: p.img
          }
        },
        category: { connect: { id: p.catId } },
        targetQuantity: targetQuantity,
        remainingQuantity: targetQuantity, // Will be decremented when orders are placed
        price: p.price,
        description: "",
        isAvailableForSale: true,
      },
      include: { product: true }
    });
    createdBatches.push(batch);
  }

  // 5. Create 5 Customers placing orders
  console.log("Creating 5 distinct customers & orders...")
  
  const customers = [
    { name: "Болдбаатар", phone: "99112233", acc: "5011223344" },
    { name: "Саруул", phone: "88776655", acc: "5088776655" },
    { name: "Тэмүүлэн", phone: "99001122", acc: "5099001122" },
    { name: "Агиймаа", phone: "99887766", acc: "5099887766" },
    { name: "Золзаяа", phone: "88112233", acc: "5088112233" }
  ]

  // We assign 2 orders to each customer from random products
  let orderIndex = 0;
  for (const c of customers) {
    // Pick 2 random batches
    const pickedBatches = [
      createdBatches[orderIndex % createdBatches.length],
      createdBatches[(orderIndex + 2) % createdBatches.length]
    ]
    
    // Generate a unique transaction Ref for this user's 'cart'
    const tRef = `DEMO-TR-${Date.now()}-${c.phone}`

    for (const b of pickedBatches) {
      const q = Math.floor(Math.random() * 2) + 1; // 1 or 2 items
      const totalAmount = Number(b.price || 0) * q;

      await prisma.order.create({
        data: {
          batchId: b.id,
          customerName: c.name,
          customerPhone: c.phone,
          accountNumber: c.acc,
          quantity: q,
          statusId: defaultStatus.id,
          paymentStatus: "PENDING",
          totalAmount: totalAmount,
          transactionRef: tRef,
          wantsDelivery: Math.random() > 0.5,
          deliveryAddress: Math.random() > 0.5 ? "СБД, 8-р хороо, 14-р байр" : null
        }
      });

      // Update remaining quantity
      await prisma.batch.update({
        where: { id: b.id },
        data: { remainingQuantity: { decrement: q } }
      })
    }
    orderIndex++;
  }

  console.log("Database reset and seeded successfully! 🎉")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

const CATEGORIES = [
  { name: "Ухаалаг утас & Таблет", slug: "phones-tablets" },
  { name: "Зөөврийн компьютер", slug: "laptops" },
  { name: "Ухаалаг цаг & Чихэвч", slug: "wearables-audio" },
  { name: "Телевизор & Дэлгэц", slug: "tv-monitors" },
  { name: "Цахилгаан бараа", slug: "home-appliances" },
]

const BRANDS = {
  "phones-tablets": ["Apple iPhone", "Samsung Galaxy", "Google Pixel", "OnePlus", "Sony Xperia"],
  "laptops": ["MacBook Pro", "Dell XPS", "Lenovo ThinkPad", "ASUS ROG", "Razer Blade", "HP Spectre"],
  "wearables-audio": ["Apple Watch", "Samsung Galaxy Watch", "Garmin", "Sony WH", "AirPods", "Bose"],
  "tv-monitors": ["LG OLED", "Samsung Neo QLED", "Sony Bravia", "Apple Pro Display", "Dell UltraSharp"],
  "home-appliances": ["Dyson", "LG WashTower", "Samsung Bespoke", "Miele", "iRobot Roomba"],
}

const DESCRIPTIONS = [
  "Хамгийн сүүлийн үеийн дэвшилтэт технологи бүхий, дээд зэрэглэлийн дизайнтай шинэ загвар. Хэрэглэхэд хялбар, өндөр хүчин чадалтай, бат бөх материалуудаар хийгдсэн тул таны өдөр тутмын хэрэглээг төгс хангана. Албан ёсны 1 жилийн баталгаатай.",
  "Гайхалтай дүрслэл болон дууралтын төгс хослол. Шинэчилсэн процессор болон илүү удаан барих батерейтэй болсон тул өмнөх загваруудаас илүү хурдан бөгөөд найдвартай. Оригинал савлагаатай, үйлдвэрийн бүрэн баталгаат хугацаатай.",
  "Мэргэжлийн түвшний хэрэглээнд зориулагдсан өндөр үзүүлэлттэй шилдэг бүтээгдэхүүн. Орчин үеийн минималист загвартай бөгөөд таны амьдралын хэв маягийг илтгэх төгс сонголт байх болно. Яг одоо онцгой үнээр худалдан аваарай."
]

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getRandomPrice() {
  // Generate price between 1,000,000 and 19,000,000
  // Formatting ending in 99,999 (e.g. 1,499,999)
  const millions = getRandomInt(1, 19) * 1000000
  const thousands = getRandomInt(0, 9) * 100000
  return millions + thousands + 99999
}

async function main() {
  console.log("🌱 Демо бараануудыг оруулж эхэллээ...")

  // 1. Устгах (хэрэв өмнө нь байсан бол)
  await db.product.deleteMany({
    where: { sku: { startsWith: "DEMO-" } }
  })

  // 2. Ангилал үүсгэх
  const createdCategories: Record<string, string> = {}
  for (const cat of CATEGORIES) {
    const created = await db.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { name: cat.name, slug: cat.slug },
    })
    createdCategories[cat.slug] = created.id
  }

  // 3. Бараа үүсгэх
  let skuCounter = 1
  for (const cat of CATEGORIES) {
    const brands = BRANDS[cat.slug as keyof typeof BRANDS]
    
    // Ангилал бүрт 10 бараа (нийт 50)
    for (let i = 1; i <= 10; i++) {
      const brand = brands[getRandomInt(0, brands.length - 1)]
      const modelNum = getRandomInt(10, 99)
      const isPro = Math.random() > 0.5 ? " Pro" : " Max"
      const name = `${brand} ${modelNum}${isPro}`
      
      const price = getRandomPrice()
      // Зарим бараанууд хямдарсан байж болно
      const isDiscounted = Math.random() > 0.7
      const comparePrice = isDiscounted ? price + (getRandomInt(1, 5) * 100000) : null

      const sku = `DEMO-${cat.slug.toUpperCase().substring(0,3)}-${String(skuCounter).padStart(3, '0')}`
      const slug = name.toLowerCase().replace(/\s+/g, "-") + "-" + sku.toLowerCase()
      
      const descIndex = getRandomInt(0, DESCRIPTIONS.length - 1)
      const description = `<p><strong>${name}</strong></p><p>${DESCRIPTIONS[descIndex]}</p><ul><li>Брэнд: ${brand}</li><li>Баталгаа: 12 сар</li><li>Төлөв: Шинэ</li></ul>`

      // 3-4 зураг үүсгэх (Picsum placeholder ашиглах)
      const numImages = getRandomInt(3, 4)
      const images = []
      for (let j = 1; j <= numImages; j++) {
        images.push(`https://picsum.photos/seed/${slug}-${j}/800/800`)
      }
      const imageUrl = images[0]

      await db.product.create({
        data: {
          sku,
          name,
          slug,
          description,
          price,
          comparePrice,
          costPrice: price * 0.7, // 30% margin
          stockQuantity: getRandomInt(5, 50),
          categoryId: createdCategories[cat.slug],
          status: "ACTIVE",
          imageUrl: imageUrl,
          images: JSON.stringify(images),
          isPreOrder: Math.random() > 0.9,
          isFeatured: Math.random() > 0.8,
        }
      })
      
      skuCounter++
    }
    console.log(`✅ ${cat.name} ангилалд 10 бараа орлоо.`)
  }

  console.log(`\n🎉 Нийт ${skuCounter - 1} демо бараа амжилттай орлоо!`)
}

main()
  .catch((e) => {
    console.error("❌ Seed алдаа:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })

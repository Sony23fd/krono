import { db } from "./src/lib/db"
import fs from "fs"
import path from "path"

async function main() {
  console.log("Нөөцлөж эхэллээ. Түр хүлээнэ үү...")
  try {
    // Fetch all necessary data
    const categories = await db.category.findMany()
    const products = await db.product.findMany()
    const batches = await db.batch.findMany()
    const orders = await db.order.findMany()
    const users = await db.user.findMany()
    const shopSettings = await db.shopSettings.findMany()
    const orderStatusTypes = await db.orderStatusType.findMany()
    const activityLogs = await (db as any).activityLog?.findMany().catch(() => [])

    const backupData = {
      timestamp: new Date().toISOString(),
      data: {
        categories,
        products,
        batches,
        orders,
        users,
        shopSettings,
        orderStatusTypes,
        activityLogs,
      }
    }

    // Create backups directory if it doesn't exist
    const dir = path.join(process.cwd(), 'backups')
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }

    // Write to file
    const filename = `db-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    const filepath = path.join(dir, filename)
    
    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2))
    
    console.log(`\n✅ Амжилттай нөөцлөгдлөө!\nШинэ файл: backups/${filename}`)
  } catch (error) {
    console.error("Нөөцлөх үед алдаа гарлаа:", error)
  } finally {
    await db.$disconnect()
  }
}

main()

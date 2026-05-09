/**
 * POS Sync Worker
 * Дэлгүүрийн MySQL → Web Platform PostgreSQL руу бараа синхрончлох script.
 * 
 * Crontab жишээ (15 минут тутам):
 * * /15 * * * * npx tsx /path/to/scripts/pos-sync-worker.ts
 * 
 * Шаардлагатай env variables:
 * - POS_DB_HOST, POS_DB_USER, POS_DB_PASSWORD, POS_DB_NAME
 * - NEXT_PUBLIC_APP_URL
 * - POS_SYNC_API_KEY
 * 
 * mysql2 package суулгах: npm install mysql2
 */

async function syncFromPOS() {
  console.log(`[POS Sync] ${new Date().toISOString()} — Эхэллээ...`)

  // MySQL-ээс бараа унших
  let rows: any[] = []
  try {
    const mysql = require("mysql2/promise")
    const conn = await mysql.createConnection({
      host: process.env.POS_DB_HOST || "localhost",
      user: process.env.POS_DB_USER || "root",
      password: process.env.POS_DB_PASSWORD || "",
      database: process.env.POS_DB_NAME || "pos_db",
    })

    // Сүүлийн 20 минутад шинэчлэгдсэн барааг авах
    const [result] = await conn.execute(`
      SELECT
        sku,
        product_name AS name,
        selling_price AS price,
        current_stock AS stockQuantity
      FROM products
      WHERE updated_at > DATE_SUB(NOW(), INTERVAL 20 MINUTE)
      ORDER BY updated_at DESC
    `)
    rows = result as any[]
    await conn.end()
  } catch (err: any) {
    console.error("[POS Sync] MySQL холболтын алдаа:", err.message)
    process.exit(1)
  }

  if (rows.length === 0) {
    console.log("[POS Sync] Шинэчлэгдсэн бараа олдсонгүй. Дуусгав.")
    return
  }

  console.log(`[POS Sync] ${rows.length} бараа MySQL-ээс уншлаа. Sync эхэлж байна...`)

  // Web API руу илгээх
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/pos/sync`
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.POS_SYNC_API_KEY || "",
      },
      body: JSON.stringify({
        items: rows,
        mode: "partial",
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`API ${res.status}: ${errText}`)
    }

    const data = await res.json()
    console.log(`[POS Sync] Амжилттай:`, data)
  } catch (err: any) {
    console.error("[POS Sync] API илгээхэд алдаа:", err.message)
    process.exit(1)
  }
}

syncFromPOS()
  .then(() => {
    console.log("[POS Sync] Дуусгав.")
    process.exit(0)
  })
  .catch((err) => {
    console.error("[POS Sync] Fatal:", err)
    process.exit(1)
  })

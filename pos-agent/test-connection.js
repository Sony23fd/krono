/**
 * ═══════════════════════════════════════════════
 * TEST CONNECTION — MySQL + Cloud API шалгах
 * ═══════════════════════════════════════════════
 * 
 * Ажиллуулах: node test-connection.js
 */

require("dotenv").config()
const mysql = require("mysql2/promise")
const axios = require("axios")

async function testMySQL() {
  console.log("\n──── MySQL шалгаж байна ────")
  try {
    const conn = await mysql.createConnection({
      host: process.env.MYSQL_HOST || "127.0.0.1",
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE,
    })

    const table = process.env.POS_TABLE_NAME || "products"
    const [rows] = await conn.execute(`SELECT COUNT(*) as count FROM \`${table}\``)
    const count = rows[0].count

    console.log(`✅ MySQL холбогдлоо!`)
    console.log(`   Database: ${process.env.MYSQL_DATABASE}`)
    console.log(`   Хүснэгт '${table}' дотор ${count} мөр байна.`)

    // Жишээ 3 мөр харуулах
    const skuCol = process.env.POS_SKU_COLUMN || "sku"
    const nameCol = process.env.POS_NAME_COLUMN || "name"
    const stockCol = process.env.POS_STOCK_COLUMN || "stock_quantity"
    const [samples] = await conn.execute(
      `SELECT \`${skuCol}\`, \`${nameCol}\`, \`${stockCol}\` FROM \`${table}\` LIMIT 3`
    )
    if (samples.length > 0) {
      console.log("\n   Жишээ мөрүүд:")
      samples.forEach((s, i) => {
        console.log(`   ${i + 1}. SKU: ${s[skuCol]}, Нэр: ${s[nameCol]}, Нөөц: ${s[stockCol]}`)
      })
    }

    await conn.end()
    return true
  } catch (err) {
    console.log(`❌ MySQL алдаа: ${err.message}`)
    return false
  }
}

async function testCloud() {
  console.log("\n──── Cloud API шалгаж байна ────")
  try {
    const url = process.env.CLOUD_API_URL
    const apiKey = process.env.POS_SYNC_API_KEY

    if (!url) {
      console.log("❌ CLOUD_API_URL тохируулагдаагүй!")
      return false
    }

    const res = await axios.get(url, {
      headers: { "x-api-key": apiKey },
      timeout: 15000,
    })

    if (res.data.success) {
      console.log(`✅ Cloud API холбогдлоо!`)
      console.log(`   URL: ${url}`)
      console.log(`   Нийт бараа: ${res.data.stats?.total || "?"}`)
      console.log(`   Идэвхтэй: ${res.data.stats?.active || "?"}`)
      if (res.data.lastSync) {
        console.log(`   Сүүлийн sync: ${res.data.lastSync.time}`)
      }
    } else {
      console.log(`❌ Cloud алдаа: ${res.data.error}`)
    }
    return true
  } catch (err) {
    if (err.response) {
      console.log(`❌ Cloud HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`)
    } else {
      console.log(`❌ Cloud холбогдож чадсангүй: ${err.message}`)
    }
    return false
  }
}

async function main() {
  console.log("═══════════════════════════════════════")
  console.log("  POS Push Agent — Connection Test")
  console.log("═══════════════════════════════════════")

  const mysqlOk = await testMySQL()
  const cloudOk = await testCloud()

  console.log("\n──── Дүгнэлт ────")
  console.log(`MySQL:  ${mysqlOk ? "✅ OK" : "❌ FAIL"}`)
  console.log(`Cloud:  ${cloudOk ? "✅ OK" : "❌ FAIL"}`)

  if (mysqlOk && cloudOk) {
    console.log("\n🚀 Бэлэн! 'npm start' ажиллуулж болно.")
  } else {
    console.log("\n⚠️  .env файлын тохиргоог шалгана уу.")
  }

  process.exit(0)
}

main()

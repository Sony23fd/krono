/**
 * ═══════════════════════════════════════════════════════════════════
 * POS PUSH AGENT — Main Script
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Дотоод POS MySQL → Cloud API руу inventory push хийх agent.
 * 
 * Ажиллах зарчим:
 * 1. POS MySQL-ээс сүүлийн sync-ээс хойш өөрчлөгдсөн бараануудыг авна
 * 2. Cloud API руу HTTP POST илгээнэ
 * 3. Амжилттай бол lastSyncTimestamp шинэчилнэ
 * 4. Алдаа гарвал (интернэтгүй г.м.) timestamp шинэчлэхгүй → дараа дахин оролдоно
 * 5. SYNC_INTERVAL_MS тутамд давтана
 * 
 * ═══════════════════════════════════════════════════════════════════
 */

require("dotenv").config()
const mysql = require("mysql2/promise")
const axios = require("axios")
const { v4: uuidv4 } = require("uuid")
const { createLogger, format, transports } = require("winston")
const path = require("path")
const tracker = require("./sync-tracker")

// ──── ТОХИРГОО ────
const CONFIG = {
  cloud: {
    url: process.env.CLOUD_API_URL,
    apiKey: process.env.POS_SYNC_API_KEY,
  },
  mysql: {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE,
  },
  pos: {
    table: process.env.POS_TABLE_NAME || "products",
    sku: process.env.POS_SKU_COLUMN || "sku",
    name: process.env.POS_NAME_COLUMN || "name",
    price: process.env.POS_PRICE_COLUMN || "price",
    cost: process.env.POS_COST_COLUMN || "cost_price",
    stock: process.env.POS_STOCK_COLUMN || "stock_quantity",
    category: process.env.POS_CATEGORY_COLUMN || "category_name",
    updatedAt: process.env.POS_UPDATED_AT_COLUMN || "updated_at",
  },
  sync: {
    intervalMs: Number(process.env.SYNC_INTERVAL_MS || 300000),
    batchSize: Number(process.env.SYNC_BATCH_SIZE || 200),
    mode: process.env.SYNC_MODE || "delta",
  },
  agentId: process.env.AGENT_ID || "store-main",
}

// ──── LOGGER ────
const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level.toUpperCase()}] ${message}`
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: path.join(__dirname, "logs", "agent.log"),
      maxsize: 5 * 1024 * 1024,  // 5MB
      maxFiles: 5,
    }),
    new transports.File({
      filename: path.join(__dirname, "logs", "error.log"),
      level: "error",
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3,
    }),
  ],
})

// ──── logs хавтас үүсгэх ────
const fs = require("fs")
const logsDir = path.join(__dirname, "logs")
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// ──── MySQL Pool ────
let pool = null

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      ...CONFIG.mysql,
      waitForConnections: true,
      connectionLimit: 3,
      connectTimeout: 10000,
      enableKeepAlive: true,
    })
  }
  return pool
}

// ═══════════════════════════════════════════════
// 1. POS DATABASE-ЭЭС БАРАА АВАХ
// ═══════════════════════════════════════════════

async function fetchChangedProducts() {
  const db = getPool()
  const { table, sku, name, price, cost, stock, category, updatedAt } = CONFIG.pos

  const lastSync = tracker.getLastSyncTimestamp()
  const mode = CONFIG.sync.mode

  let query = ""
  let params = []

  if (mode === "full" || !lastSync) {
    // Бүх барааг авна (эхний sync эсвэл full mode)
    query = `
      SELECT
        \`${sku}\` AS sku,
        \`${name}\` AS name,
        \`${price}\` AS price,
        ${cost ? `\`${cost}\` AS costPrice,` : ""}
        \`${stock}\` AS stockQuantity,
        ${category ? `\`${category}\` AS categoryName,` : ""}
        \`${updatedAt}\` AS updatedAt
      FROM \`${table}\`
      ORDER BY \`${updatedAt}\` DESC
      LIMIT ?
    `
    params = [CONFIG.sync.batchSize]
    logger.info(`[FETCH] Full mode: бүх бараа авч байна (limit: ${CONFIG.sync.batchSize})`)
  } else {
    // Delta mode: зөвхөн өөрчлөгдсөн бараа
    query = `
      SELECT
        \`${sku}\` AS sku,
        \`${name}\` AS name,
        \`${price}\` AS price,
        ${cost ? `\`${cost}\` AS costPrice,` : ""}
        \`${stock}\` AS stockQuantity,
        ${category ? `\`${category}\` AS categoryName,` : ""}
        \`${updatedAt}\` AS updatedAt
      FROM \`${table}\`
      WHERE \`${updatedAt}\` > ?
      ORDER BY \`${updatedAt}\` DESC
      LIMIT ?
    `
    params = [lastSync, CONFIG.sync.batchSize]
    logger.info(`[FETCH] Delta mode: ${lastSync}-аас хойш өөрчлөгдсөн бараа хайж байна`)
  }

  const [rows] = await db.execute(query, params)
  return rows
}

// ═══════════════════════════════════════════════
// 2. CLOUD API РУУ PUSH ХИЙХ
// ═══════════════════════════════════════════════

async function pushToCloud(items) {
  const syncId = uuidv4()

  const payload = {
    syncId,
    agentVersion: "1.0.0",
    agentId: CONFIG.agentId,
    mode: CONFIG.sync.mode,
    posTimestamp: new Date().toISOString(),
    items: items.map((item) => ({
      sku: item.sku,
      name: item.name,
      price: Number(item.price) || 0,
      ...(item.costPrice !== undefined && { costPrice: Number(item.costPrice) }),
      stockQuantity: Number(item.stockQuantity) || 0,
      ...(item.categoryName && { categoryName: item.categoryName }),
      ...(item.updatedAt && { updatedAt: new Date(item.updatedAt).toISOString() }),
    })),
  }

  const response = await axios.post(CONFIG.cloud.url, payload, {
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CONFIG.cloud.apiKey,
      "x-agent-id": CONFIG.agentId,
    },
    timeout: 30000, // 30 секунд timeout
  })

  return { syncId, data: response.data }
}

// ═══════════════════════════════════════════════
// 3. SYNC ЦИКЛ
// ═══════════════════════════════════════════════

async function runSyncCycle() {
  const cycleStart = Date.now()

  try {
    // ──── MySQL-ээс бараа авах ────
    logger.info("──── Sync цикл эхэллээ ────")

    let products
    try {
      products = await fetchChangedProducts()
    } catch (err) {
      logger.error(`[MYSQL] Холбогдож чадсангүй: ${err.message}`)
      tracker.markFailure(`MySQL: ${err.message}`)
      return
    }

    if (!products || products.length === 0) {
      logger.info("[SYNC] Өөрчлөгдсөн бараа олдсонгүй. Дараагийн цикл хүлээж байна...")
      return
    }

    logger.info(`[SYNC] ${products.length} бараа олдлоо. Cloud руу push хийж байна...`)

    // ──── Cloud руу илгээх ────
    try {
      const { syncId, data } = await pushToCloud(products)

      if (data.success) {
        const state = tracker.markSuccess(syncId, data.synced || products.length)
        const duration = Date.now() - cycleStart

        logger.info([
          `[SUCCESS] Sync амжилттай!`,
          `SyncID: ${syncId}`,
          `Synced: ${data.synced || 0}`,
          `Created: ${data.created || 0}`,
          `Duration: ${duration}ms`,
          `Дараагийн sync: ${CONFIG.sync.intervalMs / 1000}с дараа`,
        ].join(" | "))

        if (data.duplicate) {
          logger.warn("[WARN] Давхар sync илэрлээ (idempotency), гэхдээ амжилттай.")
        }
      } else {
        logger.error(`[CLOUD] Сервер алдаа буцаалаа: ${data.error || JSON.stringify(data)}`)
        tracker.markFailure(`Cloud: ${data.error}`)
      }
    } catch (err) {
      // ──── ИНТЕРНЭТ АЛДАА (Offline Handling) ────
      if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND" || err.code === "ETIMEDOUT" || err.code === "ECONNRESET") {
        logger.warn(`[OFFLINE] Интернэт холбогдохгүй байна (${err.code}). Дараа дахин оролдоно...`)
      } else if (err.response) {
        logger.error(`[CLOUD] HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`)
      } else {
        logger.error(`[PUSH] Алдаа: ${err.message}`)
      }

      tracker.markFailure(err.message)
      // ⚠️ ЧУХАЛ: lastSyncTimestamp шинэчлэхГҮЙ → дараагийн цикл дахин оролдоно
    }
  } catch (err) {
    logger.error(`[FATAL] Гэнэтийн алдаа: ${err.message}`)
    tracker.markFailure(err.message)
  }
}

// ═══════════════════════════════════════════════
// 4. AGENT ЭХЛҮҮЛЭХ
// ═══════════════════════════════════════════════

async function main() {
  logger.info("═══════════════════════════════════════════")
  logger.info("  POS Push Agent v1.0.0 эхэллээ")
  logger.info(`  Agent ID: ${CONFIG.agentId}`)
  logger.info(`  Cloud URL: ${CONFIG.cloud.url}`)
  logger.info(`  MySQL: ${CONFIG.mysql.host}:${CONFIG.mysql.port}/${CONFIG.mysql.database}`)
  logger.info(`  Sync Mode: ${CONFIG.sync.mode}`)
  logger.info(`  Sync Interval: ${CONFIG.sync.intervalMs / 1000}с (${CONFIG.sync.intervalMs / 60000} мин)`)
  logger.info("═══════════════════════════════════════════")

  // Тохиргоо шалгах
  if (!CONFIG.cloud.url) {
    logger.error("CLOUD_API_URL тохиргоо олдсонгүй! .env файлыг шалгана уу.")
    process.exit(1)
  }
  if (!CONFIG.cloud.apiKey) {
    logger.error("POS_SYNC_API_KEY тохиргоо олдсонгүй! .env файлыг шалгана уу.")
    process.exit(1)
  }
  if (!CONFIG.mysql.database) {
    logger.error("MYSQL_DATABASE тохиргоо олдсонгүй! .env файлыг шалгана уу.")
    process.exit(1)
  }

  // Одоогийн state
  const state = tracker.loadState()
  if (state.lastSyncTimestamp) {
    logger.info(`Сүүлийн sync: ${state.lastSyncTimestamp}`)
    logger.info(`Нийт sync хийсэн: ${state.totalSynced}`)
  } else {
    logger.info("Анхны sync! Бүх бараа авч илгээнэ.")
  }

  // Шууд нэг удаа ажиллуулах
  await runSyncCycle()

  // Давтамжтай ажиллуулах
  setInterval(runSyncCycle, CONFIG.sync.intervalMs)

  logger.info(`[LOOP] ${CONFIG.sync.intervalMs / 1000}с тутамд ажиллана. Ctrl+C-ээр зогсооно.`)
}

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Agent зогсож байна...")
  if (pool) await pool.end()
  process.exit(0)
})

process.on("SIGTERM", async () => {
  logger.info("Agent зогсож байна (SIGTERM)...")
  if (pool) await pool.end()
  process.exit(0)
})

process.on("uncaughtException", (err) => {
  logger.error(`[UNCAUGHT] ${err.message}`)
  logger.error(err.stack)
})

process.on("unhandledRejection", (err) => {
  logger.error(`[UNHANDLED] ${err}`)
})

// ──── Start ────
main().catch((err) => {
  logger.error(`[STARTUP] ${err.message}`)
  process.exit(1)
})

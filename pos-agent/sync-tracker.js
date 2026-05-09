/**
 * ═══════════════════════════════════════════════════════
 * SYNC TRACKER — Сүүлийн sync цагийг хянах утилити
 * ═══════════════════════════════════════════════════════
 * 
 * JSON файлд `lastSyncTimestamp` хадгална.
 * Agent эхлэх бүрт уншиж, амжилттай sync-ийн дараа шинэчилнэ.
 * Файл эвдэрвэл автомат сэргээнэ.
 */

const fs = require("fs")
const path = require("path")

const TRACKER_FILE = path.join(__dirname, "sync-state.json")

/**
 * Default state
 */
function getDefaultState() {
  return {
    lastSyncTimestamp: null,     // ISO-8601 string
    lastSyncId: null,            // UUID
    totalSynced: 0,
    totalErrors: 0,
    consecutiveFailures: 0,
    lastError: null,
    lastSuccessAt: null,
    createdAt: new Date().toISOString(),
  }
}

/**
 * State файлыг уншина. Байхгүй / эвдэрсэн бол default буцаана.
 */
function loadState() {
  try {
    if (!fs.existsSync(TRACKER_FILE)) {
      const state = getDefaultState()
      saveState(state)
      return state
    }

    const raw = fs.readFileSync(TRACKER_FILE, "utf-8")
    const state = JSON.parse(raw)
    return { ...getDefaultState(), ...state }
  } catch (err) {
    console.error("[SyncTracker] State файл уншихад алдаа, шинээр үүсгэлээ:", err.message)
    const state = getDefaultState()
    saveState(state)
    return state
  }
}

/**
 * State файлд хадгална (atomic write).
 */
function saveState(state) {
  try {
    const tmpFile = TRACKER_FILE + ".tmp"
    fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), "utf-8")
    fs.renameSync(tmpFile, TRACKER_FILE)
  } catch (err) {
    console.error("[SyncTracker] State хадгалахад алдаа:", err.message)
  }
}

/**
 * Амжилттай sync-ийн дараа дуудна.
 */
function markSuccess(syncId, syncedCount) {
  const state = loadState()
  state.lastSyncTimestamp = new Date().toISOString()
  state.lastSyncId = syncId
  state.totalSynced += syncedCount
  state.consecutiveFailures = 0
  state.lastSuccessAt = new Date().toISOString()
  saveState(state)
  return state
}

/**
 * Алдаатай sync-ийн дараа дуудна.
 */
function markFailure(errorMessage) {
  const state = loadState()
  state.consecutiveFailures += 1
  state.totalErrors += 1
  state.lastError = {
    message: errorMessage,
    at: new Date().toISOString(),
  }
  saveState(state)
  return state
}

/**
 * Сүүлийн sync цагийг авна (MySQL WHERE-д ашиглана).
 */
function getLastSyncTimestamp() {
  const state = loadState()
  return state.lastSyncTimestamp
}

module.exports = {
  loadState,
  saveState,
  markSuccess,
  markFailure,
  getLastSyncTimestamp,
}

/**
 * ═══════════════════════════════════════════════
 * WINDOWS SERVICE INSTALLER
 * ═══════════════════════════════════════════════
 * 
 * POS Push Agent-ыг Windows Service болгож суулгана.
 * Компьютер асах бүрт автоматаар эхэлнэ.
 * 
 * Ажиллуулах: node service-install.js
 * Устгах:     node service-uninstall.js
 */

const Service = require("node-windows").Service
const path = require("path")

const svc = new Service({
  name: "POS Push Agent",
  description: "POS дэлгүүрийн inventory-г Cloud руу автомат push хийх agent",
  script: path.join(__dirname, "agent.js"),
  nodeOptions: [],
  // Алдаа гарвал автомат дахин эхлэх
  wait: 10,         // 10 секунд хүлээх
  grow: 0.5,        // Хүлээх хугацаа 50%-аар нэмэгдэх
  maxRestarts: 999,  // Дахин эхлэх тоо (бараг хязгааргүй)
})

svc.on("install", () => {
  console.log("\n✅ Service амжилттай суулгагдлаа!")
  console.log("   Service-ыг эхлүүлж байна...")
  svc.start()
})

svc.on("start", () => {
  console.log("🚀 POS Push Agent Service ажиллаж эхэллээ!")
  console.log("\n   Шалгах командууд:")
  console.log("   • services.msc — Windows Services хэсэгт 'POS Push Agent' олдоно")
  console.log("   • Лог файл: pos-agent/logs/agent.log")
})

svc.on("alreadyinstalled", () => {
  console.log("ℹ️  Service аль хэдийн суулгагдсан байна.")
})

svc.on("error", (err) => {
  console.error("❌ Алдаа:", err)
})

console.log("══════════════════════════════════════")
console.log("  POS Push Agent — Windows Service Installer")
console.log("══════════════════════════════════════")
console.log("")
console.log("⚙️  Service суулгаж байна...")

svc.install()

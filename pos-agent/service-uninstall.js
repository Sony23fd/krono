/**
 * Windows Service устгах
 * Ажиллуулах: node service-uninstall.js
 */

const Service = require("node-windows").Service
const path = require("path")

const svc = new Service({
  name: "POS Push Agent",
  script: path.join(__dirname, "agent.js"),
})

svc.on("uninstall", () => {
  console.log("✅ POS Push Agent Service устгагдлаа.")
  console.log("   services.msc-ээс арилсан байх ёстой.")
})

svc.on("error", (err) => {
  console.error("❌ Алдаа:", err)
})

console.log("⚙️  Service устгаж байна...")
svc.uninstall()

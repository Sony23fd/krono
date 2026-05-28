const { PrismaClient } = require("@prisma/client")
const db = new PrismaClient()

async function main() {
  const users = await db.user.findMany({
    select: { email: true, role: true, phone: true }
  })
  console.log(users)
}

main().catch(console.error).finally(() => db.$disconnect())

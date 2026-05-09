import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  const p1 = await prisma.orderStatusType.findFirst({ where: { name: "Өөрөө ирж авсан" } })
  if (!p1) {
    await prisma.orderStatusType.create({ data: { name: "Өөрөө ирж авсан", color: "emerald", isFinal: true } })
    console.log("Created Өөрөө ирж авсан")
  }

  const p2 = await prisma.orderStatusType.findFirst({ where: { name: "Хүргэлтээр авсан" } })
  if (!p2) {
    await prisma.orderStatusType.create({ data: { name: "Хүргэлтээр авсан", color: "teal", isFinal: true } })
    console.log("Created Хүргэлтээр авсан")
  }
  
  // Clean up the generic one if it exists so we just have these two specific ones
  const old = await prisma.orderStatusType.findFirst({ where: { name: "Хүргэгдсэн" } })
  if (old) {
    // Before deleting, if there are any orders with this status, reassign them to "Хүргэлтээр авсан"
    const p2real = await prisma.orderStatusType.findFirst({ where: { name: "Хүргэлтээр авсан" } })
    await prisma.order.updateMany({
      where: { statusId: old.id },
      data: { statusId: p2real?.id }
    })
    await prisma.orderStatusType.delete({ where: { id: old.id } })
    console.log("Migrated and deleted generic Хүргэгдсэн status")
  }
}

main().finally(() => prisma.$disconnect())

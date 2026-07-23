import { db } from "@/lib/db"
import { NewTransferForm } from "./NewTransferForm"

export const dynamic = "force-dynamic"

export default async function NewTransferPage() {
  const branches = await db.branch.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" }
  })
  
  const products = await db.product.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, sku: true, imageUrl: true }
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Шинэ шилжүүлэг үүсгэх</h1>
        <p className="text-sm text-slate-500 mt-1">Салбар хооронд шилжүүлэх барааны мэдээллийг оруулна уу.</p>
      </div>

      <NewTransferForm branches={branches} products={products} />
    </div>
  )
}

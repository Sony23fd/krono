import { db } from "@/lib/db"
import { SaaSHomepageClient } from "./SaaSHomepageClient"

export const dynamic = "force-dynamic"

export default async function ShopPage() {
  const products = await db.product.findMany({
    where: { slug: { in: ["crm-system", "erp-system"] } }
  });

  const safeProducts = products.map(p => ({
    ...p,
    price: Number(p.price),
    comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
    costPrice: p.costPrice ? Number(p.costPrice) : null,
    weight: p.weight ? Number(p.weight) : null,
  }))

  return <SaaSHomepageClient products={safeProducts} />
}

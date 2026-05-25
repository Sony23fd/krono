"use server"

import { db } from "@/lib/db"

export async function getBanners() {
  try {
    const banners = await db.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" }
    })
    return { success: true, banners }
  } catch (error: any) {
    console.error("Failed to fetch banners:", error)
    return { success: false, banners: [], error: error.message }
  }
}

export async function getFeaturedProducts() {
  try {
    const products = await db.product.findMany({
      where: { 
        isFeatured: true,
        status: "ACTIVE",
        NOT: {
          OR: [
            { imageUrl: null },
            { imageUrl: "" }
          ]
        }
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10
    })
    
    // Calculate availableStock
    const enriched = products.map(p => ({
      ...p,
      availableStock: p.stockQuantity - p.reservedStock,
    }))
    
    return { success: true, products: JSON.parse(JSON.stringify(enriched)) }
  } catch (error: any) {
    console.error("Failed to fetch featured products:", error)
    return { success: false, products: [], error: error.message }
  }
}

export async function getSaleProducts() {
  try {
    // DiscountPrice condition: comparePrice is greater than price
    const products = await db.product.findMany({
      where: {
        status: "ACTIVE",
        comparePrice: {
          gt: db.product.fields.price
        },
        NOT: {
          OR: [
            { imageUrl: null },
            { imageUrl: "" }
          ]
        }
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10
    })

    const enriched = products.map(p => ({
      ...p,
      availableStock: p.stockQuantity - p.reservedStock,
    }))

    return { success: true, products: JSON.parse(JSON.stringify(enriched)) }
  } catch (error: any) {
    console.error("Failed to fetch sale products:", error)
    return { success: false, products: [], error: error.message }
  }
}

export async function getPromoSettings() {
  try {
    const settings = await db.shopSettings.findMany({
      where: { key: { in: ["promo_title", "promo_subtitle", "promo_link", "promo_image"] } }
    })
    
    const config = settings.reduce((acc, current) => {
      acc[current.key] = current.value
      return acc
    }, {} as Record<string, string>)
    
    return { success: true, config }
  } catch (error: any) {
    return { success: false, config: {} }
  }
}

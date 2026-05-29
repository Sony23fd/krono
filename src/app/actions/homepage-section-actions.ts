"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { SectionType } from "@prisma/client"

export async function getHomePageSections() {
  try {
    const sections = await db.homePageSection.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        category: {
          select: { name: true, id: true, slug: true }
        }
      }
    })
    return { success: true, sections }
  } catch (error: any) {
    console.error("Failed to fetch home page sections:", error)
    return { success: false, error: error.message }
  }
}

export async function getStorefrontHomePageSections() {
  try {
    const sections = await db.homePageSection.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        category: {
          select: { name: true, id: true, slug: true }
        }
      }
    })

    const sectionsWithProducts = await Promise.all(
      sections.map(async (section) => {
        let products = []
        if (section.categoryId) {
          products = await db.product.findMany({
            where: {
              categoryId: section.categoryId,
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
        } else {
          // Fallback: If no category is selected, get featured products or sale products based on type
          if (section.type === "PROMO_SLIDER") {
             products = await db.product.findMany({
              where: {
                status: "ACTIVE",
                comparePrice: { gt: db.product.fields.price },
                NOT: { OR: [{ imageUrl: null }, { imageUrl: "" }] }
              },
              include: { category: { select: { id: true, name: true, slug: true } } },
              orderBy: { createdAt: "desc" },
              take: 10
            })
          } else {
            products = await db.product.findMany({
              where: {
                status: "ACTIVE",
                isFeatured: true,
                NOT: { OR: [{ imageUrl: null }, { imageUrl: "" }] }
              },
              include: { category: { select: { id: true, name: true, slug: true } } },
              orderBy: { createdAt: "desc" },
              take: 10
            })
          }
        }

        const enriched = products.map(p => ({
          ...p,
          availableStock: p.stockQuantity - p.reservedStock,
        }))

        return {
          ...section,
          products: JSON.parse(JSON.stringify(enriched))
        }
      })
    )

    return { success: true, sections: sectionsWithProducts }
  } catch (error: any) {
    console.error("Failed to fetch storefront sections:", error)
    return { success: false, error: error.message, sections: [] }
  }
}

export async function createHomePageSection(data: {
  title: string
  type: SectionType
  categoryId?: string | null
  bannerImageUrl?: string | null
  bannerLink?: string | null
  isActive?: boolean
  sortOrder?: number
  rowCount?: number
  autoScroll?: boolean
}) {
  try {
    const section = await db.homePageSection.create({
      data: {
        title: data.title,
        type: data.type,
        categoryId: data.categoryId || null,
        bannerImageUrl: data.bannerImageUrl || null,
        bannerLink: data.bannerLink || null,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
        rowCount: data.rowCount ?? 2,
        autoScroll: data.autoScroll ?? false,
      }
    })
    revalidatePath("/")
    revalidatePath("/admin/marketing/homepage-sections")
    return { success: true, section }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateHomePageSection(id: string, data: Partial<{
  title: string
  type: SectionType
  categoryId: string | null
  bannerImageUrl: string | null
  bannerLink: string | null
  isActive: boolean
  sortOrder: number
  rowCount: number
  autoScroll: boolean
}>) {
  try {
    const section = await db.homePageSection.update({
      where: { id },
      data: {
        ...data,
        categoryId: data.categoryId === undefined ? undefined : data.categoryId || null,
        bannerImageUrl: data.bannerImageUrl === undefined ? undefined : data.bannerImageUrl || null,
        bannerLink: data.bannerLink === undefined ? undefined : data.bannerLink || null,
      }
    })
    revalidatePath("/")
    revalidatePath("/admin/marketing/homepage-sections")
    return { success: true, section }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteHomePageSection(id: string) {
  try {
    await db.homePageSection.delete({ where: { id } })
    revalidatePath("/")
    revalidatePath("/admin/marketing/homepage-sections")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateHomePageSectionOrder(orderedIds: string[]) {
  try {
    const transaction = orderedIds.map((id, index) => 
      db.homePageSection.update({
        where: { id },
        data: { sortOrder: index }
      })
    )
    await db.$transaction(transaction)
    revalidatePath("/")
    revalidatePath("/admin/marketing/homepage-sections")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

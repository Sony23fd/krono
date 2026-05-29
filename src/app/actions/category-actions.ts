"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { cyrillicToLatinSlug } from "@/lib/utils"

export async function getCategories() {
  try {
    const categories = await db.category.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: "asc" },
    })
    return { success: true, categories: JSON.parse(JSON.stringify(categories)) }
  } catch (error: any) {
    return { success: false, error: error.message, categories: [] }
  }
}

export async function getAllCategories() {
  try {
    const categories = await db.category.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: "asc" },
    })
    return { success: true, categories: JSON.parse(JSON.stringify(categories)) }
  } catch (error: any) {
    return { success: false, error: error.message, categories: [] }
  }
}

export async function createCategory(data: { name: string; imageUrl?: string; metaTitle?: string; metaDescription?: string; parentId?: string; displayName?: string }) {
  try {
    const slug = cyrillicToLatinSlug(data.name)
    
    const category = await db.category.create({
      data: {
        name: data.name.trim(),
        slug: slug || `cat-${Date.now()}`,
        imageUrl: data.imageUrl,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        parentId: data.parentId || null,
        displayName: data.displayName?.trim() || null,
      }
    })
    revalidatePath("/admin/products")
    revalidatePath("/admin/categories")
    return { success: true, category: JSON.parse(JSON.stringify(category)) }
  } catch (error: any) {
    if (error.code === "P2002") return { success: false, error: "Ангилал давхардаж байна" }
    return { success: false, error: error.message }
  }
}

export async function updateCategory(id: string, data: { name?: string; imageUrl?: string; isActive?: boolean; sortOrder?: number; metaTitle?: string; metaDescription?: string; parentId?: string | null; displayName?: string | null }) {
  try {
    const existing = await db.category.findUnique({ where: { id } })
    if (!existing) return { success: false, error: "Ангилал олдсонгүй" }

    let slug = existing.slug
    if (data.name && data.name.trim() !== existing.name) {
      slug = cyrillicToLatinSlug(data.name)
    }

    const category = await db.category.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim(), slug }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.metaTitle !== undefined && { metaTitle: data.metaTitle }),
        ...(data.metaDescription !== undefined && { metaDescription: data.metaDescription }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.displayName !== undefined && { displayName: data.displayName?.trim() || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      }
    })

    revalidatePath("/admin/products")
    revalidatePath("/admin/categories")
    revalidatePath("/")
    return { success: true, category: JSON.parse(JSON.stringify(category)) }
  } catch (error: any) {
    if (error.code === "P2002") return { success: false, error: "Нэр давхардаж байна" }
    return { success: false, error: error.message }
  }
}

export async function deleteCategory(id: string) {
  try {
    const subCount = await db.category.count({ where: { parentId: id } })
    if (subCount > 0) {
      return { success: false, error: `Энэ ангилалд ${subCount} дэд ангилал байгаа тул устгах боломжгүй.` }
    }

    const productCount = await db.product.count({ where: { categoryId: id } })
    if (productCount > 0) {
      return { success: false, error: `${productCount} бараатай ангилалыг устгах боломжгүй. Эхлээд барааг шилжүүлнэ үү.` }
    }

    await db.category.delete({ where: { id } })
    revalidatePath("/admin/categories")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateCategoryOrder(items: { id: string, sortOrder: number }[]) {
  try {
    const transactions = items.map(item =>
      db.category.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder }
      })
    )
    await db.$transaction(transactions)
    revalidatePath("/admin/categories")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}


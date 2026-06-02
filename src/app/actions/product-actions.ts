"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { deleteProductFolder } from "@/lib/image-processor"

// ═══════════════════════════════════════════════════
// БАРАА CRUD
// ═══════════════════════════════════════════════════

export async function getProducts(filters?: {
  search?: string
  status?: string
  categoryId?: string
  page?: number
  limit?: number
  sort?: "newest" | "oldest" | "price_asc" | "price_desc" | "stock_asc" | "stock_desc"
}) {
  try {
    const page = filters?.page || 1
    const limit = filters?.limit || 20
    const where: any = {}

    if (filters?.search?.trim()) {
      const q = filters.search.trim()
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ]
    }

    if (filters?.status && filters.status !== "ALL") {
      if (filters.status === "LOW_STOCK") {
        where.status = "ACTIVE"
        where.stockQuantity = { lt: 5, gt: 0 }
      } else if (filters.status === "NO_IMAGE") {
        where.AND = [
          ...(where.AND || []),
          { OR: [{ imageUrl: null }, { imageUrl: "" }] }
        ]
      } else {
        where.status = filters.status
      }
    }

    if (filters?.categoryId && filters.categoryId !== "ALL") {
      where.categoryId = filters.categoryId
    }

    let orderBy: any = [{ imageUrl: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }]
    switch (filters?.sort) {
      case "oldest": orderBy = [{ imageUrl: { sort: "desc", nulls: "last" } }, { createdAt: "asc" }]; break
      case "price_asc": orderBy = [{ imageUrl: { sort: "desc", nulls: "last" } }, { price: "asc" }]; break
      case "price_desc": orderBy = [{ imageUrl: { sort: "desc", nulls: "last" } }, { price: "desc" }]; break
      case "stock_asc": orderBy = [{ imageUrl: { sort: "desc", nulls: "last" } }, { stockQuantity: "asc" }]; break
      case "stock_desc": orderBy = [{ imageUrl: { sort: "desc", nulls: "last" } }, { stockQuantity: "desc" }]; break
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          variants: { orderBy: { createdAt: "asc" } },
          _count: { select: { orderItems: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({ where }),
    ])

    return {
      success: true,
      products: JSON.parse(JSON.stringify(products)),
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    }
  } catch (error: any) {
    console.error("[GetProducts] Error:", error)
    return { success: false, error: error.message, products: [], total: 0, totalPages: 0, currentPage: 1 }
  }
}

export async function getActiveProducts(filters?: {
  categorySlug?: string
  type?: "all" | "ready" | "preorder"
  search?: string
  sort?: "newest" | "oldest" | "price_asc" | "price_desc" | "stock_asc" | "stock_desc"
  page?: number
  limit?: number
  sale?: boolean
}) {
  try {
    const page = filters?.page || 1
    const limit = filters?.limit || 24
    const where: any = { status: { in: ["ACTIVE", "OUT_OF_STOCK"] } }

    if (filters?.categorySlug && filters.categorySlug !== "all") {
      const targetCategory = await db.category.findUnique({
        where: { slug: filters.categorySlug },
        include: { subcategories: { select: { id: true } } }
      })
      
      if (targetCategory) {
        const categoryIds = [targetCategory.id, ...targetCategory.subcategories.map((sub: any) => sub.id)]
        where.categoryId = { in: categoryIds }
      } else {
        where.category = { slug: filters.categorySlug }
      }
    }

    if (filters?.type === "ready") {
      where.isPreOrder = false
      where.stockQuantity = { gt: 0 }
    } else if (filters?.type === "preorder") {
      where.isPreOrder = true
    }
    // For type === "all", we don't filter by stockQuantity or isPreOrder anymore
    // so that OUT_OF_STOCK products remain visible in the store and search results.

    if (filters?.search?.trim()) {
      const q = filters.search.trim()
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
      ]
    }

    if (filters?.sale) {
      where.comparePrice = { gt: db.product.fields.price }
    }

    let orderBy: any = [{ imageUrl: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }]
    switch (filters?.sort) {
      case "oldest": orderBy = [{ imageUrl: { sort: "desc", nulls: "last" } }, { createdAt: "asc" }]; break
      case "price_asc": orderBy = [{ imageUrl: { sort: "desc", nulls: "last" } }, { price: "asc" }]; break
      case "price_desc": orderBy = [{ imageUrl: { sort: "desc", nulls: "last" } }, { price: "desc" }]; break
      case "stock_asc": orderBy = [{ imageUrl: { sort: "desc", nulls: "last" } }, { stockQuantity: "asc" }]; break
      case "stock_desc": orderBy = [{ imageUrl: { sort: "desc", nulls: "last" } }, { stockQuantity: "desc" }]; break
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          variants: { orderBy: { createdAt: "asc" } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({ where }),
    ])

    const enriched = products.map(p => ({
      ...p,
      availableStock: p.stockQuantity - p.reservedStock,
    }))

    return { 
      success: true, 
      products: JSON.parse(JSON.stringify(enriched)),
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    }
  } catch (error: any) {
    return { success: false, error: error.message, products: [], total: 0, totalPages: 0, currentPage: 1 }
  }
}

export async function getProductsByIds(ids: string[]) {
  try {
    if (!ids || ids.length === 0) return { success: true, products: [] }
    
    const products = await db.product.findMany({
      where: {
        id: { in: ids },
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: { orderBy: { createdAt: "asc" } },
      },
    })

    const enriched = products.map(p => ({
      ...p,
      availableStock: p.stockQuantity - p.reservedStock,
    }))

    return { success: true, products: JSON.parse(JSON.stringify(enriched)) }
  } catch (error: any) {
    return { success: false, error: error.message, products: [] }
  }
}

export async function getProductBySlug(slug: string) {
  try {
    const product = await db.product.findUnique({
      where: { slug },
      include: {
        category: true,
        variants: { orderBy: { createdAt: "asc" } },
      },
    })
    if (!product) return { success: false, error: "Олдсонгүй" }

    return {
      success: true,
      product: JSON.parse(JSON.stringify({
        ...product,
        availableStock: product.stockQuantity - product.reservedStock,
      })),
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createProduct(data: {
  sku: string
  name: string
  description?: string
  price: number
  comparePrice?: number
  costPrice?: number
  stockQuantity: number
  weight?: number
  unit?: string
  categoryId?: string
  imageUrl?: string
  isPreOrder?: boolean
  customBadge?: string
  options?: any
  variants?: { sku: string; name: string; price?: number; stockQuantity: number; options: any }[]
}) {
  try {
    const slug = data.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-а-яөүё]/gi, "")
      + `-${data.sku.toLowerCase()}`

    const product = await db.product.create({
      data: {
        sku: data.sku.trim(),
        name: data.name.trim(),
        slug,
        description: data.description?.trim(),
        price: data.price,
        comparePrice: data.comparePrice,
        costPrice: data.costPrice,
        stockQuantity: data.stockQuantity,
        weight: data.weight || 0,
        unit: data.unit || "ширхэг",
        imageUrl: data.imageUrl,
        isPreOrder: data.isPreOrder || false,
        customBadge: data.customBadge?.trim() || null,
        options: data.options,
        status: data.stockQuantity > 0 ? "ACTIVE" : "OUT_OF_STOCK",
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.variants && data.variants.length > 0 && {
          variants: {
            create: data.variants.map(v => ({
              sku: v.sku.trim(),
              name: v.name.trim(),
              price: v.price,
              stockQuantity: v.stockQuantity,
              options: v.options,
            }))
          }
        }),
      },
      include: { variants: true, category: true },
    })

    revalidatePath("/admin/products")
    revalidatePath("/")
    return { success: true, product: JSON.parse(JSON.stringify(product)) }
  } catch (error: any) {
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0]
      return { success: false, error: `${field === "sku" ? "SKU" : field === "slug" ? "Нэр" : field} давхардаж байна` }
    }
    console.error("[CreateProduct] Error:", error)
    return { success: false, error: error.message }
  }
}

export async function updateProduct(productId: string, data: {
  name?: string
  description?: string
  price?: number
  comparePrice?: number
  costPrice?: number
  stockQuantity?: number
  weight?: number
  unit?: string
  categoryId?: string
  imageUrl?: string
  status?: string
  isPreOrder?: boolean
  isFeatured?: boolean
  requiresAgeVerification?: boolean
  customBadge?: string
  options?: any
  images?: string[]
  variants?: { sku: string; name: string; price?: number; stockQuantity: number; options: any }[]
}) {
  try {
    const existing = await db.product.findUnique({ where: { id: productId } })
    if (!existing) return { success: false, error: "Бараа олдсонгүй" }

    // Slug шинэчлэх (нэр өөрчлөгдвөл)
    let slug = existing.slug
    if (data.name && data.name.trim() !== existing.name) {
      slug = data.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-а-яөүё]/gi, "")
        + `-${existing.sku.toLowerCase()}`
    }

    const product = await db.product.update({
      where: { id: productId },
      data: {
        ...(data.name && { name: data.name.trim(), slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.comparePrice !== undefined && { comparePrice: data.comparePrice }),
        ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
        ...(data.stockQuantity !== undefined && {
          stockQuantity: data.stockQuantity,
          status: data.stockQuantity > 0 ? "ACTIVE" : "OUT_OF_STOCK",
        }),
        ...(data.weight !== undefined && { weight: data.weight }),
        ...(data.unit !== undefined && { unit: data.unit }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.status !== undefined && { status: data.status as any }),
        ...(data.isPreOrder !== undefined && { isPreOrder: data.isPreOrder }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
        ...(data.requiresAgeVerification !== undefined && { requiresAgeVerification: data.requiresAgeVerification }),
        ...(data.customBadge !== undefined && { customBadge: data.customBadge?.trim() || null }),
        ...(data.options !== undefined && { options: data.options }),
        ...(data.images !== undefined && { images: data.images }),
      },
    })

    // Handle variants if provided
    if (data.variants !== undefined) {
      if (data.variants.length === 0) {
        // If variants array is empty but provided, it means all variants were removed
        await db.productVariant.deleteMany({ where: { productId } })
      } else {
        // Upsert variants based on SKU
        const currentVariantSkus = data.variants.map(v => v.sku)
        
        // Delete variants that are no longer in the list
        await db.productVariant.deleteMany({
          where: { 
            productId,
            sku: { notIn: currentVariantSkus }
          }
        })
        
        // Upsert new/existing variants
        for (const variant of data.variants) {
          await db.productVariant.upsert({
            where: { sku: variant.sku },
            update: {
              name: variant.name,
              price: variant.price,
              stockQuantity: variant.stockQuantity,
              options: variant.options,
            },
            create: {
              productId: productId,
              sku: variant.sku,
              name: variant.name,
              price: variant.price,
              stockQuantity: variant.stockQuantity,
              options: variant.options,
            }
          })
        }
      }
    }

    revalidatePath("/admin/products")
    revalidatePath("/")
    return { success: true, product: JSON.parse(JSON.stringify(product)) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteProduct(productId: string) {
  try {
    const product = await db.product.findUnique({ where: { id: productId } })
    if (!product) return { success: false, error: "Бараа олдсонгүй" }

    if (product.status === "ARCHIVED") {
      const totalOrders = await db.orderItem.count({ where: { productId } })
      if (totalOrders > 0) {
        return { success: false, error: "Захиалгын түүхэнд бүртгэгдсэн тул бүр мөсөн устгах боломжгүй." }
      }
      await db.cartItem.deleteMany({ where: { productId } })
      await db.product.delete({ where: { id: productId } })
      
      // Delete the physical images folder for this product
      if (product.sku) {
        await deleteProductFolder(product.sku)
      }
    } else {
      const activeOrderCount = await db.orderItem.count({
        where: {
          productId,
          order: { orderStatus: { in: ["PENDING", "PAID", "PROCESSING", "SHIPPED"] } }
        }
      })
      if (activeOrderCount > 0) {
        return { success: false, error: `${activeOrderCount} идэвхтэй захиалгатай тул устгах боломжгүй.` }
      }
      await db.product.update({
        where: { id: productId },
        data: { status: "ARCHIVED" }
      })
    }

    revalidatePath("/admin/products")
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ═══════════════════════════════════════════════════
// АНГИЛАЛ CRUD
// ═══════════════════════════════════════════════════

export async function getCategories() {
  try {
    const categories = await db.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { sortOrder: "asc" },
    })
    return { success: true, categories: JSON.parse(JSON.stringify(categories)) }
  } catch (error: any) {
    return { success: false, error: error.message, categories: [] }
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    const category = await db.category.findFirst({
      where: { slug },
      include: { _count: { select: { products: true } } },
    })
    if (!category) return { success: false, error: "Ангилал олдсонгүй" }
    return { success: true, category: JSON.parse(JSON.stringify(category)) }
  } catch (error: any) {
    return { success: false, error: error.message, category: null }
  }
}

export async function createCategory(data: { name: string; imageUrl?: string }) {
  try {
    const slug = data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-а-яөүё]/gi, "")
    const category = await db.category.create({
      data: { name: data.name.trim(), slug: slug || `cat-${Date.now()}`, imageUrl: data.imageUrl }
    })
    revalidatePath("/admin/products")
    return { success: true, category: JSON.parse(JSON.stringify(category)) }
  } catch (error: any) {
    if (error.code === "P2002") return { success: false, error: "Ангилал давхардаж байна" }
    return { success: false, error: error.message }
  }
}

// ═══════════════════════════════════════════════════
// EXCEL IMPORT
// ═══════════════════════════════════════════════════

export async function importProducts(rows: any[], defaultCategoryId?: string) {
  try {
    if (!rows || rows.length === 0) return { success: false, error: "Хоосон байна" }
    
    let importedCount = 0
    let updatedCount = 0

    for (const row of rows) {
      if (!row.SKU || !row["Барааны нэр"]) continue

      const sku = String(row.SKU).trim()
      const name = String(row["Барааны нэр"]).trim()
      const price = Number(row["Үнэ"]) || 0
      const stockQuantity = Number(row["Үлдэгдэл"]) || 0
      const weight = Number(row["Жин"]) || 0
      const unit = row["Хэмжих нэгж"] || "ширхэг"
      const status = row["Статус"] || (stockQuantity > 0 ? "ACTIVE" : "OUT_OF_STOCK")
      const customBadge = row["Тусгай тэмдэг"] || null
      
      let slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-а-яөүё]/gi, "") + `-${sku.toLowerCase()}`

      const existing = await db.product.findUnique({ where: { sku } })

      if (existing) {
        await db.product.update({
          where: { sku },
          data: {
            name,
            price,
            stockQuantity,
            weight,
            unit,
            status,
            customBadge,
            ...(defaultCategoryId && { categoryId: defaultCategoryId }),
            ...(row["Харьцуулах үнэ"] && { comparePrice: Number(row["Харьцуулах үнэ"]) })
          }
        })
        updatedCount++
      } else {
        await db.product.create({
          data: {
            sku,
            name,
            slug,
            price,
            stockQuantity,
            weight,
            unit,
            status,
            customBadge,
            ...(defaultCategoryId && { categoryId: defaultCategoryId }),
            ...(row["Харьцуулах үнэ"] && { comparePrice: Number(row["Харьцуулах үнэ"]) })
          }
        })
        importedCount++
      }
    }

    revalidatePath("/admin/products")
    revalidatePath("/")
    
    return { success: true, imported: importedCount, updated: updatedCount }
  } catch (error: any) {
    console.error("[ImportProducts Error]", error)
    return { success: false, error: error.message }
  }
}


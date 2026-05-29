import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentAdmin, logActivity } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin || admin.role !== "DATAADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Файл олдсонгүй" }, { status: 400 })
    }

    const fileContent = await file.text()
    const parsed = JSON.parse(fileContent)

    if (!parsed || !parsed.data) {
      return NextResponse.json({ error: "Буруу форматтай байна. Зөвхөн Backup хийсэн JSON файлыг оруулна уу." }, { status: 400 })
    }

    const { categories, products, users, shopSettings } = parsed.data

    let restoredCategories = 0
    let restoredProducts = 0
    let restoredUsers = 0

    // Restore Settings
    if (shopSettings && Array.isArray(shopSettings)) {
      for (const s of shopSettings) {
        await db.shopSettings.upsert({
          where: { key: s.key },
          update: { value: s.value },
          create: { key: s.key, value: s.value }
        })
      }
    }

    // Restore Users
    if (users && Array.isArray(users)) {
      for (const u of users) {
        // Skip current admin
        if (u.id === admin.id) continue;
        
        // Remove relationships we don't want to blindly insert
        const { id, cart, orders, ...userData } = u;
        
        await db.user.upsert({
          where: { id: u.id },
          update: userData,
          create: {
            id: u.id,
            ...userData
          }
        })
        restoredUsers++
      }
    }

    // Restore Categories
    if (categories && Array.isArray(categories)) {
      for (const c of categories) {
        const { id, parent, subcategories, products, homePageSections, ...catData } = c;
        await db.category.upsert({
          where: { id: c.id },
          update: catData,
          create: {
            id: c.id,
            ...catData
          }
        })
        restoredCategories++
      }
    }

    // Restore Products
    if (products && Array.isArray(products)) {
      for (const p of products) {
        const { id, variants, category, cartItems, orderItems, ...prodData } = p;
        
        await db.product.upsert({
          where: { id: p.id },
          update: prodData,
          create: {
            id: p.id,
            ...prodData
          }
        })

        // Restore Variants
        if (variants && Array.isArray(variants)) {
          for (const v of variants) {
            const { id: vId, product, ...varData } = v;
            await db.productVariant.upsert({
              where: { id: v.id },
              update: varData,
              create: {
                id: v.id,
                ...varData
              }
            })
          }
        }
        restoredProducts++
      }
    }

    // Restore Orders (complex, skip for basic restore to prevent overriding new orders, unless required)
    // Actually, orders shouldn't typically be restored this way unless it's a full DB reset, as IDs might collide.
    // For now, we restore users, categories, products and settings, which are the main entities.

    await logActivity({
      userId: admin.id,
      userName: admin.name || "Админ",
      userRole: admin.role,
      action: "Өгөгдөл сэргээв (Restore)",
      target: "Database",
      detail: `${restoredCategories} ангилал, ${restoredProducts} бараа, ${restoredUsers} хэрэглэгч сэргээгдлээ.`,
    })

    return NextResponse.json({ 
      success: true, 
      message: `Амжилттай сэргээлээ. Ангилал: ${restoredCategories}, Бараа: ${restoredProducts}, Хэрэглэгч: ${restoredUsers}` 
    })

  } catch (error: any) {
    console.error("Restore error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

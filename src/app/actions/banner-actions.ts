"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getBanners(type?: string) {
  try {
    const banners = await db.banner.findMany({
      where: type ? { type } : undefined,
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" }
      ]
    })
    return { success: true, banners: JSON.parse(JSON.stringify(banners)) }
  } catch (error: any) {
    return { success: false, error: error.message, banners: [] }
  }
}

export async function createBanner(data: { title?: string; imageUrl: string; linkUrl?: string; type?: string }) {
  try {
    const count = await db.banner.count()
    const banner = await db.banner.create({
      data: {
        title: data.title,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        type: data.type || "HERO",
        sortOrder: count,
      }
    })
    revalidatePath("/admin/marketing/banners")
    revalidatePath("/")
    return { success: true, banner: JSON.parse(JSON.stringify(banner)) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateBanner(id: string, data: { title?: string; imageUrl?: string; linkUrl?: string; isActive?: boolean; type?: string }) {
  try {
    const banner = await db.banner.update({
      where: { id },
      data
    })
    revalidatePath("/admin/marketing/banners")
    revalidatePath("/")
    return { success: true, banner: JSON.parse(JSON.stringify(banner)) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteBanner(id: string) {
  try {
    await db.banner.delete({ where: { id } })
    revalidatePath("/admin/marketing/banners")
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateBannerOrder(items: { id: string, sortOrder: number }[]) {
  try {
    const transactions = items.map(item =>
      db.banner.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder }
      })
    )
    await db.$transaction(transactions)
    revalidatePath("/admin/marketing/banners")
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

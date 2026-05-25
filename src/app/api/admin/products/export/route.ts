import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentAdmin } from "@/lib/auth"
import * as xlsx from "xlsx"

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    const where: any = {}
    if (status === "NO_IMAGE") {
      where.OR = [{ imageUrl: null }, { imageUrl: "" }]
    } else if (status && status !== "ALL") {
      if (status === "LOW_STOCK") {
        where.status = "ACTIVE"
        where.stockQuantity = { lt: 5, gt: 0 }
      } else {
        where.status = status
      }
    }

    const products = await db.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" }
    })

    const data = products.map(p => ({
      "SKU": p.sku,
      "Нэр": p.name,
      "Үнэ": p.price,
      "Өртөг": p.costPrice || "",
      "Тоо": p.stockQuantity,
      "Жин": p.weight || "",
      "Хэмжих нэгж": p.unit || "ширхэг",
      "Ангилал": p.category?.name || "",
      "Тайлбар": p.description || "",
      "Хувилбар_SKU": "",
      "Хувилбар_нэр": "",
      "Хувилбар_Тоо": "",
      "Статус": p.status,
      "Тусгай тэмдэг": p.customBadge || "",
      "ID": p.id,
    }))

    const headers = [
      "SKU", "Нэр", "Үнэ", "Өртөг", "Тоо", "Жин", "Хэмжих нэгж", "Ангилал", "Тайлбар",
      "Хувилбар_SKU", "Хувилбар_нэр", "Хувилбар_Тоо", "Статус", "Тусгай тэмдэг", "ID"
    ]

    const worksheet = xlsx.utils.json_to_sheet(data, { header: headers })
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, "Products")

    const instructionsData = [
      { "Багана": "SKU", "Тайлбар": "Барааны дахин давтагдашгүй код (Заавал)", "Жишээ": "PROD-001" },
      { "Багана": "Нэр", "Тайлбар": "Барааны нэр (Заавал)", "Жишээ": "Ухаалаг цаг" },
      { "Багана": "Үнэ", "Тайлбар": "Барааны зарах үнэ, зөвхөн тоогоор (Заавал)", "Жишээ": "150000" },
      { "Багана": "Өртөг", "Тайлбар": "Барааны худалдаж авсан өртөг, зөвхөн тоогоор (Нэмэлт)", "Жишээ": "100000" },
      { "Багана": "Тоо", "Тайлбар": "Барааны үлдэгдэл тоо ширхэг (Заавал)", "Жишээ": "50" },
      { "Багана": "Жин", "Тайлбар": "Барааны жин, зөвхөн тоогоор (Нэмэлт)", "Жишээ": "1.5" },
      { "Багана": "Хэмжих нэгж", "Тайлбар": "Ширхэг, кг, гр гэх мэт (Нэмэлт, анхны утга: ширхэг)", "Жишээ": "ширхэг" },
      { "Багана": "Ангилал", "Тайлбар": "Барааны ангиллын нэр. Баазад байхгүй бол шинээр үүснэ (Нэмэлт)", "Жишээ": "Электрон бараа" },
      { "Багана": "Тайлбар", "Тайлбар": "Барааны дэлгэрэнгүй тайлбар (Нэмэлт)", "Жишээ": "Усны хамгаалалттай ухаалаг цаг" },
      { "Багана": "Хувилбар_SKU", "Тайлбар": "Хувилбартай барааны хувьд Эх барааны SKU-г энд бичнэ. Энэ мөр нь зөвхөн хувилбар болж орно.", "Жишээ": "PROD-001" },
      { "Багана": "Хувилбар_нэр", "Тайлбар": "Хувилбарын нэр (Жнь: Улаан, Хэмжээ 42). Хувилбар_SKU бөглөсөн үед заавал.", "Жишээ": "Улаан өнгөтэй" },
      { "Багана": "Хувилбар_Тоо", "Тайлбар": "Хувилбарын үлдэгдэл тоо ширхэг. Хувилбар_SKU бөглөсөн үед заавал.", "Жишээ": "10" },
      { "Багана": "Статус", "Тайлбар": "ACTIVE, DRAFT, ARCHIVED, OUT_OF_STOCK (Систем өөрөө автоматаар тооцоолно)", "Жишээ": "ACTIVE" },
      { "Багана": "Тусгай тэмдэг", "Тайлбар": "Шинэ, Онцлох гэх мэт барааны зураг дээр харагдах текст (Нэмэлт)", "Жишээ": "Шинэ" },
      { "Багана": "ID", "Тайлбар": "Системээс өгсөн дахин давтагдашгүй ID (Шинэ бараа нэмэхэд хоосон орхино, үл тооно)", "Жишээ": "cl..." },
    ]

    const instructionsSheet = xlsx.utils.json_to_sheet(instructionsData)
    instructionsSheet['!cols'] = [{ wch: 20 }, { wch: 90 }, { wch: 25 }]
    xlsx.utils.book_append_sheet(workbook, instructionsSheet, "Заавар")

    const buf = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" })

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="products_export_${new Date().toISOString().split("T")[0]}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }
    })
  } catch (error: any) {
    console.error("[Export Error]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

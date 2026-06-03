import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Prisma client
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    // 1. Аюулгүй байдлын шалгалт (Bearer Token)
    // process.env.POS_SYNC_API_KEY эсвэл SYNC_SECRET_TOKEN ашиглаж болно.
    const authHeader = request.headers.get('authorization');
    const secretToken = process.env.SYNC_SECRET_TOKEN || process.env.POS_SYNC_API_KEY;

    if (!secretToken) {
      console.error('POS Sync Token тохируулагдаагүй байна (.env шалгана уу)');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== secretToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Payload датаг унших
    const body = await request.json();
    const items = body.items;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid payload format. Expected { "items": [...] }' }, { status: 400 });
    }

    // 3. Payload дотроос бүх itemId-г (эсвэл barcode) ялгаж авах
    // Анхаарах: Таны баазын загварт (schema.prisma) барааны дахин давтагдахгүй код нь 'sku' гэж байгаа тул 'sku' талбартай тулгалт хийнэ.
    const itemIds = items.map((item: any) => item.itemId || item.barcode).filter(Boolean);

    if (itemIds.length === 0) {
      return NextResponse.json({ message: 'No valid items found in payload' }, { status: 200 });
    }

    // 4. Өгөгдлийн сангаас зөвхөн манайд бүртгэлтэй байгаа бараануудыг хайж олох
    const existingProducts = await db.product.findMany({
      where: {
        sku: {
          in: itemIds
        }
      },
      select: { sku: true }
    });

    // Олдсон бараануудын sku-үүдээр Set үүсгэх (Хайлт хийхэд илүү хурдан)
    const existingSkuSet = new Set(existingProducts.map(p => p.sku));

    // 5. Зөвхөн баазад бүртгэлтэй байгаа бараануудыг шүүж авах (NO CREATIONS)
    const matchedItems = items.filter((item: any) => {
      const id = item.itemId || item.barcode;
      return existingSkuSet.has(id);
    });

    if (matchedItems.length === 0) {
      return NextResponse.json({ message: 'No matching items found to update', updatedCount: 0 }, { status: 200 });
    }

    // 6. Prisma Transaction ашиглан олон барааг нэгэн зэрэг шинэчлэх (MATCH & UPDATE ONLY, NO DELETIONS)
    // updateMany нь өөр өөр утгаар update хийж чаддаггүй тул массив гүйлгэж transaction ашиглана.
    const updateOperations = matchedItems.map((item: any) => {
      const id = item.itemId || item.barcode;
      return db.product.update({
        where: { sku: id },
        data: {
          price: item.price,
          stockQuantity: item.stock
        }
      });
    });

    await db.$transaction(updateOperations);

    // 7. Амжилттай болсон тухай хариу илгээх
    return NextResponse.json({
      message: 'Sync successful',
      receivedCount: items.length,
      updatedCount: matchedItems.length
    }, { status: 200 });

  } catch (error) {
    console.error('POS Sync алдаа гарлаа:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

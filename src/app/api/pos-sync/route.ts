import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Prisma client
import { Prisma, ProductStatus } from '@prisma/client';
import { orderEmitter } from '@/lib/orderEvents'; // For notifications

export async function POST(request: Request) {
  try {
    // 1. Аюулгүй байдлын шалгалт
    const authHeader = request.headers.get('authorization');
    const secretToken = process.env.SYNC_SECRET_TOKEN || process.env.POS_SYNC_API_KEY;

    if (!secretToken) {
      console.error('POS Sync Token тохируулагдаагүй байна (.env шалгана уу)');
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== secretToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Payload датаг унших: { items: [{ itemId, name, barcode, price, stock }] }
    const body = await request.json();
    const items = body.items;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ success: false, error: 'Invalid payload format' }, { status: 400 });
    }

    // 3. Payload дотроос itemId-г ялгах
    const itemIds = items.map((item: any) => item.itemId).filter(Boolean);

    if (itemIds.length === 0) {
      return NextResponse.json({ success: true, message: 'No valid items found' }, { status: 200 });
    }

    // 4. Өгөгдлийн сангаас itemId (манай sku)-гээр хайх
    const existingProducts = await db.product.findMany({
      where: {
        sku: { in: itemIds }
      },
      select: { sku: true, barcode: true }
    });

    const existingMap = new Map(existingProducts.map(p => [p.sku, p]));

    // 5. Олдсон болон олдоогүй барааг ялгах
    const matchedItems: any[] = [];
    const missingItems: any[] = [];

    items.forEach((item: any) => {
      const id = item.itemId;
      if (!id) return;
      if (existingMap.has(id)) {
        matchedItems.push({ item, dbRecord: existingMap.get(id) });
      } else {
        missingItems.push(item);
      }
    });

    // 6. Олдсон бараануудыг шинэчлэх (Update price, stock, and barcode if empty)
    const updateOperations = matchedItems.map(({ item, dbRecord }) => {
      let newStatus = dbRecord.status;
      
      // Автомат төлөвийн логик
      if (item.price <= 0 || item.stock <= 0) {
        newStatus = ProductStatus.ARCHIVED; // Үнэ эсвэл үлдэгдэл 0 бол шууд Архив
      } else {
        newStatus = ProductStatus.ACTIVE; // Үнэтэй бөгөөд үлдэгдэлтэй бол Идэвхтэй
      }

      const dataToUpdate: any = {
        price: item.price,
        stockQuantity: item.stock,
        status: newStatus
      };
      
      // Хэрэв баазад barcode хоосон, харин payload дээр ирсэн бол нөхөж оруулах
      if (!dbRecord.barcode && item.barcode) {
        dataToUpdate.barcode = item.barcode;
      }

      return db.product.update({
        where: { sku: item.itemId },
        data: dataToUpdate
      });
    });

    // 7. Олдоогүй бараануудыг DRAFT эсвэл ARCHIVED төлөвтэйгөөр үүсгэх
    const draftsToCreate = missingItems.map((item: any) => {
      let initialStatus: ProductStatus = ProductStatus.DRAFT;
      if (item.price <= 0 || item.stock <= 0) {
        initialStatus = ProductStatus.ARCHIVED;
      }
      
      return {
        sku: item.itemId,
        barcode: item.barcode || null,
        name: item.name || `Шинэ бараа - ${item.itemId}`,
        slug: `pos-${item.itemId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        price: item.price,
        stockQuantity: item.stock,
        status: initialStatus
      };
    });

    // Транзакц (Transactions) - Шинэчлэх
    if (updateOperations.length > 0) {
      await db.$transaction(updateOperations);
    }
    
    // Бөөнөөр үүсгэх (Create Many)
    if (draftsToCreate.length > 0) {
      await db.product.createMany({
        data: draftsToCreate,
        skipDuplicates: true // давхардал гарвал алгасах
      });

      // Админ руу бодит цагийн мэдэгдэл (SSE) явуулах
      try {
        orderEmitter.emit("system-alert", {
          message: `${draftsToCreate.length} шинэ бараа POS системээс нэмэгдлээ!`,
          details: "Ноорог хэсгээс шалгаж баталгаажуулна уу.",
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        console.error("Failed to emit event:", e);
      }
    }

    // Activity Log бичих (Шинэчлэгдсэн эсвэл шинээр нэмэгдсэн байвал)
    if (updateOperations.length > 0 || draftsToCreate.length > 0) {
      try {
        let draftMessage = `\nБүртгэлгүй байсан тул "Ноорог" (Draft) хэлбэрээр үүссэн: ${draftsToCreate.length}`;
        if (draftsToCreate.length > 0) {
          const draftSkus = draftsToCreate.map((d: any) => d.sku);
          const displaySkus = draftSkus.slice(0, 10).join(", ");
          draftMessage += ` (SKU: ${displaySkus}${draftSkus.length > 10 ? ` болон бусад ${draftSkus.length - 10} бараа` : ""})`;
        }

        await (db as any).activityLog.create({
          data: {
            userId: "system",
            userName: "POS Sync System",
            userRole: "SYSTEM",
            action: "POS Системтэй синхрончилов",
            target: "Product",
            detail: `Нийт хүлээн авсан бараа: ${items.length}\nАмжилттай шинэчлэгдсэн үлдэгдэл/үнэ: ${updateOperations.length}${draftMessage}`
          }
        });
      } catch (e) {
        console.error("Failed to log activity:", e);
      }
    }

    // 8. Хариу буцаах
    return NextResponse.json({
      success: true,
      receivedCount: items.length,
      updatedCount: matchedItems.length,
      ignoredCount: 0, // Бүгдийг боловсруулдаг болсон тул ignore байхгүй
      createdDraftsCount: draftsToCreate.length
    }, { status: 200 });

  } catch (error) {
    console.error('POS Sync алдаа гарлаа:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

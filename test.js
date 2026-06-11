const sql = require('mssql/msnodesqlv8');

const config = {
    server: 'localhost',
    database: 'UTDiamond',
    driver: 'msnodesqlv8',
    requestTimeout: 120000, // Том тайлан тул 2 минут хүлээнэ
    options: {
        trustedConnection: true, // Windows Authentication ашиглах
        encrypt: false,
        trustServerCertificate: true
    }
};

async function syncInventory() {
    try {
        console.log("Бааз руу холбогдож байна...");
        await sql.connect(config);

        console.log("Тооллогын датаг татаж байна. Түр хүлээнэ үү...");
        const result = await sql.query(`
            EXEC IM_SEL_ItemCountList 
                @ItemLocationInfID=N'202601010000000001',
                @AccountRecID=N'202601010000000003',
                @BeginDate=N'2026/06/03',
                @EndDate=N'2026/06/03',
                @IsLocal=N'Y',
                @MapRecID=N'0',
                @ChannelInfID=0,
                @PriceType=1,
                @UserInfID=N'260101442851400000'
        `);

        const rawItems = result.recordsets[0];

        // Датаг цэвэрлэж, вэб рүү илгээх (Үнийн шалгалт нэмэгдсэн)
        const cleanData = rawItems
            .filter(item => item.ItemID && item.ItemID.trim() !== '')
            .map(item => {
                let actualPrice = Number(item.Price) || 0;
                let actualCost = Number(item.Cost) || 0;

                // 🚨 ХАМГИЙН ГОЛ ШАЛГАЛТ: Хэрэв үнэ нь өртөгтэйгөө яг ижил байвал үнийг 0 болгох
                if (actualPrice === actualCost) {
                    actualPrice = 0;
                }

                return {
                    itemId: item.ItemID.trim(),
                    name: item.ItemDescription ? item.ItemDescription.trim() : 'Нэргүй бараа',
                    barcode: item.BarCode ? item.BarCode.trim() : '',
                    price: actualPrice, // Зассан үнээ энд оноолоо
                    stock: Number(item.EndQty) || 0
                };
            });

        console.log(`\nНийт ${cleanData.length} ширхэг барааг вэб рүү илгээж байна...`);

        // Next.js API руу датагаа илгээх
        // АНХААР: Вэб сайт тань интернэтэд орсон үед localhost:3000 хэсгийг жинхэнэ домэйнээрээ солино
        const response = await fetch('http://localhost:3000/api/pos-sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer super_secret_pos_key_2026'
            },
            body: JSON.stringify({ items: cleanData })
        });

        // API-аас ирсэн хариуг JSON хэлбэрээр унших
        const responseData = await response.json();

        if (response.ok && responseData.success) {
            console.log("\n=========================================");
            console.log("✅ СИНК АМЖИЛТТАЙ ХИЙГДЭЖ ДУУСЛАА!");
            console.log("=========================================");
            console.log(`📦 Кассаас илгээсэн нийт бараа: ${responseData.receivedCount || cleanData.length}`);
            console.log(`🔄 Вэб дээр хуучин байсан, шинэчлэгдсэн: ${responseData.updatedCount || 0}`);
            console.log(`🆕 Вэб дээр шинээр нэмэгдсэн (DRAFT): ${responseData.createdDraftsCount || 0}`);
            console.log(`⚠️ Вэб рүү ороогүй (Орхигдсон): ${responseData.ignoredCount || 0}`);
            console.log("=========================================\n");
        } else {
            console.error("❌ API руу илгээх үед алдаа гарлаа:", responseData.error || response.status);
        }

    } catch (err) {
        console.error("Алдаа гарлаа:", err);
    } finally {
        sql.close();
    }
}

syncInventory();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const scriptContent = `const sql = require('mssql/msnodesqlv8');

const config = {
    server: 'localhost',
    database: 'UTDiamond',
    driver: 'msnodesqlv8',
    requestTimeout: 120000, 
    options: {
        trustedConnection: true, 
        encrypt: false,
        trustServerCertificate: true
    }
};

async function syncInventory() {
    try {
        console.log("Татаж байна...");
        await sql.connect(config);

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const formattedDate = \`\${yyyy}/\${mm}/\${dd}\`;

        console.log(\`Өгөгдлийн сангаас \${formattedDate}-н өгөгдлийг уншиж байна...\`);
        const result = await sql.query(\`
            EXEC IM_SEL_ItemCountList 
                @ItemLocationInfID=N'202601010000000001',
                @AccountRecID=N'202601010000000003',
                @BeginDate=N'\${formattedDate}',
                @EndDate=N'\${formattedDate}',
                @IsLocal=N'Y',
                @MapRecID=N'0',
                @ChannelInfID=0,
                @PriceType=1,
                @UserInfID=N'260101442851400000'
        \`);

        const rawItems = result.recordsets[0];

        const cleanData = rawItems
            .filter(item => item.ItemID && item.ItemID.trim() !== '')
            .map(item => {
                let actualPrice = Number(item.Price) || 0;
                let actualCost = Number(item.Cost) || 0;

                if (actualPrice === actualCost) {
                    actualPrice = 0;
                }

                return {
                    itemId: item.ItemID.trim(),
                    name: item.ItemDescription ? item.ItemDescription.trim() : 'Нэргүй бараа',
                    barcode: item.BarCode ? item.BarCode.trim() : '',
                    price: actualPrice,
                    stock: Number(item.EndQty) || 0
                };
            });

        console.log(\`\\nНийт \${cleanData.length} барааны үлдэгдэл олдлоо. Вэб рүү илгээж байна...\`);

        const response = await fetch('https://bileghurgelt.mn/api/pos-sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer super_secret_pos_key_2026'
            },
            body: JSON.stringify({ items: cleanData })
        });

        const responseData = await response.json();

        if (response.ok && responseData.success) {
            console.log("\\n=========================================");
            console.log("✅ Амжилттай илгээгдлээ!");
            console.log("=========================================");
            console.log(\`📦 Нийт илгээсэн: \${cleanData.length}\`);
            console.log(\`🔄 Шинэчлэгдсэн: \${responseData.updatedCount || 0}\`);
            console.log(\`➕ Шинээр үүссэн: \${responseData.createdDraftsCount || 0}\`);
            console.log("=========================================\\n");
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
`;

async function main() {
  await prisma.shopSettings.upsert({
    where: { key: 'POS_SYNC_SCRIPT' },
    update: { value: scriptContent },
    create: { key: 'POS_SYNC_SCRIPT', value: scriptContent }
  });
  console.log("Seeded POS script into ShopSettings.");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const transfers = await db.stockTransfer.findMany({
      include: {
        fromBranch: true,
        toBranch: true,
        createdBy: true,
        approvedBy: true,
        items: {
          include: {
            product: true,
            variant: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(transfers);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch transfers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fromBranchId, toBranchId, items, createdById, note } = body;

    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    const referenceNumber = `TR-${date}-${random}`;

    // Admin fallback for demo if createdById is missing
    let creatorId = createdById;
    if (!creatorId) {
      const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
      creatorId = admin?.id || "fallback-id";
    }

    const transfer = await db.stockTransfer.create({
      data: {
        referenceNumber,
        fromBranchId,
        toBranchId,
        createdById: creatorId,
        note,
        status: "PENDING",
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: parseInt(item.quantity)
          }))
        }
      }
    });

    return NextResponse.json(transfer);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Failed to create transfer" }, { status: 500 });
  }
}

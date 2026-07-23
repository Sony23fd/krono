import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const transferId = resolvedParams.id;
    
    const result = await db.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({
        where: { id: transferId },
        include: { items: true }
      });

      if (!transfer || transfer.status !== "PENDING") {
        throw new Error("Invalid transfer or already processed");
      }

      for (const item of transfer.items) {
        const inv = await tx.inventory.findFirst({
          where: { branchId: transfer.fromBranchId, productId: item.productId, variantId: item.variantId }
        });

        // For demo purposes, we might allow negative stock if inv is missing
        if (!inv) {
          await tx.inventory.create({
            data: {
              branchId: transfer.fromBranchId,
              productId: item.productId,
              variantId: item.variantId,
              quantity: -item.quantity
            }
          });
        } else {
          await tx.inventory.update({
            where: { id: inv.id },
            data: { quantity: { decrement: item.quantity } }
          });
        }
        
        await tx.stockMovement.create({
           data: {
             branchId: transfer.fromBranchId,
             productId: item.productId,
             variantId: item.variantId,
             type: "TRANSFER_OUT",
             quantity: -item.quantity,
             transferId: transfer.id
           }
        });
      }

      const updated = await tx.stockTransfer.update({
        where: { id: transferId },
        data: {
          status: "IN_TRANSIT",
          shippedAt: new Date()
        }
      });

      return updated;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

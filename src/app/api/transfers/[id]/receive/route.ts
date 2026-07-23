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

      if (!transfer || transfer.status !== "IN_TRANSIT") {
        throw new Error("Invalid transfer or not in transit");
      }

      for (const item of transfer.items) {
        let inv = await tx.inventory.findFirst({
          where: { branchId: transfer.toBranchId, productId: item.productId, variantId: item.variantId }
        });

        if (inv) {
          await tx.inventory.update({
            where: { id: inv.id },
            data: { quantity: { increment: item.quantity } }
          });
        } else {
          await tx.inventory.create({
            data: {
              branchId: transfer.toBranchId,
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity
            }
          });
        }
        
        await tx.stockTransferItem.update({
          where: { id: item.id },
          data: { receivedQty: item.quantity }
        });
        
        await tx.stockMovement.create({
           data: {
             branchId: transfer.toBranchId,
             productId: item.productId,
             variantId: item.variantId,
             type: "TRANSFER_IN",
             quantity: item.quantity,
             transferId: transfer.id
           }
        });
      }

      const updated = await tx.stockTransfer.update({
        where: { id: transferId },
        data: {
          status: "COMPLETED",
          receivedAt: new Date()
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

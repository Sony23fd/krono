import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    const where = branchId ? { branchId } : {};

    const inventory = await db.inventory.findMany({
      where,
      include: {
        branch: true,
        product: true,
        variant: true,
      },
    });
    
    return NextResponse.json(inventory);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

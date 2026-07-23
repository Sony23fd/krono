import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const branches = await db.branch.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(branches);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const branch = await db.branch.create({
      data: {
        name: data.name,
        type: data.type || "STORE",
        address: data.address,
      }
    });
    return NextResponse.json(branch);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create branch" }, { status: 500 });
  }
}

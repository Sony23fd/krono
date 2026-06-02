import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const settings = await db.shopSettings.findMany({
      where: {
        key: {
          in: ["map_new_darkhan", "map_old_darkhan"]
        }
      }
    })

    const mapData: Record<string, string> = {}
    settings.forEach(s => {
      mapData[s.key] = s.value
    })

    return NextResponse.json(mapData)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch map settings" }, { status: 500 })
  }
}

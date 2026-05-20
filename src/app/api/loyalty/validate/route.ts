import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { cardNumber } = await req.json()
    
    if (!cardNumber || typeof cardNumber !== "string") {
      return NextResponse.json({ isValid: false, error: "Картны дугаар оруулна уу." }, { status: 400 })
    }

    const card = await db.loyaltyCard.findUnique({
      where: { cardNumber: cardNumber.trim() }
    })

    if (!card) {
      return NextResponse.json({ isValid: false, error: "Карт олдсонгүй эсвэл буруу байна." }, { status: 404 })
    }

    return NextResponse.json({ 
      isValid: true, 
      balance: card.pointsBalance 
    })
  } catch (error: any) {
    console.error("[Loyalty Validate Error]:", error)
    return NextResponse.json({ isValid: false, error: "Дотоод алдаа гарлаа." }, { status: 500 })
  }
}

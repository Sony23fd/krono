"use server"

import { db } from "@/lib/db"
import { getCustomerSession } from "@/lib/customer-session"

export async function getReferralData() {
  const session = await getCustomerSession()
  if (!session.isLoggedIn || !session.phone) {
    return { success: false, error: "Хэрэглэгч нэвтрээгүй байна." }
  }

  const user = await db.user.findUnique({
    where: { phone: session.phone },
    select: {
      id: true,
      referralCode: true,
      referralReward: true,
      referralCount: true,
      referrals: {
        select: {
          id: true,
          name: true,
          phone: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })

  if (!user) {
    return { success: false, error: "Хэрэглэгч олдсонгүй." }
  }

  // If user doesn't have a referral code yet, generate one
  let referralCode = user.referralCode
  if (!referralCode) {
    const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase()
    let myCode = generateCode()
    while (await db.user.findUnique({ where: { referralCode: myCode } })) {
      myCode = generateCode()
    }
    
    await db.user.update({
      where: { id: user.id },
      data: { referralCode: myCode }
    })
    referralCode = myCode
  }

  return {
    success: true,
    data: {
      referralCode,
      referralReward: user.referralReward,
      referralCount: user.referralCount,
      referrals: user.referrals
    }
  }
}

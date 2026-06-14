import { ReactNode } from "react"
import { Outfit } from "next/font/google"
import { Toaster } from "sonner"
import { db } from "@/lib/db"
import type { Metadata } from "next"
import "./globals.css"

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })

export async function generateMetadata(): Promise<Metadata> {
  let shopName = "Онлайн дэлгүүр"
  try {
    const setting = await db.shopSettings.findUnique({ where: { key: "shop_name" } })
    if (setting?.value) shopName = setting.value
  } catch {}
  return {
    title: {
      default: shopName,
      template: `%s | ${shopName}`,
    },
    description: `${shopName} — Таны өдөр тутмын супермаркет`,
  }
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="mn" className={`${outfit.variable} ${outfit.className}`} suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 flex flex-col font-sans font-medium" suppressHydrationWarning>
        <Toaster richColors position="top-right" />
        {children}
      </body>
    </html>
  )
}

import { getIronSession, IronSession } from "iron-session"
import { cookies } from "next/headers"

export interface CustomerSessionData {
  id: string
  name: string
  phone: string
  address?: string
  isLoggedIn: boolean
}

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET || "fallback_secret_for_local_development_only_change_this_to_32_chars_long_str",
  cookieName: "bileg-customer-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30, // 30 days session for customers
  },
}

export async function getCustomerSession(): Promise<IronSession<CustomerSessionData>> {
  const cookieStore = await cookies()
  const session = await getIronSession<CustomerSessionData>(cookieStore, SESSION_OPTIONS)
  return session
}

export async function createCustomerSession(data: Omit<CustomerSessionData, "isLoggedIn">) {
  const session = await getCustomerSession()
  session.id = data.id
  session.name = data.name
  session.phone = data.phone
  session.address = data.address
  session.isLoggedIn = true
  await session.save()
}

export async function destroyCustomerSession() {
  const session = await getCustomerSession()
  session.destroy()
}

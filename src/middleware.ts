import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getIronSession } from "iron-session"
import type { AdminSessionData } from "@/lib/session"

const CARGO_ADMIN_ALLOWED_ROUTES = [
  "/admin/home",
  "/admin/orders",
  "/admin/cargo-settings",
  "/admin/guide",
  "/admin/print",
]

const DATAADMIN_ALLOWED_ROUTES = [
  "/admin/home",
  "/admin/data-center",
  "/admin/activity",
  "/admin/users",
  "/admin/settings",
]

// We can't import from src/lib directly in middleware (edge runtime), so inline constants
const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET!,
  cookieName: "anar-admin-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 60 * 8, // 8 hours
  },
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const protocol = request.headers.get("x-forwarded-proto") || "https"

  // Skip API routes and statics (for /admin protection)
  if (
    pathname.startsWith("/api/admin/login") ||
    pathname.startsWith("/api/admin/logout") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/qpay") ||
    pathname.startsWith("/api/notifications") ||
    pathname.startsWith("/api/upload")
  ) {
    return NextResponse.next()
  }

  // Only protect /admin routes for session check
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next()
  }

  // Check session
  const response = NextResponse.next()
  const session = await getIronSession<AdminSessionData>(request, response, SESSION_OPTIONS)

  if (pathname === "/admin/login") {
    if (session.isLoggedIn && session.userId) {
      return NextResponse.redirect(new URL("/admin/orders", request.url))
    }
    return response
  }

  if (!session.isLoggedIn || !session.userId) {
    const loginUrl = new URL("/admin/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Check role-based access for CARGO_ADMIN
  if (session.role === "CARGO_ADMIN") {
    const isAllowed = CARGO_ADMIN_ALLOWED_ROUTES.some(r => pathname.startsWith(r))
    if (!isAllowed) {
      const fallback = new URL("/admin/orders", request.url)
      return NextResponse.redirect(fallback)
    }
  }

  // Check role-based access for DATAADMIN
  if (session.role === "DATAADMIN") {
    const isAllowed = DATAADMIN_ALLOWED_ROUTES.some(r => pathname.startsWith(r))
    if (!isAllowed) {
      const fallback = new URL("/admin/data-center", request.url)
      return NextResponse.redirect(fallback)
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/|api/notifications).*)"],
}

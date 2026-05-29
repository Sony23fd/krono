import { db } from "@/lib/db"
import { UsersClient } from "./UsersClient"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function UsersPage() {
  const session = await getSession()
  if (!session.isLoggedIn || (session.role !== "ADMIN" && session.role !== "DATAADMIN")) {
    redirect("/admin/login")
  }

  const allowedRoles = session.role === "DATAADMIN" 
    ? ["ADMIN", "CARGO_ADMIN", "DATAADMIN"] 
    : ["ADMIN", "CARGO_ADMIN"];

  const users = await db.user.findMany({
    where: {
      role: { in: allowedRoles as any }
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" }
  })

  // Format dates for client
  const serializedUsers = users.map(u => ({
    ...u,
    createdAt: u.createdAt.toISOString()
  }))

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Хэрэглэгчид</h1>
          <p className="text-slate-500 mt-1">
            Админ болон Карго админ хэрэглэгчдийг удирдах хэсэг.
          </p>
        </div>
      </div>
      
      <UsersClient initialUsers={serializedUsers} />
    </div>
  )
}

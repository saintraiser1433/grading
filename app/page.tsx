import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  // Redirect to role-specific dashboard
  switch (session.user.role) {
    case "ADMIN":
      redirect("/admin")
    case "TEACHER":
      redirect("/teacher")
    case "STUDENT":
      redirect("/student")
    default:
      redirect("/auth/login")
  }
}

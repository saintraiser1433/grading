import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getDepartments } from "@/lib/actions/department.actions"
import { DepartmentsPageClient } from "@/components/admin/departments-page-client"

export default async function DepartmentsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const departmentsResult = await getDepartments()
  const departments = departmentsResult.success ? departmentsResult.data : []

  return <DepartmentsPageClient departments={departments} />
}



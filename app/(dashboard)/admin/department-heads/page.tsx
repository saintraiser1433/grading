import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getDepartmentHeads } from "@/lib/actions/departmenthead.actions"
import { DepartmentHeadsPageClient } from "@/components/admin/department-heads-page-client"

export default async function DepartmentHeadsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const departmentHeadsResult = await getDepartmentHeads()
  const departmentHeads = departmentHeadsResult.success ? departmentHeadsResult.data : []

  return <DepartmentHeadsPageClient departmentHeads={departmentHeads} />
}



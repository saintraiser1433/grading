import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getSchoolYears } from "@/lib/actions/schoolyear.actions"
import { SchoolYearsPageClient } from "@/components/admin/school-years-page-client"

export default async function SchoolYearsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const schoolYearsResult = await getSchoolYears()
  const schoolYears = schoolYearsResult.success ? schoolYearsResult.data : []

  return <SchoolYearsPageClient schoolYears={schoolYears} />
}


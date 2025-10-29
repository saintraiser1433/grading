import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getSubjects } from "@/lib/actions/subject.actions"
import { getSchoolYears } from "@/lib/actions/schoolyear.actions"
import { SubjectsPageClient } from "@/components/admin/subjects-page-client"

export default async function SubjectsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const subjectsResult = await getSubjects()
  const subjects = subjectsResult.success ? subjectsResult.data : []

  const schoolYearsResult = await getSchoolYears()
  const schoolYears = schoolYearsResult.success ? schoolYearsResult.data : []

  return <SubjectsPageClient subjects={subjects} schoolYears={schoolYears} />
}


import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getUsers } from "@/lib/actions/user.actions"
import { getSubjectsWithAssignments } from "@/lib/actions/subject.actions"
import { getSchoolYears } from "@/lib/actions/schoolyear.actions"
import { getActiveDepartmentHeads } from "@/lib/actions/departmenthead.actions"
import { getDepartments } from "@/lib/actions/department.actions"
import { FacultyPageClient } from "@/components/admin/faculty-page-client"

export default async function FacultyPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const [teachersResult, subjectsResult, schoolYearsResult, departmentHeadsResult, departmentsResult] = await Promise.all([
    getUsers("TEACHER"),
    getSubjectsWithAssignments(),
    getSchoolYears(),
    getActiveDepartmentHeads(),
    getDepartments(),
  ])

  const teachers = teachersResult.success ? teachersResult.data : []
  const subjects = subjectsResult.success ? subjectsResult.data : []
  const schoolYears = schoolYearsResult.success ? schoolYearsResult.data : []
  const departmentHeads = departmentHeadsResult.success ? departmentHeadsResult.data : []
  const departments = departmentsResult.success ? departmentsResult.data : []

  return (
    <FacultyPageClient 
      teachers={teachers}
      subjects={subjects}
      schoolYears={schoolYears}
      departmentHeads={departmentHeads}
      departments={departments}
    />
  )
}


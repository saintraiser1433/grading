import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getSubjectsAssignedToTeacherManyToMany } from "@/lib/actions/subject.actions"
import { getSchoolYears } from "@/lib/actions/schoolyear.actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClassForm } from "@/components/teacher/class-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function NewClassPage({
  searchParams,
}: {
  searchParams: { subjectId?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "TEACHER") {
    redirect("/dashboard")
  }

  const [subjectsResult, schoolYearsResult] = await Promise.all([
    getSubjectsAssignedToTeacherManyToMany(session.user.id),
    getSchoolYears(),
  ])

  const subjects = subjectsResult.success ? subjectsResult.data || [] : []
  const schoolYears = schoolYearsResult.success ? schoolYearsResult.data || [] : []

  // Filter to only show active school year
  const activeSchoolYear = schoolYears.find((sy) => sy.isActive)
  const activeSchoolYears = activeSchoolYear ? [activeSchoolYear] : schoolYears

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/teacher/classes">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Class</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create a new class for one of your assigned subjects
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class Information</CardTitle>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                You don't have any assigned subjects yet. Contact your administrator to get assigned to subjects first.
              </p>
            </div>
          ) : (
            <ClassForm 
              subjects={subjects} 
              schoolYears={activeSchoolYears}
              teacherId={session.user.id}
              initialSubjectId={searchParams.subjectId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}




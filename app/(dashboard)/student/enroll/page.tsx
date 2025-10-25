import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getOpenSubjects } from "@/lib/actions/subject.actions"
import { getStudentEnrollments } from "@/lib/actions/enrollment.actions"
import { getActiveSchoolYear } from "@/lib/actions/schoolyear.actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EnrollmentForm } from "@/components/student/enrollment-form"

export default async function EnrollPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "STUDENT") {
    redirect("/dashboard")
  }

  const [subjectsResult, activeSchoolYearResult, enrollmentsResult] = await Promise.all([
    getOpenSubjects(),
    getActiveSchoolYear(),
    getStudentEnrollments(session.user.id),
  ])

  const subjects = subjectsResult.success ? subjectsResult.data : []
  const activeSchoolYear = activeSchoolYearResult.success ? activeSchoolYearResult.data : null
  const enrollments = enrollmentsResult.success ? enrollmentsResult.data : []

  // Filter out already enrolled subjects
  const enrolledSubjectIds = new Set(enrollments.map((e) => e.subjectId))
  const availableSubjects = subjects.filter((s) => !enrolledSubjectIds.has(s.id))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Enroll in Subjects</h1>
        <p className="text-gray-500 mt-1">
          Select subjects to enroll in for the current semester
        </p>
      </div>

      {!activeSchoolYear ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">No active school year found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Enrolling for</p>
                <p className="text-xl font-bold">
                  {activeSchoolYear.year} - {activeSchoolYear.semester} Semester
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              {availableSubjects.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    No subjects available for enrollment at this time
                  </p>
                </div>
              ) : (
                <EnrollmentForm
                  subjects={availableSubjects}
                  studentId={session.user.id}
                  schoolYearId={activeSchoolYear.id}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}


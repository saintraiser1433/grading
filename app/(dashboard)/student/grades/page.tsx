import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getStudentEnrollments } from "@/lib/actions/enrollment.actions"
import { getSchoolYears } from "@/lib/actions/schoolyear.actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GradesTable } from "@/components/student/grades-table"

export default async function StudentGradesPage({
  searchParams,
}: {
  searchParams: { sy?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "STUDENT") {
    redirect("/dashboard")
  }

  const [enrollmentsResult, schoolYearsResult] = await Promise.all([
    getStudentEnrollments(session.user.id, searchParams.sy),
    getSchoolYears(),
  ])

  const enrollments = enrollmentsResult.success ? enrollmentsResult.data : []
  const schoolYears = schoolYearsResult.success ? schoolYearsResult.data : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Grades</h1>
          <p className="text-gray-500 mt-1">
            View your grades per subject and school year
          </p>
        </div>
      </div>

      {schoolYears.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Filter by School Year</CardTitle>
          </CardHeader>
          <CardContent>
            <form action="/student/grades" method="get">
              <Select name="sy" defaultValue={searchParams.sy || ""}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="All school years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All school years</SelectItem>
                  {schoolYears.map((sy) => (
                    <SelectItem key={sy.id} value={sy.id}>
                      {sy.year} - {sy.semester} Semester
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Grades Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <GradesTable enrollments={enrollments} />
        </CardContent>
      </Card>
    </div>
  )
}


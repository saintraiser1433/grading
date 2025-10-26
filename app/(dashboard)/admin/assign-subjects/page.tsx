import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getUsers } from "@/lib/actions/user.actions"
import { getSubjects } from "@/lib/actions/subject.actions"
import { getSchoolYears } from "@/lib/actions/schoolyear.actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, UserPlus } from "lucide-react"
import Link from "next/link"
import { TeacherSubjectAssignments } from "@/components/admin/teacher-subject-assignments"

export default async function AssignSubjectsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const [teachersResult, subjectsResult, schoolYearsResult] = await Promise.all([
    getUsers("TEACHER"),
    getSubjects(),
    getSchoolYears()
  ])

  const teachers = teachersResult.success ? teachersResult.data : []
  const subjects = subjectsResult.success ? subjectsResult.data : []
  const schoolYears = schoolYearsResult.success ? schoolYearsResult.data : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assign Subjects to Teachers</h1>
          <p className="text-gray-500 mt-1">
            Manage teacher-subject assignments and class assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/subjects">
            <Button variant="outline">
              <BookOpen className="mr-2 h-4 w-4" />
              Manage Subjects
            </Button>
          </Link>
          <Link href="/admin/faculty">
            <Button variant="outline">
              <UserPlus className="mr-2 h-4 w-4" />
              Manage Faculty
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teacher-Subject Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <TeacherSubjectAssignments 
            teachers={teachers} 
            subjects={subjects} 
            schoolYears={schoolYears} 
          />
        </CardContent>
      </Card>
    </div>
  )
}

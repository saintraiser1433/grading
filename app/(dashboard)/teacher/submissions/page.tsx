import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getGradeSubmissions } from "@/lib/actions/grade.actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TeacherSubmissionsTable } from "@/components/teacher/submissions-table"

export default async function TeacherSubmissionsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "TEACHER") {
    redirect("/dashboard")
  }

  const submissionsResult = await getGradeSubmissions(session.user.id)
  const submissions = submissionsResult.success ? submissionsResult.data : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Grade Submissions</h1>
        <p className="text-gray-500 mt-1">
          View the status of your submitted grades
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submission History</CardTitle>
        </CardHeader>
        <CardContent>
          <TeacherSubmissionsTable submissions={submissions} />
        </CardContent>
      </Card>
    </div>
  )
}


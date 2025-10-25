import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getGradeSubmissions } from "@/lib/actions/grade.actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SubmissionsTable } from "@/components/admin/submissions-table"

export default async function SubmissionsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const submissionsResult = await getGradeSubmissions()
  const submissions = submissionsResult.success ? submissionsResult.data : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Grade Submissions</h1>
        <p className="text-gray-500 mt-1">
          Review and approve faculty grade submissions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <SubmissionsTable submissions={submissions} adminId={session.user.id} />
        </CardContent>
      </Card>
    </div>
  )
}


import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getPendingGradeSubmissions } from "@/lib/actions/grade.actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Clock, FileText, User, Calendar } from "lucide-react"
import Link from "next/link"
import { AdminEmptyState } from "@/components/ui/admin-empty-state"

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic'

export default async function AdminSubmissionsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const submissionsResult = await getPendingGradeSubmissions()
  const submissions = submissionsResult.success ? submissionsResult.data || [] : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Grade Submissions</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Review and approve pending grade submissions from teachers
        </p>
      </div>

      {submissions.length > 0 ? (
        <div className="grid gap-4">
          {submissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {submission.class.subject.code} - {submission.class.subject.name}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{submission.class.teacher.firstName} {submission.class.teacher.lastName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{submission.schoolYear.year} - {submission.schoolYear.semester}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{submission.gradeType?.name || 'Unknown Grade Type'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      PENDING
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Class:</span> {submission.class.name} - {submission.class.section}
                    </div>
                    <div>
                      <span className="font-medium">Units:</span> {submission.class.subject.units}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <Button size="sm" asChild>
                      <Link href={`/admin/submissions/${submission.id}`}>
                        <FileText className="mr-2 h-4 w-4" />
                        Review Grades
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/submissions/${submission.id}/approve`}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/submissions/${submission.id}/decline`}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Decline
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <AdminEmptyState
          iconName="FileText"
          title="No Pending Submissions"
          description="There are no pending grade submissions to review at this time."
        />
      )}
    </div>
  )
}
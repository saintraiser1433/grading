import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { approveGradeSubmission } from "@/lib/actions/grade.actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, ArrowLeft, FileText, User, Calendar } from "lucide-react"
import Link from "next/link"
import { ApproveSubmissionForm } from "@/components/admin/approve-submission-form"

interface ApprovePageProps {
  params: { id: string }
}

export default async function ApproveSubmissionPage({ params }: ApprovePageProps) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const submission = await prisma.gradeSubmission.findUnique({
    where: { id: params.id },
    include: {
      class: {
        include: {
          subject: true,
          teacher: true,
        },
      },
      gradeType: true,
      schoolYear: true,
    },
  })

  if (!submission) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">Submission Not Found</h1>
          <p className="text-gray-500 mt-2">The requested grade submission could not be found.</p>
          <Button asChild className="mt-4">
            <Link href="/admin/submissions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Submissions
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (submission.status !== "PENDING") {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">Submission Already Processed</h1>
          <p className="text-gray-500 mt-2">
            This submission has already been {submission.status.toLowerCase()}.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/submissions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Submissions
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Approve Grade Submission</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Review and approve this grade submission
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/admin/submissions/${submission.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Review
          </Link>
        </Button>
      </div>

      {/* Submission Info */}
      <Card>
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
            <Badge variant="outline" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              PENDING APPROVAL
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Class:</span> {submission.class.name} - {submission.class.section}
            </div>
            <div>
              <span className="font-medium">Units:</span> {submission.class.subject.units}
            </div>
            <div>
              <span className="font-medium">Submitted:</span> {new Date(submission.submittedAt).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval Form */}
      <ApproveSubmissionForm 
        submissionId={submission.id}
        approverId={session.user.id}
        submission={submission}
      />
    </div>
  )
}


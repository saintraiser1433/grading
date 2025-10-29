import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Clock, FileText, User, Calendar, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { EnhancedGradesSheet } from "@/components/teacher/enhanced-grades-sheet"

interface SubmissionPageProps {
  params: { id: string }
}

export default async function SubmissionReviewPage({ params }: SubmissionPageProps) {
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

  // Get enrollments for this class
  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId: submission.classId,
      status: "APPROVED"
    },
    include: {
      student: true,
      grades: {
        where: {
          gradeTypeId: submission.gradeTypeId
        },
        include: {
          gradeType: true
        }
      }
    }
  })

  // Get grading criteria for this class and grade type
  const criteria = await prisma.globalGradingCriteria.findMany({
    where: {
      gradeTypeId: submission.gradeTypeId,
      isActive: true
    },
    orderBy: { order: "asc" }
  })

  // Construct proper classData object with schoolYear included
  const classData = {
    ...submission.class,
    schoolYear: submission.schoolYear
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Review Grade Submission</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Review grades before approving or declining
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/submissions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Submissions
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
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Class:</span> {submission.class.name} - {submission.class.section}
            </div>
            <div>
              <span className="font-medium">Units:</span> {submission.class.subject.units}
            </div>
            <div>
              <span className="font-medium">Students:</span> {enrollments.length}
            </div>
            <div>
              <span className="font-medium">Submitted:</span> {new Date(submission.submittedAt).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grades Sheet */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Sheet - {submission.gradeType?.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <EnhancedGradesSheet
            classId={submission.classId}
            isMidterm={false}
            enrollments={enrollments}
            criteria={criteria}
            classData={classData}
            gradeType={submission.gradeType}
            allGradeTypes={[submission.gradeType].filter(Boolean)}
            isReadOnly={true}
            showApprovalButtons={false}
            submissionId={submission.id}
            adminId={session.user.id}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <Button asChild>
          <Link href={`/admin/submissions/${submission.id}/approve`}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Approve Submission
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/admin/submissions/${submission.id}/decline`}>
            <XCircle className="mr-2 h-4 w-4" />
            Decline Submission
          </Link>
        </Button>
      </div>
    </div>
  )
}

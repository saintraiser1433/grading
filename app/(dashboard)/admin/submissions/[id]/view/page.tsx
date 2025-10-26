import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { EnhancedGradesSheet } from "@/components/teacher/enhanced-grades-sheet"

interface ViewSubmissionPageProps {
  params: {
    id: string
  }
}

export default async function ViewSubmissionPage({ params }: ViewSubmissionPageProps) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Get the grade submission with all related data
  const submission = await prisma.gradeSubmission.findUnique({
    where: { id: params.id },
    include: {
      class: {
        include: {
          subject: true,
          schoolYear: true,
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      },
      teacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      schoolYear: true,
      gradeType: true,
      approver: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      }
    }
  })

  if (!submission) {
    redirect("/admin/submissions")
  }

  // Get enrollments for this class
  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId: submission.classId
    },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          studentId: true
        }
      }
    },
    orderBy: {
      student: {
        lastName: 'asc'
      }
    }
  })

  // Get global criteria for this grade type
  const globalCriteria = await prisma.globalGradingCriteria.findMany({
    where: {
      gradeTypeId: submission.gradeTypeId,
      isActive: true
    },
    include: {
      componentDefinitions: {
        where: { isActive: true },
        orderBy: { order: 'asc' }
      }
    },
    orderBy: { order: 'asc' }
  })

  // Get all grade types for the dropdown
  const allGradeTypes = await prisma.gradeType.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' }
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case "APPROVED":
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
      case "DECLINED":
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Declined</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/submissions">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Submissions
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Grade Submission Review</h1>
            <p className="text-gray-500 mt-1">
              Review submitted grades for {submission.class.subject.name}
            </p>
          </div>
        </div>
        {getStatusBadge(submission.status)}
      </div>

      {/* Submission Details */}
      <Card>
        <CardHeader>
          <CardTitle>Submission Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Subject</label>
              <p className="text-lg font-semibold">{submission.class.subject.name}</p>
              <p className="text-sm text-gray-600">{submission.class.subject.code}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Teacher</label>
              <p className="text-lg font-semibold">{submission.teacher.firstName} {submission.teacher.lastName}</p>
              <p className="text-sm text-gray-600">{submission.teacher.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Grade Type</label>
              <p className="text-lg font-semibold">{submission.gradeType?.name || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Class</label>
              <p className="text-lg font-semibold">{submission.class.name}</p>
              <p className="text-sm text-gray-600">Section {submission.class.section}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">School Year</label>
              <p className="text-lg font-semibold">{submission.schoolYear.year}</p>
              <p className="text-sm text-gray-600">{submission.schoolYear.semester} Semester</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Submitted At</label>
              <p className="text-lg font-semibold">{format(new Date(submission.submittedAt), 'MMM dd, yyyy')}</p>
              <p className="text-sm text-gray-600">{format(new Date(submission.submittedAt), 'h:mm a')}</p>
            </div>
          </div>
          
          {submission.comments && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-500">Comments</label>
              <p className="text-sm bg-gray-50 p-3 rounded-md mt-1">{submission.comments}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grade Sheet - Same as Teacher View */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Sheet - {submission.gradeType?.name?.toUpperCase() || 'GRADES'}</CardTitle>
          <p className="text-sm text-gray-600">
            This is the exact same view that teachers see when entering grades
          </p>
        </CardHeader>
        <CardContent>
          <EnhancedGradesSheet
            classId={submission.classId}
            isMidterm={submission.gradeType?.name?.toLowerCase() === 'midterm'}
            enrollments={enrollments}
            criteria={globalCriteria}
            classData={submission.class}
            gradeType={submission.gradeType}
            allGradeTypes={allGradeTypes}
            isReadOnly={true}
            submissionId={submission.id}
            adminId={session.user.id}
          />
        </CardContent>
      </Card>
    </div>
  )
}

import { getServerSession } from "next-auth"
import { redirect, notFound } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getClassById } from "@/lib/actions/class.actions"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Users, ClipboardList } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ClassStudents } from "@/components/teacher/class-students"
import { EnhancedGradesSheet } from "@/components/teacher/enhanced-grades-sheet"

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic'

export default async function ClassDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "TEACHER") {
    redirect("/dashboard")
  }

  const classResult = await getClassById(params.id)

  if (!classResult.success || !classResult.data) {
    notFound()
  }

  const classData = classResult.data

  // Check if teacher owns this class
  if (classData.teacherId !== session.user.id) {
    redirect("/teacher/classes")
  }

  // Fetch grading types, global criteria, and submission statuses
  const [gradeTypes, globalCriteria, submissions] = await Promise.all([
    prisma.gradeType.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    }),
    prisma.globalGradingCriteria.findMany({
      where: { isActive: true },
      include: {
        gradeType: true,
        componentDefinitions: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: [
        { gradeType: { order: "asc" } },
        { order: "asc" }
      ],
    }),
    prisma.gradeSubmission.findMany({
      where: {
        classId: classData.id,
        teacherId: session.user.id,
        schoolYearId: classData.schoolYearId,
      },
      select: {
        gradeTypeId: true,
        status: true,
        id: true,
      },
    }),
  ])

  // Create a map of gradeTypeId to submission status
  const submissionStatusMap = new Map()
  submissions.forEach(submission => {
    submissionStatusMap.set(submission.gradeTypeId, {
      status: submission.status,
      id: submission.id
    })
  })

  // Debug logging
  console.log("=== CLASS DETAIL PAGE DEBUG ===")
  console.log("Class ID:", params.id)
  console.log("Raw submissions from DB:", submissions)
  console.log("Submission status map:", Array.from(submissionStatusMap.entries()))
  console.log("Grade types:", gradeTypes.map(gt => ({ id: gt.id, name: gt.name })))
  console.log("=== END DEBUG ===")

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/teacher/classes">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            {classData.subject.code} - {classData.subject.name}
          </h1>
          <p className="text-gray-500 mt-1">
            {classData.name} • Section {classData.section}
            {classData.isIrregular && " • Irregular"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">
            <Users className="mr-2 h-4 w-4" />
            Students
          </TabsTrigger>
          {gradeTypes.map((gradeType) => (
            <TabsTrigger key={gradeType.id} value={gradeType.id}>
              <ClipboardList className="mr-2 h-4 w-4" />
              {gradeType.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Students</CardTitle>
            </CardHeader>
            <CardContent>
              <ClassStudents 
                classId={params.id}
                enrollments={classData.enrollments}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {gradeTypes.map((gradeType) => {
          // Convert new schema to old schema format for compatibility
          const isMidterm = gradeType.name.toLowerCase() === 'midterm'
          
          // Use global criteria filtered by grade type
          const typeCriteria = globalCriteria.filter(c => c.gradeTypeId === gradeType.id)
          
          // Convert GlobalGradingCriteria to old GradingCriteria format
          const formattedCriteria = typeCriteria.map(criteria => ({
            id: criteria.id,
            name: criteria.name,
            percentage: criteria.percentage,
            classId: classData.id,
            isMidterm: isMidterm,
            order: criteria.order,
            createdAt: criteria.createdAt,
            updatedAt: criteria.updatedAt
          }))

          // Get submission status for this grade type
          const submissionInfo = submissionStatusMap.get(gradeType.id)
          const submissionStatus = submissionInfo?.status || null
          const submissionId = submissionInfo?.id || undefined

          return (
            <TabsContent key={gradeType.id} value={gradeType.id}>
              <EnhancedGradesSheet
                classId={classData.id}
                isMidterm={isMidterm}
                enrollments={classData.enrollments}
                criteria={formattedCriteria}
                classData={classData}
                gradeType={gradeType}
                allGradeTypes={gradeTypes}
                submissionStatus={submissionStatus}
                submissionId={submissionId}
                allSubmissionStatuses={submissionStatusMap}
                showApprovalButtons={false}
              />
            </TabsContent>
          )
        })}

      </Tabs>
    </div>
  )
}


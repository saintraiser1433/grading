import { getServerSession } from "next-auth"
import { redirect, notFound } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getClassById } from "@/lib/actions/class.actions"
import { getGradingCriteria } from "@/lib/actions/grade.actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Users, Settings, ClipboardList } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ClassStudents } from "@/components/teacher/class-students"
import { EnhancedGradingCriteriaManager } from "@/components/teacher/enhanced-grading-criteria-manager"
import { EnhancedGradesSheet } from "@/components/teacher/enhanced-grades-sheet"

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

  const criteriaResult = await getGradingCriteria(params.id)
  const criteria = criteriaResult.success ? criteriaResult.data : []

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
          <TabsTrigger value="criteria">
            <Settings className="mr-2 h-4 w-4" />
            Grading Criteria
          </TabsTrigger>
          <TabsTrigger value="midterm">
            <ClipboardList className="mr-2 h-4 w-4" />
            Midterm Grades
          </TabsTrigger>
          <TabsTrigger value="final">
            <ClipboardList className="mr-2 h-4 w-4" />
            Final Grades
          </TabsTrigger>
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

        <TabsContent value="criteria">
          <Card>
            <CardHeader>
              <CardTitle>Grading Criteria</CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedGradingCriteriaManager 
                classId={params.id}
                criteria={criteria}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="midterm">
          <EnhancedGradesSheet 
            classId={params.id}
            isMidterm={true}
            enrollments={classData.enrollments}
            criteria={criteria.filter(c => c.isMidterm)}
            classData={classData}
          />
        </TabsContent>

        <TabsContent value="final">
          <EnhancedGradesSheet 
            classId={params.id}
            isMidterm={false}
            enrollments={classData.enrollments}
            criteria={criteria.filter(c => !c.isMidterm)}
            classData={classData}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}


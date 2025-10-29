import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getOpenSubjects } from "@/lib/actions/subject.actions"
import { getStudentEnrollments } from "@/lib/actions/enrollment.actions"
import { getActiveSchoolYear } from "@/lib/actions/schoolyear.actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { BookOpen, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { EnrollmentForm } from "@/components/student/enrollment-form"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function EnrollPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "STUDENT") {
    redirect("/dashboard")
  }

  const [subjectsResult, activeSchoolYearResult, enrollmentsResult] = await Promise.all([
    getOpenSubjects(),
    getActiveSchoolYear(),
    getStudentEnrollments(session.user.id),
  ])

  const subjects = subjectsResult.success ? subjectsResult.data : []
  const activeSchoolYear = activeSchoolYearResult.success ? activeSchoolYearResult.data : null
  const enrollments = enrollmentsResult.success ? enrollmentsResult.data : []

  // Filter subjects by enrollment status
  const enrolledSubjectIds = new Set(enrollments.map((e) => e.subjectId))
  const currentEnrollments = enrollments.filter(
    (e) => e.schoolYearId === activeSchoolYear?.id
  )
  const availableSubjects = subjects.filter((s) => !enrolledSubjectIds.has(s.id))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subject Enrollment</h1>
        <p className="text-gray-500 mt-1">
          Manage your current subjects and enroll in new ones
        </p>
      </div>

      {!activeSchoolYear ? (
        <EmptyState
          icon={Calendar}
          title="No Active School Year"
          description="There is no active school year set. Please contact your administrator to set up the current academic period."
        />
      ) : (
        <>
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Enrolling for</p>
                <p className="text-xl font-bold">
                  {activeSchoolYear.year} - {activeSchoolYear.semester} Semester
                </p>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="current" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Current Subjects ({currentEnrollments.length})
              </TabsTrigger>
              <TabsTrigger value="available" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Available Subjects ({availableSubjects.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current">
              <Card>
                <CardHeader>
                  <CardTitle>My Current Subjects</CardTitle>
                  <CardDescription>
                    Subjects you are currently enrolled in for this semester
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentEnrollments.length === 0 ? (
                    <EmptyState
                      icon={BookOpen}
                      title="No Current Enrollments"
                      description="You haven't enrolled in any subjects yet. Browse available subjects to get started."
                    />
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {currentEnrollments.map((enrollment) => (
                        <div
                          key={enrollment.id}
                          className="rounded-lg border p-4 hover:border-primary transition-colors"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="rounded-full bg-primary/10 p-2">
                                <BookOpen className="h-5 w-5 text-primary" />
                              </div>
                              <Badge 
                                variant="outline"
                                className={`text-xs ${
                                  enrollment.status === "APPROVED" 
                                    ? "text-green-600 border-green-600" 
                                    : enrollment.status === "PENDING"
                                    ? "text-yellow-600 border-yellow-600"
                                    : "text-red-600 border-red-600"
                                }`}
                              >
                                {enrollment.status === "APPROVED" ? "Approved" : 
                                 enrollment.status === "PENDING" ? "Pending" : 
                                 "Rejected"}
                              </Badge>
                            </div>
                            
                            <div>
                              <h3 className="font-semibold text-base">
                                {enrollment.subject.code}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {enrollment.subject.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {enrollment.subject.units} units
                              </p>
                            </div>

                            {enrollment.status === "PENDING" && (
                              <div className="flex items-center gap-2 text-xs text-yellow-600">
                                <Clock className="h-3 w-3" />
                                Awaiting teacher approval
                              </div>
                            )}

                            {enrollment.status === "REJECTED" && (
                              <div className="flex items-center gap-2 text-xs text-red-600">
                                <AlertCircle className="h-3 w-3" />
                                Enrollment rejected
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="available">
              <Card>
                <CardHeader>
                  <CardTitle>Available Subjects</CardTitle>
                  <CardDescription>
                    Subjects you can enroll in for this semester
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {availableSubjects.length === 0 ? (
                    <EmptyState
                      icon={BookOpen}
                      title="No Subjects Available"
                      description="You are already enrolled in all available subjects for this semester. Check back later for new subjects."
                    />
                  ) : (
                    <EnrollmentForm
                      subjects={availableSubjects}
                      studentId={session.user.id}
                      schoolYearId={activeSchoolYear.id}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}


import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { BookOpen, GraduationCap, Calendar, TrendingUp, Award, Plus, Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "STUDENT") {
    redirect("/dashboard")
  }

  // Fetch student data
  const [enrollments, activeSchoolYear] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId: session.user.id },
      include: {
        subject: true,
        class: {
          include: {
            teacher: true,
          },
        },
        schoolYear: true,
        grades: true,
      },
      orderBy: { enrolledAt: "desc" },
    }),
    prisma.schoolYear.findFirst({
      where: { isActive: true },
    }),
  ])

  const currentEnrollments = enrollments.filter(
    (e) => e.schoolYearId === activeSchoolYear?.id
  )
  
  const approvedEnrollments = currentEnrollments.filter(
    (e) => e.status === "APPROVED"
  )

  // Calculate grade stats
  const gradesWithScores = approvedEnrollments.filter(
    (e) => e.grades.length > 0 && e.grades.some((g) => g.overallGrade !== null)
  )
  const passedSubjects = gradesWithScores.filter(
    (e) => e.grades.some((g) => g.overallGrade && g.overallGrade >= 75)
  ).length
  const avgGrade = gradesWithScores.length > 0
    ? gradesWithScores.reduce((sum, e) => {
        const grade = e.grades.find((g) => g.overallGrade)
        return sum + (grade?.overallGrade || 0)
      }, 0) / gradesWithScores.length
    : 0

  const stats = [
    {
      title: "Approved Enrollments",
      value: approvedEnrollments.length.toString(),
      change: "+15.3%",
      trend: "up",
      icon: BookOpen,
      description: "This semester",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Average Grade",
      value: avgGrade > 0 ? avgGrade.toFixed(1) : "—",
      change: avgGrade >= 75 ? "+5.2%" : "—",
      trend: "up",
      icon: Award,
      description: gradesWithScores.length > 0 ? "From graded subjects" : "No grades yet",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Passed Subjects",
      value: passedSubjects.toString(),
      change: gradesWithScores.length > 0 ? `${Math.round((passedSubjects / gradesWithScores.length) * 100)}%` : "—",
      trend: "up",
      icon: GraduationCap,
      description: gradesWithScores.length > 0 ? "Success rate" : "Not graded yet",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      title: "Total Subjects",
      value: enrollments.length.toString(),
      change: "+23.1%",
      trend: "up",
      icon: BookOpen,
      description: "All time",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your academic progress and grades
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeSchoolYear && (
            <div className="hidden md:flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Active Semester</p>
                <p className="text-sm font-semibold">
                  {activeSchoolYear.year} • {activeSchoolYear.semester}
                </p>
              </div>
            </div>
          )}
          <Link href="/student/enroll">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Enroll Subject
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {stat.change !== "—" && stat.trend === "up" && (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                )}
                <span className={stat.change !== "—" && stat.trend === "up" ? "text-green-600" : ""}>
                  {stat.change}
                </span>
                <span className="ml-1">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current Enrollments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Enrollments</CardTitle>
              <CardDescription className="mt-1">
                Your subjects for this semester
              </CardDescription>
            </div>
            {currentEnrollments.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {approvedEnrollments.length} Approved • {currentEnrollments.length} Total
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {currentEnrollments.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No Enrollments Yet"
              description="You haven't enrolled in any subjects yet. Browse available subjects to start your academic journey."
              action={
                <Link href="/student/enroll">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Enroll Now
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {currentEnrollments.map((enrollment) => {
                const grade = enrollment.grades.find((g) => g.overallGrade !== null)
                // Get all grade types dynamically
                const gradeTypes = [...new Set(enrollment.grades.map(g => g.gradeType?.name).filter(Boolean))]
                const hasGrades = gradeTypes.map(gradeTypeName => ({
                  name: gradeTypeName,
                  hasGrade: enrollment.grades.some((g) => g.gradeType?.name === gradeTypeName && g.grade !== null)
                }))
                
                return (
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
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {enrollment.subject.name}
                        </p>
                      </div>

                      {enrollment.class && (
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-3 w-3" />
                            {enrollment.class.name} - {enrollment.class.section}
                          </div>
                          {enrollment.class.teacher && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              {enrollment.class.teacher.firstName} {enrollment.class.teacher.lastName}
                            </div>
                          )}
                        </div>
                      )}

                      {grade?.overallGrade ? (
                        <div className="pt-3 border-t space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">Overall Grade</span>
                            <span className="text-lg font-bold">
                              {grade.overallGrade.toFixed(1)}
                            </span>
                          </div>
                          <Progress 
                            value={grade.overallGrade} 
                            className="h-2"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            {hasGrades.map((gradeInfo, index) => (
                              <span key={index}>
                                {gradeInfo.name}: {gradeInfo.hasGrade ? "✓" : "—"}
                              </span>
                            ))}
                            {hasGrades.length === 0 && (
                              <span>No grade types available</span>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



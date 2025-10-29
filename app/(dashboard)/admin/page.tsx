import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, Calendar, FileCheck, TrendingUp, TrendingDown, GraduationCap, Clock, Percent, UserPlus, Building2, Settings } from "lucide-react"
import { AdminCharts } from "@/components/admin/admin-charts"
import { RecentActivities } from "@/components/admin/recent-activities"

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Fetch comprehensive statistics
  const [
    totalTeachers,
    totalStudents,
    totalSubjects,
    openSubjects,
    totalClasses,
    totalEnrollments,
    activeSchoolYear,
    pendingSubmissions,
    approvedSubmissions,
    declinedSubmissions,
    recentSubmissions,
    enrollmentsByMonth,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.subject.count(),
    prisma.subject.count({ where: { isOpen: true } }),
    prisma.class.count(),
    prisma.enrollment.count(),
    prisma.schoolYear.findFirst({ where: { isActive: true } }),
    prisma.gradeSubmission.count({ where: { status: "PENDING" } }),
    prisma.gradeSubmission.count({ where: { status: "APPROVED" } }),
    prisma.gradeSubmission.count({ where: { status: "DECLINED" } }),
    prisma.gradeSubmission.findMany({
      take: 10,
      orderBy: { submittedAt: "desc" },
      include: {
        class: {
          include: {
            subject: true,
          },
        },
        teacher: true,
      },
    }),
    prisma.$queryRaw`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "enrolledAt"), 'Mon') as month,
        COUNT(*)::int as count
      FROM "Enrollment"
      WHERE "enrolledAt" >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', "enrolledAt")
      ORDER BY DATE_TRUNC('month', "enrolledAt")
    ` as Promise<Array<{ month: string; count: number }>>,
  ])

  // Calculate trends (mock data - in production, compare with previous period)
  const teacherTrend = 12.5
  const studentTrend = 23.1
  const submissionTrend = -2.1
  const enrollmentTrend = 15.3

  const stats = [
    {
      title: "Total Students",
      value: totalStudents.toLocaleString(),
      change: `+${studentTrend}%`,
      trend: "up" as const,
      icon: GraduationCap,
      description: "Active students",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Enrollments",
      value: totalEnrollments.toLocaleString(),
      change: `+${enrollmentTrend}%`,
      trend: "up" as const,
      icon: BookOpen,
      description: "This semester",
      color: "text-green-600",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Pending Reviews",
      value: pendingSubmissions.toString(),
      change: submissionTrend > 0 ? `+${submissionTrend}%` : `${submissionTrend}%`,
      trend: submissionTrend > 0 ? "up" as const : "down" as const,
      icon: FileCheck,
      description: "Grade submissions",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      title: "Faculty Members",
      value: totalTeachers.toString(),
      change: `+${teacherTrend}%`,
      trend: "up" as const,
      icon: Users,
      description: "Active teachers",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your grading system
          </p>
        </div>
        {activeSchoolYear && (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Active School Year</p>
              <p className="text-sm font-semibold">
                {activeSchoolYear.year} • {activeSchoolYear.semester}
              </p>
            </div>
          </div>
        )}
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
                {stat.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={stat.trend === "up" ? "text-green-600" : "text-red-600"}>
                  {stat.change}
                </span>
                <span className="ml-1">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Analytics */}
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <CardDescription>
              Enrollment trends and grade submissions over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminCharts 
              enrollmentData={enrollmentsByMonth}
              submissionsData={{
                pending: pendingSubmissions,
                approved: approvedSubmissions,
                declined: declinedSubmissions,
              }}
            />
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>
              Latest grade submissions and system events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivities submissions={recentSubmissions} />
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Subjects
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubjects}</div>
            <p className="text-xs text-muted-foreground">
              {openSubjects} currently open for enrollment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Classes
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClasses}</div>
            <p className="text-xs text-muted-foreground">
              Running this semester
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Approval Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {approvedSubmissions + pendingSubmissions + declinedSubmissions > 0
                ? Math.round((approvedSubmissions / (approvedSubmissions + declinedSubmissions + pendingSubmissions)) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {approvedSubmissions} of {approvedSubmissions + declinedSubmissions} submissions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <a
              href="/admin/faculty"
              className="group flex items-center gap-3 rounded-lg border p-4 transition-all hover:border-primary hover:shadow-sm"
            >
              <div className="rounded-full bg-blue-50 p-3 transition-colors group-hover:bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Manage Faculty</p>
                <p className="text-xs text-muted-foreground">Add or edit teachers</p>
              </div>
            </a>
            <a
              href="/admin/subjects"
              className="group flex items-center gap-3 rounded-lg border p-4 transition-all hover:border-primary hover:shadow-sm"
            >
              <div className="rounded-full bg-purple-50 p-3 transition-colors group-hover:bg-purple-100">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Manage Subjects</p>
                <p className="text-xs text-muted-foreground">Add or open subjects</p>
              </div>
            </a>
            <a
              href="/admin/school-years"
              className="group flex items-center gap-3 rounded-lg border p-4 transition-all hover:border-primary hover:shadow-sm"
            >
              <div className="rounded-full bg-green-50 p-3 transition-colors group-hover:bg-green-100">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">School Years</p>
                <p className="text-xs text-muted-foreground">Manage academic years</p>
              </div>
            </a>
            <a
              href="/admin/submissions"
              className="group flex items-center gap-3 rounded-lg border p-4 transition-all hover:border-primary hover:shadow-sm"
            >
              <div className="rounded-full bg-orange-50 p-3 transition-colors group-hover:bg-orange-100">
                <FileCheck className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium">Grade Reviews</p>
                <p className="text-xs text-muted-foreground">{pendingSubmissions} pending</p>
              </div>
            </a>
            <a
              href="/admin/grading-criteria"
              className="group flex items-center gap-3 rounded-lg border p-4 transition-all hover:border-primary hover:shadow-sm"
            >
              <div className="rounded-full bg-indigo-50 p-3 transition-colors group-hover:bg-indigo-100">
                <Percent className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium">Grading Criteria</p>
                <p className="text-xs text-muted-foreground">Set global criteria</p>
              </div>
            </a>
            <a
              href="/admin/assign-subjects"
              className="group flex items-center gap-3 rounded-lg border p-4 transition-all hover:border-primary hover:shadow-sm"
            >
              <div className="rounded-full bg-purple-50 p-3 transition-colors group-hover:bg-purple-100">
                <UserPlus className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Assign Subjects</p>
                <p className="text-xs text-muted-foreground">Assign subjects to teachers</p>
              </div>
            </a>
            <a
              href="/admin/department-heads"
              className="group flex items-center gap-3 rounded-lg border p-4 transition-all hover:border-primary hover:shadow-sm"
            >
              <div className="rounded-full bg-blue-50 p-3 transition-colors group-hover:bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Department Heads</p>
                <p className="text-xs text-muted-foreground">Manage department heads</p>
              </div>
            </a>
            <a
              href="/admin/departments"
              className="group flex items-center gap-3 rounded-lg border p-4 transition-all hover:border-primary hover:shadow-sm"
            >
              <div className="rounded-full bg-indigo-50 p-3 transition-colors group-hover:bg-indigo-100">
                <Building2 className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium">Departments</p>
                <p className="text-xs text-muted-foreground">Manage academic departments</p>
              </div>
            </a>
            <a
              href="/admin/settings"
              className="group flex items-center gap-3 rounded-lg border p-4 transition-all hover:border-primary hover:shadow-sm"
            >
              <div className="rounded-full bg-gray-50 p-3 transition-colors group-hover:bg-gray-100">
                <Settings className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium">Settings</p>
                <p className="text-xs text-muted-foreground">Global system settings</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


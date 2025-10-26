import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users, ClipboardList, FileCheck, TrendingUp, GraduationCap, Calendar, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default async function TeacherDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "TEACHER") {
    redirect("/dashboard")
  }

  // Fetch comprehensive statistics
  const [
    classes,
    totalStudents,
    pendingSubmissions,
    approvedSubmissions,
    activeSchoolYear,
  ] = await Promise.all([
    prisma.class.findMany({
      where: { teacherId: session.user.id },
      include: {
        subject: true,
        schoolYear: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.enrollment.count({
      where: {
        class: {
          teacherId: session.user.id,
        },
      },
    }),
    prisma.gradeSubmission.count({
      where: {
        teacherId: session.user.id,
        status: "PENDING",
      },
    }),
    prisma.gradeSubmission.count({
      where: {
        teacherId: session.user.id,
        status: "APPROVED",
      },
    }),
    0, // Removed grading criteria count as it's now admin-only
    prisma.schoolYear.findFirst({ where: { isActive: true } }),
  ])

  const stats = [
    {
      title: "My Classes",
      value: classes.length.toString(),
      change: "+12.5%",
      trend: "up",
      icon: BookOpen,
      description: "Active classes",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Students",
      value: totalStudents.toString(),
      change: "+23.1%",
      trend: "up",
      icon: GraduationCap,
      description: "Enrolled students",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Pending Reviews",
      value: pendingSubmissions.toString(),
      change: "-5.2%",
      trend: "down",
      icon: FileCheck,
      description: "Awaiting approval",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      title: "Approved Grades",
      value: approvedSubmissions.toString(),
      change: "+15.3%",
      trend: "up",
      icon: ClipboardList,
      description: "This semester",
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
            Manage your classes and student grades
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
          <Link href="/teacher/classes/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Class
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
                {stat.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <span className="text-red-600">↓</span>
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

      {/* Classes List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Classes</CardTitle>
              <CardDescription className="mt-1">
                Manage your active classes this semester
              </CardDescription>
            </div>
            {classes.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {classes.length} Active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No classes yet</h3>
              <p className="text-sm text-muted-foreground mt-2 mb-4">
                Create your first class to start managing student grades
              </p>
              <Link href="/teacher/classes/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Class
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((classItem) => (
                <Link
                  key={classItem.id}
                  href={`/teacher/classes/${classItem.id}`}
                  className="group block rounded-lg border p-4 transition-all hover:border-primary hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="rounded-full bg-primary/10 p-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      {classItem.isIrregular && (
                        <Badge variant="outline" className="text-xs">
                          Irregular
                        </Badge>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                        {classItem.subject.code}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {classItem.subject.name}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-xs text-muted-foreground">
                        {classItem.name} - {classItem.section}
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {classItem._count.enrollments}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


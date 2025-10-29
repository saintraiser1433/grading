import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FacultyTable } from "@/components/admin/faculty-table"
import { FacultySubjectAssignmentForm } from "@/components/admin/faculty-subject-assignment-form"
import { getUsers } from "@/lib/actions/user.actions"
import { getSubjectsWithAssignments } from "@/lib/actions/subject.actions"
import { getTeachers } from "@/lib/actions/user.actions"
import { getSchoolYears } from "@/lib/actions/schoolyear.actions"
import { getActiveDepartmentHeads } from "@/lib/actions/departmenthead.actions"
import { getDepartments } from "@/lib/actions/department.actions"
import { Button } from "@/components/ui/button"
import { UserPlus, Users, BookOpen } from "lucide-react"
import Link from "next/link"
import { AdminEmptyState } from "@/components/ui/admin-empty-state"

export default async function FacultyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const [teachersResult, subjectsResult, schoolYearsResult, departmentHeadsResult, departmentsResult] = await Promise.all([
    getUsers("TEACHER"),
    getSubjectsWithAssignments(),
    getSchoolYears(),
    getActiveDepartmentHeads(),
    getDepartments(),
  ])

  const teachers = teachersResult.success ? teachersResult.data : []
  const subjects = subjectsResult.success ? subjectsResult.data : []
  const schoolYears = schoolYearsResult.success ? schoolYearsResult.data : []
  const departmentHeads = departmentHeadsResult.success ? departmentHeadsResult.data : []
  const departments = departmentsResult.success ? departmentsResult.data : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Faculty Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage teachers and faculty members
          </p>
        </div>
        <Link href="/admin/faculty/new">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Faculty
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="faculty" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="faculty">Faculty Members</TabsTrigger>
          <TabsTrigger value="assign-subjects">Assign Subjects</TabsTrigger>
        </TabsList>

        <TabsContent value="faculty" className="space-y-6">
          {teachers.length === 0 ? (
            <AdminEmptyState
              iconName="Users"
              title="No Faculty Members"
              description="There are currently no faculty members in the system. Add your first teacher to get started with faculty management."
              actionLabel="Add Faculty"
              actionHref="/admin/faculty/new"
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>All Faculty Members</CardTitle>
              </CardHeader>
              <CardContent>
                <FacultyTable teachers={teachers} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="assign-subjects" className="space-y-6">
          {subjects.length === 0 ? (
            <AdminEmptyState
              iconName="BookOpen"
              title="No Subjects Available"
              description="There are currently no subjects available for assignment. Create subjects first before assigning them to faculty members."
              actionLabel="Create Subject"
              actionHref="/admin/subjects/new"
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Subject Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <FacultySubjectAssignmentForm teachers={teachers} subjects={subjects} schoolYears={schoolYears} departmentHeads={departmentHeads} departments={departments} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

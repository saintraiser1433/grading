import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getClasses } from "@/lib/actions/class.actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users } from "lucide-react"
import Link from "next/link"

export default async function TeacherClassesPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "TEACHER") {
    redirect("/dashboard")
  }

  const classesResult = await getClasses(session.user.id)
  const classes = classesResult.success ? classesResult.data : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
          <p className="text-gray-500 mt-1">
            Manage your classes and student grades
          </p>
        </div>
        <Link href="/teacher/classes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Class
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((classItem) => (
          <Link key={classItem.id} href={`/teacher/classes/${classItem.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">
                  {classItem.subject.code}
                </CardTitle>
                <p className="text-sm text-gray-500">
                  {classItem.subject.name}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">
                    {classItem.name} • Section {classItem.section}
                  </p>
                  {classItem.isIrregular && (
                    <p className="text-orange-600">Irregular Section</p>
                  )}
                  <p className="text-gray-500">
                    {classItem.schoolYear.year} - {classItem.schoolYear.semester}
                  </p>
                  <div className="flex items-center gap-2 pt-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{classItem._count.enrollments} students</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {classes.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">No classes yet</p>
            <Link href="/teacher/classes/new">
              <Button className="mt-4">Create Your First Class</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


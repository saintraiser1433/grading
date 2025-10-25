import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getSubjects } from "@/lib/actions/subject.actions"
import { getSchoolYears } from "@/lib/actions/schoolyear.actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClassForm } from "@/components/teacher/class-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function NewClassPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "TEACHER") {
    redirect("/dashboard")
  }

  const [subjectsResult, schoolYearsResult] = await Promise.all([
    getSubjects(),
    getSchoolYears(),
  ])

  const subjects = subjectsResult.success ? subjectsResult.data : []
  const schoolYears = schoolYearsResult.success ? schoolYearsResult.data : []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/teacher/classes">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Class</h1>
          <p className="text-gray-500 mt-1">
            Set up a new class for the current semester
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassForm 
            subjects={subjects} 
            schoolYears={schoolYears} 
            teacherId={session.user.id}
          />
        </CardContent>
      </Card>
    </div>
  )
}


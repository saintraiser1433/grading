import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getSchoolYears } from "@/lib/actions/schoolyear.actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SubjectForm } from "@/components/admin/subject-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function NewSubjectPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const schoolYearsResult = await getSchoolYears()
  const schoolYears = schoolYearsResult.success ? schoolYearsResult.data || [] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/subjects">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add Subject</h1>
          <p className="text-gray-500 mt-1">
            Create a new subject
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subject Information</CardTitle>
        </CardHeader>
        <CardContent>
          <SubjectForm schoolYears={schoolYears} />
        </CardContent>
      </Card>
    </div>
  )
}


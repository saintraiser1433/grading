import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getSchoolYears } from "@/lib/actions/schoolyear.actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Plus } from "lucide-react"
import Link from "next/link"
import { SchoolYearsTable } from "@/components/admin/schoolyears-table"

export default async function SchoolYearsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const schoolYearsResult = await getSchoolYears()
  const schoolYears = schoolYearsResult.success ? schoolYearsResult.data : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">School Years</h1>
          <p className="text-gray-500 mt-1">
            Manage academic years and semesters
          </p>
        </div>
        <Link href="/admin/school-years/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add School Year
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All School Years</CardTitle>
        </CardHeader>
        <CardContent>
          <SchoolYearsTable schoolYears={schoolYears} />
        </CardContent>
      </Card>
    </div>
  )
}


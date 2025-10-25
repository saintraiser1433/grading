import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SchoolYearForm } from "@/components/admin/schoolyear-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function NewSchoolYearPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/school-years">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add School Year</h1>
          <p className="text-gray-500 mt-1">
            Create a new academic year
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>School Year Information</CardTitle>
        </CardHeader>
        <CardContent>
          <SchoolYearForm />
        </CardContent>
      </Card>
    </div>
  )
}


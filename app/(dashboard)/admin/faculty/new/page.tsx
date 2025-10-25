import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FacultyForm } from "@/components/admin/faculty-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function NewFacultyPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/faculty">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add Faculty Member</h1>
          <p className="text-gray-500 mt-1">
            Create a new faculty/teacher account
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faculty Information</CardTitle>
        </CardHeader>
        <CardContent>
          <FacultyForm />
        </CardContent>
      </Card>
    </div>
  )
}


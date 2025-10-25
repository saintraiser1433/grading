import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getSubjects } from "@/lib/actions/subject.actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Plus } from "lucide-react"
import Link from "next/link"
import { SubjectsTable } from "@/components/admin/subjects-table"

export default async function SubjectsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const subjectsResult = await getSubjects()
  const subjects = subjectsResult.success ? subjectsResult.data : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subjects Management</h1>
          <p className="text-gray-500 mt-1">
            Manage subjects and course offerings
          </p>
        </div>
        <Link href="/admin/subjects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Subject
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Subjects</CardTitle>
        </CardHeader>
        <CardContent>
          <SubjectsTable subjects={subjects} />
        </CardContent>
      </Card>
    </div>
  )
}


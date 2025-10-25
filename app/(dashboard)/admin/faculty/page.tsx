import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getUsers } from "@/lib/actions/user.actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, UserPlus } from "lucide-react"
import Link from "next/link"
import { FacultyTable } from "@/components/admin/faculty-table"

export default async function FacultyPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const teachersResult = await getUsers("TEACHER")
  const teachers = teachersResult.success ? teachersResult.data : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Faculty Management</h1>
          <p className="text-gray-500 mt-1">
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

      <Card>
        <CardHeader>
          <CardTitle>All Faculty Members</CardTitle>
        </CardHeader>
        <CardContent>
          <FacultyTable teachers={teachers} />
        </CardContent>
      </Card>
    </div>
  )
}


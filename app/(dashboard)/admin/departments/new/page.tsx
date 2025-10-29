import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { DepartmentFormStandalone } from "@/components/admin/department-form-standalone"

export default async function NewDepartmentPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Department</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Create a new academic department
        </p>
      </div>

      <DepartmentFormStandalone />
    </div>
  )
}

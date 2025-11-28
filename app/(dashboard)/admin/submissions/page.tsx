import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getPendingGradeSubmissions, getApprovedGradeSubmissions } from "@/lib/actions/grade.actions"
import { SubmissionsTabs } from "@/components/admin/submissions-tabs"

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic'

export default async function AdminSubmissionsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const [pendingResult, approvedResult] = await Promise.all([
    getPendingGradeSubmissions(),
    getApprovedGradeSubmissions(),
  ])

  const pendingSubmissions = pendingResult.success ? pendingResult.data || [] : []
  const approvedSubmissions = approvedResult.success ? approvedResult.data || [] : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Grade Submissions</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Review and approve grade submissions from teachers
        </p>
      </div>

      <SubmissionsTabs
        pendingSubmissions={pendingSubmissions}
        approvedSubmissions={approvedSubmissions}
      />
    </div>
  )
}
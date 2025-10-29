import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GlobalGradingCriteriaManager } from "@/components/admin/global-grading-criteria-manager"
import { AdminEmptyState } from "@/components/ui/admin-empty-state"
import { Award, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function AdminGradingCriteriaPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Fetch all grade types and global criteria
  const [gradeTypes, globalCriteria] = await Promise.all([
    prisma.gradeType.findMany({
      orderBy: { order: "asc" },
    }),
    prisma.globalGradingCriteria.findMany({
      where: { isActive: true },
      include: {
        gradeType: true,
        componentDefinitions: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: [
        { gradeType: { order: "asc" } },
        { order: "asc" }
      ],
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grading Criteria Management</h1>
          <p className="text-muted-foreground mt-1">
            Set global grading criteria that apply to all subjects. Teachers will add specific components (Quiz 1, Activity 2, etc.) within these criteria.
          </p>
        </div>
      </div>

      {gradeTypes.length === 0 ? (
        <AdminEmptyState
          iconName="Award"
          title="No Grade Types Found"
          description="There are currently no grade types in the system. Create grade types first before setting up grading criteria."
          actionLabel="Add Grade Type"
          actionHref="/admin/grade-types/new"
        />
      ) : (
        <GlobalGradingCriteriaManager 
          gradeTypes={gradeTypes}
          globalCriteria={globalCriteria}
        />
      )}
    </div>
  )
}

import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GlobalGradingCriteriaManager } from "@/components/admin/global-grading-criteria-manager"

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Grading Criteria Management</h1>
        <p className="text-muted-foreground mt-1">
          Set global grading criteria that apply to all subjects. Teachers will add specific components (Quiz 1, Activity 2, etc.) within these criteria.
        </p>
      </div>

      <GlobalGradingCriteriaManager 
        gradeTypes={gradeTypes}
        globalCriteria={globalCriteria}
      />
    </div>
  )
}

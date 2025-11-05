import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GlobalGradingCriteriaManager } from "@/components/admin/global-grading-criteria-manager"
import { GradingCriteriaEmptyState } from "@/components/admin/grading-criteria-empty-state"

export default async function AdminGradingCriteriaPage({
  searchParams,
}: {
  searchParams: { schoolYearId?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Get active school year
  const activeSchoolYear = await prisma.schoolYear.findFirst({
    where: { isActive: true },
  })

  // Get all school years
  const schoolYears = await prisma.schoolYear.findMany({
    orderBy: [{ year: "desc" }, { semester: "desc" }],
  })

  // Use selected school year or default to active school year
  const selectedSchoolYearId = searchParams.schoolYearId || activeSchoolYear?.id || "all"

  // Fetch all grade types and global criteria, filtered by school year
  const [gradeTypes, globalCriteria] = await Promise.all([
    prisma.gradeType.findMany({
      where: selectedSchoolYearId === "all" 
        ? {} 
        : { schoolYearId: selectedSchoolYearId },
      orderBy: { order: "asc" },
    }),
    prisma.globalGradingCriteria.findMany({
      where: {
        isActive: true,
        ...(selectedSchoolYearId !== "all" && {
          schoolYearId: selectedSchoolYearId,
        }),
      },
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

      <GlobalGradingCriteriaManager 
        gradeTypes={gradeTypes}
        globalCriteria={globalCriteria}
        schoolYears={schoolYears}
        activeSchoolYear={activeSchoolYear}
        selectedSchoolYearId={selectedSchoolYearId}
      />
    </div>
  )
}

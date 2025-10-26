import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GradingComponentsManager } from "@/components/teacher/grading-components-manager"

export default async function TeacherGradingComponentsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "TEACHER") {
    redirect("/dashboard")
  }

  // Fetch global criteria for teachers to add components to
  const globalCriteria = await prisma.globalGradingCriteria.findMany({
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
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Grading Components</h1>
        <p className="text-muted-foreground mt-1">
          Add specific grading components (Quiz 1, Activity 2, etc.) within the global criteria set by administrators.
        </p>
      </div>

      <GradingComponentsManager globalCriteria={globalCriteria} />
    </div>
  )
}


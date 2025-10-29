import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GradeTypesPageClient } from "@/components/admin/grade-types-page-client"

export default async function GradeTypesPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const gradeTypes = await prisma.gradeType.findMany({
    orderBy: { order: "asc" },
  })

  return <GradeTypesPageClient gradeTypes={gradeTypes} />
}

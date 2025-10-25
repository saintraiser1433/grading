"use server"

import { prisma } from "@/lib/prisma"

export async function getClassGradesWithComponents(classId: string, isMidterm: boolean) {
  try {
    const grades = await prisma.grade.findMany({
      where: {
        classId,
        isMidterm,
      },
      include: {
        student: true,
        enrollment: true,
        components: {
          include: {
            criteria: true,
          },
        },
      },
    })

    return { success: true, data: grades }
  } catch (error) {
    console.error("Error fetching grades:", error)
    return { success: false, error: "Failed to fetch grades" }
  }
}

export async function getGradingCriteriaWithComponents(classId: string, isMidterm: boolean) {
  try {
    const criteria = await prisma.gradingCriteria.findMany({
      where: {
        classId,
        isMidterm,
      },
      orderBy: {
        order: 'asc',
      },
    })

    return { success: true, data: criteria }
  } catch (error) {
    console.error("Error fetching criteria:", error)
    return { success: false, error: "Failed to fetch criteria" }
  }
}


"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  CreateGradingCriteriaSchema,
  UpdateGradeComponentSchema,
  type CreateGradingCriteriaInput,
  type UpdateGradeComponentInput,
} from "@/lib/schemas"

export async function createGradingCriteria(data: CreateGradingCriteriaInput) {
  try {
    const validated = CreateGradingCriteriaSchema.parse(data)

    const criteria = await prisma.gradingCriteria.create({
      data: validated,
    })

    revalidatePath("/teacher/classes")
    return { success: true, data: criteria }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to create grading criteria" }
  }
}

export async function updateGradingCriteria(id: string, data: Partial<CreateGradingCriteriaInput>) {
  try {
    const criteria = await prisma.gradingCriteria.update({
      where: { id },
      data,
    })

    revalidatePath("/teacher/classes")
    return { success: true, data: criteria }
  } catch (error) {
    return { success: false, error: "Failed to update grading criteria" }
  }
}

export async function deleteGradingCriteria(id: string) {
  try {
    await prisma.gradingCriteria.delete({
      where: { id },
    })

    revalidatePath("/teacher/classes")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete grading criteria" }
  }
}

export async function getGradingCriteria(classId: string) {
  try {
    const criteria = await prisma.gradingCriteria.findMany({
      where: { classId },
      orderBy: { order: "asc" },
    })

    return { success: true, data: criteria }
  } catch (error) {
    return { success: false, error: "Failed to fetch grading criteria" }
  }
}

export async function updateGradeComponent(data: UpdateGradeComponentInput) {
  try {
    const validated = UpdateGradeComponentSchema.parse(data)
    
    // Calculate percentage based on score/maxScore
    const percentage = (validated.score / validated.maxScore) * 100

    // Upsert grade component
    const component = await prisma.gradeComponent.upsert({
      where: {
        gradeId_criteriaId: {
          gradeId: validated.gradeId,
          criteriaId: validated.criteriaId,
        },
      },
      update: {
        score: validated.score,
        maxScore: validated.maxScore,
        percentage,
      },
      create: {
        gradeId: validated.gradeId,
        criteriaId: validated.criteriaId,
        score: validated.score,
        maxScore: validated.maxScore,
        percentage,
      },
    })

    // Recalculate grade
    await recalculateGrade(validated.gradeId)

    revalidatePath("/teacher/classes")
    return { success: true, data: component }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to update grade component" }
  }
}

async function recalculateGrade(gradeId: string) {
  try {
    // Get grade with components and criteria
    const grade = await prisma.grade.findUnique({
      where: { id: gradeId },
      include: {
        components: {
          include: {
            criteria: true,
          },
        },
      },
    })

    if (!grade) return

    // Calculate weighted average
    let totalWeightedScore = 0
    for (const component of grade.components) {
      const componentPercentage = (component.score / component.maxScore) * 100
      const weightedScore = (componentPercentage * component.criteria.percentage) / 100
      totalWeightedScore += weightedScore
    }

    // Update grade
    const updateData: any = {}
    if (grade.isMidterm) {
      updateData.midtermGrade = totalWeightedScore
    } else {
      updateData.finalGrade = totalWeightedScore
    }

    // Calculate overall if both exist
    const midterm = grade.isMidterm ? totalWeightedScore : grade.midtermGrade
    const final = !grade.isMidterm ? totalWeightedScore : grade.finalGrade
    
    if (midterm !== null && final !== null) {
      updateData.overallGrade = (midterm + final) / 2
      updateData.remarks = updateData.overallGrade >= 75 ? "PASSED" : "FAILED"
    }

    await prisma.grade.update({
      where: { id: gradeId },
      data: updateData,
    })
  } catch (error) {
    console.error("Failed to recalculate grade:", error)
  }
}

export async function getOrCreateGrade(enrollmentId: string, classId: string, studentId: string, isMidterm: boolean) {
  try {
    let grade = await prisma.grade.findFirst({
      where: {
        enrollmentId,
        classId,
        isMidterm,
      },
      include: {
        components: {
          include: {
            criteria: true,
          },
        },
      },
    })

    if (!grade) {
      grade = await prisma.grade.create({
        data: {
          enrollmentId,
          classId,
          studentId,
          isMidterm,
        },
        include: {
          components: {
            include: {
              criteria: true,
            },
          },
        },
      })
    }

    return { success: true, data: grade }
  } catch (error) {
    return { success: false, error: "Failed to get grade" }
  }
}

export async function getClassGrades(classId: string, isMidterm: boolean) {
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
      orderBy: {
        student: {
          lastName: "asc",
        },
      },
    })

    return { success: true, data: grades }
  } catch (error) {
    return { success: false, error: "Failed to fetch grades" }
  }
}

export async function submitGrades(classId: string, teacherId: string, schoolYearId: string, isMidterm: boolean) {
  try {
    const submission = await prisma.gradeSubmission.create({
      data: {
        classId,
        teacherId,
        schoolYearId,
        isMidterm,
        status: "PENDING",
      },
      include: {
        class: {
          include: {
            subject: true,
          },
        },
      },
    })

    revalidatePath("/teacher/classes")
    return { success: true, data: submission }
  } catch (error) {
    return { success: false, error: "Failed to submit grades" }
  }
}

export async function approveGradeSubmission(id: string, approverId: string, comments?: string) {
  try {
    const submission = await prisma.gradeSubmission.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedBy: approverId,
        approvedAt: new Date(),
        comments,
      },
    })

    revalidatePath("/admin/submissions")
    return { success: true, data: submission }
  } catch (error) {
    return { success: false, error: "Failed to approve submission" }
  }
}

export async function declineGradeSubmission(id: string, approverId: string, comments: string) {
  try {
    const submission = await prisma.gradeSubmission.update({
      where: { id },
      data: {
        status: "DECLINED",
        approvedBy: approverId,
        approvedAt: new Date(),
        comments,
      },
    })

    revalidatePath("/admin/submissions")
    return { success: true, data: submission }
  } catch (error) {
    return { success: false, error: "Failed to decline submission" }
  }
}

export async function getGradeSubmissions(teacherId?: string) {
  try {
    const submissions = await prisma.gradeSubmission.findMany({
      where: teacherId ? { teacherId } : undefined,
      include: {
        class: {
          include: {
            subject: true,
          },
        },
        teacher: true,
        schoolYear: true,
        approver: true,
      },
      orderBy: { submittedAt: "desc" },
    })

    return { success: true, data: submissions }
  } catch (error) {
    return { success: false, error: "Failed to fetch grade submissions" }
  }
}


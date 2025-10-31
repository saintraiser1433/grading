"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  CreateGradingCriteriaSchema,
  UpdateGradeComponentSchema,
  CreateComponentDefinitionSchema,
  UpdateComponentDefinitionSchema,
  type CreateGradingCriteriaInput,
  type UpdateGradeComponentInput,
  type CreateComponentDefinitionInput,
  type UpdateComponentDefinitionInput,
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

export async function submitGrades(classId: string, teacherId: string, schoolYearId: string, gradeTypeId: string) {
  try {
    const submission = await prisma.gradeSubmission.create({
      data: {
        classId,
        teacherId,
        schoolYearId,
        gradeTypeId,
        status: "PENDING",
      },
      include: {
        class: {
          include: {
            subject: true,
          },
        },
        gradeType: true,
      },
    })

    revalidatePath("/teacher/classes")
    revalidatePath("/teacher/classes/[id]")
    revalidatePath("/teacher/submissions")
    revalidatePath("/admin/submissions")
    return { success: true, data: submission }
  } catch (error) {
    return { success: false, error: "Failed to submit grades" }
  }
}

export async function getPendingGradeSubmissions() {
  try {
    const submissions = await prisma.gradeSubmission.findMany({
      where: { status: "PENDING" },
      include: {
        class: {
          include: {
            subject: true,
            teacher: true,
          },
        },
        gradeType: true,
        schoolYear: true,
      },
      orderBy: { submittedAt: "desc" },
    })

    return { success: true, data: submissions }
  } catch (error) {
    return { success: false, error: "Failed to fetch pending submissions" }
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
      include: {
        class: {
          include: {
            subject: true,
          },
        },
        gradeType: true,
      },
    })

    revalidatePath("/admin/submissions")
    revalidatePath("/teacher/submissions")
    revalidatePath("/teacher/classes")
    revalidatePath("/student/grades")
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
      include: {
        class: {
          include: {
            subject: true,
          },
        },
        gradeType: true,
      },
    })

    revalidatePath("/admin/submissions")
    revalidatePath("/teacher/submissions")
    revalidatePath("/teacher/classes")
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
        gradeType: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    })

    return { success: true, data: submissions }
  } catch (error) {
    return { success: false, error: "Failed to fetch grade submissions" }
  }
}

// New function to create/update grades with grade types
export async function createOrUpdateGradeWithType(
  enrollmentId: string,
  classId: string,
  studentId: string,
  gradeTypeId: string,
  finalGrade?: number,
  remarks?: string
) {
  try {
    // Validate required parameters
    if (!enrollmentId || !classId || !studentId || !gradeTypeId) {
      throw new Error("Missing required parameters")
    }

    // Check if grade already exists
    let grade = await prisma.grade.findFirst({
      where: {
        enrollmentId,
        classId,
        gradeTypeId,
      },
    })


    if (grade) {
      // Update existing grade
      grade = await prisma.grade.update({
        where: { id: grade.id },
        data: {
          grade: finalGrade,
          remarks,
        },
      })
    } else {
      // Create new grade
      grade = await prisma.grade.create({
        data: {
          enrollmentId,
          classId,
          studentId,
          gradeTypeId,
          grade: finalGrade,
          remarks,
        },
      })
    }

    return { success: true, data: grade }
  } catch (error) {
    console.error("Error in createOrUpdateGradeWithType:", error)
    return { success: false, error: `Failed to create/update grade: ${error.message}` }
  }
}

// Component Definition Actions
export async function createComponentDefinition(data: CreateComponentDefinitionInput) {
  try {
    const validated = CreateComponentDefinitionSchema.parse(data)

    const component = await prisma.componentDefinition.create({
      data: validated,
    })

    revalidatePath("/teacher/classes")
    return { success: true, data: component }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to create component definition" }
  }
}

export async function updateComponentDefinition(id: string, data: UpdateComponentDefinitionInput) {
  try {
    const validated = UpdateComponentDefinitionSchema.parse({ ...data, id })

    const component = await prisma.componentDefinition.update({
      where: { id },
      data: validated,
    })

    revalidatePath("/teacher/classes")
    return { success: true, data: component }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to update component definition" }
  }
}

export async function deleteComponentDefinition(id: string) {
  try {
    await prisma.componentDefinition.delete({
      where: { id },
    })

    revalidatePath("/teacher/classes")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete component definition" }
  }
}

export async function getComponentDefinitions(criteriaId: string) {
  try {
    const components = await prisma.componentDefinition.findMany({
      where: { criteriaId },
      orderBy: { order: "asc" },
    })

    return { success: true, data: components }
  } catch (error) {
    return { success: false, error: "Failed to fetch component definitions" }
  }
}

// Global Component Definition Actions
export async function createGlobalComponentDefinition(data: CreateComponentDefinitionInput) {
  try {
    const validated = CreateComponentDefinitionSchema.parse(data)

    const component = await prisma.globalComponentDefinition.create({
      data: validated,
    })

    revalidatePath("/admin/grading-criteria")
    return { success: true, data: component }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to create global component definition" }
  }
}

export async function updateGlobalComponentDefinition(id: string, data: UpdateComponentDefinitionInput) {
  try {
    const validated = UpdateComponentDefinitionSchema.parse({ ...data, id })

    const component = await prisma.globalComponentDefinition.update({
      where: { id },
      data: validated,
    })

    revalidatePath("/admin/grading-criteria")
    return { success: true, data: component }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to update global component definition" }
  }
}

export async function deleteGlobalComponentDefinition(id: string) {
  try {
    await prisma.globalComponentDefinition.delete({
      where: { id },
    })

    revalidatePath("/admin/grading-criteria")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete global component definition" }
  }
}

export async function getGlobalComponentDefinitions(criteriaId: string) {
  try {
    const components = await prisma.globalComponentDefinition.findMany({
      where: { criteriaId },
      orderBy: { order: "asc" },
    })

    return { success: true, data: components }
  } catch (error) {
    return { success: false, error: "Failed to fetch global component definitions" }
  }
}


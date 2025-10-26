"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Schemas for validation
const CreateGradeTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  percentage: z.number().min(0).max(100, "Percentage must be between 0 and 100"),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().optional(),
})

const CreateGlobalCriteriaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  percentage: z.number().min(0).max(100, "Percentage must be between 0 and 100"),
  gradeTypeId: z.string().min(1, "Grade type is required"),
  order: z.number().int().min(0).default(0),
})

const CreateGlobalComponentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  maxScore: z.number().min(0, "Max score must be positive"),
  criteriaId: z.string().min(1, "Criteria is required"),
  order: z.number().int().min(0).default(0),
})

export type CreateGradeTypeInput = z.infer<typeof CreateGradeTypeSchema>
export type CreateGlobalCriteriaInput = z.infer<typeof CreateGlobalCriteriaSchema>
export type CreateGlobalComponentInput = z.infer<typeof CreateGlobalComponentSchema>

// Grade Type Management
export async function createGradeType(data: CreateGradeTypeInput) {
  try {
    const validated = CreateGradeTypeSchema.parse(data)

    const gradeType = await prisma.gradeType.create({
      data: validated,
    })

    revalidatePath("/admin/grading-criteria")
    return { success: true, data: gradeType }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to create grade type" }
  }
}

export async function updateGradeType(id: string, data: Partial<CreateGradeTypeInput>) {
  try {
    // Validate the data first
    const validated = CreateGradeTypeSchema.partial().parse(data)
    
    const gradeType = await prisma.gradeType.update({
      where: { id },
      data: validated,
    })

    revalidatePath("/admin/grading-criteria")
    return { success: true, data: gradeType }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: `Failed to update grade type: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

export async function deleteGradeType(id: string) {
  try {
    await prisma.gradeType.delete({
      where: { id },
    })

    revalidatePath("/admin/grading-criteria")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete grade type" }
  }
}

export async function getGradeTypes() {
  try {
    const gradeTypes = await prisma.gradeType.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    })

    return { success: true, data: gradeTypes }
  } catch (error) {
    return { success: false, error: "Failed to fetch grade types" }
  }
}

// Global Grading Criteria Management
export async function createGlobalCriteria(data: CreateGlobalCriteriaInput) {
  try {
    const validated = CreateGlobalCriteriaSchema.parse(data)

    // Check if total percentage for this grade type would exceed 100%
    const existingCriteria = await prisma.globalGradingCriteria.findMany({
      where: { 
        gradeTypeId: validated.gradeTypeId,
        isActive: true 
      },
    })

    const currentTotal = existingCriteria.reduce((sum, c) => sum + c.percentage, 0)
    const newTotal = currentTotal + validated.percentage

    if (newTotal > 100) {
      return { 
        success: false, 
        error: `Total percentage would be ${newTotal}%. Must not exceed 100% for this grade type.` 
      }
    }

    const criteria = await prisma.globalGradingCriteria.create({
      data: validated,
    })

    revalidatePath("/admin/grading-criteria")
    return { success: true, data: criteria }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to create global grading criteria" }
  }
}

export async function updateGlobalCriteria(id: string, data: Partial<CreateGlobalCriteriaInput>) {
  try {
    const criteria = await prisma.globalGradingCriteria.update({
      where: { id },
      data,
    })

    revalidatePath("/admin/grading-criteria")
    return { success: true, data: criteria }
  } catch (error) {
    return { success: false, error: "Failed to update global grading criteria" }
  }
}

export async function deleteGlobalCriteria(id: string) {
  try {
    await prisma.globalGradingCriteria.delete({
      where: { id },
    })

    revalidatePath("/admin/grading-criteria")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete global grading criteria" }
  }
}

export async function getGlobalCriteria() {
  try {
    const criteria = await prisma.globalGradingCriteria.findMany({
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

    return { success: true, data: criteria }
  } catch (error) {
    return { success: false, error: "Failed to fetch global grading criteria" }
  }
}

// Global Component Definition Management
export async function createGlobalComponent(data: CreateGlobalComponentInput) {
  try {
    const validated = CreateGlobalComponentSchema.parse(data)

    const component = await prisma.globalComponentDefinition.create({
      data: validated,
    })

    revalidatePath("/admin/grading-criteria")
    return { success: true, data: component }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to create global component" }
  }
}

export async function updateGlobalComponent(id: string, data: Partial<CreateGlobalComponentInput>) {
  try {
    const component = await prisma.globalComponentDefinition.update({
      where: { id },
      data,
    })

    revalidatePath("/admin/grading-criteria")
    return { success: true, data: component }
  } catch (error) {
    return { success: false, error: "Failed to update global component" }
  }
}

export async function deleteGlobalComponent(id: string) {
  try {
    await prisma.globalComponentDefinition.delete({
      where: { id },
    })

    revalidatePath("/admin/grading-criteria")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete global component" }
  }
}

// Get grading criteria for a specific grade type
export async function getCriteriaByGradeType(gradeTypeId: string) {
  try {
    const criteria = await prisma.globalGradingCriteria.findMany({
      where: { 
        gradeTypeId,
        isActive: true 
      },
      include: {
        componentDefinitions: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    })

    return { success: true, data: criteria }
  } catch (error) {
    return { success: false, error: "Failed to fetch criteria for grade type" }
  }
}

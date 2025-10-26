"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Schemas for validation
const CreateComponentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  maxScore: z.number().min(0, "Max score must be positive"),
  criteriaId: z.string().min(1, "Criteria is required"),
  order: z.number().int().min(0).default(0),
})

export type CreateComponentInput = z.infer<typeof CreateComponentSchema>

// Get global criteria for teachers to add components to
export async function getGlobalCriteriaForTeacher() {
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
    return { success: false, error: "Failed to fetch global criteria" }
  }
}

// Create component definition (teachers can do this)
export async function createComponent(data: CreateComponentInput) {
  try {
    const validated = CreateComponentSchema.parse(data)

    const component = await prisma.globalComponentDefinition.create({
      data: validated,
    })

    revalidatePath("/teacher/classes")
    return { success: true, data: component }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to create component" }
  }
}

// Update component definition
export async function updateComponent(id: string, data: Partial<CreateComponentInput>) {
  try {
    const component = await prisma.globalComponentDefinition.update({
      where: { id },
      data,
    })

    revalidatePath("/teacher/classes")
    return { success: true, data: component }
  } catch (error) {
    return { success: false, error: "Failed to update component" }
  }
}

// Delete component definition
export async function deleteComponent(id: string) {
  try {
    await prisma.globalComponentDefinition.delete({
      where: { id },
    })

    revalidatePath("/teacher/classes")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete component" }
  }
}

// Get components for a specific criteria
export async function getComponentsByCriteria(criteriaId: string) {
  try {
    const components = await prisma.globalComponentDefinition.findMany({
      where: { 
        criteriaId,
        isActive: true 
      },
      orderBy: { order: "asc" },
    })

    return { success: true, data: components }
  } catch (error) {
    return { success: false, error: "Failed to fetch components" }
  }
}


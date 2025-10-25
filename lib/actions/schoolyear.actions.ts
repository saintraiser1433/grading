"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  CreateSchoolYearSchema,
  UpdateSchoolYearSchema,
  type CreateSchoolYearInput,
  type UpdateSchoolYearInput,
} from "@/lib/schemas"

export async function createSchoolYear(data: CreateSchoolYearInput) {
  try {
    const validated = CreateSchoolYearSchema.parse(data)

    // If setting as active, deactivate others
    if (validated.isActive) {
      await prisma.schoolYear.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })
    }

    const schoolYear = await prisma.schoolYear.create({
      data: validated,
    })

    revalidatePath("/admin/school-years")
    return { success: true, data: schoolYear }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to create school year" }
  }
}

export async function updateSchoolYear(data: UpdateSchoolYearInput) {
  try {
    const validated = UpdateSchoolYearSchema.parse(data)
    const { id, ...rest } = validated

    // If setting as active, deactivate others
    if (rest.isActive) {
      await prisma.schoolYear.updateMany({
        where: { 
          isActive: true,
          NOT: { id }
        },
        data: { isActive: false },
      })
    }

    const schoolYear = await prisma.schoolYear.update({
      where: { id },
      data: rest,
    })

    revalidatePath("/admin/school-years")
    return { success: true, data: schoolYear }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to update school year" }
  }
}

export async function deleteSchoolYear(id: string) {
  try {
    await prisma.schoolYear.delete({
      where: { id },
    })

    revalidatePath("/admin/school-years")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete school year" }
  }
}

export async function getSchoolYears() {
  try {
    const schoolYears = await prisma.schoolYear.findMany({
      orderBy: [
        { year: "desc" },
        { semester: "asc" },
      ],
    })

    return { success: true, data: schoolYears }
  } catch (error) {
    return { success: false, error: "Failed to fetch school years" }
  }
}

export async function getActiveSchoolYear() {
  try {
    const schoolYear = await prisma.schoolYear.findFirst({
      where: { isActive: true },
    })

    return { success: true, data: schoolYear }
  } catch (error) {
    return { success: false, error: "Failed to fetch active school year" }
  }
}

export async function getSchoolYearById(id: string) {
  try {
    const schoolYear = await prisma.schoolYear.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subjects: true,
            classes: true,
            enrollments: true,
          },
        },
      },
    })

    return { success: true, data: schoolYear }
  } catch (error) {
    return { success: false, error: "Failed to fetch school year" }
  }
}


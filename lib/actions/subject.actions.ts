"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  CreateSubjectSchema,
  UpdateSubjectSchema,
  type CreateSubjectInput,
  type UpdateSubjectInput,
} from "@/lib/schemas"

export async function createSubject(data: CreateSubjectInput) {
  try {
    const validated = CreateSubjectSchema.parse(data)

    const subject = await prisma.subject.create({
      data: validated,
    })

    revalidatePath("/admin/subjects")
    return { success: true, data: subject }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to create subject" }
  }
}

export async function updateSubject(data: UpdateSubjectInput) {
  try {
    const validated = UpdateSubjectSchema.parse(data)
    const { id, ...rest } = validated

    const subject = await prisma.subject.update({
      where: { id },
      data: rest,
    })

    revalidatePath("/admin/subjects")
    return { success: true, data: subject }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to update subject" }
  }
}

export async function deleteSubject(id: string) {
  try {
    await prisma.subject.delete({
      where: { id },
    })

    revalidatePath("/admin/subjects")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete subject" }
  }
}

export async function getSubjects() {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        schoolYear: true,
        _count: {
          select: {
            classes: true,
            enrollments: true,
          },
        },
      },
      orderBy: { code: "asc" },
    })

    return { success: true, data: subjects }
  } catch (error) {
    return { success: false, error: "Failed to fetch subjects" }
  }
}

export async function getOpenSubjects() {
  try {
    const subjects = await prisma.subject.findMany({
      where: { isOpen: true },
      include: {
        schoolYear: true,
      },
      orderBy: { code: "asc" },
    })

    return { success: true, data: subjects }
  } catch (error) {
    return { success: false, error: "Failed to fetch open subjects" }
  }
}

export async function getSubjectById(id: string) {
  try {
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        schoolYear: true,
        classes: {
          include: {
            teacher: true,
          },
        },
      },
    })

    return { success: true, data: subject }
  } catch (error) {
    return { success: false, error: "Failed to fetch subject" }
  }
}

export async function assignSubjectToTeacher(subjectId: string, teacherId: string, schoolYearId: string) {
  try {
    // This will be handled in the class creation
    // Just a placeholder for the assignment logic
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to assign subject" }
  }
}


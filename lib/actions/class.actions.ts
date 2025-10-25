"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  CreateClassSchema,
  UpdateClassSchema,
  type CreateClassInput,
  type UpdateClassInput,
} from "@/lib/schemas"

export async function createClass(data: CreateClassInput) {
  try {
    const validated = CreateClassSchema.parse(data)

    const classData = await prisma.class.create({
      data: validated,
      include: {
        subject: true,
        teacher: true,
        schoolYear: true,
      },
    })

    revalidatePath("/teacher/classes")
    return { success: true, data: classData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to create class" }
  }
}

export async function updateClass(data: UpdateClassInput) {
  try {
    const validated = UpdateClassSchema.parse(data)
    const { id, ...rest } = validated

    const classData = await prisma.class.update({
      where: { id },
      data: rest,
      include: {
        subject: true,
        teacher: true,
        schoolYear: true,
      },
    })

    revalidatePath("/teacher/classes")
    return { success: true, data: classData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to update class" }
  }
}

export async function deleteClass(id: string) {
  try {
    await prisma.class.delete({
      where: { id },
    })

    revalidatePath("/teacher/classes")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete class" }
  }
}

export async function getClasses(teacherId?: string) {
  try {
    const classes = await prisma.class.findMany({
      where: teacherId ? { teacherId } : undefined,
      include: {
        subject: true,
        teacher: true,
        schoolYear: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: classes }
  } catch (error) {
    return { success: false, error: "Failed to fetch classes" }
  }
}

export async function getClassById(id: string) {
  try {
    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        subject: true,
        teacher: true,
        schoolYear: true,
        enrollments: {
          include: {
            student: true,
          },
        },
        gradingCriteria: {
          orderBy: { order: "asc" },
        },
      },
    })

    return { success: true, data: classData }
  } catch (error) {
    return { success: false, error: "Failed to fetch class" }
  }
}

export async function addStudentToClass(classId: string, studentId: string) {
  try {
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: { subject: true },
    })

    if (!classData) {
      return { success: false, error: "Class not found" }
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        subjectId: classData.subjectId,
        classId,
        schoolYearId: classData.schoolYearId,
      },
    })

    revalidatePath(`/teacher/classes/${classId}`)
    return { success: true, data: enrollment }
  } catch (error) {
    return { success: false, error: "Failed to add student to class" }
  }
}

export async function removeStudentFromClass(enrollmentId: string) {
  try {
    await prisma.enrollment.delete({
      where: { id: enrollmentId },
    })

    revalidatePath("/teacher/classes")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to remove student from class" }
  }
}


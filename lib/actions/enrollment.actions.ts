"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  CreateEnrollmentSchema,
  type CreateEnrollmentInput,
} from "@/lib/schemas"

export async function createEnrollment(data: CreateEnrollmentInput) {
  try {
    const validated = CreateEnrollmentSchema.parse(data)

    // Check if already enrolled
    const existing = await prisma.enrollment.findFirst({
      where: {
        studentId: validated.studentId,
        subjectId: validated.subjectId,
        schoolYearId: validated.schoolYearId,
      },
    })

    if (existing) {
      return { success: false, error: "Already enrolled in this subject" }
    }

    const enrollment = await prisma.enrollment.create({
      data: validated,
      include: {
        subject: true,
        class: true,
        schoolYear: true,
      },
    })

    revalidatePath("/student/enrollments")
    return { success: true, data: enrollment }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to enroll in subject" }
  }
}

export async function deleteEnrollment(id: string) {
  try {
    await prisma.enrollment.delete({
      where: { id },
    })

    revalidatePath("/student/enrollments")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to drop enrollment" }
  }
}

export async function getStudentEnrollments(studentId: string, schoolYearId?: string) {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId,
        ...(schoolYearId && { schoolYearId }),
      },
      include: {
        subject: true,
        class: {
          include: {
            teacher: true,
          },
        },
        schoolYear: true,
        grades: true,
      },
      orderBy: { enrolledAt: "desc" },
    })

    return { success: true, data: enrollments }
  } catch (error) {
    return { success: false, error: "Failed to fetch enrollments" }
  }
}

export async function getEnrollmentsByClass(classId: string) {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { classId },
      include: {
        student: true,
        subject: true,
        grades: {
          include: {
            components: {
              include: {
                criteria: true,
              },
            },
          },
        },
      },
      orderBy: {
        student: {
          lastName: "asc",
        },
      },
    })

    return { success: true, data: enrollments }
  } catch (error) {
    return { success: false, error: "Failed to fetch enrollments" }
  }
}


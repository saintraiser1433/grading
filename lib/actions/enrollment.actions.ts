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

    // If no classId provided, find the appropriate class for this subject
    let classId = validated.classId
    if (!classId) {
      const subject = await prisma.subject.findUnique({
        where: { id: validated.subjectId },
        include: { classes: true }
      })

      if (!subject) {
        return { success: false, error: "Subject not found" }
      }

      // Find the first available class for this subject and school year
      const availableClass = subject.classes.find(
        (cls) => cls.schoolYearId === validated.schoolYearId
      )

      if (!availableClass) {
        return { success: false, error: "No classes available for this subject" }
      }

      classId = availableClass.id
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        ...validated,
        classId,
        status: "PENDING",
      },
      include: {
        subject: true,
        class: true,
        schoolYear: true,
      },
    })

    revalidatePath("/student/enrollments")
    revalidatePath("/teacher/classes")
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
        grades: {
          include: {
            gradeType: {
              select: {
                name: true,
                percentage: true,
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    })

    // Filter grades to only show those from approved submissions
    const enrollmentsWithApprovedGrades = await Promise.all(
      enrollments.map(async (enrollment) => {
        const approvedGrades = []
        
        for (const grade of enrollment.grades) {
          // Check if there's an approved submission for this class and grade type
          const approvedSubmission = await prisma.gradeSubmission.findFirst({
            where: {
              classId: enrollment.classId,
              gradeTypeId: grade.gradeTypeId,
              status: "APPROVED"
            }
          })
          
          if (approvedSubmission) {
            approvedGrades.push(grade)
          }
        }
        
        return {
          ...enrollment,
          grades: approvedGrades
        }
      })
    )

    return { success: true, data: enrollmentsWithApprovedGrades }
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


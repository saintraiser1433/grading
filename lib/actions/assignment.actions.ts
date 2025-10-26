"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export interface CreateAssignmentInput {
  teacherId: string
  subjectId: string
  schoolYearId: string
  section: string
  name?: string
  dayAndTime?: string
  room?: string
  classSize?: number
  departmentHead?: string
  vpAcademics?: string
  isIrregular?: boolean
}

export async function createTeacherSubjectAssignment(data: CreateAssignmentInput) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    // Check if teacher exists and is a teacher
    const teacher = await prisma.user.findUnique({
      where: { id: data.teacherId },
      select: { id: true, role: true }
    })

    if (!teacher || teacher.role !== "TEACHER") {
      return { success: false, error: "Invalid teacher" }
    }

    // Check if subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: data.subjectId }
    })

    if (!subject) {
      return { success: false, error: "Invalid subject" }
    }

    // Check if school year exists
    const schoolYear = await prisma.schoolYear.findUnique({
      where: { id: data.schoolYearId }
    })

    if (!schoolYear) {
      return { success: false, error: "Invalid school year" }
    }

    // Check for duplicate assignment (same subject, section, school year)
    const existingClass = await prisma.class.findFirst({
      where: {
        subjectId: data.subjectId,
        section: data.section,
        schoolYearId: data.schoolYearId
      }
    })

    if (existingClass) {
      return { success: false, error: "A class with this subject, section, and school year already exists" }
    }

    // Create the class assignment
    const classAssignment = await prisma.class.create({
      data: {
        name: data.name || `${subject.name} - ${data.section}`,
        section: data.section,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        schoolYearId: data.schoolYearId,
        dayAndTime: data.dayAndTime,
        room: data.room,
        classSize: data.classSize,
        departmentHead: data.departmentHead,
        vpAcademics: data.vpAcademics,
        isIrregular: data.isIrregular || false
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        subject: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        schoolYear: {
          select: {
            id: true,
            year: true,
            semester: true
          }
        }
      }
    })

    revalidatePath("/admin/assign-subjects")
    revalidatePath("/admin/faculty")
    revalidatePath("/admin/subjects")

    return { success: true, data: classAssignment }
  } catch (error) {
    console.error("Error creating teacher-subject assignment:", error)
    return { success: false, error: "Failed to create assignment" }
  }
}

export async function getTeacherAssignments(teacherId?: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    const assignments = await prisma.class.findMany({
      where: teacherId ? { teacherId } : {},
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        subject: {
          select: {
            id: true,
            code: true,
            name: true,
            units: true
          }
        },
        schoolYear: {
          select: {
            id: true,
            year: true,
            semester: true
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      },
      orderBy: [
        { schoolYear: { year: "desc" } },
        { subject: { name: "asc" } },
        { section: "asc" }
      ]
    })

    return { success: true, data: assignments }
  } catch (error) {
    console.error("Error fetching teacher assignments:", error)
    return { success: false, error: "Failed to fetch assignments" }
  }
}

export async function removeTeacherAssignment(classId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    // Check if class has enrollments
    const classWithEnrollments = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    })

    if (!classWithEnrollments) {
      return { success: false, error: "Class not found" }
    }

    if (classWithEnrollments._count.enrollments > 0) {
      return { success: false, error: "Cannot remove assignment with enrolled students" }
    }

    await prisma.class.delete({
      where: { id: classId }
    })

    revalidatePath("/admin/assign-subjects")
    revalidatePath("/admin/faculty")
    revalidatePath("/admin/subjects")

    return { success: true }
  } catch (error) {
    console.error("Error removing teacher assignment:", error)
    return { success: false, error: "Failed to remove assignment" }
  }
}

export async function updateTeacherAssignment(classId: string, data: Partial<CreateAssignmentInput>) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: {
        ...(data.section && { section: data.section }),
        ...(data.name && { name: data.name }),
        ...(data.dayAndTime && { dayAndTime: data.dayAndTime }),
        ...(data.room && { room: data.room }),
        ...(data.classSize && { classSize: data.classSize }),
        ...(data.departmentHead && { departmentHead: data.departmentHead }),
        ...(data.vpAcademics && { vpAcademics: data.vpAcademics }),
        ...(data.isIrregular !== undefined && { isIrregular: data.isIrregular })
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        subject: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        schoolYear: {
          select: {
            id: true,
            year: true,
            semester: true
          }
        }
      }
    })

    revalidatePath("/admin/assign-subjects")
    revalidatePath("/admin/faculty")
    revalidatePath("/admin/subjects")

    return { success: true, data: updatedClass }
  } catch (error) {
    console.error("Error updating teacher assignment:", error)
    return { success: false, error: "Failed to update assignment" }
  }
}

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

    // If no schoolYearId is provided, use the active school year
    let subjectData = validated
    if (!subjectData.schoolYearId) {
      const activeSchoolYear = await prisma.schoolYear.findFirst({
        where: { isActive: true },
      })
      if (activeSchoolYear) {
        subjectData = { ...subjectData, schoolYearId: activeSchoolYear.id }
      }
    }

    const subject = await prisma.subject.create({
      data: subjectData,
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
        subjectAssignments: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
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
    // Get the active school year first
    const activeSchoolYear = await prisma.schoolYear.findFirst({
      where: { isActive: true },
    })

    if (!activeSchoolYear) {
      return { success: true, data: [] }
    }

    const subjects = await prisma.subject.findMany({
      where: { 
        isOpen: true,
        schoolYearId: activeSchoolYear.id
      },
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

export async function getSubjectsAssignedToTeacher(teacherId: string) {
  try {
    const subjects = await prisma.subject.findMany({
      where: { assignedTeacherId: teacherId },
      include: {
        schoolYear: true,
        _count: {
          select: {
            classes: true,
          },
        },
      },
      orderBy: { code: "asc" },
    })

    return { success: true, data: subjects }
  } catch (error) {
    return { success: false, error: "Failed to fetch assigned subjects" }
  }
}

export async function assignSubjectToTeacher(subjectId: string, teacherId: string) {
  try {
    const subject = await prisma.subject.update({
      where: { id: subjectId },
      data: { 
        assignedTeacherId: teacherId || null 
      },
      include: {
        assignedTeacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    revalidatePath("/admin/faculty/assign-subjects")
    revalidatePath("/admin/subjects")
    revalidatePath("/teacher/classes")
    
    return { success: true, data: subject }
  } catch (error) {
    return { success: false, error: "Failed to assign subject" }
  }
}

// New functions for many-to-many subject assignments
export async function assignSubjectToTeacherManyToMany(subjectId: string, teacherId: string) {
  try {
    // Check if assignment already exists
    const existingAssignment = await prisma.subjectAssignment.findUnique({
      where: {
        subjectId_teacherId: {
          subjectId,
          teacherId,
        },
      },
    })

    if (existingAssignment) {
      return { success: false, error: "Subject is already assigned to this teacher" }
    }

    // Get subject details for class creation
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        schoolYear: true,
      },
    })

    if (!subject) {
      return { success: false, error: "Subject not found" }
    }

    // Get teacher details
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
    })

    if (!teacher) {
      return { success: false, error: "Teacher not found" }
    }

    // Use transaction to create both assignment and class
    const result = await prisma.$transaction(async (tx) => {
      // Create the subject assignment
      const assignment = await tx.subjectAssignment.create({
        data: {
          subjectId,
          teacherId,
        },
        include: {
          subject: {
            include: {
              schoolYear: true,
            },
          },
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      })

      // Create a class automatically
      const classData = await tx.class.create({
        data: {
          name: `${subject.code} - Class`,
          section: "A", // Default section
          isIrregular: false,
          subjectId: subject.id,
          teacherId: teacher.id,
          schoolYearId: subject.schoolYearId || undefined,
        },
        include: {
          subject: true,
          teacher: true,
          schoolYear: true,
        },
      })

      return { assignment, classData }
    })

    revalidatePath("/admin/faculty")
    revalidatePath("/admin/subjects")
    revalidatePath("/teacher/classes")
    revalidatePath("/teacher")
    
    return { success: true, data: result.assignment }
  } catch (error) {
    return { success: false, error: "Failed to assign subject and create class" }
  }
}

export async function removeSubjectFromTeacher(subjectId: string, teacherId: string) {
  try {
    await prisma.subjectAssignment.delete({
      where: {
        subjectId_teacherId: {
          subjectId,
          teacherId,
        },
      },
    })

    revalidatePath("/admin/faculty")
    revalidatePath("/admin/subjects")
    revalidatePath("/teacher/classes")
    
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to remove subject assignment" }
  }
}

export async function getSubjectsWithAssignments() {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        schoolYear: true,
        assignedTeacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        subjectAssignments: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
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
    return { success: false, error: "Failed to fetch subjects with assignments" }
  }
}

export async function getSubjectsAssignedToTeacherManyToMany(teacherId: string) {
  try {
    // Get the active school year first
    const activeSchoolYear = await prisma.schoolYear.findFirst({
      where: { isActive: true },
    })

    if (!activeSchoolYear) {
      return { success: true, data: [] }
    }

    const assignments = await prisma.subjectAssignment.findMany({
      where: { 
        teacherId,
        subject: {
          schoolYearId: activeSchoolYear.id
        }
      },
      include: {
        subject: {
          include: {
            schoolYear: true,
            _count: {
              select: {
                classes: true,
              },
            },
          },
        },
      },
      orderBy: {
        subject: {
          code: "asc",
        },
      },
    })

    const subjects = assignments.map(assignment => assignment.subject)

    return { success: true, data: subjects }
  } catch (error) {
    return { success: false, error: "Failed to fetch assigned subjects" }
  }
}


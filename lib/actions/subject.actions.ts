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

    // Get all subjects that have classes or assignments in the active school year
    // First, get subjects with classes in the active school year
    const subjectsWithClasses = await prisma.subject.findMany({
      where: { 
        classes: {
          some: {
            schoolYearId: activeSchoolYear.id
          }
        }
      },
      include: {
        schoolYear: true,
        classes: {
          where: {
            schoolYearId: activeSchoolYear.id
          },
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        },
        _count: {
          select: {
            classes: true
          }
        }
      },
      orderBy: { code: "asc" },
    })

    // Also get subjects assigned to teachers for this school year (via SubjectAssignment)
    const assignments = await prisma.subjectAssignment.findMany({
      where: {
        schoolYearId: activeSchoolYear.id
      },
      include: {
        subject: {
          include: {
            schoolYear: true,
            classes: {
              where: {
                schoolYearId: activeSchoolYear.id
              },
              include: {
                teacher: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  }
                }
              }
            },
            _count: {
              select: {
                classes: true
              }
            }
          }
        }
      }
    })

    // Combine subjects from both sources
    const subjectMap = new Map()
    
    // Add subjects with classes
    subjectsWithClasses.forEach(subject => {
      subjectMap.set(subject.id, subject)
    })
    
    // Add subjects from assignments
    assignments.forEach(assignment => {
      if (!subjectMap.has(assignment.subject.id)) {
        subjectMap.set(assignment.subject.id, assignment.subject)
      }
    })

    // Convert map to array and filter to only include subjects with classes
    const allSubjects = Array.from(subjectMap.values())
    const subjectsWithAvailableClasses = allSubjects.filter(
      subject => subject.classes.length > 0
    )

    return { success: true, data: subjectsWithAvailableClasses }
  } catch (error) {
    console.error("Error fetching open subjects:", error)
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
export async function assignSubjectToTeacherManyToMany(
  subjectId: string, 
  teacherId: string,
  course?: string,
  section?: string,
  dayTime?: string,
  size?: string,
  schoolYearId?: string,
  departmentHeadId?: string,
  departmentId?: string
) {
  try {
    // Note: We allow multiple classes per assignment, so we don't check for existing assignment here
    // The assignment will be created if it doesn't exist, or reused if it does

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

    // Validate schoolYearId
    const targetSchoolYearId = schoolYearId || subject.schoolYearId
    if (!targetSchoolYearId) {
      return { success: false, error: "School year is required" }
    }

    // Get department head name if departmentHeadId is provided
    let departmentHeadName: string | null = null
    if (departmentHeadId) {
      const deptHead = await prisma.departmentHead.findUnique({
        where: { id: departmentHeadId },
      })
      departmentHeadName = deptHead?.name || null
    }

    // Use transaction to create both assignment and class
    const result = await prisma.$transaction(async (tx) => {
      // Check if assignment already exists, if not create it
      let assignment = await tx.subjectAssignment.findFirst({
        where: {
          subjectId,
          teacherId,
          schoolYearId: targetSchoolYearId,
        },
      })

      if (!assignment) {
        // Create the subject assignment if it doesn't exist
        assignment = await tx.subjectAssignment.create({
          data: {
            subjectId,
            teacherId,
            schoolYearId: targetSchoolYearId,
          },
        })
      }

      // Determine section - use provided section or find an available one
      let classSection = section?.trim() || ""
      
      if (!classSection) {
        // Find existing sections for this subject and school year
        const existingClasses = await tx.class.findMany({
          where: {
            subjectId: subject.id,
            schoolYearId: targetSchoolYearId,
          },
          select: { section: true },
        })
        
        const existingSections = new Set(existingClasses.map(c => c.section.toUpperCase()))
        
        // Try to find an available section (A, B, C, etc.)
        const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
        for (const sec of sections) {
          if (!existingSections.has(sec)) {
            classSection = sec
            break
          }
        }
        
        // If all sections are taken, use teacher's initial
        if (!classSection) {
          classSection = teacher.firstName?.[0]?.toUpperCase() || teacher.lastName?.[0]?.toUpperCase() || "X"
        }
      }

      // Check if a class with this subject, section, and school year already exists
      let classData = await tx.class.findUnique({
        where: {
          subjectId_section_schoolYearId: {
            subjectId: subject.id,
            section: classSection,
            schoolYearId: targetSchoolYearId,
          },
        },
        include: {
          subject: true,
          teacher: true,
          schoolYear: true,
        },
      })

      if (!classData) {
        // Class doesn't exist, create it
        const className = course?.trim() || `${subject.code} - Class`
        classData = await tx.class.create({
          data: {
            name: className,
            section: classSection,
            isIrregular: false,
            dayAndTime: dayTime?.trim() || null,
            classSize: size ? parseInt(size) || null : null,
            departmentHead: departmentHeadName,
            departmentId: departmentId || null,
            subjectId: subject.id,
            teacherId: teacher.id,
            schoolYearId: targetSchoolYearId,
          },
          include: {
            subject: true,
            teacher: true,
            schoolYear: true,
          },
        })
      } else {
        // Class exists, optionally update class info if provided
        if (dayTime?.trim() || size || departmentHeadName || departmentId) {
          classData = await tx.class.update({
            where: {
              id: classData.id,
            },
            data: {
              ...(dayTime?.trim() && { dayAndTime: dayTime.trim() }),
              ...(size && { classSize: parseInt(size) || null }),
              ...(departmentHeadName && { departmentHead: departmentHeadName }),
              ...(departmentId && { departmentId: departmentId }),
            },
            include: {
              subject: true,
              teacher: true,
              schoolYear: true,
            },
          })
        }
      }

      return { assignment, classData }
    })

    revalidatePath("/admin/faculty")
    revalidatePath("/admin/subjects")
    revalidatePath("/teacher/classes")
    revalidatePath("/teacher")
    
    return { success: true, data: result.assignment }
  } catch (error: any) {
    console.error("Error assigning subject:", error)
    // Check for unique constraint violation
    if (error.code === 'P2002') {
      return { success: false, error: "A class with this subject, section, and school year already exists. Please use a different section." }
    }
    return { success: false, error: error.message || "Failed to assign subject and create class" }
  }
}

export async function removeSubjectFromTeacher(subjectId: string, teacherId: string) {
  try {
    // Find all classes associated with this subject-teacher pair
    const classes = await prisma.class.findMany({
      where: {
        subjectId,
        teacherId,
      },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    })

    // Check if any classes have enrollments
    const classesWithEnrollments = classes.filter(c => c._count.enrollments > 0)
    if (classesWithEnrollments.length > 0) {
      return { 
        success: false, 
        error: `Cannot remove assignment: ${classesWithEnrollments.length} class(es) have enrolled students. Please remove students first.` 
      }
    }

    // Delete all classes associated with this subject-teacher pair
    await prisma.class.deleteMany({
      where: {
        subjectId,
        teacherId,
      },
    })

    // Delete the subject assignment using deleteMany
    await prisma.subjectAssignment.deleteMany({
      where: {
        subjectId,
        teacherId,
      },
    })

    revalidatePath("/admin/faculty")
    revalidatePath("/admin/subjects")
    revalidatePath("/teacher/classes")
    
    return { success: true }
  } catch (error) {
    console.error("Error removing subject assignment:", error)
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
            schoolYear: true,
          },
        },
        classes: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            schoolYear: true,
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

export async function getSubjectsAssignedToTeacherManyToMany(teacherId: string, schoolYearId?: string) {
  try {
    // Get the active school year if no schoolYearId provided
    let targetSchoolYearId = schoolYearId
    if (!targetSchoolYearId) {
      const activeSchoolYear = await prisma.schoolYear.findFirst({
        where: { isActive: true },
      })
      targetSchoolYearId = activeSchoolYear?.id
    }

    const assignments = await prisma.subjectAssignment.findMany({
      where: { 
        teacherId,
        ...(targetSchoolYearId && {
          OR: [
            { schoolYearId: targetSchoolYearId },
            { subject: { schoolYearId: targetSchoolYearId } }
          ]
        })
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
        schoolYear: true,
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


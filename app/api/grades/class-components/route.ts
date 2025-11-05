import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createComponentDefinition, deleteComponentDefinition } from "@/lib/actions/grade.actions"
import { revalidatePath } from "next/cache"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')

    if (!classId) {
      return NextResponse.json({
        success: false,
        error: "Missing classId"
      }, { status: 400 })
    }

    // Verify teacher owns this class and get class data
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        schoolYear: true
      },
      select: {
        teacherId: true,
        schoolYear: true,
        schoolYearId: true
      }
    })

    if (!classData) {
      return NextResponse.json({ success: false, error: "Class not found" }, { status: 404 })
    }

    if (session.user.role !== "ADMIN" && classData.teacherId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    // Get all active grade types
    const gradeTypes = await prisma.gradeType.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    })

    // Get global criteria for all grade types (new system)
    const globalCriteria = await prisma.globalGradingCriteria.findMany({
      where: {
        isActive: true,
        schoolYearId: classData.schoolYearId
      },
      include: {
        componentDefinitions: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    })

    // Flatten all global components
    const allComponents = []
    globalCriteria.forEach(criterion => {
      criterion.componentDefinitions.forEach(comp => {
        allComponents.push({
          id: comp.id,
          name: comp.name,
          maxScore: comp.maxScore,
          criteriaId: criterion.id,
          order: comp.order
        })
      })
    })

    // Also check for old class-specific criteria (fallback)
    const oldCriteria = await prisma.gradingCriteria.findMany({
      where: { classId },
      include: {
        componentDefinitions: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    })

    oldCriteria.forEach(criterion => {
      criterion.componentDefinitions.forEach(comp => {
        allComponents.push({
          id: comp.id,
          name: comp.name,
          maxScore: comp.maxScore,
          criteriaId: criterion.id,
          order: comp.order
        })
      })
    })

    return NextResponse.json({
      success: true,
      components: allComponents
    })

  } catch (error: any) {
    console.error("Error loading class components:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to load components"
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { criteriaId, name, maxScore, order } = data

    if (!criteriaId || !name || maxScore === undefined) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields"
      }, { status: 400 })
    }

    // Check if it's a GlobalGradingCriteria (new system) or GradingCriteria (old system)
    const globalCriteria = await prisma.globalGradingCriteria.findUnique({
      where: { id: criteriaId },
      include: {
        gradeType: true
      }
    })

    if (globalCriteria) {
      // For global criteria, teachers can add components if they have a class in the same school year
      // Admins can always add components
      if (session.user.role !== "ADMIN") {
        // Check if teacher has a class in the same school year as the criteria
        const teacherClass = await prisma.class.findFirst({
          where: {
            teacherId: session.user.id,
            schoolYearId: globalCriteria.schoolYearId || undefined
          }
        })

        if (!teacherClass) {
          return NextResponse.json({ 
            success: false, 
            error: "You don't have access to add components for this criteria" 
          }, { status: 403 })
        }
      }

      // Use global component definition
      const { createGlobalComponentDefinition } = await import("@/lib/actions/grade.actions")
      const result = await createGlobalComponentDefinition({
        criteriaId,
        name,
        maxScore,
        order: order || 0
      })

      if (result.success) {
        // Revalidate the class components cache
        revalidatePath("/api/grades/class-components")
        return NextResponse.json(result)
      } else {
        return NextResponse.json(result, { status: 400 })
      }
    }

    // Fallback to old class-specific criteria
    const criteria = await prisma.gradingCriteria.findUnique({
      where: { id: criteriaId },
      include: {
        class: {
          select: { teacherId: true }
        }
      }
    })

    if (!criteria) {
      return NextResponse.json({ success: false, error: "Criteria not found" }, { status: 404 })
    }

    if (session.user.role !== "ADMIN" && criteria.class.teacherId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const result = await createComponentDefinition({
      criteriaId,
      name,
      maxScore,
      order: order || 0
    })

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error: any) {
    console.error("Error creating class component:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to create component"
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const componentId = searchParams.get('componentId')

    if (!componentId) {
      return NextResponse.json({
        success: false,
        error: "Missing componentId"
      }, { status: 400 })
    }

    // Check if it's a global component or class-specific component
    const globalComponent = await prisma.globalComponentDefinition.findUnique({
      where: { id: componentId },
      include: {
        criteria: {
          include: {
            gradeType: true
          }
        }
      }
    })

    if (globalComponent) {
      // For global components, verify teacher has access
      if (session.user.role !== "ADMIN") {
        const teacherClass = await prisma.class.findFirst({
          where: {
            teacherId: session.user.id,
            schoolYearId: globalComponent.criteria.schoolYearId || undefined
          }
        })

        if (!teacherClass) {
          return NextResponse.json({ 
            success: false, 
            error: "You don't have access to delete this component" 
          }, { status: 403 })
        }
      }

      const { deleteGlobalComponentDefinition } = await import("@/lib/actions/grade.actions")
      const result = await deleteGlobalComponentDefinition(componentId)

      if (result.success) {
        return NextResponse.json(result)
      } else {
        return NextResponse.json(result, { status: 400 })
      }
    }

    // Fallback to old class-specific component
    const component = await prisma.componentDefinition.findUnique({
      where: { id: componentId },
      include: {
        criteria: {
          include: {
            class: {
              select: { teacherId: true }
            }
          }
        }
      }
    })

    if (!component) {
      return NextResponse.json({ success: false, error: "Component not found" }, { status: 404 })
    }

    if (session.user.role !== "ADMIN" && component.criteria.class.teacherId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const result = await deleteComponentDefinition(componentId)

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error: any) {
    console.error("Error deleting class component:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to delete component"
    }, { status: 500 })
  }
}

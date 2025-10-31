import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')

    if (!classId) {
      return NextResponse.json({
        success: false,
        error: "Missing classId"
      }, { status: 400 })
    }


    // Get grading criteria for this class
    const criteria = await prisma.gradingCriteria.findMany({
      where: {
        classId,
        isMidterm: true // For now, only midterm components
      },
      include: {
        componentDefinitions: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    })


    // Flatten all components
    const allComponents = []
    criteria.forEach(criterion => {
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

  } catch (error) {
    console.error("Error loading class components:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { criteriaId, name, maxScore, order = 0 } = body

    if (!criteriaId || !name || !maxScore) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields"
      }, { status: 400 })
    }

    const component = await prisma.componentDefinition.create({
      data: {
        criteriaId,
        name,
        maxScore,
        order
      }
    })

    return NextResponse.json({
      success: true,
      component
    })

  } catch (error) {
    console.error("Error creating component:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const componentId = searchParams.get('componentId')

    if (!componentId) {
      return NextResponse.json({
        success: false,
        error: "Missing componentId"
      }, { status: 400 })
    }

    await prisma.componentDefinition.delete({
      where: { id: componentId }
    })

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error("Error deleting component:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}


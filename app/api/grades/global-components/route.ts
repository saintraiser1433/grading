import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createGlobalComponentDefinition, deleteGlobalComponentDefinition } from "@/lib/actions/grade.actions"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gradeTypeId = searchParams.get('gradeTypeId')

    if (!gradeTypeId) {
      return NextResponse.json({
        success: false,
        error: "Missing gradeTypeId"
      }, { status: 400 })
    }


    // Get global criteria for this grade type
    const globalCriteria = await prisma.globalGradingCriteria.findMany({
      where: {
        gradeTypeId,
        isActive: true
      },
      include: {
        componentDefinitions: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    })


    // Flatten all components
    const allComponents = []
    globalCriteria.forEach(criteria => {
      criteria.componentDefinitions.forEach(comp => {
        allComponents.push({
          id: comp.id,
          name: comp.name,
          maxScore: comp.maxScore,
          criteriaId: criteria.id,
          order: comp.order
        })
      })
    })


    return NextResponse.json({
      success: true,
      components: allComponents
    })

  } catch (error) {
    console.error("Error loading global components:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const result = await createGlobalComponentDefinition(data)

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error("Error creating global component definition:", error)
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

    const result = await deleteGlobalComponentDefinition(componentId)

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error("Error deleting global component definition:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}


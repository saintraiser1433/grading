import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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

    console.log("Loading global components for gradeTypeId:", gradeTypeId)

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

    console.log("Found global criteria:", globalCriteria.length)

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

    console.log("Found components:", allComponents.length)

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


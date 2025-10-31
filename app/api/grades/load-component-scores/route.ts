import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const gradeTypeId = searchParams.get('gradeTypeId')

    if (!classId || !gradeTypeId) {
      return NextResponse.json({
        success: false,
        error: "Missing classId or gradeTypeId"
      }, { status: 400 })
    }


    // Get all grades for this class and grade type
    const grades = await prisma.grade.findMany({
      where: {
        classId,
        gradeTypeId
      },
      include: {
        componentScores: {
          include: {
            globalComponentDef: true
          }
        }
      }
    })

    grades.forEach(grade => {
      grade.componentScores.forEach(score => {
      })
    })


    // Create a map of studentId -> componentId -> score
    const scoresMap = new Map()
    grades.forEach(grade => {
      const studentScores = new Map()
      grade.componentScores.forEach(componentScore => {
        studentScores.set(componentScore.globalComponentDefId, {
          id: componentScore.id,
          score: componentScore.score,
          componentId: componentScore.globalComponentDefId
        })
      })
      scoresMap.set(grade.studentId, Object.fromEntries(studentScores))
    })


    return NextResponse.json({
      success: true,
      scores: Object.fromEntries(scoresMap)
    })

  } catch (error) {
    console.error("Error loading component scores:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

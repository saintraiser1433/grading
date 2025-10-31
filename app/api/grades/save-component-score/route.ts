import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    
    const body = await request.json()
    const { gradeId, componentId, score, maxScore } = body
    
    
    // Validate required fields
    if (!gradeId || !componentId || score === undefined) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields"
      }, { status: 400 })
    }
    
    // Check if the grade exists
    const grade = await prisma.grade.findFirst({
      where: { id: gradeId }
    })
    
    if (!grade) {
      return NextResponse.json({
        success: false,
        error: "Grade not found"
      }, { status: 404 })
    }
    
    
    // Check if component score already exists
    const existingScore = await prisma.componentScore.findFirst({
      where: {
        gradeId,
        globalComponentDefId: componentId
      }
    })
    
    
    let componentScore
    if (existingScore) {
      // Update existing component score
      componentScore = await prisma.componentScore.update({
        where: { id: existingScore.id },
        data: {
          score: parseFloat(score),
        }
      })
    } else {
      // Create new component score
      componentScore = await prisma.componentScore.create({
        data: {
          gradeId,
          globalComponentDefId: componentId,
          score: parseFloat(score),
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      componentScore,
      message: "Component score saved successfully"
    })
    
  } catch (error) {
    console.error("Error saving component score:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}


import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    console.log("=== SAVE COMPONENT SCORE API CALLED ===")
    
    const body = await request.json()
    const { gradeId, componentId, score, maxScore } = body
    
    console.log("Received data:", { gradeId, componentId, score, maxScore })
    
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
    
    console.log("Grade found:", grade.id)
    
    // Check if component score already exists
    const existingScore = await prisma.componentScore.findFirst({
      where: {
        gradeId,
        globalComponentDefId: componentId
      }
    })
    
    console.log("Existing component score:", existingScore)
    
    let componentScore
    if (existingScore) {
      // Update existing component score
      componentScore = await prisma.componentScore.update({
        where: { id: existingScore.id },
        data: {
          score: parseFloat(score),
        }
      })
      console.log("Component score updated:", componentScore)
    } else {
      // Create new component score
      componentScore = await prisma.componentScore.create({
        data: {
          gradeId,
          globalComponentDefId: componentId,
          score: parseFloat(score),
        }
      })
      console.log("Component score created:", componentScore)
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


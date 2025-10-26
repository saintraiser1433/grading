import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    console.log("=== TEST COMPONENT SAVE API CALLED ===")
    
    const body = await request.json()
    const { gradeId, componentId, score } = body
    
    console.log("Test data:", { gradeId, componentId, score })
    
    // Test database connection
    await prisma.$connect()
    console.log("Database connected")
    
    // Check if grade exists
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
    
    // Try to create a component score
    const componentScore = await prisma.componentScore.create({
      data: {
        gradeId,
        globalComponentDefId: componentId,
        score: parseFloat(score),
      }
    })
    
    console.log("Component score created:", componentScore)
    
    return NextResponse.json({
      success: true,
      componentScore,
      message: "Test component score created successfully"
    })
    
  } catch (error) {
    console.error("Test component save error:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}


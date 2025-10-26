import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    console.log("=== TEST SAVE API CALLED ===")
    
    // Simple test without transactions
    const gradeCount = await prisma.grade.count()
    console.log("Current grade count:", gradeCount)
    
    return NextResponse.json({
      success: true,
      message: "Test save API working",
      gradeCount
    })
    
  } catch (error) {
    console.error("Test save error:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}


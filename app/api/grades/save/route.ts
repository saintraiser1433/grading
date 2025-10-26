import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    console.log("API route /api/grades/save called")
    
    const body = await request.json()
    const { enrollmentId, classId, studentId, gradeTypeId, finalGrade, remarks } = body

    console.log("API route called with:", {
      enrollmentId,
      classId,
      studentId,
      gradeTypeId,
      finalGrade,
      remarks
    })

    // Test database connection first
    console.log("Testing database connection...")
    await prisma.$connect()
    console.log("Database connected successfully")

    // Check if grade already exists first
    const existingGrade = await prisma.grade.findFirst({
      where: {
        enrollmentId,
        gradeTypeId,
      },
    })

    console.log("Existing grade found:", existingGrade)

    let grade
    if (existingGrade) {
      // Update existing grade
      grade = await prisma.grade.update({
        where: { id: existingGrade.id },
        data: {
          grade: finalGrade,
          remarks,
        },
      })
      console.log("Grade updated:", grade)
    } else {
      // Create new grade
      grade = await prisma.grade.create({
        data: {
          enrollmentId,
          classId,
          studentId,
          gradeTypeId,
          grade: finalGrade,
          remarks,
        },
      })
      console.log("Grade created:", grade)
    }

    console.log("Grade operation completed successfully:", grade)

    // Verify the grade was actually saved by querying it back
    const verification = await prisma.grade.findFirst({
      where: {
        enrollmentId,
        gradeTypeId,
      },
    })

    console.log("Verification query result:", verification)

    // Disconnect from database
    await prisma.$disconnect()
    console.log("Database disconnected")

    return NextResponse.json({ success: true, data: grade })
  } catch (error) {
    console.error("Error in API route:", error)
    
    // Ensure we disconnect even on error
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error("Error disconnecting from database:", disconnectError)
    }
    
    return NextResponse.json(
      { success: false, error: `Failed to save grade: ${error.message}` },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    
    const body = await request.json()
    const { enrollmentId, classId, studentId, gradeTypeId, finalGrade, remarks, status } = body

      enrollmentId,
      classId,
      studentId,
      gradeTypeId,
      finalGrade,
      remarks,
      status
    })

    // Test database connection first
    await prisma.$connect()

    // Check if grade already exists first
    const existingGrade = await prisma.grade.findFirst({
      where: {
        enrollmentId,
        gradeTypeId,
      },
    })


    let grade
    if (existingGrade) {
      // Update existing grade
      grade = await prisma.grade.update({
        where: { id: existingGrade.id },
        data: {
          grade: finalGrade,
          remarks,
          status: status || 'NORMAL',
        },
      })
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
          status: status || 'NORMAL',
        },
      })
    }


    // Verify the grade was actually saved by querying it back
    const verification = await prisma.grade.findFirst({
      where: {
        enrollmentId,
        gradeTypeId,
      },
    })


    // Disconnect from database
    await prisma.$disconnect()

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

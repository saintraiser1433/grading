import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    console.log("=== SIMPLE SAVE API CALLED ===")
    
    const body = await request.json()
    console.log("Request body:", body)
    
    // Get the first enrollment and grade type from the database
    const enrollment = await prisma.enrollment.findFirst()
    const gradeType = await prisma.gradeType.findFirst()
    
    if (!enrollment || !gradeType) {
      return NextResponse.json({
        success: false,
        error: "No enrollment or grade type found"
      }, { status: 400 })
    }
    
    console.log("Using enrollment:", enrollment.id)
    console.log("Using grade type:", gradeType.id)
    
    // Check if grade already exists
    const existingGrade = await prisma.grade.findFirst({
      where: {
        enrollmentId: enrollment.id,
        gradeTypeId: gradeType.id
      }
    })
    
    let grade
    if (existingGrade) {
      // Update existing grade
      grade = await prisma.grade.update({
        where: { id: existingGrade.id },
        data: {
          grade: 2.5,
          remarks: "SIMPLE TEST UPDATED"
        }
      })
      console.log("Grade updated successfully:", grade)
    } else {
      // Create new grade
      grade = await prisma.grade.create({
        data: {
          enrollmentId: enrollment.id,
          classId: enrollment.classId,
          studentId: enrollment.studentId,
          gradeTypeId: gradeType.id,
          grade: 2.5,
          remarks: "SIMPLE TEST"
        }
      })
      console.log("Grade created successfully:", grade)
    }
    
    return NextResponse.json({
      success: true,
      grade,
      message: "Simple grade created successfully"
    })
    
  } catch (error) {
    console.error("Simple save error:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

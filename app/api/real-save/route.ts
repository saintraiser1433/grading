import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    console.log("=== REAL SAVE API CALLED ===")
    
    const body = await request.json()
    const { enrollmentId, classId, studentId, gradeTypeId, finalGrade, remarks, status } = body
    
    console.log("Received data:", { enrollmentId, classId, studentId, gradeTypeId, finalGrade, remarks, status })
    
    // Validate required fields
    if (!enrollmentId || !classId || !studentId || !gradeTypeId) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields"
      }, { status: 400 })
    }
    
    // Check if the enrollment exists
    const enrollment = await prisma.enrollment.findFirst({
      where: { id: enrollmentId }
    })
    
    if (!enrollment) {
      return NextResponse.json({
        success: false,
        error: "Enrollment not found"
      }, { status: 404 })
    }
    
    console.log("Enrollment found:", enrollment.id)
    
    // Check if the grade type exists
    const gradeType = await prisma.gradeType.findFirst({
      where: { id: gradeTypeId }
    })
    
    if (!gradeType) {
      return NextResponse.json({
        success: false,
        error: "Grade type not found"
      }, { status: 404 })
    }
    
    console.log("Grade type found:", gradeType.id)
    
    // Check if grade already exists first
    const existingGrade = await prisma.grade.findFirst({
      where: {
        enrollmentId,
        gradeTypeId
      }
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
          status: status || 'NORMAL'
        }
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
          status: status || 'NORMAL'
        }
      })
      console.log("Grade created:", grade)
    }
    
    console.log("Grade operation completed:", grade)
    
    // Also save component scores if provided
    if (body.allComponentScores) {
      console.log("Saving component scores for all students:", body.allComponentScores)
      
      // Save component scores for all students
      for (const [studentId, studentComponentScores] of Object.entries(body.allComponentScores)) {
        console.log(`Saving component scores for student ${studentId}:`, studentComponentScores)
        
        // Find the grade for this student
        const studentGrade = await prisma.grade.findFirst({
          where: {
            studentId,
            gradeTypeId: body.gradeTypeId
          }
        })
        
        if (studentGrade) {
          console.log(`Found grade for student ${studentId}:`, studentGrade.id)
          
          // Save each component score for this student
          for (const [componentId, score] of Object.entries(studentComponentScores)) {
            try {
              // Check if component score already exists
              const existingScore = await prisma.componentScore.findFirst({
                where: {
                  gradeId: studentGrade.id,
                  globalComponentDefId: componentId
                }
              })
              
              if (existingScore) {
                // Update existing component score
                await prisma.componentScore.update({
                  where: { id: existingScore.id },
                  data: {
                    score: parseFloat(score as string),
                  }
                })
                console.log(`Component score updated for student ${studentId}:`, componentId, score)
              } else {
                // Create new component score
                await prisma.componentScore.create({
                  data: {
                    gradeId: studentGrade.id,
                    globalComponentDefId: componentId,
                    score: parseFloat(score as string),
                  }
                })
                console.log(`Component score created for student ${studentId}:`, componentId, score)
              }
            } catch (componentError) {
              console.error(`Error saving component score for student ${studentId}:`, componentId, componentError)
            }
          }
        } else {
          console.log(`No grade found for student ${studentId}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      grade,
      message: "Grade saved successfully"
    })
    
  } catch (error) {
    console.error("Real save error:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

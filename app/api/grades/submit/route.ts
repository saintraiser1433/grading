import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({
        success: false,
        error: "Unauthorized"
      }, { status: 401 })
    }
    
    const body = await request.json()
    const { classId, teacherId, schoolYearId, gradeTypeId } = body
    
    
    // Validate required fields
    if (!classId || !teacherId || !schoolYearId) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields"
      }, { status: 400 })
    }
    
    // Check if the class exists and belongs to the teacher
    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: teacherId
      }
    })
    
    if (!classData) {
      return NextResponse.json({
        success: false,
        error: "Class not found or access denied"
      }, { status: 404 })
    }
    
    // Check if there's already a pending submission for this class and grade type
    const existingSubmission = await prisma.gradeSubmission.findFirst({
      where: {
        classId,
        teacherId,
        gradeTypeId: gradeTypeId || null,
        status: "PENDING"
      }
    })
    
    if (existingSubmission) {
      return NextResponse.json({
        success: false,
        error: "There is already a pending submission for this class and grade type"
      }, { status: 400 })
    }
    
    // Create the grade submission
    const submission = await prisma.gradeSubmission.create({
      data: {
        classId,
        teacherId,
        schoolYearId,
        gradeTypeId: gradeTypeId || null,
        status: "PENDING",
        submittedAt: new Date()
      },
      include: {
        class: {
          include: {
            subject: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        schoolYear: {
          select: {
            id: true,
            year: true,
            semester: true
          }
        }
      }
    })
    
    
    return NextResponse.json({
      success: true,
      data: submission,
      message: "Grades submitted for approval"
    })
    
  } catch (error) {
    console.error("Grade submission error:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to submit grades",
      stack: error.stack
    }, { status: 500 })
  }
}

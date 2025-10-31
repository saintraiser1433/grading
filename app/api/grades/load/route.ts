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


    // Get all enrollments for this class
    const enrollments = await prisma.enrollment.findMany({
      where: { classId },
      include: {
        student: true
      }
    })


    // Get existing grades for this class and grade type
    const existingGrades = await prisma.grade.findMany({
      where: {
        classId,
        gradeTypeId
      },
      include: {
        student: true,
        gradeType: true
      }
    })


    // Create a map of studentId -> grade data
    const gradesMap = new Map()
    existingGrades.forEach(grade => {
      gradesMap.set(grade.studentId, {
        id: grade.id,
        grade: grade.grade,
        remarks: grade.remarks,
        status: grade.status,
        studentId: grade.studentId,
        enrollmentId: grade.enrollmentId
      })
    })

    return NextResponse.json({
      success: true,
      grades: Object.fromEntries(gradesMap),
      enrollments: enrollments.map(e => ({
        id: e.id,
        studentId: e.studentId,
        student: e.student
      }))
    })

  } catch (error) {
    console.error("Error loading grades:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}


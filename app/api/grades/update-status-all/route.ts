import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, enrollmentId, status, classId } = body

    // Validate required fields
    if (!studentId || !enrollmentId || !status || !classId) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields"
      }, { status: 400 })
    }

    // If status is DROPPED, update all grade types for this student
    if (status === 'DROPPED') {
      // Find all grades for this student in this class
      const allGrades = await prisma.grade.findMany({
        where: {
          enrollmentId,
          classId
        }
      })

      // Update all grades to DROPPED status
      const updatePromises = allGrades.map(grade =>
        prisma.grade.update({
          where: { id: grade.id },
          data: { status: 'DROPPED' }
        })
      )

      await Promise.all(updatePromises)

      return NextResponse.json({
        success: true,
        message: `Updated ${allGrades.length} grade(s) to DROPPED status`,
        updatedCount: allGrades.length
      })
    }

    // For non-DROPPED status, just return success (regular save will handle it)
    return NextResponse.json({
      success: true,
      message: "Status update not needed (only DROPPED status propagates)"
    })

  } catch (error) {
    console.error("Error updating status across all grade types:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to update status"
    }, { status: 500 })
  }
}


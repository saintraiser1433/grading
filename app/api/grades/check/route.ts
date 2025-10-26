import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const enrollmentId = searchParams.get('enrollmentId')
    const classId = searchParams.get('classId')
    const gradeTypeId = searchParams.get('gradeTypeId')

    if (!enrollmentId || !classId || !gradeTypeId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      )
    }

    const grade = await prisma.grade.findFirst({
      where: {
        enrollmentId,
        gradeTypeId,
      },
    })

    return NextResponse.json({ 
      success: true, 
      found: !!grade,
      grade 
    })
  } catch (error) {
    console.error("Error checking grade:", error)
    return NextResponse.json(
      { success: false, error: `Failed to check grade: ${error.message}` },
      { status: 500 }
    )
  }
}

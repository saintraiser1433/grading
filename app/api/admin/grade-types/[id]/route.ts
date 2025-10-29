import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { name, description, percentage, order } = body

    // Validate required fields
    if (!name || percentage === undefined || order === undefined) {
      return NextResponse.json(
        { error: "Name, percentage, and order are required" },
        { status: 400 }
      )
    }

    // Check if grade type exists
    const existingGradeType = await prisma.gradeType.findUnique({
      where: { id },
    })

    if (!existingGradeType) {
      return NextResponse.json(
        { error: "Grade type not found" },
        { status: 404 }
      )
    }

    // Update grade type
    const updatedGradeType = await prisma.gradeType.update({
      where: { id },
      data: {
        name,
        description: description || null,
        percentage: Number(percentage),
        order: Number(order),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Grade type updated successfully",
      data: updatedGradeType,
    })
  } catch (error) {
    console.error("Error updating grade type:", error)
    return NextResponse.json(
      { error: "Failed to update grade type" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Check if grade type exists
    const gradeType = await prisma.gradeType.findUnique({
      where: { id },
    })

    if (!gradeType) {
      return NextResponse.json(
        { error: "Grade type not found" },
        { status: 404 }
      )
    }

    // Delete grade type
    await prisma.gradeType.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: "Grade type deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting grade type:", error)
    return NextResponse.json(
      { error: "Failed to delete grade type" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, percentage, order } = body

    // Validate required fields
    if (!name || percentage === undefined || order === undefined) {
      return NextResponse.json(
        { error: "Name, percentage, and order are required" },
        { status: 400 }
      )
    }

    // Validate percentage is between 0 and 100
    if (percentage < 0 || percentage > 100) {
      return NextResponse.json(
        { error: "Percentage must be between 0 and 100" },
        { status: 400 }
      )
    }

    // Create grade type
    const gradeType = await prisma.gradeType.create({
      data: {
        name,
        description: description || null,
        percentage,
        order,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: gradeType,
    })
  } catch (error) {
    console.error("Error creating grade type:", error)
    return NextResponse.json(
      { error: "Failed to create grade type" },
      { status: 500 }
    )
  }
}


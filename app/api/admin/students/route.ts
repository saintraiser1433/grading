import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { approveStudent, rejectStudent } from "@/lib/actions/student-registration.actions"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const studentId = formData.get("studentId") as string
    const reason = formData.get("reason") as string
    const action = formData.get("action") as string

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 })
    }

    if (action === "reject") {
      if (!reason?.trim()) {
        return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 })
      }
      
      const result = await rejectStudent(studentId, reason, session.user.id)
      if (result.success) {
        return NextResponse.json({ success: true, message: "Student rejected successfully" })
      } else {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
    } else {
      // Default to approve action
      const result = await approveStudent(studentId, session.user.id)
      if (result.success) {
        return NextResponse.json({ success: true, message: "Student approved successfully" })
      } else {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
    }
  } catch (error) {
    console.error("Error in students API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


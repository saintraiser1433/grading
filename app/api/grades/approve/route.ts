import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({
        success: false,
        error: "Unauthorized"
      }, { status: 401 })
    }
    
    const body = await request.json()
    const { submissionId, adminId, action, comments } = body
    
    
    // Validate required fields
    if (!submissionId || !adminId || !action) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields"
      }, { status: 400 })
    }

    // Validate action
    if (!["approve", "decline"].includes(action)) {
      return NextResponse.json({
        success: false,
        error: "Invalid action. Must be 'approve' or 'decline'"
      }, { status: 400 })
    }

    // Get the submission
    const submission = await prisma.gradeSubmission.findUnique({
      where: { id: submissionId },
      include: {
        class: {
          include: {
            subject: true
          }
        }
      }
    })

    if (!submission) {
      return NextResponse.json({
        success: false,
        error: "Submission not found"
      }, { status: 404 })
    }

    // Check if submission is still pending
    if (submission.status !== "PENDING") {
      return NextResponse.json({
        success: false,
        error: "Submission is no longer pending"
      }, { status: 400 })
    }

    // Update the submission
    const updatedSubmission = await prisma.gradeSubmission.update({
      where: { id: submissionId },
      data: {
        status: action === "approve" ? "APPROVED" : "DECLINED",
        approverId: adminId,
        approvedAt: new Date(),
        comments: comments || null
      },
      include: {
        class: {
          include: {
            subject: true,
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
      message: `Submission ${action === "approve" ? "approved" : "declined"} successfully`
    })

  } catch (error) {
    console.error("Grade approval API error:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

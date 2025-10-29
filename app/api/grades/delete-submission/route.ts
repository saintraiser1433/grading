import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { submissionId } = await request.json()

    if (!submissionId) {
      return NextResponse.json({ success: false, error: 'Submission ID is required' }, { status: 400 })
    }

    // Check if the submission exists and belongs to the current user
    const submission = await prisma.gradeSubmission.findFirst({
      where: {
        id: submissionId,
        teacherId: session.user.id,
        status: 'PENDING' // Only allow deletion of PENDING submissions
      }
    })

    if (!submission) {
      return NextResponse.json({ 
        success: false, 
        error: 'Submission not found or cannot be deleted' 
      }, { status: 404 })
    }

    // Delete the submission (this will cascade delete related component scores due to the schema)
    await prisma.gradeSubmission.delete({
      where: {
        id: submissionId
      }
    })

    // Revalidate relevant pages
    revalidatePath("/teacher/submissions")
    revalidatePath("/teacher/classes")
    revalidatePath("/admin/submissions")

    return NextResponse.json({ 
      success: true, 
      message: 'Submission deleted successfully' 
    })

  } catch (error) {
    console.error('Delete submission error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete submission' 
    }, { status: 500 })
  }
}

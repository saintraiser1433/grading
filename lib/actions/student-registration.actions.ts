"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  StudentRegistrationSchema,
  ApproveUserSchema,
  CreateEnrollmentDocumentSchema,
  type StudentRegistrationInput,
  type ApproveUserInput,
  type CreateEnrollmentDocumentInput,
} from "@/lib/schemas"

export async function registerStudent(data: StudentRegistrationInput) {
  try {
    const validated = StudentRegistrationSchema.parse(data)

    // Check if email or student ID already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validated.email },
          { studentId: validated.studentId },
        ],
      },
    })

    if (existingUser) {
      return { 
        success: false, 
        error: existingUser.email === validated.email 
          ? "Email already registered" 
          : "Student ID already exists" 
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10)

    const user = await prisma.user.create({
      data: {
        ...validated,
        password: hashedPassword,
        role: "STUDENT",
        status: "PENDING",
      },
    })

    revalidatePath("/admin/students")
    return { success: true, data: user }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to register student" }
  }
}

export async function approveUser(data: ApproveUserInput) {
  try {
    const validated = ApproveUserSchema.parse(data)

    const user = await prisma.user.update({
      where: { id: validated.id },
      data: {
        status: validated.status,
        approvedBy: validated.status === "APPROVED" ? "admin" : null, // TODO: Get actual admin ID
        approvedAt: validated.status === "APPROVED" ? new Date() : null,
        rejectionReason: validated.status === "REJECTED" ? validated.rejectionReason : null,
      },
    })

    revalidatePath("/admin/students")
    return { success: true, data: user }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to update user status" }
  }
}

export async function getPendingStudents() {
  try {
    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        status: "PENDING",
      },
      include: {
        enrollmentDocuments: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: students }
  } catch (error) {
    return { success: false, error: "Failed to fetch pending students" }
  }
}

export async function getApprovedStudents() {
  try {
    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        status: "APPROVED",
      },
      include: {
        enrollmentDocuments: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: students }
  } catch (error) {
    return { success: false, error: "Failed to fetch approved students" }
  }
}

export async function getRejectedStudents() {
  try {
    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        status: "REJECTED",
      },
      include: {
        enrollmentDocuments: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: students }
  } catch (error) {
    return { success: false, error: "Failed to fetch rejected students" }
  }
}

export async function uploadEnrollmentDocument(data: CreateEnrollmentDocumentInput) {
  try {
    console.log("uploadEnrollmentDocument called with data:", data)
    
    const validated = CreateEnrollmentDocumentSchema.parse(data)
    console.log("Validation successful:", validated)

    const document = await prisma.enrollmentDocument.create({
      data: validated,
    })
    console.log("Document created successfully:", document)

    revalidatePath("/student/documents")
    return { success: true, data: document }
  } catch (error) {
    console.error("Error in uploadEnrollmentDocument:", error)
    if (error instanceof z.ZodError) {
      console.error("Zod validation error:", error.errors)
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to upload document" }
  }
}

export async function getStudentDocuments(userId: string) {
  try {
    const documents = await prisma.enrollmentDocument.findMany({
      where: { userId },
      orderBy: { uploadedAt: "desc" },
    })

    return { success: true, data: documents }
  } catch (error) {
    return { success: false, error: "Failed to fetch documents" }
  }
}

export async function approveStudent(studentId: string, approvedBy: string) {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: studentId },
      data: {
        status: "APPROVED",
        approvedBy,
        approvedAt: new Date(),
      },
    })

    revalidatePath("/admin/students")
    return { success: true, data: updatedUser }
  } catch (error) {
    console.error("Error approving student:", error)
    return { success: false, error: "Failed to approve student" }
  }
}

export async function rejectStudent(studentId: string, reason: string, rejectedBy: string) {
  try {
    // First, delete all enrollment documents associated with the user
    await prisma.enrollmentDocument.deleteMany({
      where: { userId: studentId },
    })

    // Then delete the user completely
    const deletedUser = await prisma.user.delete({
      where: { id: studentId },
    })

    revalidatePath("/admin/students")
    return { success: true, data: deletedUser }
  } catch (error) {
    console.error("Error rejecting and deleting student:", error)
    return { success: false, error: "Failed to reject and delete student" }
  }
}

export async function deleteEnrollmentDocument(id: string) {
  try {
    await prisma.enrollmentDocument.delete({
      where: { id },
    })

    revalidatePath("/student/documents")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete document" }
  }
}

// Upload file to server and return file info
export async function uploadFileToServer(file: File): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/upload`, {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error uploading file:", error)
    return { success: false, error: "Failed to upload file" }
  }
}



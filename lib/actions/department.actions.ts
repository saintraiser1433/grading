"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  CreateDepartmentSchema,
  UpdateDepartmentSchema,
  type CreateDepartmentInput,
  type UpdateDepartmentInput,
} from "@/lib/schemas"

export async function createDepartment(data: CreateDepartmentInput) {
  try {
    const validated = CreateDepartmentSchema.parse(data)

    const department = await prisma.department.create({
      data: validated,
    })

    revalidatePath("/admin/departments")
    return { success: true, data: department }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to create department" }
  }
}

export async function updateDepartment(data: UpdateDepartmentInput) {
  try {
    const validated = UpdateDepartmentSchema.parse(data)

    const department = await prisma.department.update({
      where: { id: validated.id },
      data: validated,
    })

    revalidatePath("/admin/departments")
    return { success: true, data: department }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to update department" }
  }
}

export async function deleteDepartment(id: string) {
  try {
    await prisma.department.delete({
      where: { id },
    })

    revalidatePath("/admin/departments")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete department" }
  }
}

export async function getDepartments() {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
    })

    return { success: true, data: departments }
  } catch (error) {
    return { success: false, error: "Failed to fetch departments" }
  }
}

export async function getDepartmentById(id: string) {
  try {
    const department = await prisma.department.findUnique({
      where: { id },
    })

    return { success: true, data: department }
  } catch (error) {
    return { success: false, error: "Failed to fetch department" }
  }
}




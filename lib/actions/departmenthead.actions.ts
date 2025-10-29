"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  CreateDepartmentHeadSchema,
  UpdateDepartmentHeadSchema,
  type CreateDepartmentHeadInput,
  type UpdateDepartmentHeadInput,
} from "@/lib/schemas"

export async function createDepartmentHead(data: CreateDepartmentHeadInput) {
  try {
    const validated = CreateDepartmentHeadSchema.parse(data)

    const departmentHead = await prisma.departmentHead.create({
      data: validated,
    })

    revalidatePath("/admin/department-heads")
    return { success: true, data: departmentHead }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to create department head" }
  }
}

export async function updateDepartmentHead(data: UpdateDepartmentHeadInput) {
  try {
    const validated = UpdateDepartmentHeadSchema.parse(data)

    const departmentHead = await prisma.departmentHead.update({
      where: { id: validated.id },
      data: validated,
    })

    revalidatePath("/admin/department-heads")
    return { success: true, data: departmentHead }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to update department head" }
  }
}

export async function deleteDepartmentHead(id: string) {
  try {
    await prisma.departmentHead.delete({
      where: { id },
    })

    revalidatePath("/admin/department-heads")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete department head" }
  }
}

export async function getDepartmentHeads() {
  try {
    const departmentHeads = await prisma.departmentHead.findMany({
      orderBy: [
        { isActive: "desc" },
        { name: "asc" },
      ],
    })

    return { success: true, data: departmentHeads }
  } catch (error) {
    return { success: false, error: "Failed to fetch department heads" }
  }
}

export async function getActiveDepartmentHeads() {
  try {
    const departmentHeads = await prisma.departmentHead.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    })

    return { success: true, data: departmentHeads }
  } catch (error) {
    return { success: false, error: "Failed to fetch active department heads" }
  }
}

export async function getDepartmentHeadById(id: string) {
  try {
    const departmentHead = await prisma.departmentHead.findUnique({
      where: { id },
    })

    return { success: true, data: departmentHead }
  } catch (error) {
    return { success: false, error: "Failed to fetch department head" }
  }
}




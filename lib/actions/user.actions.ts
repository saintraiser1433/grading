"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  CreateUserSchema,
  UpdateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/schemas"

export async function createUser(data: CreateUserInput) {
  try {
    const validated = CreateUserSchema.parse(data)

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10)

    const user = await prisma.user.create({
      data: {
        ...validated,
        password: hashedPassword,
      },
    })

    revalidatePath("/admin/users")
    return { success: true, data: user }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to create user" }
  }
}

export async function updateUser(data: UpdateUserInput) {
  try {
    const validated = UpdateUserSchema.parse(data)
    const { id, password, ...rest } = validated

    const updateData: any = { ...rest }

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    })

    revalidatePath("/admin/users")
    return { success: true, data: user }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to update user" }
  }
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({
      where: { id },
    })

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete user" }
  }
}

export async function getUsers(role?: string) {
  try {
    const users = await prisma.user.findMany({
      where: role ? { role: role as any } : undefined,
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: users }
  } catch (error) {
    return { success: false, error: "Failed to fetch users" }
  }
}

export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    })

    return { success: true, data: user }
  } catch (error) {
    return { success: false, error: "Failed to fetch user" }
  }
}

export async function getTeachers() {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: "TEACHER" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        employeeId: true,
      },
      orderBy: { firstName: "asc" },
    })

    return { success: true, data: teachers }
  } catch (error) {
    return { success: false, error: "Failed to fetch teachers" }
  }
}


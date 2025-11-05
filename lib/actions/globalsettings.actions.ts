"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getGlobalSetting(key: string) {
  try {
    const setting = await prisma.globalSettings.findUnique({
      where: { key },
    })

    return { success: true, data: setting }
  } catch (error) {
    return { success: false, error: "Failed to fetch global setting" }
  }
}

export async function setGlobalSetting(key: string, value: string, description?: string) {
  try {
    const setting = await prisma.globalSettings.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    })

    revalidatePath("/admin/settings")
    return { success: true, data: setting }
  } catch (error) {
    return { success: false, error: "Failed to set global setting" }
  }
}

export async function getAllGlobalSettings() {
  try {
    const settings = await prisma.globalSettings.findMany({
      orderBy: { key: "asc" },
    })

    return { success: true, data: settings }
  } catch (error) {
    return { success: false, error: "Failed to fetch global settings" }
  }
}

export async function deleteGlobalSetting(key: string) {
  try {
    await prisma.globalSettings.delete({
      where: { key },
    })

    revalidatePath("/admin/settings")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete global setting" }
  }
}

// Specific functions for common settings
export async function getVpAcademics() {
  const result = await getGlobalSetting("VP_ACADEMICS")
  return result.success ? result.data?.value || "HECTOR L. LAVILLES JR., Ph.D.Ed." : "HECTOR L. LAVILLES JR., Ph.D.Ed."
}

export async function setVpAcademics(name: string) {
  return await setGlobalSetting("VP_ACADEMICS", name, "Vice President for Academics")
}

export async function getRegistrar() {
  const result = await getGlobalSetting("REGISTRAR")
  return result.success ? result.data?.value || "" : ""
}

export async function setRegistrar(name: string) {
  return await setGlobalSetting("REGISTRAR", name, "Registrar Name")
}

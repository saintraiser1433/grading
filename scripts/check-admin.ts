import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🔍 Checking admin users...")
  
  const adminUsers = await prisma.user.findMany({
    where: { role: "ADMIN" }
  })
  
  console.log("Admin users found:", adminUsers.length)
  adminUsers.forEach(user => {
    console.log(`- ${user.email} (${user.firstName} ${user.lastName})`)
  })
  
  const gradeTypes = await prisma.gradeType.findMany()
  console.log("\nGrade types found:", gradeTypes.length)
  gradeTypes.forEach(gt => {
    console.log(`- ${gt.name} (${gt.description})`)
  })
  
  const globalCriteria = await prisma.globalGradingCriteria.findMany({
    include: { gradeType: true }
  })
  console.log("\nGlobal criteria found:", globalCriteria.length)
  globalCriteria.forEach(criteria => {
    console.log(`- ${criteria.name} (${criteria.percentage}%) - ${criteria.gradeType.name}`)
  })
  
  await prisma.$disconnect()
}

main().catch(console.error)


import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🧪 Testing admin grading criteria page data...")
  
  try {
    // Test the same queries as the admin page
    const [gradeTypes, globalCriteria] = await Promise.all([
      prisma.gradeType.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
      }),
      prisma.globalGradingCriteria.findMany({
        where: { isActive: true },
        include: {
          gradeType: true,
          componentDefinitions: {
            where: { isActive: true },
            orderBy: { order: "asc" },
          },
        },
        orderBy: [
          { gradeType: { order: "asc" } },
          { order: "asc" }
        ],
      }),
    ])
    
    console.log("✅ Grade types loaded:", gradeTypes.length)
    console.log("✅ Global criteria loaded:", globalCriteria.length)
    
    gradeTypes.forEach(gt => {
      console.log(`  - ${gt.name} (Order: ${gt.order})`)
    })
    
    globalCriteria.forEach(criteria => {
      console.log(`  - ${criteria.name} (${criteria.percentage}%) - ${criteria.gradeType.name}`)
      console.log(`    Components: ${criteria.componentDefinitions.length}`)
    })
    
  } catch (error) {
    console.error("❌ Error loading data:", error)
  }
  
  await prisma.$disconnect()
}

main().catch(console.error)


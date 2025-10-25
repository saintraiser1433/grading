import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🧹 Cleaning up duplicate criteria...\n")

  // Find the class
  const classData = await prisma.class.findFirst({
    where: {
      name: "BSCS 4",
      section: "A",
    },
  })

  if (!classData) {
    console.log("❌ Class not found")
    return
  }

  // Get all midterm criteria
  const allCriteria = await prisma.gradingCriteria.findMany({
    where: {
      classId: classData.id,
      isMidterm: true,
    },
    orderBy: {
      createdAt: 'asc', // Keep the oldest ones (first created)
    },
  })

  console.log(`Found ${allCriteria.count} total criteria\n`)

  // Group by name
  const groups = new Map<string, typeof allCriteria>()
  allCriteria.forEach(c => {
    if (!groups.has(c.name)) {
      groups.set(c.name, [])
    }
    groups.get(c.name)!.push(c)
  })

  // For each group, keep the first, delete the rest
  let deletedCount = 0

  for (const [name, criteria] of groups.entries()) {
    if (criteria.length > 1) {
      console.log(`${name}: Found ${criteria.length} duplicates`)
      
      // Keep the first one
      const toKeep = criteria[0]
      const toDelete = criteria.slice(1)
      
      console.log(`  Keeping: ${toKeep.id}`)
      
      for (const dup of toDelete) {
        console.log(`  Deleting: ${dup.id}`)
        
        // First, delete all grade components linked to this criteria
        const deletedComponents = await prisma.gradeComponent.deleteMany({
          where: { criteriaId: dup.id },
        })
        console.log(`    - Deleted ${deletedComponents.count} grade components`)
        
        // Then delete the criteria
        await prisma.gradingCriteria.delete({
          where: { id: dup.id },
        })
        
        deletedCount++
      }
      console.log()
    }
  }

  console.log(`\n✅ Deleted ${deletedCount} duplicate criteria`)

  // Verify
  const remainingCriteria = await prisma.gradingCriteria.findMany({
    where: {
      classId: classData.id,
      isMidterm: true,
    },
  })

  const total = remainingCriteria.reduce((sum, c) => sum + c.percentage, 0)

  console.log("\n📊 FINAL STATUS:")
  console.log("─".repeat(50))
  remainingCriteria.forEach(c => {
    console.log(`${c.name.padEnd(20)} ${c.percentage}%`)
  })
  console.log("─".repeat(50))
  console.log(`TOTAL: ${total}%`)

  if (Math.abs(total - 100) < 0.01) {
    console.log("✅ Valid! Now equals 100%")
  } else {
    console.log(`⚠️ Total is ${total}%`)
  }

  console.log("\n✨ Cleanup complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🔧 Resetting grading criteria...")

  // Find the CS THESIS 1 class
  const classData = await prisma.class.findFirst({
    where: {
      name: "BSCS 4",
      section: "A",
    },
    include: {
      subject: true,
    },
  })

  if (!classData) {
    console.log("❌ Class not found")
    return
  }

  console.log(`Found class: ${classData.name} - ${classData.section}`)

  // Delete existing grading criteria for this class
  const deleted = await prisma.gradingCriteria.deleteMany({
    where: {
      classId: classData.id,
    },
  })

  console.log(`✓ Deleted ${deleted.count} existing criteria`)

  // Create new criteria (100% total)
  const criteria = await prisma.gradingCriteria.createMany({
    data: [
      {
        classId: classData.id,
        name: "QUIZZES",
        percentage: 40,
        isMidterm: true,
        order: 0,
      },
      {
        classId: classData.id,
        name: "CLASS STANDING",
        percentage: 20,
        isMidterm: true,
        order: 1,
      },
      {
        classId: classData.id,
        name: "PROJECTS",
        percentage: 10,
        isMidterm: true,
        order: 2,
      },
      {
        classId: classData.id,
        name: "MAJOR EXAM",
        percentage: 30,
        isMidterm: true,
        order: 3,
      },
    ],
  })

  console.log(`✓ Created ${criteria.count} new criteria`)

  // Verify total
  const allCriteria = await prisma.gradingCriteria.findMany({
    where: {
      classId: classData.id,
      isMidterm: true,
    },
  })

  const total = allCriteria.reduce((sum, c) => sum + c.percentage, 0)
  console.log(`\n📊 Total percentage: ${total}%`)

  if (Math.abs(total - 100) < 0.01) {
    console.log("✅ Criteria is valid (100%)")
  } else {
    console.log(`⚠️ Criteria total is ${total}%, should be 100%`)
  }

  console.log("\n✨ Criteria reset complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


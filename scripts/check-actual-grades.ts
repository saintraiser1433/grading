import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🔍 Checking actual grades in database...\n")

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

  // Get first 3 students' grades to check
  const grades = await prisma.grade.findMany({
    where: {
      classId: classData.id,
      isMidterm: true,
    },
    include: {
      student: true,
      components: {
        include: {
          criteria: true,
        },
      },
    },
    take: 3,
  })

  console.log(`Found ${grades.length} sample grades\n`)

  grades.forEach((grade, i) => {
    console.log(`${i + 1}. ${grade.student.firstName} ${grade.student.lastName}`)
    console.log(`   ID: ${grade.id}`)
    console.log(`   Final Grade: ${grade.finalGrade} (${grade.remarks})`)
    console.log(`   Components:`)
    
    grade.components.forEach(comp => {
      console.log(`     - ${comp.criteria.name}: ${comp.score}/${comp.maxScore}`)
    })
    console.log()
  })

  // Check if grade components exist
  const totalComponents = await prisma.gradeComponent.count()
  console.log(`\nTotal grade components in database: ${totalComponents}`)
  console.log(`Expected (50 students × 4 criteria): ${50 * 4} = 200`)

  if (totalComponents === 200) {
    console.log("✅ All grades exist in database!")
  } else {
    console.log(`⚠️ Missing some grade data (have ${totalComponents}, expected 200)`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🔍 Checking grading criteria...")

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

  console.log(`\nClass: ${classData.name} - ${classData.section}`)
  console.log(`Subject: ${classData.subject.code}\n`)

  // Get midterm criteria
  const midtermCriteria = await prisma.gradingCriteria.findMany({
    where: {
      classId: classData.id,
      isMidterm: true,
    },
    orderBy: {
      order: 'asc',
    },
  })

  console.log("📊 MIDTERM CRITERIA:")
  console.log("─".repeat(50))

  let midtermTotal = 0
  midtermCriteria.forEach((c, i) => {
    console.log(`${i + 1}. ${c.name.padEnd(20)} ${c.percentage}%`)
    midtermTotal += c.percentage
  })

  console.log("─".repeat(50))
  console.log(`TOTAL: ${midtermTotal}%`)

  if (Math.abs(midtermTotal - 100) < 0.01) {
    console.log("✅ Valid (100%)\n")
  } else {
    console.log(`❌ Invalid! Should be 100%, got ${midtermTotal}%\n`)
  }

  // Check for duplicates
  const duplicates = midtermCriteria.filter((c, i, arr) => 
    arr.findIndex(x => x.name === c.name && x.id !== c.id) !== -1
  )

  if (duplicates.length > 0) {
    console.log("⚠️ DUPLICATE CRITERIA FOUND:")
    duplicates.forEach(d => {
      console.log(`  - ${d.name} (ID: ${d.id})`)
    })
    console.log("\nTo fix: Delete duplicate records in Prisma Studio")
    console.log("URL: http://localhost:5555")
  }

  // Count enrollments and grades
  const enrollmentCount = await prisma.enrollment.count({
    where: { classId: classData.id },
  })

  const gradeCount = await prisma.grade.count({
    where: { classId: classData.id, isMidterm: true },
  })

  console.log(`\n👥 Enrollments: ${enrollmentCount}`)
  console.log(`📝 Grades: ${gradeCount}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function randomScore(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function percentageToGrade(percentage: number): number {
  if (percentage >= 97) return 1.00
  if (percentage >= 94) return 1.25
  if (percentage >= 91) return 1.50
  if (percentage >= 88) return 1.75
  if (percentage >= 85) return 2.00
  if (percentage >= 82) return 2.25
  if (percentage >= 79) return 2.50
  if (percentage >= 76) return 2.75
  if (percentage >= 75) return 3.00
  if (percentage >= 70) return 3.50
  if (percentage >= 65) return 4.00
  if (percentage >= 60) return 4.50
  return 5.00
}

async function main() {
  console.log("🔄 Regenerating grades for 50 students...\n")

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

  // Get criteria (should be 4, totaling 100%)
  const criteria = await prisma.gradingCriteria.findMany({
    where: {
      classId: classData.id,
      isMidterm: true,
    },
    orderBy: { order: 'asc' },
  })

  console.log(`Found ${criteria.length} criteria:`)
  criteria.forEach(c => {
    console.log(`  - ${c.name}: ${c.percentage}%`)
  })
  const total = criteria.reduce((sum, c) => sum + c.percentage, 0)
  console.log(`  Total: ${total}%\n`)

  if (Math.abs(total - 100) > 0.01) {
    console.log("❌ Criteria doesn't equal 100%! Fix this first.")
    return
  }

  const [quizCriteria, classCriteria, projectCriteria, examCriteria] = criteria

  // Get all enrollments
  const enrollments = await prisma.enrollment.findMany({
    where: { classId: classData.id },
    include: { student: true },
    orderBy: { student: { studentId: 'asc' } },
  })

  console.log(`Found ${enrollments.length} enrollments\n`)

  // Delete existing grade components
  console.log("Deleting old grade components...")
  const deletedComponents = await prisma.gradeComponent.deleteMany({
    where: {
      grade: {
        classId: classData.id,
        isMidterm: true,
      },
    },
  })
  console.log(`✓ Deleted ${deletedComponents.count} old components\n`)

  console.log("Creating new grades...")

  for (let i = 0; i < enrollments.length; i++) {
    const enrollment = enrollments[i]
    const student = enrollment.student

    // Vary the grades
    let basePercentage
    if (i < 10) {
      basePercentage = randomScore(95, 100) // Excellent
    } else if (i < 25) {
      basePercentage = randomScore(85, 94) // Good to Very Good
    } else if (i < 40) {
      basePercentage = randomScore(75, 84) // Passing
    } else {
      basePercentage = randomScore(60, 74) // Below passing
    }

    // Calculate scores
    const quizzesScore = randomScore(Math.floor(basePercentage * 0.36), 45)
    const classStandingScore = randomScore(Math.floor(basePercentage * 0.36), 45)
    const projectScore = randomScore(Math.floor(basePercentage * 0.40), 50)
    const examScore = randomScore(Math.floor(basePercentage * 0.48), 60)

    // Calculate percentages
    const quizzesPercentage = (quizzesScore / 45) * 100
    const classStandingPercentage = (classStandingScore / 45) * 100
    const projectPercentage = (projectScore / 50) * 100
    const examPercentage = (examScore / 60) * 100

    // Calculate GE
    const quizzesGE = percentageToGrade(quizzesPercentage)
    const classStandingGE = percentageToGrade(classStandingPercentage)
    const projectGE = percentageToGrade(projectPercentage)
    const examGE = percentageToGrade(examPercentage)

    // Calculate WE
    const quizzesWE = quizzesGE * 0.40
    const classStandingWE = classStandingGE * 0.20
    const projectWE = projectGE * 0.10
    const examWE = examGE * 0.30

    // Calculate final grade
    const midtermGrade = Math.round((quizzesWE + classStandingWE + projectWE + examWE) * 4) / 4
    const remarks = midtermGrade <= 3.0 ? "PASSED" : "FAILED"

    // Create or update grade
    const grade = await prisma.grade.upsert({
      where: {
        enrollmentId_isMidterm: {
          enrollmentId: enrollment.id,
          isMidterm: true,
        },
      },
      update: {
        midtermGrade: midtermGrade,
        remarks: remarks,
      },
      create: {
        enrollmentId: enrollment.id,
        studentId: student.id,
        classId: classData.id,
        isMidterm: true,
        midtermGrade: midtermGrade,
        finalGrade: null,
        overallGrade: null,
        remarks: remarks,
      },
    })

    // Create grade components
    await prisma.gradeComponent.create({
      data: {
        gradeId: grade.id,
        criteriaId: quizCriteria.id,
        score: quizzesScore,
        maxScore: 45,
        percentage: quizzesPercentage,
        gradeEquivalent: quizzesGE,
        weightedEquivalent: quizzesWE,
      },
    })

    await prisma.gradeComponent.create({
      data: {
        gradeId: grade.id,
        criteriaId: classCriteria.id,
        score: classStandingScore,
        maxScore: 45,
        percentage: classStandingPercentage,
        gradeEquivalent: classStandingGE,
        weightedEquivalent: classStandingWE,
      },
    })

    await prisma.gradeComponent.create({
      data: {
        gradeId: grade.id,
        criteriaId: projectCriteria.id,
        score: projectScore,
        maxScore: 50,
        percentage: projectPercentage,
        gradeEquivalent: projectGE,
        weightedEquivalent: projectWE,
      },
    })

    await prisma.gradeComponent.create({
      data: {
        gradeId: grade.id,
        criteriaId: examCriteria.id,
        score: examScore,
        maxScore: 60,
        percentage: examPercentage,
        gradeEquivalent: examGE,
        weightedEquivalent: examWE,
      },
    })

    if ((i + 1) % 10 === 0) {
      console.log(`  ✓ Processed ${i + 1}/${enrollments.length} students...`)
    }
  }

  console.log(`\n✅ Created grades for all ${enrollments.length} students!`)

  // Verify
  const totalComponents = await prisma.gradeComponent.count({
    where: {
      grade: {
        classId: classData.id,
        isMidterm: true,
      },
    },
  })

  console.log(`\n📊 Final count: ${totalComponents} grade components`)
  console.log(`Expected: ${enrollments.length * 4} (${enrollments.length} students × 4 criteria)`)

  if (totalComponents === enrollments.length * 4) {
    console.log("✅ Perfect! All grades generated successfully!")
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


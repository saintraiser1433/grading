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
  console.log("🔄 Regenerating grades with ComponentDefinitions...\n")

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

  // Get criteria
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
    console.log("❌ Criteria doesn't equal 100%!")
    return
  }

  const [quizCriteria, classCriteria, projectCriteria, examCriteria] = criteria

  // Create ComponentDefinitions for each criteria
  console.log("Creating component definitions...")

  // Delete old component definitions and scores
  await prisma.componentDefinition.deleteMany({
    where: {
      criteria: {
        classId: classData.id,
        isMidterm: true,
      },
    },
  })
  console.log("✓ Cleaned old component definitions\n")

  // QUIZZES - 4 quizzes (10, 10, 10, 15 points)
  const quiz1 = await prisma.componentDefinition.create({
    data: {
      criteriaId: quizCriteria.id,
      name: "Quiz 1",
      maxScore: 10,
      order: 0,
    },
  })

  const quiz2 = await prisma.componentDefinition.create({
    data: {
      criteriaId: quizCriteria.id,
      name: "Quiz 2",
      maxScore: 10,
      order: 1,
    },
  })

  const quiz3 = await prisma.componentDefinition.create({
    data: {
      criteriaId: quizCriteria.id,
      name: "Quiz 3",
      maxScore: 10,
      order: 2,
    },
  })

  const quiz4 = await prisma.componentDefinition.create({
    data: {
      criteriaId: quizCriteria.id,
      name: "Quiz 4",
      maxScore: 15,
      order: 3,
    },
  })

  // CLASS STANDING - Attendance (10), Activity 1 (20), Activity 2 (15)
  const attendance = await prisma.componentDefinition.create({
    data: {
      criteriaId: classCriteria.id,
      name: "Attendance",
      maxScore: 10,
      order: 0,
    },
  })

  const activity1 = await prisma.componentDefinition.create({
    data: {
      criteriaId: classCriteria.id,
      name: "Activity 1",
      maxScore: 20,
      order: 1,
    },
  })

  const activity2 = await prisma.componentDefinition.create({
    data: {
      criteriaId: classCriteria.id,
      name: "Activity 2",
      maxScore: 15,
      order: 2,
    },
  })

  // PROJECTS - Project 1 (50 points)
  const project1 = await prisma.componentDefinition.create({
    data: {
      criteriaId: projectCriteria.id,
      name: "Project 1",
      maxScore: 50,
      order: 0,
    },
  })

  // MAJOR EXAM - Midterm Exam (60 points)
  const midtermExam = await prisma.componentDefinition.create({
    data: {
      criteriaId: examCriteria.id,
      name: "Midterm Exam",
      maxScore: 60,
      order: 0,
    },
  })

  console.log("✓ Created 9 component definitions\n")

  // Get all enrollments
  const enrollments = await prisma.enrollment.findMany({
    where: { classId: classData.id },
    include: { student: true },
    orderBy: { student: { studentId: 'asc' } },
  })

  console.log(`Found ${enrollments.length} enrollments\n`)
  console.log("Creating grades with component scores...")

  for (let i = 0; i < enrollments.length; i++) {
    const enrollment = enrollments[i]
    const student = enrollment.student

    // Vary the base performance
    let basePercentage
    if (i < 10) {
      basePercentage = randomScore(95, 100) // Excellent
    } else if (i < 25) {
      basePercentage = randomScore(85, 94) // Good
    } else if (i < 40) {
      basePercentage = randomScore(75, 84) // Passing
    } else {
      basePercentage = randomScore(60, 74) // Below passing
    }

    // Generate scores for each component
    const quizScores = {
      quiz1: randomScore(Math.floor(basePercentage * 0.08), 10),
      quiz2: randomScore(Math.floor(basePercentage * 0.08), 10),
      quiz3: randomScore(Math.floor(basePercentage * 0.08), 10),
      quiz4: randomScore(Math.floor(basePercentage * 0.12), 15),
    }

    const classScores = {
      attendance: randomScore(Math.floor(basePercentage * 0.08), 10),
      activity1: randomScore(Math.floor(basePercentage * 0.16), 20),
      activity2: randomScore(Math.floor(basePercentage * 0.12), 15),
    }

    const projectScore = randomScore(Math.floor(basePercentage * 0.40), 50)
    const examScore = randomScore(Math.floor(basePercentage * 0.48), 60)

    // Calculate totals and percentages
    const quizTotal = quizScores.quiz1 + quizScores.quiz2 + quizScores.quiz3 + quizScores.quiz4
    const quizMaxTotal = 45
    const quizPercentage = (quizTotal / quizMaxTotal) * 100

    const classTotal = classScores.attendance + classScores.activity1 + classScores.activity2
    const classMaxTotal = 45
    const classPercentage = (classTotal / classMaxTotal) * 100

    const projectPercentage = (projectScore / 50) * 100
    const examPercentage = (examScore / 60) * 100

    // Calculate grade equivalents (1.0 - 5.0)
    const quizGE = percentageToGrade(quizPercentage)
    const classGE = percentageToGrade(classPercentage)
    const projectGE = percentageToGrade(projectPercentage)
    const examGE = percentageToGrade(examPercentage)

    // Calculate weighted grades
    const quizWE = quizGE * 0.40
    const classWE = classGE * 0.20
    const projectWE = projectGE * 0.10
    const examWE = examGE * 0.30

    // Final midterm grade
    const midtermGrade = Math.round((quizWE + classWE + projectWE + examWE) * 4) / 4
    const remarks = midtermGrade <= 3.0 ? "PASSED" : "FAILED"

    // Create or update grade record
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

    // Create component scores
    await prisma.componentScore.upsert({
      where: {
        gradeId_componentDefId: {
          gradeId: grade.id,
          componentDefId: quiz1.id,
        },
      },
      update: { score: quizScores.quiz1 },
      create: { gradeId: grade.id, componentDefId: quiz1.id, score: quizScores.quiz1 },
    })

    await prisma.componentScore.upsert({
      where: {
        gradeId_componentDefId: {
          gradeId: grade.id,
          componentDefId: quiz2.id,
        },
      },
      update: { score: quizScores.quiz2 },
      create: { gradeId: grade.id, componentDefId: quiz2.id, score: quizScores.quiz2 },
    })

    await prisma.componentScore.upsert({
      where: {
        gradeId_componentDefId: {
          gradeId: grade.id,
          componentDefId: quiz3.id,
        },
      },
      update: { score: quizScores.quiz3 },
      create: { gradeId: grade.id, componentDefId: quiz3.id, score: quizScores.quiz3 },
    })

    await prisma.componentScore.upsert({
      where: {
        gradeId_componentDefId: {
          gradeId: grade.id,
          componentDefId: quiz4.id,
        },
      },
      update: { score: quizScores.quiz4 },
      create: { gradeId: grade.id, componentDefId: quiz4.id, score: quizScores.quiz4 },
    })

    await prisma.componentScore.upsert({
      where: {
        gradeId_componentDefId: {
          gradeId: grade.id,
          componentDefId: attendance.id,
        },
      },
      update: { score: classScores.attendance },
      create: { gradeId: grade.id, componentDefId: attendance.id, score: classScores.attendance },
    })

    await prisma.componentScore.upsert({
      where: {
        gradeId_componentDefId: {
          gradeId: grade.id,
          componentDefId: activity1.id,
        },
      },
      update: { score: classScores.activity1 },
      create: { gradeId: grade.id, componentDefId: activity1.id, score: classScores.activity1 },
    })

    await prisma.componentScore.upsert({
      where: {
        gradeId_componentDefId: {
          gradeId: grade.id,
          componentDefId: activity2.id,
        },
      },
      update: { score: classScores.activity2 },
      create: { gradeId: grade.id, componentDefId: activity2.id, score: classScores.activity2 },
    })

    await prisma.componentScore.upsert({
      where: {
        gradeId_componentDefId: {
          gradeId: grade.id,
          componentDefId: project1.id,
        },
      },
      update: { score: projectScore },
      create: { gradeId: grade.id, componentDefId: project1.id, score: projectScore },
    })

    await prisma.componentScore.upsert({
      where: {
        gradeId_componentDefId: {
          gradeId: grade.id,
          componentDefId: midtermExam.id,
        },
      },
      update: { score: examScore },
      create: { gradeId: grade.id, componentDefId: midtermExam.id, score: examScore },
    })

    if ((i + 1) % 10 === 0) {
      console.log(`  ✓ Processed ${i + 1}/${enrollments.length} students...`)
    }
  }

  console.log(`\n✅ Created grades for all ${enrollments.length} students!`)

  // Verify
  const totalScores = await prisma.componentScore.count()
  const expected = enrollments.length * 9 // 9 components per student

  console.log(`\n📊 Final count: ${totalScores} component scores`)
  console.log(`Expected: ${expected} (${enrollments.length} students × 9 components)`)

  if (totalScores === expected) {
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


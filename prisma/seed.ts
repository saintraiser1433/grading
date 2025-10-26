import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// Filipino surnames and first names for realistic data
const surnames = [
  "Dela Cruz", "Santos", "Reyes", "Garcia", "Gonzales", "Ramos", "Flores", "Mendoza", 
  "Torres", "Lopez", "Castro", "Rivera", "Villanueva", "Aquino", "Bautista", "Martinez",
  "Francisco", "Cruz", "Fernandez", "Mercado", "Diaz", "Rodriguez", "Santiago", "Morales",
  "Manuel", "Jimenez", "Valdez", "Aguilar", "Navarro", "Hernandez", "Pascual", "Salazar",
  "Valencia", "Marquez", "Alvarez", "Gutierrez", "Domingo", "Perez", "Soriano", "Ocampo",
  "Trinidad", "Velasco", "Romero", "Castillo", "Estrada", "Medina", "Luna", "Ponce", "Rojas", "Silva"
]

const firstNames = [
  "Juan", "Maria", "Jose", "Ana", "Miguel", "Rosa", "Pedro", "Carmen", "Luis", "Luz",
  "Carlos", "Elena", "Ramon", "Sofia", "Antonio", "Isabella", "Diego", "Gabriela", "Fernando", "Angelica",
  "Ricardo", "Patricia", "Eduardo", "Victoria", "Manuel", "Beatriz", "Roberto", "Cristina", "Alberto", "Diana",
  "Rafael", "Melissa", "Javier", "Andrea", "Francisco", "Laura", "Daniel", "Monica", "Alejandro", "Natalia",
  "Sergio", "Veronica", "Pablo", "Adriana", "Enrique", "Sandra", "Marco", "Teresa", "Oscar", "Julia"
]

const middleInitials = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"]

// Generate random score within range
function randomScore(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Convert percentage to 1.0-5.0 grade
function percentageToGrade(percentage: number): number {
  if (percentage >= 98) return 1.0
  if (percentage >= 95) return 1.25
  if (percentage >= 92) return 1.5
  if (percentage >= 89) return 1.75
  if (percentage >= 86) return 2.0
  if (percentage >= 83) return 2.25
  if (percentage >= 80) return 2.5
  if (percentage >= 77) return 2.75
  if (percentage >= 75) return 3.0
  return 5.0
}

async function main() {
  console.log("🌱 Starting comprehensive seed...")

  // Create Admin
  const adminPassword = await bcrypt.hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@git.edu" },
    update: {},
    create: {
      email: "admin@git.edu",
      password: adminPassword,
      firstName: "Kenneth Roy",
      lastName: "Antatico",
      middleName: "A",
      role: "ADMIN",
      employeeId: "EMP001",
    },
  })
  console.log("✓ Created admin:", admin.email)

  // Create Teacher
  const teacherPassword = await bcrypt.hash("teacher123", 10)
  const teacher = await prisma.user.upsert({
    where: { email: "teacher@git.edu" },
    update: {},
    create: {
      email: "teacher@git.edu",
      password: teacherPassword,
      firstName: "Hernan Jr.",
      lastName: "Trillano",
      middleName: "E",
      role: "TEACHER",
      employeeId: "EMP002",
    },
  })
  console.log("✓ Created teacher:", teacher.email)

  // Create 50 Students
  console.log("Creating 50 students...")
  const studentPassword = await bcrypt.hash("student123", 10)
  const students = []

  for (let i = 0; i < 50; i++) {
    const student = await prisma.user.upsert({
      where: { email: `student${i + 1}@git.edu` },
      update: {},
      create: {
        email: `student${i + 1}@git.edu`,
        password: studentPassword,
        firstName: firstNames[i],
        lastName: surnames[i],
        middleName: middleInitials[i % middleInitials.length],
        role: "STUDENT",
        studentId: `2021-${String(i + 1).padStart(4, '0')}`,
      },
    })
    students.push(student)
    if ((i + 1) % 10 === 0) {
      console.log(`  ✓ Created ${i + 1} students...`)
    }
  }
  console.log("✓ All 50 students created!")

  // Create School Year
  const schoolYear = await prisma.schoolYear.upsert({
    where: {
      year_semester: {
        year: "2025-2026",
        semester: "FIRST",
      },
    },
    update: {},
    create: {
      year: "2025-2026",
      semester: "FIRST",
      isActive: true,
      startDate: new Date("2025-08-01"),
      endDate: new Date("2025-12-31"),
    },
  })
  console.log("✓ Created school year:", schoolYear.year)

  // Create Subject (CS THESIS 1)
  const subject = await prisma.subject.upsert({
    where: { code: "CS-THESIS-1" },
    update: {},
    create: {
      code: "CS-THESIS-1",
      name: "CS THESIS WRITING 1",
      description: "Thesis Writing and Research Methodology",
      units: 3,
      isOpen: true,
      schoolYearId: schoolYear.id,
    },
  })
  console.log("✓ Created subject:", subject.code)

  // Create Class (BSCS 4 - Section A)
  const classData = await prisma.class.upsert({
    where: {
      subjectId_section_schoolYearId: {
        subjectId: subject.id,
        section: "A",
        schoolYearId: schoolYear.id,
      },
    },
    update: {},
    create: {
      name: "BSCS 4",
      section: "A",
      subjectId: subject.id,
      teacherId: teacher.id,
      schoolYearId: schoolYear.id,
      isIrregular: false,
    },
  })
  console.log("✓ Created class:", `${classData.name} - Section ${classData.section}`)

  // Enroll all 50 students
  console.log("Enrolling 50 students in class...")
  const enrollments = []
  for (const student of students) {
    const enrollment = await prisma.enrollment.upsert({
      where: {
        studentId_subjectId_schoolYearId: {
          studentId: student.id,
          subjectId: subject.id,
          schoolYearId: schoolYear.id,
        },
      },
      update: {},
      create: {
        studentId: student.id,
        subjectId: subject.id,
        classId: classData.id,
        schoolYearId: schoolYear.id,
        status: "ENROLLED",
      },
    })
    enrollments.push(enrollment)
  }
  console.log("✓ Enrolled all 50 students!")

  // Create Grading Criteria (Midterm)
  console.log("Creating grading criteria...")
  
  const quizzesCriteria = await prisma.gradingCriteria.create({
    data: {
      classId: classData.id,
      name: "QUIZZES",
      percentage: 40,
      isMidterm: true,
      order: 0,
    },
  })

  const classStandingCriteria = await prisma.gradingCriteria.create({
    data: {
      classId: classData.id,
      name: "CLASS STANDING",
      percentage: 20,
      isMidterm: true,
      order: 1,
    },
  })

  const projectsCriteria = await prisma.gradingCriteria.create({
    data: {
      classId: classData.id,
      name: "PROJECTS",
      percentage: 10,
      isMidterm: true,
      order: 2,
    },
  })

  const examCriteria = await prisma.gradingCriteria.create({
    data: {
      classId: classData.id,
      name: "MAJOR EXAM",
      percentage: 30,
      isMidterm: true,
      order: 3,
    },
  })

  console.log("✓ Created grading criteria (100% total)")

  // Create Grades for each student
  console.log("Creating grades for 50 students...")
  
  for (let i = 0; i < students.length; i++) {
    const student = students[i]
    const enrollment = enrollments[i]
    
    // Vary the grades - some excellent, some good, some passing, some failing
    let basePercentage
    if (i < 10) {
      basePercentage = randomScore(95, 100) // Excellent
    } else if (i < 25) {
      basePercentage = randomScore(85, 94) // Good to Very Good
    } else if (i < 40) {
      basePercentage = randomScore(75, 84) // Passing to Satisfactory
    } else {
      basePercentage = randomScore(60, 74) // Below passing
    }

    // Calculate scores for each category
    const quizzesScore = randomScore(Math.floor(basePercentage * 0.36), 45) // Total of 4 quizzes (45 max)
    const classStandingScore = randomScore(Math.floor(basePercentage * 0.36), 45) // Attendance + 2 activities (45 max)
    const projectScore = randomScore(Math.floor(basePercentage * 0.40), 50) // 1 project (50 max)
    const examScore = randomScore(Math.floor(basePercentage * 0.48), 60) // Exam (60 max)

    // Calculate percentages
    const quizzesPercentage = (quizzesScore / 45) * 100
    const classStandingPercentage = (classStandingScore / 45) * 100
    const projectPercentage = (projectScore / 50) * 100
    const examPercentage = (examScore / 60) * 100

    // Calculate grade equivalents
    const quizzesGE = percentageToGrade(quizzesPercentage)
    const classStandingGE = percentageToGrade(classStandingPercentage)
    const projectGE = percentageToGrade(projectPercentage)
    const examGE = percentageToGrade(examPercentage)

    // Calculate weighted equivalents
    const quizzesWE = quizzesGE * 0.40
    const classStandingWE = classStandingGE * 0.20
    const projectWE = projectGE * 0.10
    const examWE = examGE * 0.30

    // Calculate final midterm grade
    const midtermGrade = Math.round((quizzesWE + classStandingWE + projectWE + examWE) * 4) / 4
    const remarks = midtermGrade <= 3.0 ? "PASSED" : "FAILED"

    // Get the midterm grade type
    const midtermGradeType = await prisma.gradeType.findFirst({
      where: { name: "Midterm" }
    })

    if (!midtermGradeType) {
      console.log("❌ Midterm grade type not found, skipping grade creation")
      continue
    }

    // Create or update grade record for midterm
    const grade = await prisma.grade.upsert({
      where: {
        enrollmentId_gradeTypeId: {
          enrollmentId: enrollment.id,
          gradeTypeId: midtermGradeType.id,
        },
      },
      update: {
        grade: midtermGrade,
        remarks: remarks,
      },
      create: {
        enrollmentId: enrollment.id,
        studentId: student.id,
        classId: classData.id,
        gradeTypeId: midtermGradeType.id,
        grade: midtermGrade,
        remarks: remarks,
      },
    })

    // Component scores are now managed through the global grading system
    // Individual component scores are created when teachers enter grades

    if ((i + 1) % 10 === 0) {
      console.log(`  ✓ Created grades for ${i + 1} students...`)
    }
  }

  console.log("✓ All grades created!")

  console.log("\n✨ Seed completed successfully!")
  console.log("\n📊 Summary:")
  console.log("  • Admin: admin@git.edu (password: admin123)")
  console.log("  • Teacher: teacher@git.edu (password: teacher123)")
  console.log("  • 50 Students: student1@git.edu to student50@git.edu (password: student123)")
  console.log("  • Class: BSCS 4 - Section A (CS THESIS 1)")
  console.log("  • Grading: QUIZZES (40%) + CLASS STANDING (20%) + PROJECTS (10%) + MAJOR EXAM (30%)")
  console.log("  • All 50 students enrolled with complete grades!")
  console.log("\n🚀 Login as teacher@git.edu to see the grade sheet with 50 students!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

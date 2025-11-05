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

  // Get all subjects assigned to teacher@git.edu
  console.log("Finding all subjects assigned to teacher@git.edu...")
  const subjectAssignments = await prisma.subjectAssignment.findMany({
    where: {
      teacherId: teacher.id,
    },
    include: {
      subject: true,
      schoolYear: true,
    },
  })

  if (subjectAssignments.length === 0) {
    console.log("⚠️  No subjects assigned to teacher@git.edu yet. Assigning subjects via admin panel first.")
    console.log("   Enrolling students in the default subject (CS-THESIS-1)...")
    
    // Enroll all 50 students in the default subject
    for (const student of students) {
      // Check if enrollment already exists
      const existingEnrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: student.id,
          subjectId: subject.id,
          schoolYearId: schoolYear.id,
        },
      })

      if (existingEnrollment) {
        // Update existing enrollment
        await prisma.enrollment.update({
          where: { id: existingEnrollment.id },
          data: {
            classId: classData.id,
            status: "APPROVED",
          },
        })
      } else {
        // Create new enrollment
        await prisma.enrollment.create({
          data: {
            studentId: student.id,
            subjectId: subject.id,
            classId: classData.id,
            schoolYearId: schoolYear.id,
            status: "APPROVED",
          },
        })
      }
    }
    console.log("✓ Enrolled all 50 students in CS-THESIS-1!")
  } else {
    console.log(`✓ Found ${subjectAssignments.length} subject assignment(s) for teacher@git.edu`)
    
    // Enroll all 50 students in all assigned subjects
    for (const assignment of subjectAssignments) {
      const assignedSubject = assignment.subject
      const assignedSchoolYear = assignment.schoolYear || schoolYear
      
      console.log(`  Enrolling 50 students in ${assignedSubject.code} (${assignedSubject.name})...`)
      
      // Find all classes for this subject and teacher in the assigned school year
      const classes = await prisma.class.findMany({
        where: {
          subjectId: assignedSubject.id,
          teacherId: teacher.id,
          schoolYearId: assignedSchoolYear.id,
        },
      })
      
      if (classes.length === 0) {
        console.log(`    ⚠️  No classes found for ${assignedSubject.code}. Skipping enrollment.`)
        continue
      }
      
      // Enroll students in the first available class (or create enrollments without classId if needed)
      const targetClass = classes[0]
      
      for (const student of students) {
        // Check if enrollment already exists
        const existingEnrollment = await prisma.enrollment.findFirst({
          where: {
            studentId: student.id,
            subjectId: assignedSubject.id,
            schoolYearId: assignedSchoolYear.id,
          },
        })

        if (existingEnrollment) {
          // Update existing enrollment
          await prisma.enrollment.update({
            where: { id: existingEnrollment.id },
            data: {
              classId: targetClass.id,
              status: "APPROVED",
            },
          })
        } else {
          // Create new enrollment
          await prisma.enrollment.create({
            data: {
              studentId: student.id,
              subjectId: assignedSubject.id,
              classId: targetClass.id,
              schoolYearId: assignedSchoolYear.id,
              status: "APPROVED",
            },
          })
        }
      }
      
      console.log(`    ✓ Enrolled all 50 students in ${assignedSubject.code}!`)
    }
    
    console.log(`✓ Enrolled all 50 students in ${subjectAssignments.length} subject(s)!`)
  }

  console.log("\n✨ Seed completed successfully!")
  console.log("\n📊 Summary:")
  console.log("  • Admin: admin@git.edu (password: admin123)")
  console.log("  • Teacher: teacher@git.edu (password: teacher123)")
  console.log("  • 50 Students: student1@git.edu to student50@git.edu (password: student123)")
  if (subjectAssignments.length > 0) {
    console.log(`  • All 50 students enrolled in ${subjectAssignments.length} subject(s) assigned to teacher@git.edu!`)
  } else {
    console.log("  • All 50 students enrolled in CS-THESIS-1!")
  }
  console.log("\n🚀 Login as teacher@git.edu to see the enrolled students!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

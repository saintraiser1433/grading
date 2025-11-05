import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// Sample names for students
const firstNames = [
  "John", "Jane", "Michael", "Sarah", "David", "Emily", "James", "Jessica",
  "Robert", "Ashley", "William", "Amanda", "Richard", "Melissa", "Joseph", "Michelle",
  "Thomas", "Kimberly", "Christopher", "Amy", "Daniel", "Angela", "Matthew", "Stephanie",
  "Anthony", "Nicole", "Mark", "Elizabeth", "Donald", "Samantha", "Steven", "Lauren",
  "Paul", "Megan", "Andrew", "Rebecca", "Joshua", "Brittany", "Kenneth", "Rachel",
  "Kevin", "Heather", "Brian", "Christina", "George", "Tiffany", "Timothy", "Danielle",
  "Ronald", "Amber"
]

const surnames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor",
  "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris", "Sanchez",
  "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King",
  "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams",
  "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts",
  "Gomez", "Phillips"
]

const middleInitials = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]

async function main() {
  console.log("🚀 Starting script to add 50 students to CS101...")

  try {
    // 1. Find the teacher
    const teacher = await prisma.user.findUnique({
      where: { email: "hernan123@gmail.com" },
    })

    if (!teacher) {
      console.error("❌ Teacher with email hernan123@gmail.com not found!")
      return
    }

    console.log(`✓ Found teacher: ${teacher.firstName} ${teacher.lastName}`)

    // 2. Find the subject CS101
    const subject = await prisma.subject.findUnique({
      where: { code: "CS101" },
    })

    if (!subject) {
      console.error("❌ Subject CS101 not found!")
      return
    }

    console.log(`✓ Found subject: ${subject.code} - ${subject.name}`)

    // 3. Find the school year 2024-2025 SECOND
    const schoolYear = await prisma.schoolYear.findFirst({
      where: {
        year: "2024-2025",
        semester: "SECOND",
      },
    })

    if (!schoolYear) {
      console.error("❌ School year 2024-2025 SECOND not found!")
      return
    }

    console.log(`✓ Found school year: ${schoolYear.year} - ${schoolYear.semester}`)

    // 4. Find the class for this subject, teacher, and school year
    const classData = await prisma.class.findFirst({
      where: {
        subjectId: subject.id,
        teacherId: teacher.id,
        schoolYearId: schoolYear.id,
      },
    })

    if (!classData) {
      console.error("❌ Class not found for CS101, teacher, and school year!")
      console.log("   Make sure the subject is assigned to the teacher first.")
      return
    }

    console.log(`✓ Found class: ${classData.name} - Section ${classData.section}`)

    // 5. Create 50 students
    console.log("\n📝 Creating 50 students...")
    const studentPassword = await bcrypt.hash("student123", 10)
    const students = []

    for (let i = 0; i < 50; i++) {
      const studentNumber = i + 1
      const student = await prisma.user.upsert({
        where: { email: `cs101student${studentNumber}@git.edu` },
        update: {},
        create: {
          email: `cs101student${studentNumber}@git.edu`,
          password: studentPassword,
          firstName: firstNames[i],
          lastName: surnames[i],
          middleName: middleInitials[i % middleInitials.length],
          role: "STUDENT",
          studentId: `2024-${String(studentNumber).padStart(4, '0')}`,
          status: "APPROVED",
        },
      })
      students.push(student)
      if (studentNumber % 10 === 0) {
        console.log(`  ✓ Created ${studentNumber} students...`)
      }
    }

    console.log(`✓ All 50 students created!`)

    // 6. Enroll students in the class
    console.log("\n📚 Enrolling students in CS101...")
    const enrollments = []

    for (let i = 0; i < students.length; i++) {
      const student = students[i]
      
      // Check if already enrolled
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_classId_schoolYearId: {
            studentId: student.id,
            classId: classData.id,
            schoolYearId: schoolYear.id,
          },
        },
      })

      if (existingEnrollment) {
        console.log(`  ⚠ Student ${student.email} already enrolled, skipping...`)
        continue
      }

      const enrollment = await prisma.enrollment.create({
        data: {
          studentId: student.id,
          classId: classData.id,
          subjectId: subject.id,
          schoolYearId: schoolYear.id,
          status: "APPROVED",
        },
      })
      enrollments.push(enrollment)

      if ((i + 1) % 10 === 0) {
        console.log(`  ✓ Enrolled ${i + 1} students...`)
      }
    }

    console.log(`\n✅ Successfully enrolled ${enrollments.length} students in CS101!`)
    console.log(`\n📊 Summary:`)
    console.log(`   - Teacher: ${teacher.firstName} ${teacher.lastName} (${teacher.email})`)
    console.log(`   - Subject: ${subject.code} - ${subject.name}`)
    console.log(`   - School Year: ${schoolYear.year} - ${schoolYear.semester}`)
    console.log(`   - Class: ${classData.name} - Section ${classData.section}`)
    console.log(`   - Students Created: 50`)
    console.log(`   - Students Enrolled: ${enrollments.length}`)

  } catch (error) {
    console.error("❌ Error:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error("Fatal error:", error)
    process.exit(1)
  })


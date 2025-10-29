import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🔍 Checking teacher assignments...\n")

  // Check all subjects
  const subjects = await prisma.subject.findMany({
    include: {
      assignedTeacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })

  console.log(`Found ${subjects.length} subjects:`)
  console.log("─".repeat(80))
  
  subjects.forEach((subject, i) => {
    console.log(`${i + 1}. ${subject.code} - ${subject.name}`)
    console.log(`   ID: ${subject.id}`)
    console.log(`   Assigned Teacher: ${subject.assignedTeacher ? 
      `${subject.assignedTeacher.firstName} ${subject.assignedTeacher.lastName} (${subject.assignedTeacher.email})` : 
      'NOT ASSIGNED'}`)
    console.log(`   Open: ${subject.isOpen ? 'Yes' : 'No'}`)
    console.log()
  })

  // Check all teachers
  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      assignedSubjects: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  })

  console.log(`\nFound ${teachers.length} teachers:`)
  console.log("─".repeat(80))
  
  teachers.forEach((teacher, i) => {
    console.log(`${i + 1}. ${teacher.firstName} ${teacher.lastName} (${teacher.email})`)
    console.log(`   ID: ${teacher.id}`)
    console.log(`   Assigned Subjects: ${teacher.assignedSubjects.length}`)
    teacher.assignedSubjects.forEach(subject => {
      console.log(`     - ${subject.code}: ${subject.name}`)
    })
    console.log()
  })

  // Check if there are any classes with teachers
  const classes = await prisma.class.findMany({
    include: {
      subject: {
        select: {
          code: true,
          name: true,
        },
      },
      teacher: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })

  console.log(`\nFound ${classes.length} classes:`)
  console.log("─".repeat(80))
  
  classes.forEach((classItem, i) => {
    console.log(`${i + 1}. ${classItem.name}`)
    console.log(`   Subject: ${classItem.subject.code} - ${classItem.subject.name}`)
    console.log(`   Teacher: ${classItem.teacher.firstName} ${classItem.teacher.lastName} (${classItem.teacher.email})`)
    console.log()
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })




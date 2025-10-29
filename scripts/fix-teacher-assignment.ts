import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🔧 Fixing teacher assignment...\n")

  // Get the subject and teacher
  const subject = await prisma.subject.findFirst({
    where: { code: "CS-THESIS-1" },
  })

  const teacher = await prisma.user.findFirst({
    where: { email: "teacher@git.edu" },
  })

  if (!subject) {
    console.log("❌ Subject not found")
    return
  }

  if (!teacher) {
    console.log("❌ Teacher not found")
    return
  }

  console.log(`Subject: ${subject.code} - ${subject.name}`)
  console.log(`Teacher: ${teacher.firstName} ${teacher.lastName} (${teacher.email})`)

  // Update the subject to assign the teacher
  const updatedSubject = await prisma.subject.update({
    where: { id: subject.id },
    data: { assignedTeacherId: teacher.id },
    include: {
      assignedTeacher: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })

  console.log("\n✅ Subject updated successfully!")
  console.log(`Assigned Teacher: ${updatedSubject.assignedTeacher?.firstName} ${updatedSubject.assignedTeacher?.lastName}`)

  // Verify the assignment
  const verification = await prisma.subject.findUnique({
    where: { id: subject.id },
    include: {
      assignedTeacher: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })

  console.log("\n📊 Verification:")
  console.log(`Subject: ${verification?.code} - ${verification?.name}`)
  console.log(`Assigned Teacher: ${verification?.assignedTeacher ? 
    `${verification.assignedTeacher.firstName} ${verification.assignedTeacher.lastName} (${verification.assignedTeacher.email})` : 
    'NOT ASSIGNED'}`)

  console.log("\n✨ Teacher assignment fixed!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })




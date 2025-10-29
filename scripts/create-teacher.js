const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTeacher() {
  try {
    // Check if teacher already exists
    const existingTeacher = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'teacher@git.edu' },
          { employeeId: 'TCH001' }
        ]
      }
    })

    if (existingTeacher) {
      console.log('Teacher user already exists:', existingTeacher.email)
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('teacher123', 10)

    // Create teacher user
    const teacher = await prisma.user.create({
      data: {
        email: 'teacher@git.edu',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Teacher',
        role: 'TEACHER',
        status: 'APPROVED',
        employeeId: 'TCH001'
      }
    })

    console.log('Teacher user created successfully!')
    console.log('Email: teacher@git.edu')
    console.log('Password: teacher123')
    console.log('Teacher ID:', teacher.id)
  } catch (error) {
    console.error('Error creating teacher user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTeacher()


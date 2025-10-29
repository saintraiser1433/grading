const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createVPAcademic() {
  try {
    // Check if VP Academic already exists
    const existingVP = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'vp@git.edu' },
          { employeeId: 'VP001' }
        ]
      }
    })

    if (existingVP) {
      console.log('VP Academic user already exists:', existingVP.email)
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('vp123', 10)

    // Create VP Academic user
    const vp = await prisma.user.create({
      data: {
        email: 'vp@git.edu',
        password: hashedPassword,
        firstName: 'VP',
        lastName: 'Academic',
        role: 'ADMIN',
        status: 'APPROVED',
        employeeId: 'VP001'
      }
    })

    console.log('VP Academic user created successfully!')
    console.log('Email: vp@git.edu')
    console.log('Password: vp123')
    console.log('VP ID:', vp.id)
  } catch (error) {
    console.error('Error creating VP Academic user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createVPAcademic()

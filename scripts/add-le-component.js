const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addLEComponent() {
  try {
    // First, let's find the Major Exam criteria
    const majorExamCriteria = await prisma.gradingCriteria.findFirst({
      where: {
        name: {
          contains: 'Major Exam',
          mode: 'insensitive'
        }
      }
    })

    if (!majorExamCriteria) {
      console.log('❌ Major Exam criteria not found')
      return
    }

    console.log('✅ Found Major Exam criteria:', majorExamCriteria)

    // Check if LE component already exists
    const existingLE = await prisma.globalComponentDefinition.findFirst({
      where: {
        name: 'LE',
        criteriaId: majorExamCriteria.id
      }
    })

    if (existingLE) {
      console.log('✅ LE component already exists:', existingLE)
      return
    }

    // Add LE component to Major Exam criteria
    const leComponent = await prisma.globalComponentDefinition.create({
      data: {
        name: 'LE',
        maxScore: 60,
        criteriaId: majorExamCriteria.id,
        order: 0
      }
    })

    console.log('✅ Created LE component:', leComponent)

  } catch (error) {
    console.error('❌ Error adding LE component:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addLEComponent()



const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkEnum() {
  try {
    console.log('Checking EnrollmentStatus enum...')
    
    // Try to query the enum values
    const result = await prisma.$queryRaw`
      SELECT unnest(enum_range(NULL::"EnrollmentStatus")) as status_value;
    `
    
    console.log('Available enum values:', result)
    
    // Check if there are any existing enrollments
    const enrollments = await prisma.enrollment.findMany({
      select: {
        id: true,
        status: true,
        studentId: true,
        subjectId: true
      }
    })
    
    console.log('Existing enrollments:', enrollments.length)
    if (enrollments.length > 0) {
      console.log('Enrollment statuses:', enrollments.map(e => e.status))
    }
    
  } catch (error) {
    console.error('Error checking enum:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkEnum()


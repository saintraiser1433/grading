const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDocuments() {
  try {
    // Get all users with their documents
    const users = await prisma.user.findMany({
      include: {
        enrollmentDocuments: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Also check for pending students specifically
    const pendingStudents = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        status: 'PENDING',
      },
      include: {
        enrollmentDocuments: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    console.log('=== PENDING STUDENTS ===')
    console.log(`Total pending students: ${pendingStudents.length}`)
    pendingStudents.forEach((student, index) => {
      console.log(`\n${index + 1}. Student: ${student.firstName} ${student.lastName}`)
      console.log(`   Email: ${student.email}`)
      console.log(`   Student ID: ${student.studentId}`)
      console.log(`   Status: ${student.status}`)
      console.log(`   Documents: ${student.enrollmentDocuments.length}`)
      
      if (student.enrollmentDocuments.length > 0) {
        student.enrollmentDocuments.forEach((doc, docIndex) => {
          console.log(`     ${docIndex + 1}. ${doc.fileName} (${doc.documentType})`)
          console.log(`        URL: ${doc.fileUrl}`)
          console.log(`        Type: ${doc.fileType}`)
          console.log(`        Size: ${doc.fileSize} bytes`)
        })
      }
    })

    console.log('=== ALL USERS ===')
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User: ${user.firstName} ${user.lastName}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Status: ${user.status}`)
      console.log(`   Student ID: ${user.studentId}`)
      console.log(`   Documents: ${user.enrollmentDocuments.length}`)
      
      if (user.enrollmentDocuments.length > 0) {
        user.enrollmentDocuments.forEach((doc, docIndex) => {
          console.log(`     ${docIndex + 1}. ${doc.fileName} (${doc.documentType})`)
          console.log(`        URL: ${doc.fileUrl}`)
          console.log(`        Type: ${doc.fileType}`)
          console.log(`        Size: ${doc.fileSize} bytes`)
        })
      }
    })

    // Get all documents separately
    const allDocuments = await prisma.enrollmentDocument.findMany({
      orderBy: { uploadedAt: 'desc' },
    })

    console.log('\n=== ALL DOCUMENTS ===')
    console.log(`Total documents: ${allDocuments.length}`)
    allDocuments.forEach((doc, index) => {
      console.log(`\n${index + 1}. ${doc.fileName}`)
      console.log(`   User ID: ${doc.userId}`)
      console.log(`   Document Type: ${doc.documentType}`)
      console.log(`   File URL: ${doc.fileUrl}`)
      console.log(`   File Type: ${doc.fileType}`)
      console.log(`   File Size: ${doc.fileSize} bytes`)
      console.log(`   Uploaded: ${doc.uploadedAt}`)
    })

  } catch (error) {
    console.error('Error checking documents:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDocuments()

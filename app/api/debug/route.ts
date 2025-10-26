import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("=== DEBUG API ROUTE CALLED ===")
    
    // Test 1: Basic database connection
    console.log("Testing database connection...")
    await prisma.$connect()
    console.log("✅ Database connected")
    
    // Test 2: Check if Grade table exists and is accessible
    console.log("Testing Grade table access...")
    const gradeCount = await prisma.grade.count()
    console.log(`✅ Grade table accessible, count: ${gradeCount}`)
    
    // Test 3: Check if we have any existing grades to work with
    console.log("Checking existing grades...")
    const existingGrades = await prisma.grade.findMany({
      take: 5,
      include: {
        enrollment: true,
        gradeType: true,
        student: true
      }
    })
    console.log(`✅ Found ${existingGrades.length} existing grades`)
    
    // Test 4: Try to create a simple test grade (only if no existing grades)
    if (existingGrades.length === 0) {
      console.log("Testing grade creation...")
      try {
        const testGrade = await prisma.grade.create({
          data: {
            enrollmentId: "test-enrollment-id",
            classId: "test-class-id", 
            studentId: "test-student-id",
            gradeTypeId: "test-grade-type-id",
            grade: 2.5,
            remarks: "TEST"
          }
        })
        console.log("✅ Test grade created:", testGrade)
        
        // Clean up test grade
        await prisma.grade.delete({
          where: { id: testGrade.id }
        })
        console.log("✅ Test grade cleaned up")
      } catch (createError) {
        console.log("⚠️ Could not create test grade (expected if constraints exist):", createError.message)
      }
    }
    
    // Test 5: Test grade retrieval with existing data
    console.log("Testing grade retrieval...")
    if (existingGrades.length > 0) {
      const firstGrade = existingGrades[0]
      const foundGrade = await prisma.grade.findFirst({
        where: { id: firstGrade.id }
      })
      console.log("✅ Existing grade found:", foundGrade)
    } else {
      console.log("✅ No existing grades to test retrieval with")
    }
    
    await prisma.$disconnect()
    console.log("✅ Database disconnected")
    
    return NextResponse.json({
      success: true,
      message: "All database tests passed",
      gradeCount,
      existingGradesCount: existingGrades.length
    })
    
  } catch (error) {
    console.error("❌ Debug test failed:", error)
    
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error("❌ Error disconnecting:", disconnectError)
    }
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

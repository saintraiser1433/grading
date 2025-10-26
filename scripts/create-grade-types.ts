import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Creating default grade types...")

  // Create Midterm grade type
  const existingMidterm = await prisma.gradeType.findFirst({
    where: { name: "Midterm" }
  })
  
  if (!existingMidterm) {
    const midterm = await prisma.gradeType.create({
      data: {
        name: "Midterm",
        description: "Midterm period grades",
        percentage: 0,
        order: 1,
        isActive: true,
      },
    })
    console.log("✓ Created Midterm grade type")
  } else {
    console.log("✓ Midterm grade type already exists")
  }

  // Create Final grade type
  const existingFinal = await prisma.gradeType.findFirst({
    where: { name: "Final" }
  })
  
  if (!existingFinal) {
    const final = await prisma.gradeType.create({
      data: {
        name: "Final",
        description: "Final period grades",
        percentage: 0,
        order: 2,
        isActive: true,
      },
    })
    console.log("✓ Created Final grade type")
  } else {
    console.log("✓ Final grade type already exists")
  }

  // Create Prelims grade type
  const existingPrelims = await prisma.gradeType.findFirst({
    where: { name: "Prelims" }
  })
  
  if (!existingPrelims) {
    const prelims = await prisma.gradeType.create({
      data: {
        name: "Prelims",
        description: "Preliminary period grades",
        percentage: 0,
        order: 3,
        isActive: true,
      },
    })
    console.log("✓ Created Prelims grade type")
  } else {
    console.log("✓ Prelims grade type already exists")
  }

  console.log("\n✨ Grade types created successfully!")
  console.log("📊 Available grade types:")
  console.log("  • Midterm (Order: 1)")
  console.log("  • Final (Order: 2)")
  console.log("  • Prelims (Order: 3)")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

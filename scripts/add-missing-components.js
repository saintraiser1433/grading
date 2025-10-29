const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addMissingComponents() {
  try {
    console.log('🔍 Checking existing grading criteria and components...')
    
    // Get all grade types
    const gradeTypes = await prisma.gradeType.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    })
    
    console.log('Found grade types:', gradeTypes.map(gt => `${gt.name} (${gt.percentage}%)`))
    
    // Get all global grading criteria
    const criteria = await prisma.globalGradingCriteria.findMany({
      where: { isActive: true },
      include: { gradeType: true }
    })
    
    console.log('Found criteria:', criteria.map(c => `${c.name} (${c.percentage}%) for ${c.gradeType.name}`))
    
    // Get existing components
    const existingComponents = await prisma.globalComponentDefinition.findMany({
      where: { isActive: true },
      include: { criteria: { include: { gradeType: true } } }
    })
    
    console.log('Found existing components:', existingComponents.length)
    
    // Define components for each criteria
    const componentsToAdd = []
    
    for (const criterion of criteria) {
      const existingComps = existingComponents.filter(comp => comp.criteriaId === criterion.id)
      
      if (existingComps.length === 0) {
        console.log(`\n📝 Adding components for ${criterion.name} (${criterion.gradeType.name})...`)
        
        if (criterion.name.toLowerCase().includes('quiz')) {
          // Quiz components
          componentsToAdd.push({
            criteriaId: criterion.id,
            name: 'Quiz 1',
            maxScore: 10,
            order: 1,
            isActive: true
          })
          componentsToAdd.push({
            criteriaId: criterion.id,
            name: 'Quiz 2',
            maxScore: 10,
            order: 2,
            isActive: true
          })
        } else if (criterion.name.toLowerCase().includes('participation')) {
          // Class Participation components
          componentsToAdd.push({
            criteriaId: criterion.id,
            name: 'Attendance',
            maxScore: 10,
            order: 1,
            isActive: true
          })
          componentsToAdd.push({
            criteriaId: criterion.id,
            name: 'Class Participation',
            maxScore: 10,
            order: 2,
            isActive: true
          })
        } else if (criterion.name.toLowerCase().includes('exam')) {
          // Major Exam components
          componentsToAdd.push({
            criteriaId: criterion.id,
            name: 'Written Exam',
            maxScore: 10,
            order: 1,
            isActive: true
          })
          componentsToAdd.push({
            criteriaId: criterion.id,
            name: 'Practical Exam',
            maxScore: 10,
            order: 2,
            isActive: true
          })
        }
      } else {
        console.log(`✅ Components already exist for ${criterion.name}`)
      }
    }
    
    if (componentsToAdd.length > 0) {
      console.log(`\n🚀 Adding ${componentsToAdd.length} components...`)
      
      for (const component of componentsToAdd) {
        const created = await prisma.globalComponentDefinition.create({
          data: component
        })
        console.log(`✅ Created component: ${created.name} (max: ${created.maxScore}) for criteria ${component.criteriaId}`)
      }
      
      console.log('\n🎉 Successfully added all missing components!')
    } else {
      console.log('\n✅ All components already exist!')
    }
    
    // Verify the results
    console.log('\n🔍 Verifying results...')
    const finalComponents = await prisma.globalComponentDefinition.findMany({
      where: { isActive: true },
      include: { criteria: { include: { gradeType: true } } },
      orderBy: [
        { criteria: { gradeType: { order: 'asc' } } },
        { criteria: { order: 'asc' } },
        { order: 'asc' }
      ]
    })
    
    console.log('\n📊 Final component structure:')
    const groupedByGradeType = {}
    finalComponents.forEach(comp => {
      const gradeTypeName = comp.criteria.gradeType.name
      const criteriaName = comp.criteria.name
      
      if (!groupedByGradeType[gradeTypeName]) {
        groupedByGradeType[gradeTypeName] = {}
      }
      if (!groupedByGradeType[gradeTypeName][criteriaName]) {
        groupedByGradeType[gradeTypeName][criteriaName] = []
      }
      
      groupedByGradeType[gradeTypeName][criteriaName].push(comp)
    })
    
    Object.entries(groupedByGradeType).forEach(([gradeType, criteria]) => {
      console.log(`\n📚 ${gradeType}:`)
      Object.entries(criteria).forEach(([criteriaName, components]) => {
        console.log(`  📋 ${criteriaName}:`)
        components.forEach(comp => {
          console.log(`    - ${comp.name} (max: ${comp.maxScore})`)
        })
      })
    })
    
  } catch (error) {
    console.error('❌ Error adding components:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addMissingComponents()


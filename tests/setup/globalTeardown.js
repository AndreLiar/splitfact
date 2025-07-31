module.exports = async () => {
  console.log('🧹 Cleaning up global test environment...')
  
  try {
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    // Clean up test database
    console.log('🗑️ Cleaning test database...')
    await prisma.$disconnect()
    
    console.log('✅ Global test teardown completed')
  } catch (error) {
    console.warn('⚠️ Test teardown warning:', error.message)
  }
}
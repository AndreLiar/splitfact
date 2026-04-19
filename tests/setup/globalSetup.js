const { spawn } = require('child_process')
const path = require('path')

module.exports = async () => {
  console.log('🧪 Setting up global test environment...')
  
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/splitfact_test'
  
  // Check if test database is available
  try {
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    console.log('📊 Checking test database connection...')
    await prisma.$connect()
    
    // Reset database schema for clean tests
    console.log('🔄 Resetting test database...')
    await prisma.$executeRaw`DROP SCHEMA IF EXISTS public CASCADE;`
    await prisma.$executeRaw`CREATE SCHEMA public;`
    
    // Run migrations
    console.log('⚡ Running database migrations...')
    await prisma.$disconnect()
    
    // Run Prisma migrations using spawn
    await new Promise((resolve, reject) => {
      const migrate = spawn('npx', ['prisma', 'migrate', 'deploy'], {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '../..'),
      })
      
      migrate.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Database migrations completed')
          resolve()
        } else {
          reject(new Error(`Migration failed with code ${code}`))
        }
      })
    })
    
    console.log('✅ Global test setup completed')
  } catch (error) {
    console.warn('⚠️ Test database setup failed, tests will run with mocked data:', error.message)
    // Continue with tests using mocks
  }
}
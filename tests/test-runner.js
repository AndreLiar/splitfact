#!/usr/bin/env node

/**
 * Automated Test Runner for Splitfact
 * Comprehensive testing suite to flag out issues across the entire system
 */

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}🧪 ${msg}${colors.reset}\n`),
}

class TestRunner {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      issues: [],
    }
    this.startTime = Date.now()
  }

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'pipe',
        shell: true,
        ...options,
      })

      let stdout = ''
      let stderr = ''

      child.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      child.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      child.on('close', (code) => {
        resolve({
          code,
          stdout,
          stderr,
          success: code === 0,
        })
      })

      child.on('error', (error) => {
        reject(error)
      })
    })
  }

  async checkPrerequisites() {
    log.header('Checking Prerequisites')

    // Check Node.js version
    const nodeVersion = process.version
    log.info(`Node.js version: ${nodeVersion}`)

    // Check if dependencies are installed
    const packageJsonPath = path.join(__dirname, '..', 'package.json')
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found')
    }

    const nodeModulesPath = path.join(__dirname, '..', 'node_modules')
    if (!fs.existsSync(nodeModulesPath)) {
      log.warn('node_modules not found, installing dependencies...')
      const installResult = await this.runCommand('npm', ['install'])
      if (!installResult.success) {
        throw new Error('Failed to install dependencies')
      }
    }

    // Check database connection (optional)
    try {
      log.info('Checking database connection...')
      const dbResult = await this.runCommand('npm', ['run', 'db:health'])
      if (dbResult.success) {
        log.success('Database connection OK')
      } else {
        log.warn('Database connection failed, tests will run with mocks')
      }
    } catch (error) {
      log.warn('Database health check skipped, tests will run with mocks')
    }

    log.success('Prerequisites check completed')
  }

  async runLinting() {
    log.header('Running Code Quality Checks')

    try {
      const lintResult = await this.runCommand('npm', ['run', 'lint'])
      if (lintResult.success) {
        log.success('ESLint passed')
        this.results.passed++
      } else {
        log.error('ESLint failed')
        this.results.failed++
        this.results.issues.push({
          type: 'linting',
          description: 'ESLint errors found',
          details: lintResult.stderr,
        })
      }
    } catch (error) {
      log.error(`Linting error: ${error.message}`)
      this.results.failed++
    }

    this.results.total++
  }

  async runTypeChecking() {
    log.header('Running TypeScript Type Checking')

    try {
      const tscResult = await this.runCommand('npx', ['tsc', '--noEmit'])
      if (tscResult.success) {
        log.success('TypeScript compilation passed')
        this.results.passed++
      } else {
        log.error('TypeScript compilation failed')
        this.results.failed++
        this.results.issues.push({
          type: 'typescript',
          description: 'TypeScript compilation errors',
          details: tscResult.stderr,
        })
      }
    } catch (error) {
      log.error(`TypeScript check error: ${error.message}`)
      this.results.failed++
    }

    this.results.total++
  }

  async runUnitTests() {
    log.header('Running Unit Tests')

    try {
      const testResult = await this.runCommand('npm', ['run', 'test:ci'])
      if (testResult.success) {
        log.success('Unit tests passed')
        this.results.passed++
        
        // Parse test results
        const testOutput = testResult.stdout
        const passedMatch = testOutput.match(/(\d+) passed/)
        const failedMatch = testOutput.match(/(\d+) failed/)
        
        if (passedMatch) {
          log.info(`${passedMatch[1]} individual tests passed`)
        }
        if (failedMatch) {
          log.warn(`${failedMatch[1]} individual tests failed`)
        }
      } else {
        log.error('Unit tests failed')
        this.results.failed++
        this.results.issues.push({
          type: 'unit-tests',
          description: 'Unit test failures',
          details: testResult.stderr,
        })
      }
    } catch (error) {
      log.error(`Unit test error: ${error.message}`)
      this.results.failed++
    }

    this.results.total++
  }

  async runAPITests() {
    log.header('Running API Integration Tests')

    try {
      const apiTestResult = await this.runCommand('npm', ['run', 'test:api'])
      if (apiTestResult.success) {
        log.success('API tests passed')
        this.results.passed++
      } else {
        log.error('API tests failed')
        this.results.failed++
        this.results.issues.push({
          type: 'api-tests',
          description: 'API integration test failures',
          details: apiTestResult.stderr,
        })
      }
    } catch (error) {
      log.error(`API test error: ${error.message}`)
      this.results.failed++
    }

    this.results.total++
  }

  async runSecurityChecks() {
    log.header('Running Security Audit')

    try {
      const auditResult = await this.runCommand('npm', ['audit', '--audit-level=moderate'])
      if (auditResult.success) {
        log.success('Security audit passed')
        this.results.passed++
      } else {
        log.warn('Security vulnerabilities found')
        this.results.issues.push({
          type: 'security',
          description: 'Security vulnerabilities detected',
          details: auditResult.stdout,
          severity: 'warning',
        })
      }
    } catch (error) {
      log.error(`Security audit error: ${error.message}`)
    }

    this.results.total++
  }

  async checkBuildProcess() {
    log.header('Testing Build Process')

    try {
      const buildResult = await this.runCommand('npm', ['run', 'build'])
      if (buildResult.success) {
        log.success('Build process completed successfully')
        this.results.passed++
      } else {
        log.error('Build process failed')
        this.results.failed++
        this.results.issues.push({
          type: 'build',
          description: 'Build process errors',
          details: buildResult.stderr,
        })
      }
    } catch (error) {
      log.error(`Build error: ${error.message}`)
      this.results.failed++
    }

    this.results.total++
  }

  async runCustomHealthChecks() {
    log.header('Running Custom Health Checks')

    const healthChecks = [
      {
        name: 'Environment Variables',
        check: () => {
          const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL']
          const missing = requiredEnvVars.filter(env => !process.env[env])
          return {
            success: missing.length === 0,
            message: missing.length > 0 ? `Missing env vars: ${missing.join(', ')}` : 'All required env vars present',
          }
        },
      },
      {
        name: 'Critical Files',
        check: () => {
          const criticalFiles = [
            'prisma/schema.prisma',
            'src/lib/prisma.ts',
            'src/app/api/auth/[...nextauth]/route.ts',
            'src/types/next-auth.d.ts',
          ]
          const missing = criticalFiles.filter(file => !fs.existsSync(path.join(__dirname, '..', file)))
          return {
            success: missing.length === 0,
            message: missing.length > 0 ? `Missing files: ${missing.join(', ')}` : 'All critical files present',
          }
        },
      },
      {
        name: 'API Route Coverage',
        check: () => {
          const apiDir = path.join(__dirname, '..', 'src', 'app', 'api')
          if (!fs.existsSync(apiDir)) {
            return { success: false, message: 'API directory not found' }
          }
          
          const apiRoutes = this.getAllApiRoutes(apiDir)
          const expectedRoutes = [
            'auth/register/route.ts',
            'users/me/route.ts',
            'invoices/route.ts',
            'notifications/route.ts',
            'ai/fiscal-advice/route.ts',
          ]
          
          const missing = expectedRoutes.filter(route => !apiRoutes.includes(route))
          return {
            success: missing.length === 0,
            message: missing.length > 0 ? `Missing API routes: ${missing.join(', ')}` : `Found ${apiRoutes.length} API routes`,
          }
        },
      },
    ]

    for (const healthCheck of healthChecks) {
      try {
        const result = healthCheck.check()
        if (result.success) {
          log.success(`${healthCheck.name}: ${result.message}`)
          this.results.passed++
        } else {
          log.error(`${healthCheck.name}: ${result.message}`)
          this.results.failed++
          this.results.issues.push({
            type: 'health-check',
            description: `${healthCheck.name} failed`,
            details: result.message,
          })
        }
      } catch (error) {
        log.error(`${healthCheck.name}: ${error.message}`)
        this.results.failed++
      }
      this.results.total++
    }
  }

  getAllApiRoutes(dir, routes = [], basePath = '') {
    const items = fs.readdirSync(dir)
    
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        this.getAllApiRoutes(fullPath, routes, path.join(basePath, item))
      } else if (item === 'route.ts') {
        routes.push(path.join(basePath, item))
      }
    }
    
    return routes
  }

  generateReport() {
    const duration = Date.now() - this.startTime
    const successRate = this.results.total > 0 ? (this.results.passed / this.results.total * 100).toFixed(1) : 0

    log.header('Test Results Summary')
    
    console.log(`${colors.bright}Total Tests:${colors.reset} ${this.results.total}`)
    console.log(`${colors.green}Passed:${colors.reset} ${this.results.passed}`)
    console.log(`${colors.red}Failed:${colors.reset} ${this.results.failed}`)
    console.log(`${colors.blue}Success Rate:${colors.reset} ${successRate}%`)
    console.log(`${colors.cyan}Duration:${colors.reset} ${(duration / 1000).toFixed(2)}s`)

    if (this.results.issues.length > 0) {
      log.header('Issues Found')
      this.results.issues.forEach((issue, index) => {
        const severity = issue.severity === 'warning' ? colors.yellow : colors.red
        console.log(`${severity}${index + 1}. [${issue.type}] ${issue.description}${colors.reset}`)
        if (issue.details && issue.details.trim()) {
          console.log(`   ${colors.reset}${issue.details.trim().split('\n')[0]}${colors.reset}`)
        }
      })
    }

    // Generate JSON report
    const report = {
      timestamp: new Date().toISOString(),
      duration: duration,
      results: this.results,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
      },
    }

    const reportPath = path.join(__dirname, '..', 'test-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    log.info(`Detailed report saved to: ${reportPath}`)

    return this.results.failed === 0
  }

  async run() {
    try {
      log.header('Splitfact Automated Testing Suite')
      
      await this.checkPrerequisites()
      await this.runLinting()
      await this.runTypeChecking()
      await this.runUnitTests()
      await this.runAPITests()
      await this.runSecurityChecks()
      await this.checkBuildProcess()
      await this.runCustomHealthChecks()
      
      const success = this.generateReport()
      
      if (success) {
        log.success('All tests passed! 🎉')
        process.exit(0)
      } else {
        log.error('Some tests failed. Please check the issues above.')
        process.exit(1)
      }
    } catch (error) {
      log.error(`Test runner error: ${error.message}`)
      process.exit(1)
    }
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new TestRunner()
  runner.run()
}

module.exports = TestRunner
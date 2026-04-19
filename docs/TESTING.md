# Splitfact Testing System 🧪

A comprehensive automated testing suite designed to flag out issues across the entire Splitfact application ecosystem.

## 📋 Overview

This testing system provides multi-layered validation for:
- **API Endpoints** - All REST API routes and business logic
- **French Fiscal Compliance** - URSSAF, TVA, and micro-entrepreneur regulations
- **Authentication & Security** - User management and access control
- **Database Operations** - Data integrity and complex queries
- **AI Services** - Fiscal advice and business intelligence
- **Notification System** - Real-time alerts and messaging
- **Performance & Build** - Application stability and deployment readiness

## 🚀 Quick Start

### Install Testing Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm run test:all
```

### Run Specific Test Suites
```bash
# API endpoint tests
npm run test:api

# Unit tests with coverage
npm run test:coverage

# Integration tests
npm run test:integration

# Automated test runner (comprehensive)
node tests/test-runner.js
```

## 🏗️ Test Architecture

### 1. **API Endpoint Tests** (`tests/api/`)
- **Authentication** (`auth.test.js`) - User registration, login, session validation
- **Notifications** (`notifications.test.js`) - CRUD operations, real-time updates
- **Invoices** (`invoices.test.js`) - Invoice creation, French compliance validation
- **Fiscal Compliance** (`fiscal-compliance.test.js`) - URSSAF rates, TVA thresholds
- **AI Services** (`ai-services.test.js`) - Fiscal advice, business insights

### 2. **Integration Tests** (`tests/integration/`)
- **Database** (`database.test.js`) - Schema validation, complex queries, data integrity

### 3. **Test Infrastructure**
- **Jest Configuration** (`jest.config.js`) - Test framework setup
- **Global Setup** (`jest.setup.js`) - Mocks, utilities, environment
- **Test Runner** (`tests/test-runner.js`) - Comprehensive automated testing
- **CI/CD Pipeline** (`.github/workflows/ci.yml`) - Automated validation

## 🔍 Test Categories

### ✅ **Authentication & Security**
```javascript
// Tests user registration with French business validation
it('should register a new user with valid data', async () => {
  const userData = {
    fiscalRegime: 'MicroBIC',
    microEntrepreneurType: 'COMMERCANT',
    siret: '12345678901234',
    // ... French-specific fields
  }
  // Validation logic...
})
```

### ✅ **French Fiscal Compliance**
```javascript
// Tests URSSAF calculation for different micro-entrepreneur types
it('should calculate different rates for service providers', async () => {
  const mockUser = {
    microEntrepreneurType: 'PRESTATAIRE', // 22% rate
  }
  // Rate validation: 22% URSSAF + 1.7% income tax
})
```

### ✅ **Invoice Management**
```javascript
// Tests French invoice compliance
it('should create invoice with French fiscal compliance', async () => {
  const invoice = {
    legalMentions: 'TVA non applicable, article 293 B du CGI',
    // French compliance fields...
  }
})
```

### ✅ **AI Services Integration**
```javascript
// Tests AI-powered fiscal advice
it('should provide French fiscal advice for micro-entrepreneurs', async () => {
  const advice = await getFiscalAdvice({
    question: 'Comment optimiser mes charges déductibles ?'
  })
  // French-specific AI responses
})
```

## 🎯 Key Features

### **Multi-Environment Support**
- **Development** - Local testing with Ollama AI
- **CI/CD** - Automated GitHub Actions pipeline
- **Production** - Deployment validation

### **French Business Validation**
- **SIRET** - 14-digit business identification validation
- **APE Code** - Activity classification (format: 1234Z)
- **TVA Thresholds** - Commercial (€91,900) vs Service (€36,800)
- **URSSAF Rates** - COMMERCANT (12.8%), PRESTATAIRE/LIBERAL (22%)

### **Comprehensive Coverage**
- **Unit Tests** - Individual function validation
- **Integration Tests** - Database and API integration
- **Security Tests** - Authentication and access control
- **Performance Tests** - Response times and load handling
- **Compliance Tests** - French fiscal regulation adherence

## 🛠️ Configuration

### Environment Variables
```bash
# Test Database
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/splitfact_test

# Authentication
NEXTAUTH_SECRET=test-secret-key-for-testing-only
NEXTAUTH_URL=http://localhost:3000

# AI Services (optional for testing)
AI_MODE=local
OLLAMA_BASE_URL=http://localhost:11434
```

### Jest Configuration (`jest.config.js`)
```javascript
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}'],
  testTimeout: 30000,
  // French fiscal testing optimizations
}
```

## 📊 Test Results & Reports

### Automated Test Runner Output
```bash
🧪 Splitfact Automated Testing Suite

✅ Prerequisites check completed
✅ ESLint passed
✅ TypeScript compilation passed
✅ Unit tests passed (45 tests)
✅ API tests passed (23 tests)
✅ Security audit passed
✅ Build process completed successfully
✅ All health checks passed

📊 Test Results Summary
Total Tests: 8
Passed: 8
Failed: 0
Success Rate: 100%
Duration: 45.3s
```

### Coverage Reports
Generated in `coverage/` directory with detailed HTML reports showing:
- Line coverage for all source files
- Branch coverage for conditional logic
- Function coverage for API endpoints
- French fiscal compliance coverage

## 🔧 Advanced Usage

### Custom Test Scenarios
```javascript
// Create custom test for specific fiscal scenarios
describe('Micro-Entrepreneur Edge Cases', () => {
  it('should handle TVA threshold exceeded scenario', async () => {
    const mockUser = {
      fiscalRegime: 'MicroBIC',
      microEntrepreneurType: 'COMMERCANT',
    }
    const mockInvoices = [
      { totalAmount: 95000 } // Exceeds €91,900 threshold
    ]
    // Test threshold warning generation
  })
})
```

### Database Testing
```javascript
// Test complex fiscal calculations with real data
it('should perform URSSAF calculations with database', async () => {
  const user = await prisma.user.create({
    data: { fiscalRegime: 'MicroBIC', microEntrepreneurType: 'PRESTATAIRE' }
  })
  // Real database operations testing
})
```

## 🚨 Issue Detection

The testing system automatically flags:

### **Critical Issues**
- Authentication failures
- Database connection problems
- API endpoint errors
- Build process failures

### **French Fiscal Issues**
- Incorrect URSSAF rate calculations
- TVA threshold validation errors
- Missing legal mentions on invoices
- Invalid SIRET/APE code formats

### **Security Issues**
- Vulnerable dependencies (npm audit)
- Authentication bypass attempts
- Data access violations
- Injection attack vectors

### **Performance Issues**
- Slow API response times (>2s)
- Memory leaks in long-running tests
- Database query optimization needs
- AI service timeout problems

## 📋 Test Checklist

Before deployment, ensure all tests pass:

- [ ] **Authentication Tests** - Registration, login, session management
- [ ] **API Endpoint Tests** - All routes respond correctly
- [ ] **Database Tests** - Schema valid, data integrity maintained
- [ ] **French Fiscal Tests** - URSSAF calculations, TVA compliance
- [ ] **AI Service Tests** - Fiscal advice functionality
- [ ] **Notification Tests** - Real-time updates working
- [ ] **Security Tests** - No vulnerabilities detected
- [ ] **Build Tests** - Application builds successfully
- [ ] **Performance Tests** - Response times acceptable

## 🤝 Contributing

When adding new features:

1. **Write tests first** (TDD approach)
2. **Include French fiscal validation** for business logic
3. **Add API endpoint tests** for new routes
4. **Update integration tests** for database changes
5. **Test AI interactions** for intelligent features

### Test File Naming Convention
```
tests/
├── api/
│   ├── [feature].test.js          # API endpoint tests
├── integration/
│   ├── [component].test.js        # Integration tests
└── utils/
    ├── [helper].test.js           # Utility function tests
```

## 🆘 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Reset test database
npm run db:reset-test
```

**AI Service Unavailable**
```bash
# Check Ollama service (development)
ollama serve

# Verify model is available
ollama list
```

**Test Timeouts**
```javascript
// Increase timeout for slow tests
jest.setTimeout(60000) // 60 seconds
```

## 📈 Performance Metrics

Target performance benchmarks:
- **API Response Time**: < 500ms for standard requests
- **Database Queries**: < 100ms for simple queries
- **AI Service Response**: < 5s for fiscal advice
- **Test Suite Execution**: < 2 minutes complete run
- **Coverage Target**: > 80% line coverage

---

*This testing system ensures Splitfact maintains the highest quality standards for French micro-entrepreneurs while providing robust, reliable service.*
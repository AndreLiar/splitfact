// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-dom')

// Mock environment variables for testing
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/splitfact_test'
process.env.NODE_ENV = 'test'

// Mock Next.js modules that don't work well in test environment
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/test-path',
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        fiscalRegime: 'MicroBIC',
        stripeAccountId: 'test-stripe-account',
      },
    },
    status: 'authenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}))

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    invoice: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    client: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    notification: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    collective: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    urssafReport: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

// Mock AI services
jest.mock('@/lib/ai-service', () => ({
  getAIService: jest.fn(() => ({
    chat: jest.fn(() => ({ content: 'Mock AI response' })),
  })),
}))

// Global test utilities
global.testUtils = {
  createMockUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    fiscalRegime: 'MicroBIC',
    microEntrepreneurType: 'COMMERCANT',
    declarationFrequency: 'monthly',
    siret: '12345678901234',
    address: '123 Test Street, Test City',
    legalStatus: 'EI',
    apeCode: '6201Z',
    stripeAccountId: 'acct_test123',
  }),
  
  createMockInvoice: () => ({
    id: 'test-invoice-id',
    invoiceNumber: 'INV-TEST-001',
    invoiceDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    totalAmount: 1000,
    status: 'draft',
    paymentStatus: 'pending',
    issuerName: 'Test Company',
    issuerAddress: '123 Test Street',
    items: [
      {
        id: 'item-1',
        description: 'Test Service',
        quantity: 1,
        unitPrice: 1000,
        tvaRate: 0.20,
      },
    ],
  }),
  
  createMockNotification: () => ({
    id: 'test-notification-id',
    type: 'GENERAL',
    title: 'Test Notification',
    message: 'This is a test notification',
    isRead: false,
    createdAt: new Date(),
    userId: 'test-user-id',
  }),
}
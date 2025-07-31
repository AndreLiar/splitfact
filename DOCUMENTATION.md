# Splitfact Application - Complete Documentation

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Technology Stack](#2-architecture--technology-stack)
3. [Database Schema & Data Models](#3-database-schema--data-models)
4. [AI-Powered Features](#4-ai-powered-features)
5. [Backend API Endpoints](#5-backend-api-endpoints)
6. [Frontend Components & Features](#6-frontend-components--features)
7. [Payment & Financial Integration](#7-payment--financial-integration)
8. [French Fiscal Compliance](#8-french-fiscal-compliance)
9. [Deployment & Configuration](#9-deployment--configuration)
10. [Security & Authentication](#10-security--authentication)
11. [Development Setup](#11-development-setup)
12. [Feature Status & Roadmap](#12-feature-status--roadmap)

---

## 1. Project Overview

**Splitfact** is a comprehensive, AI-powered invoicing and fiscal management platform specifically designed for French micro-entrepreneurs (auto-entrepreneurs) and freelance collectives. The application combines professional invoicing capabilities with intelligent business insights, automated tax compliance, and collaborative revenue sharing.

### Key Value Propositions

- **🤖 AI-First Approach**: Multi-agent AI system providing personalized fiscal advice and proactive business insights
- **🇫🇷 French Fiscal Expertise**: Specialized compliance with URSSAF, TVA, and micro-entrepreneur regulations
- **👥 Collaborative Invoicing**: Advanced revenue sharing and collective invoice management
- **📊 Automated Reporting**: Automated URSSAF and TVA report generation with smart notifications
- **💳 Integrated Payments**: Stripe Connect integration for multi-party payment distribution

### Project Details

- **Name**: splitfact-app
- **Version**: 0.1.0
- **Target Market**: French micro-entrepreneurs, freelance collectives, and collaborative business teams
- **Primary Language**: French (with internationalization-ready architecture)

---

## 2. Architecture & Technology Stack

### Core Framework
- **Frontend**: Next.js 15.3.5 (React 19.0.0) with App Router
- **Backend**: Next.js API Routes with RESTful architecture
- **Database**: PostgreSQL with Prisma ORM (6.11.1)
- **Authentication**: NextAuth.js 4.24.11 with Prisma adapter

### AI & Machine Learning
- **Local Development**: Ollama integration with DeepSeek Coder v2
- **Production AI**: Google Gemini 2.5 Flash
- **AI Framework**: LangChain 0.3.30 with LangGraph 0.4.0 for multi-agent orchestration
- **Vector Storage**: LangChain MemoryVectorStore with OpenAI embeddings

### UI & Styling
- **CSS Framework**: Bootstrap 5.3.7 + React Bootstrap 2.10.10
- **Animations**: Framer Motion 12.23.0
- **Icons & Components**: Radix UI components
- **PDF Generation**: @react-pdf/renderer 4.3.0

### Payment & Financial
- **Payment Processing**: Stripe 18.3.0 with Stripe Connect
- **Multi-party Payouts**: Automated collective payment distribution
- **Currency Handling**: Decimal precision for financial calculations

### External Integrations
- **Email Service**: Resend 4.6.0 for transactional emails
- **File Storage**: Cloudinary 2.7.0 for document management
- **Data Processing**: CSV parser for bulk operations

### Development Tools
- **Language**: TypeScript 5
- **Validation**: Zod 3.25.74 for runtime type checking
- **Database Migrations**: Prisma migrations with PostgreSQL
- **Environment Management**: Environment-based configuration

---

## 3. Database Schema & Data Models

### Core User Management

#### User Model
```prisma
model User {
  id                    String             @id @default(cuid())
  name                  String?
  email                 String?            @unique
  password              String?
  stripeAccountId       String?            @unique
  fiscalRegime          FiscalRegime?
  siret                 String?
  tvaNumber             String?
  address               String?
  legalStatus           String?
  rcsNumber             String?
  shareCapital          String?
  apeCode               String?
  microEntrepreneurType MicroEntrepreneurType?
  declarationFrequency  DeclarationFrequency?
  // Relationships
  collectives           CollectiveMember[]
  invoices              Invoice[]
  clients               Client[]
  notifications         Notification[]
  collectivePayouts     CollectivePayout[]
  urssafReports         UrssafReport[]
}
```

### Collective Management

#### Collective & Membership Models
```prisma
model Collective {
  id                String             @id @default(cuid())
  name              String
  createdBy         User               @relation("CreatedBy")
  members           CollectiveMember[]
  invoices          Invoice[]
  collectiveClients CollectiveClient[]
}

model CollectiveMember {
  id           String         @id @default(cuid())
  user         User
  collective   Collective
  role         CollectiveRole @default(member)
  joinedAt     DateTime       @default(now())
}
```

### Invoice System

#### Main Invoice Model
```prisma
model Invoice {
  id                    String        @id @default(cuid())
  invoiceNumber         String
  invoiceDate           DateTime
  dueDate               DateTime
  totalAmount           Decimal
  status                InvoiceStatus @default(draft)
  paymentStatus         PaymentStatus @default(pending)
  stripePaymentIntentId String?       @unique
  // Client information (immutable snapshot)
  clientName            String?
  clientAddress         String?
  clientSiret           String?
  clientTvaNumber       String?
  // Issuer information (immutable snapshot)
  issuerName            String
  issuerAddress         String
  issuerSiret           String?
  issuerTva             String?
  // Legal compliance
  paymentTerms          String?
  latePenaltyRate       String?
  recoveryIndemnity     Float?
  legalMentions         String?
  // Relationships
  items                 InvoiceItem[]
  shares                InvoiceShare[]
  subInvoices           SubInvoice[]
  collectivePayouts     CollectivePayout[]
}
```

#### Sub-Invoice System
```prisma
model SubInvoice {
  id                    String        @id @default(cuid())
  issuer                User          @relation("Issuer")
  receiver              User          @relation("Receiver")
  parentInvoice         Invoice
  amount                Decimal
  description           String?
  legalMentions         String?
  status                InvoiceStatus @default(draft)
  paymentStatus         PaymentStatus @default(pending)
  stripePaymentIntentId String?       @unique
}
```

### Financial Management

#### Revenue Sharing
```prisma
model InvoiceShare {
  id                     String      @id @default(cuid())
  invoice                Invoice
  user                   User
  shareType              ShareType   // percent | fixed
  shareValue             Decimal
  calculatedAmount       Decimal
  description            String?
  autogeneratedInvoice   SubInvoice?
}
```

#### Collective Payouts
```prisma
model CollectivePayout {
  id               String       @id @default(cuid())
  invoice          Invoice
  user             User
  amount           Decimal
  status           PayoutStatus @default(pending)
  stripeTransferId String?      @unique
  errorMessage     String?
  attemptCount     Int          @default(0)
  completedAt      DateTime?
}
```

### Compliance & Reporting

#### URSSAF Reports
```prisma
model UrssafReport {
  id                     String   @id @default(cuid())
  user                   User
  reportData             Json
  periodStartDate        DateTime
  periodEndDate          DateTime
  isAutomatic            Boolean  @default(false)
  paidInvoicesDisclaimer String?
}
```

#### Notification System
```prisma
model Notification {
  id        String           @id @default(cuid())
  user      User
  type      NotificationType
  title     String
  message   String
  isRead    Boolean          @default(false)
  actionUrl String?
  metadata  Json?
  readAt    DateTime?
}
```

### Enums & Types

```prisma
enum FiscalRegime {
  MicroBIC | BNC | SASU | EI | Other
}

enum MicroEntrepreneurType {
  COMMERCANT | PRESTATAIRE | LIBERAL
}

enum PaymentStatus {
  pending | paid | failed | refunded
}

enum InvoiceStatus {
  draft | sent | paid
}

enum NotificationType {
  URSSAF_REMINDER | TVA_THRESHOLD_WARNING | 
  TVA_THRESHOLD_EXCEEDED | GENERAL
}

enum DeclarationFrequency {
  monthly | quarterly
}
```

---

## 4. AI-Powered Features

### Multi-Agent AI Architecture

Splitfact implements a sophisticated AI system using LangGraph for orchestration with specialized agents for French fiscal expertise.

#### Core AI Services

**1. Universal AI Service (`src/lib/ai-service.ts`)**
- Environment-based switching between local Ollama and production Gemini
- Automatic fallback mechanisms
- Health monitoring and service availability checks
- LangChain-compatible interface

**2. Multi-Agent Orchestration (`src/lib/fiscal-agents.ts`)**
- **Fiscal Analyst Agent**: Analyzes financial data and identifies trends
- **Risk Assessment Agent**: Evaluates fiscal risks and compliance issues  
- **Fiscal Expert Agent**: Provides comprehensive advice and recommendations
- State-based workflow management with intelligent agent routing

#### AI Memory & Context System

**3. Advanced Memory Management (`src/lib/ai-memory.ts`)**
- Vector-based conversation memory with semantic search
- User preference learning and adaptation
- Conversation summarization and topic extraction
- Importance scoring for context relevance

**4. Performance Optimization (`src/lib/ai-cache.ts`)**
- Multi-tier caching system with TTL-based expiration
- Cache types: Insights (15min), Health (30min), Suggestions (10min), Fiscal Advice (5min)
- User-specific cache isolation
- LRU eviction and cache statistics

#### Proactive Intelligence Engine

**5. Business Intelligence (`src/lib/proactive-insights.ts`)**
- **Fiscal Health Score**: 4-component scoring (compliance, cash flow, growth, efficiency)
- **Threshold Monitoring**: BNC/BIC threshold alerts and TVA tracking
- **Cash Flow Analysis**: Overdue invoice tracking and payment pattern analysis
- **Client Risk Assessment**: Concentration risk and payment delay analysis
- **Growth Opportunities**: Revenue trend analysis and optimization suggestions

#### AI-Powered UI Components

**6. Smart Dashboard Widgets**
- **FiscalHealthWidget**: Real-time health scoring with visual indicators
- **ProactiveInsightsWidget**: AI-generated personalized recommendations
- **SmartSuggestions**: Context-aware suggestions with confidence scoring
- **Performance monitoring**: Web Vitals and AI component load time tracking

### Local AI Development Setup

**Ollama Integration**
- Primary model: DeepSeek Coder v2 (specialized for fiscal reasoning)
- Fallback models: Qwen3, Gemma3, Mixtral
- Development environment with local processing
- Production environment with Google Gemini 2.5 Flash

---

## 5. Backend API Endpoints

### 🤖 AI-Powered Features (`/api/ai/`)

#### Fiscal Intelligence
- **`POST /api/ai/fiscal-advice`**: Multi-agent orchestrated fiscal advice with memory context
- **`POST /api/ai/fiscal-context`**: User fiscal profile analysis with forecasting
- **`POST /api/ai/fiscal-suggestions`**: French tax regime recommendations
- **`GET /api/ai/health`**: AI service health monitoring and model availability

### 🔐 Authentication (`/api/auth/`)

#### User Management
- **`POST /api/auth/register`**: User registration with bcrypt password hashing
- **`GET/POST /api/auth/[...nextauth]`**: NextAuth.js authentication flow
- **`GET /api/users/me`**: Authenticated user profile with fiscal data
- **`PUT /api/users/me`**: Profile updates with comprehensive Zod validation
- **`GET /api/users/me/invoices`**: Paginated user invoice listing

### 👥 Client Management (`/api/clients/`)

#### CRUD Operations
- **`GET /api/clients`**: List user's clients with business data
- **`POST /api/clients`**: Create client with French business validation
- **`GET /api/clients/[clientId]`**: Individual client details
- **`PUT /api/clients/[clientId]`**: Update client information
- **`DELETE /api/clients/[clientId]`**: Remove client

### 🏢 Collective Management (`/api/collectives/`)

#### Collective Operations
- **`GET /api/collectives`**: List user's collectives with member details
- **`POST /api/collectives`**: Create new collective
- **`GET /api/collectives/[collectiveId]`**: Collective details with members
- **`PUT /api/collectives/[collectiveId]`**: Update collective (owner only)
- **`DELETE /api/collectives/[collectiveId]`**: Delete collective (owner only)

#### Member Management
- **`GET /api/collectives/[collectiveId]/members`**: List collective members
- **`POST /api/collectives/[collectiveId]/members`**: Add member (owner only)
- **`DELETE /api/collectives/[collectiveId]/members`**: Remove member (owner only)

#### Shared Client Management
- **`GET /api/collectives/[collectiveId]/clients`**: List shared clients
- **`POST /api/collectives/[collectiveId]/clients`**: Associate client with collective
- **`POST /api/collectives/[collectiveId]/clients/import`**: Bulk CSV import
- **`DELETE /api/collectives/[collectiveId]/clients/[clientId]`**: Remove client association

#### Collective Invoicing
- **`GET /api/collectives/[collectiveId]/invoices`**: List collective invoices
- **`POST /api/collectives/[collectiveId]/invoices`**: Create collective invoice
- **`POST /api/collectives/[collectiveId]/invoices/[invoiceId]/generate-subinvoice`**: Generate sub-invoices

### 📄 Invoice System (`/api/invoices/`)

#### Invoice Management
- **`GET /api/invoices`**: List user invoices with fresh data (`revalidate = 0`)
- **`POST /api/invoices`**: Create invoice with automatic numbering and sub-invoice generation
- **`GET /api/invoices/[invoiceId]`**: Individual invoice with items and shares
- **`PUT /api/invoices/[invoiceId]`**: Update invoice with complex validation
- **`DELETE /api/invoices/[invoiceId]`**: Delete invoice

#### Sub-Invoice Operations
- **`GET /api/invoices/[invoiceId]/sub-invoices`**: List generated sub-invoices
- **`POST /api/invoices/[invoiceId]/generate-subinvoice`**: Generate and notify sub-invoices

#### PDF Generation
- **`GET /api/invoices/[invoiceId]/pdf`**: Generate invoice PDF with React-PDF
- **`GET /api/sub-invoices/[subInvoiceId]/pdf`**: Generate sub-invoice PDF

### 📑 Sub-Invoice Management (`/api/sub-invoices/`)

#### Sub-Invoice Operations
- **`GET /api/sub-invoices`**: List received sub-invoices
- **`GET /api/sub-invoices/[subInvoiceId]`**: Individual sub-invoice details
- **`PUT /api/sub-invoices/[subInvoiceId]`**: Update sub-invoice (receiver only)
- **`DELETE /api/sub-invoices/[subInvoiceId]`**: Delete sub-invoice (receiver only)

### 🔔 Notification System (`/api/notifications/`)

#### Notification Management
- **`GET /api/notifications`**: List notifications with unread filtering
- **`POST /api/notifications`**: Create notification
- **`GET /api/notifications/[id]`**: Individual notification details
- **`PUT /api/notifications/[id]`**: Mark notification as read
- **`DELETE /api/notifications/[id]`**: Delete notification
- **`POST /api/notifications/mark-all-read`**: Bulk mark as read

### 🌐 Public APIs (`/api/public/`)

#### Public Access
- **`GET /api/public/invoices/[invoiceId]`**: Public invoice view (filtered data)
- **`POST /api/public/invoices/[invoiceId]/checkout`**: Create Stripe Checkout session

### 📊 Reporting System (`/api/reports/`)

#### French Tax Compliance Reports
- **`GET /api/reports/tva`**: TVA (VAT) reports with automatic HT/TVA/TTC calculations
- **`GET /api/reports/urssaf`**: URSSAF CSV export with micro-entrepreneur rates
- **`GET /api/reports/urssaf/pdf`**: PDF URSSAF report generation
- **`GET /api/reports/urssaf-csv`**: CSV export functionality
- **`GET /api/reports/urssaf-reports`**: List generated reports
- **`GET /api/reports/urssaf-reports/[id]`**: Individual report access

### 💳 Payment Processing (`/api/stripe/`)

#### Stripe Connect Integration
- **`POST /api/stripe/onboard`**: Express account onboarding for French users
- **`POST /api/stripe/payout`**: Multi-party payout processing to collective members
- **`POST /api/webhook/stripe-payment-success`**: Payment webhook with signature verification

### 🔍 Analytics & Insights (`/api/insights/`)

#### Business Intelligence
- **`GET /api/insights`**: Fiscal health scoring and smart suggestions with caching

### 🕐 Automated Systems (`/api/cron/`)

#### Compliance Automation
- **`GET /api/cron/generate-urssaf-reports`**: Automated URSSAF report generation
- **`GET /api/cron/urssaf-reminders`**: Automated tax reminder notifications

### 🏢 Collective Payouts (`/api/collective-payouts/`)

#### Payout Management
- **`GET /api/collective-payouts`**: List payout tracking and status

---

## 6. Frontend Components & Features

### Dashboard Architecture

The frontend uses a sophisticated component-based architecture with responsive navigation and real-time data updates.

#### Core Navigation
- **`Sidebar.tsx`**: Fixed sidebar with organized sections (Dashboard, Facturation, Gestion, Analyse, Rapports, Paramètres)
- **`DashboardNavbar.tsx`**: Top navigation with user profile and notifications
- **`Navbar.tsx`**: Public page navigation

#### AI-Enhanced Dashboard Widgets

**Fiscal Intelligence Widgets**
- **`FiscalHealthWidget.tsx`**: Real-time fiscal health score (0-100) with visual circular progress
- **`AsyncFiscalHealthWidget.tsx`**: Lazy-loaded version with timeout handling (25s)
- **`ProactiveInsightsWidget.tsx`**: AI-generated personalized recommendations with priority levels
- **`AsyncProactiveInsightsWidget.tsx`**: Performance-optimized version
- **`SmartSuggestions.tsx`**: Context-aware suggestions with confidence scoring
- **`AsyncSmartSuggestions.tsx`**: Debounced API calls (500ms) for performance

#### Notification System

**Multi-Channel Notifications**
- **`NotificationCenter.tsx`**: Real-time notification bell with unread count and auto-refresh (30s)
- **`FixedNotificationCenter.tsx`**: Fixed positioning version
- **`ToastProvider.tsx`**: Context provider for urgent alerts
- **`ToastNotification.tsx`**: Auto-hide toasts with progress bars and action buttons

#### French Tax & Business Tools

**Micro-Entrepreneur Simulator**
- **`SimulateurAutoEntrepreneur.tsx`**: Real-time URSSAF contribution calculator
  - Support for COMMERCANT (12.8%), PRESTATAIRE (22%), LIBERAL (22%) rates
  - TVA threshold monitoring with warnings
  - Income tax estimation and net income projections

**Reporting Components**
- **`UrssafReportsTable.tsx`**: Report management with automated and manual generation
- **`UrssafReportModal.tsx`**: Modal for report creation and configuration

#### Professional Document Generation

**PDF Components**
- **`InvoicePdf.tsx`**: French-compliant invoice layouts with itemized services
- **`SubInvoicePdf.tsx`**: Sub-invoice PDF generation
- **`UrssafReportPdf.tsx`**: Official URSSAF report formatting

#### Performance & Developer Experience

**Monitoring & Optimization**
- **`PerformanceMonitor.tsx`**: Web Vitals monitoring (FCP, LCP, CLS, FID)
- **`TestimonialSection.tsx`**: Landing page testimonials
- **`SessionProvider.tsx`**: NextAuth session context

### Page Structure

**Dashboard Pages**
- `/dashboard/page.tsx`: Main dashboard overview with AI widgets
- `/dashboard/assistant/page.tsx`: AI fiscal assistant interface
- `/dashboard/clients/page.tsx`: Client management interface
- `/dashboard/collectives/page.tsx`: Collective management
- `/dashboard/invoices/page.tsx`: Invoice creation and management
- `/dashboard/reports/page.tsx`: URSSAF and tax reporting
- `/dashboard/profile/page.tsx`: User profile with fiscal settings
- `/dashboard/notifications/page.tsx`: Notification center

**Authentication Pages**
- `/auth/signin/page.tsx`: Sign-in interface
- `/auth/register/page.tsx`: User registration

**Public Pages**
- `/page.tsx`: Landing page with features showcase
- `/invoices/[invoiceId]/pay/page.tsx`: Public payment interface
- `/payment-success/page.tsx`: Payment confirmation

### Key UI Features

1. **Real-time Updates**: Live notifications and automatic data refresh
2. **Responsive Design**: Bootstrap-based responsive components
3. **AI-First Interface**: Every major feature includes AI insights
4. **French Localization**: Specialized French business terminology
5. **Professional Styling**: Consistent branding and professional appearance
6. **Performance Optimization**: Lazy loading, caching, and timeout management
7. **Accessibility**: Keyboard shortcuts and accessible UI patterns

---

## 7. Payment & Financial Integration

### Stripe Connect Architecture

Splitfact implements a comprehensive multi-party payment system using Stripe Connect, specifically designed for collaborative invoicing and revenue sharing.

#### Express Account Integration

**Account Onboarding**
- **`POST /api/stripe/onboard`**: Creates Express accounts for French users
- Automatic compliance with French banking regulations
- KYC/AML verification handled by Stripe
- Real-time onboarding status tracking

**Account Management**
- Stripe account ID stored in user profile (`stripeAccountId`)
- Account linking verification before payment processing
- Automatic account status monitoring

#### Multi-Party Payment Flow

**1. Invoice Payment Processing**
- **`POST /api/public/invoices/[invoiceId]/checkout`**: Creates Checkout Session
- Direct charges to invoice issuer's connected account
- Automatic payment status updates across invoice hierarchy
- Support for immediate and delayed payment processing

**2. Collective Revenue Distribution**
- **`POST /api/stripe/payout`**: Automated payout to collective members
- Revenue sharing based on `InvoiceShare` configurations
- Support for percentage and fixed amount distributions
- Payout tracking with `CollectivePayout` model

**3. Webhook Integration**
- **`POST /api/webhook/stripe-payment-success`**: Handles payment events
- Signature verification for security
- Cascading status updates (main invoice → sub-invoices)
- Support for `checkout.session.completed` and `payment_intent.succeeded`

#### Financial Data Management

**Decimal Precision**
- All financial amounts stored as `Decimal` type for precision
- Proper handling of fractional cents in calculations
- French currency formatting (€ symbol, comma decimal separator)

**Revenue Sharing Logic**
```typescript
// Share calculation examples
shareType: 'percent' | 'fixed'
shareValue: Decimal // Percentage (0-100) or fixed amount
calculatedAmount: Decimal // Final amount after calculation
```

**Payout Status Tracking**
```typescript
enum PayoutStatus {
  pending     // Awaiting processing
  processing  // Transfer in progress
  completed   // Successfully transferred
  failed      // Transfer failed (with error details)
  cancelled   // Cancelled by user/system
}
```

### Tax Calculation Engine

**French VAT (TVA) Handling**
- Automatic HT (Hors Taxes) / TTC (Toutes Taxes Comprises) calculations
- TVA rate application per invoice item
- Threshold monitoring for VAT eligibility (€91,900 commercial, €36,800 services)

**URSSAF Contribution Calculations**
- Micro-entrepreneur specific rates:
  - **COMMERCANT**: 12.8% URSSAF contribution
  - **PRESTATAIRE**: 22% URSSAF contribution  
  - **LIBERAL**: 22% URSSAF contribution
- Automatic contribution calculations in URSSAF reports
- Net income projections after all deductions

---

## 8. French Fiscal Compliance

### Micro-Entrepreneur Support

Splitfact provides comprehensive support for French micro-entrepreneurs (auto-entrepreneurs) with specialized features for tax compliance and business management.

#### Fiscal Regime Management

**Supported Regimes**
- **Micro-BIC**: Commercial activities with simplified tax regime
- **BNC**: Non-commercial professions (liberal professions)
- **SASU**: Simplified joint-stock companies
- **EI**: Individual enterprises
- **Other**: Custom fiscal arrangements

**Micro-Entrepreneur Types**
- **COMMERCANT**: Commercial activities (12.8% URSSAF rate)
- **PRESTATAIRE**: Service providers (22% URSSAF rate)
- **LIBERAL**: Liberal professions (22% URSSAF rate)

#### URSSAF Compliance & Automation

**Automated Report Generation**
- Monthly and quarterly report generation based on user preference
- Automated cron jobs run on 1st of each month at 9 AM UTC
- Comprehensive financial summaries with proper tax calculations
- PDF and CSV export capabilities

**Threshold Monitoring**
- Real-time monitoring of income thresholds
- Automatic alerts when approaching regime limits
- TVA threshold warnings (€91,900 commercial, €36,800 services)
- BNC/BIC regime transition notifications

**Report Features**
- Period-based reporting (monthly/quarterly)
- Automatic HT/TVA/TTC calculations
- Paid invoice disclaimers for compliance
- Legal mention generation based on fiscal regime
- Export capabilities (PDF, CSV)

#### TVA (VAT) Management

**Threshold Monitoring**
- Automatic tracking of annual turnover
- Threshold alerts before exceeding limits
- TVA applicability assessment based on business type
- Notification system for threshold changes

**TVA Calculations**
- Item-level TVA rate application
- Automatic total calculations (HT + TVA = TTC)
- TVA reporting for eligible businesses
- French decimal formatting compliance

#### Legal Compliance Features

**Invoice Legal Requirements**
- Automatic legal mention generation based on fiscal regime
- SIRET number validation and display
- TVA number handling for applicable businesses
- Payment terms and late penalty clauses
- Recovery indemnity calculations

**Business Entity Support**
- SIRET number validation
- RCS number tracking for applicable entities
- Share capital recording for corporations
- APE code management
- Legal status tracking

### Automated Compliance Systems

**Cron Job Architecture**
- **`/api/cron/generate-urssaf-reports`**: Monthly report generation
- **`/api/cron/urssaf-reminders`**: Deadline notifications
- Bearer token authentication for security
- Vercel cron job integration for reliable scheduling

**Notification System**
- **URSSAF_REMINDER**: Declaration deadline alerts
- **TVA_THRESHOLD_WARNING**: Approaching threshold notifications
- **TVA_THRESHOLD_EXCEEDED**: Immediate regime change alerts
- Smart deduplication to prevent notification spam

**AI-Powered Fiscal Advice**
- French-specific tax optimization recommendations
- Regime comparison and switching advice
- Compliance risk assessment
- Proactive threshold management suggestions

---

## 9. Deployment & Configuration

### Production Deployment (Vercel)

#### Automated URSSAF Report Generation

**Vercel Cron Configuration** (`vercel.json`)
```json
{
  "crons": [
    {
      "path": "/api/cron/generate-urssaf-reports",
      "schedule": "0 9 1 * *"
    }
  ]
}
```

**Schedule Details**
- Runs monthly on 1st of each month at 9 AM UTC
- Processes users with `declarationFrequency` set to `monthly` or `quarterly`
- Filters by `fiscalRegime` (MicroBIC, BNC) and `microEntrepreneurType`
- Generates reports for appropriate periods with automatic notifications

#### Required Environment Variables

**Database & Authentication**
```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your_auth_secret
NEXTAUTH_URL=https://your-app.vercel.app
```

**Stripe Integration**
```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Email Service**
```env
RESEND_API_KEY=re_...
EMAIL_FROM=your-app@domain.com
```

**AI Services**
```env
AI_MODE=gemini  # Production mode
GEMINI_API_KEY=your_gemini_key
OLLAMA_BASE_URL=http://localhost:11434  # Development only
OLLAMA_MODEL=deepseek-coder-v2:latest
```

**Security**
```env
CRON_SECRET=your_secure_cron_secret
```

#### Vercel Deployment Steps

1. **Push to GitHub** with `vercel.json` configuration
2. **Connect to Vercel** and import project
3. **Add Environment Variables** in Vercel Dashboard
4. **Deploy** with automatic CI/CD pipeline
5. **Verify Cron Jobs** in Vercel Functions dashboard

### Local Development Setup

#### Prerequisites

**Node.js & Package Manager**
```bash
node >= 18.0.0
npm >= 9.0.0
```

**Database Setup**
```bash
# PostgreSQL (via Docker or local installation)
docker run --name splitfact-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15
```

**Ollama Setup (Optional for AI development)**
```bash
# macOS
brew install ollama

# Start Ollama service
ollama serve

# Pull recommended model
ollama pull deepseek-coder-v2:latest
```

#### Development Environment

**Install Dependencies**
```bash
npm install
```

**Database Setup**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (if seeder exists)
npx prisma db seed
```

**Start Development Server**
```bash
npm run dev
```

**Environment Configuration** (`.env.local`)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/splitfact"

# NextAuth
NEXTAUTH_SECRET="your-development-secret"
NEXTAUTH_URL="http://localhost:3000"

# AI Mode (local for development)
AI_MODE=local
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-coder-v2:latest

# Optional: Gemini for testing
GEMINI_API_KEY=your_gemini_key

# Stripe (test keys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (test mode)
RESEND_API_KEY=re_...
EMAIL_FROM=test@localhost
```

### Performance Optimization

**Caching Strategy**
- AI responses cached with TTL-based expiration
- Database queries optimized with Prisma relations
- Static assets optimized with Next.js automatic optimization

**Database Performance**
- Indexed foreign keys and frequently queried fields
- Optimized query patterns with proper relations
- Pagination implemented for large datasets

**AI Performance**
- Local Ollama for development (faster iteration)
- Production Gemini for reliability and scale
- Multi-tier caching system for AI responses
- Timeout management for AI service calls

---

## 10. Security & Authentication

### Authentication Architecture

**NextAuth.js Integration**
- JWT strategy with comprehensive user data in tokens
- Credentials provider for email/password authentication
- Prisma adapter for session and user management
- Secure password hashing with bcryptjs

**Session Management**
```typescript
// Extended session data
session: {
  user: {
    id: string
    name: string
    email: string
    fiscalRegime: FiscalRegime
    stripeAccountId: string
    // ... other profile data
  }
}
```

### API Security

**Route Protection**
- Consistent session validation across all protected routes
- User-scoped data access with ownership validation
- Role-based access control for collective operations

**Webhook Security**
- Stripe webhook signature verification
- Bearer token authentication for cron jobs
- Environment-based secret management

**Input Validation**
- Comprehensive Zod schemas for all API inputs
- French business entity validation (SIRET, TVA numbers)
- Conditional validation based on fiscal regimes
- Sanitization of user inputs

### Data Protection

**Financial Data Security**
- Decimal precision for all financial calculations
- Immutable invoice snapshots (client/issuer data)
- Secure payment processing through Stripe Connect
- PCI compliance through Stripe integration

**Privacy Compliance**
- GDPR-ready data architecture
- User data isolation and access controls
- Secure file storage with Cloudinary
- Email data protection with Resend

**Database Security**
- Prisma ORM with parameterized queries (SQL injection protection)
- Environment-based database URL configuration
- Secure connection strings with SSL
- Regular automated backups (Neon PostgreSQL)

### Business Logic Security

**Multi-Party Payment Security**
- Ownership verification before payment processing
- Payout validation and error handling
- Attempt tracking for failed transactions
- Audit trail for all financial operations

**Collective Security**
- Owner-only operations for sensitive collective actions
- Member verification before adding to collectives
- Client association permissions
- Revenue sharing validation

---

## 11. Development Setup

### Quick Start Guide

**1. Clone and Install**
```bash
git clone https://github.com/your-org/splitfact-app
cd splitfact-app
npm install
```

**2. Environment Setup**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

**3. Database Setup**
```bash
# Start PostgreSQL (Docker)
docker run --name splitfact-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15

# Run migrations
npx prisma migrate dev

# Generate client
npx prisma generate
```

**4. Start Development**
```bash
npm run dev
```

### Development Workflow

**Database Management**
```bash
# View database
npx prisma studio

# Reset database
npx prisma migrate reset

# Create migration
npx prisma migrate dev --name your-migration-name
```

**AI Development Setup**
```bash
# Install Ollama
brew install ollama

# Start service
ollama serve

# Pull models
ollama pull deepseek-coder-v2:latest
ollama pull qwen3:latest

# Set environment
AI_MODE=local
```

**Testing**
```bash
# Lint code
npm run lint

# Build project
npm run build

# Test API endpoints
curl http://localhost:3000/api/ai/health
```

### Code Structure

**Directory Organization**
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── components/        # Shared components
│   └── auth/             # Authentication pages
├── lib/                   # Utility libraries
│   ├── ai-*.ts           # AI services
│   ├── prisma.ts         # Database client
│   └── utils.ts          # Helper functions
├── components/            # UI components
└── types/                # TypeScript definitions
```

**Code Style Guidelines**
- TypeScript for type safety
- Zod for runtime validation
- Prisma for database operations
- Consistent error handling patterns
- French terminology for business logic

---

## 12. Feature Status & Roadmap

### ✅ Complete Features

#### Core Platform
- **User Authentication & Profile Management**: Complete NextAuth.js integration with fiscal profile support
- **Client Management**: Full CRUD operations with French business validation
- **Collective Management**: Advanced multi-user collaboration with role-based permissions
- **Invoice System**: Professional invoicing with automatic numbering and legal compliance
- **Sub-Invoice Generation**: Automated revenue sharing with email notifications

#### AI-Powered Intelligence
- **Multi-Agent AI System**: LangGraph orchestration with specialized fiscal agents
- **Proactive Insights**: Real-time business intelligence with health scoring
- **Smart Suggestions**: Context-aware recommendations with confidence scoring
- **Fiscal Health Monitoring**: 4-component health assessment with trend analysis
- **AI Memory System**: Conversation continuity with vector-based storage

#### French Fiscal Compliance
- **URSSAF Automation**: Automated report generation with cron jobs
- **TVA Threshold Monitoring**: Real-time threshold tracking with notifications
- **Micro-Entrepreneur Support**: Specialized calculators and regime-specific features
- **Legal Document Generation**: Compliant PDFs with proper French formatting

#### Payment & Financial
- **Stripe Connect Integration**: Multi-party payment processing and onboarding
- **Collective Payouts**: Automated revenue distribution to team members
- **Financial Reporting**: PDF and CSV export with proper tax calculations

#### User Experience
- **Real-time Notifications**: Multi-channel notification system with urgency levels
- **Performance Monitoring**: Web Vitals tracking and AI component optimization
- **Responsive Design**: Bootstrap-based mobile-friendly interface

### 🚧 In Progress Features

#### Enhanced AI Capabilities
- **Conversation Context Expansion**: Deeper memory integration across all AI interactions
- **Predictive Analytics**: Advanced forecasting for cash flow and tax obligations
- **Document Intelligence**: AI-powered invoice analysis and optimization suggestions

#### Extended Reporting
- **Advanced Analytics Dashboard**: Business intelligence with trend analysis
- **Export Customization**: Configurable report formats and periods
- **Compliance Tracking**: Automated compliance score calculation

### 📋 Planned Features

#### Platform Expansion
- **Multi-language Support**: Internationalization for broader European markets
- **Advanced Permissions**: Granular role-based access control
- **API Documentation**: OpenAPI specification and developer portal

#### Business Intelligence
- **Competitive Analysis**: Market benchmarking and positioning insights
- **Client Relationship Management**: Advanced CRM features with AI-powered insights
- **Cash Flow Forecasting**: Predictive cash flow analysis with scenario planning

#### Integration Ecosystem
- **Accounting Software Integration**: Direct integration with popular French accounting tools
- **Banking Connections**: Open Banking integration for automatic transaction import
- **Third-party Service Marketplace**: Plugin system for extended functionality

#### Advanced Compliance
- **Multi-jurisdiction Support**: Support for other European fiscal regimes
- **Audit Trail Enhancement**: Comprehensive audit logging and compliance reporting
- **Advanced Tax Optimization**: AI-powered tax strategy recommendations

### 🎯 Development Priorities

1. **AI Enhancement**: Expand conversation memory and predictive capabilities
2. **User Experience**: Mobile app development for iOS/Android
3. **Compliance Expansion**: Support for additional European markets
4. **Integration Platform**: Open API for third-party integrations
5. **Advanced Analytics**: Business intelligence dashboard expansion

---

## 📚 Additional Resources

### Documentation Files
- **`OLLAMA_SETUP.md`**: Local AI development setup guide
- **`VERCEL_DEPLOYMENT.md`**: Production deployment instructions
- **`README.md`**: Quick start guide and basic information

### Development Tools
- **Prisma Studio**: Database visual editor
- **Next.js DevTools**: Development debugging tools
- **Vercel Analytics**: Production monitoring and performance insights

### Support & Community
- **GitHub Issues**: Bug reports and feature requests
- **Development Discord**: Community support and discussions
- **Documentation Wiki**: Extended guides and best practices

---

*This documentation represents the current state of Splitfact as of July 2025. The application continues to evolve with new features and improvements based on user feedback and market needs.*
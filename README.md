# 📊 Splitfact

**AI-Powered Invoicing & Fiscal Management Platform for French Micro-Entrepreneurs**

[![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-green?logo=openai)](https://openai.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://prisma.io/)
[![Tests](https://img.shields.io/badge/Tests-100%25-brightgreen?logo=jest)](https://jestjs.io/)

**Splitfact** is a comprehensive, AI-powered invoicing and fiscal management platform specifically designed for French micro-entrepreneurs (auto-entrepreneurs) and freelance collectives. The application combines professional invoicing capabilities with intelligent business insights, automated tax compliance, and collaborative revenue sharing.

---

## 🚀 Features

### 💰 **Invoicing & Payments**
- **Professional Invoice Generation** with French legal compliance
- **Stripe Integration** for secure online payments
- **Multi-currency Support** with automatic conversion
- **Recurring Invoice Automation**
- **Payment Tracking & Reminders**

### 🤖 **AI-Powered Insights**  
- **Intelligent Query Routing** (Simple → Direct AI, Complex → Multi-Agent)
- **French Fiscal Advisory** with real-time compliance checks
- **URSSAF Declaration Assistance** and deadline reminders  
- **TVA Threshold Monitoring** with automated warnings
- **Cash Flow Predictions** and business analytics
- **Cost-Optimized AI** (€0.30-€0.90/month for 20 users)

### 👥 **Collective Management**
- **Revenue Sharing** with customizable distribution rules
- **Team Collaboration** with role-based permissions
- **Client Assignment** and workload balancing
- **Collective Reporting** and analytics

### 📋 **Compliance & Reporting**
- **French Tax Compliance** (MicroBIC, BNC regimes)
- **Automated URSSAF Reports** with calculation assistance
- **TVA Management** and threshold tracking
- **Export to CSV/PDF** for accountants
- **Deadline Notifications** and fiscal calendar

### 🔔 **Smart Notifications**
- **URSSAF Reminders** (2 days before deadlines)
- **TVA Threshold Alerts** when approaching limits
- **Payment Due Notifications**
- **Cash Flow Insights** and recommendations

---

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 15.3.5** (App Router, React Server Components)
- **TypeScript** for type safety
- **Tailwind CSS** for responsive design
- **Shadcn/UI** components

### **Backend**
- **Next.js API Routes** (serverless functions)
- **NextAuth.js** for authentication
- **Prisma ORM** with PostgreSQL
- **Stripe API** for payments

### **AI & Intelligence**
- **OpenAI GPT-4o-mini** for production (cost-optimized)
- **Ollama** for local development
- **Multi-Agent System** for complex fiscal analysis
- **LangChain** for AI orchestration
- **Smart Query Routing** to optimize costs

### **Infrastructure**
- **Vercel** deployment ready
- **Neon PostgreSQL** database
- **Cloudinary** for file storage
- **Resend** for email notifications

---

## 📋 Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **PostgreSQL** database (or Neon)
- **OpenAI API Key** (for production)
- **Stripe Account** (for payments)

---

## 🚀 Quick Start

### 1. **Clone the Repository**
```bash
git clone https://github.com/AndreLiar/splitfact.git
cd splitfact
```

### 2. **Install Dependencies**
```bash
npm install
```

### 3. **Environment Setup**
Create `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/splitfact"

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# AI Configuration
AI_MODE=local  # Use 'openai' for production
OPENAI_API_KEY=sk-proj-your-openai-key
OPENAI_MODEL=gpt-4o-mini

# Ollama (for local development)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-coder-v2:latest

# Stripe
STRIPE_SECRET_KEY=sk_test_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Email
RESEND_API_KEY=re_your-resend-key
EMAIL_FROM=your-email@domain.com

# File Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 4. **Database Setup**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma db push

# (Optional) Seed database
npx prisma db seed
```

### 5. **Start Development Server**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

---

## 🧪 Testing

### **Run All Tests**
```bash
npm test                    # Jest unit tests
npm run test:e2e           # Playwright e2e tests  
npm run test:full          # Complete test suite (100% success rate)
```

### **Quality Checks**
```bash
npm run lint               # ESLint code quality
npm run type-check         # TypeScript validation
npm run build              # Production build test
```

### **Test Coverage**
- ✅ **Unit Tests**: 72/72 passing
- ✅ **API Integration Tests**: All endpoints covered
- ✅ **TypeScript**: Zero compilation errors
- ✅ **ESLint**: Zero linting errors
- ✅ **Build**: Production ready

---

## 🔧 Development Workflow

### **Branch Strategy**
```
main     ← Production (auto-deploy to Vercel)
├── staging ← Pre-production testing  
└── dev     ← Active development
```

### **Local Development**
```bash
# Switch to development branch
git checkout dev

# Start with Ollama (local AI)
AI_MODE=local npm run dev

# Run tests continuously  
npm run test:watch
```

### **AI Development Modes**

#### **Local Development** (Free)
```env
AI_MODE=local
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-coder-v2:latest
```

#### **Production** (Cost-Optimized)
```env
AI_MODE=openai
OPENAI_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-proj-your-key
```

---

## 💰 AI Cost Management

### **Optimized for €5 Budget**
- **Model**: GPT-4o-mini (cheapest OpenAI model)
- **Smart Routing**: Simple queries bypass expensive multi-agent processing
- **Token Limits**: 1000 max tokens per request
- **Budget Protection**: Automatic blocking when approaching limits
- **Usage Tracking**: Real-time cost monitoring

### **Expected Costs (20 users/month)**
```
Simple Queries (80%): €0.001 each = €0.16
Complex Queries (20%): €0.005 each = €0.20
─────────────────────────────────────────
Total Monthly Cost: ~€0.36 (7% of budget) ✅
```

### **Monitor Usage**
```bash
# Check current usage
curl http://localhost:3000/api/ai/usage

# Reset monthly stats
curl -X POST http://localhost:3000/api/ai/usage \
  -H "Content-Type: application/json" \
  -d '{"action": "reset"}'
```

---

## 🚀 Deployment

### **Vercel Deployment** (Recommended)

#### **1. Connect Repository**
```bash
# Deploy to Vercel  
vercel --prod

# Set environment variables in Vercel dashboard
# Switch AI_MODE to 'openai' for production
```

#### **2. Database Setup**
```bash
# Use Neon PostgreSQL for production
# Update DATABASE_URL in Vercel environment variables
```

#### **3. Domain Configuration**
```bash
# Update NEXTAUTH_URL to your production domain
# Configure Stripe webhooks for production domain
```

### **Manual Deployment**
```bash
# Build for production
npm run build

# Start production server  
npm run start
```

---

## 📁 Project Structure

```
splitfact/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── ai/           # AI services
│   │   │   ├── auth/         # Authentication  
│   │   │   ├── invoices/     # Invoice management
│   │   │   └── reports/      # Fiscal reports
│   │   ├── dashboard/        # Main application
│   │   └── components/       # React components
│   ├── lib/                   # Utilities & services
│   │   ├── ai-service.ts     # Universal AI service
│   │   ├── openai-service.ts # OpenAI integration
│   │   ├── cost-monitor.ts   # Usage tracking
│   │   ├── fiscal-agents.ts  # Multi-agent system
│   │   └── prisma.ts         # Database client
│   └── types/                # TypeScript definitions
├── prisma/                   # Database schema & migrations
├── tests/                    # Test suites
├── docs/                     # Documentation
└── scripts/                  # Automation scripts
```

---

## 🔒 Security Features

- **NextAuth.js** authentication with session management
- **CSRF Protection** on all forms
- **Rate Limiting** on API endpoints
- **Input Validation** with Zod schemas
- **SQL Injection Prevention** with Prisma ORM
- **Secure Headers** configured
- **Environment Variable Protection**

---

## 🌍 French Business Compliance

### **Supported Fiscal Regimes**
- ✅ **Micro-BIC** (Commercial activities)
- ✅ **BNC** (Liberal professions)  
- ✅ **Auto-entrepreneur** status
- ✅ **TVA** management and thresholds

### **URSSAF Integration**
- **Monthly/Quarterly** declaration assistance
- **Automatic calculations** for social contributions
- **Deadline reminders** and notifications
- **Export formats** compatible with URSSAF

### **TVA Thresholds (2024)**
- **Commercial**: €91,900
- **Services**: €36,800
- **Liberal professions**: €36,800
- **Automatic monitoring** and alerts

---

## 🤝 Contributing

### **Development Setup**
```bash
# Fork and clone the repository
git clone https://github.com/YOUR-USERNAME/splitfact.git

# Create feature branch from dev
git checkout dev
git checkout -b feature/your-feature-name

# Make changes and test
npm run test:full

# Submit pull request to dev branch
```

### **Code Standards**
- **TypeScript** required for all new code
- **ESLint** configuration must pass
- **100% test coverage** for new features
- **Conventional commits** for commit messages

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 💬 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/AndreLiar/splitfact/issues)
- **Email**: kanmegneandre@gmail.com

---

## 🎯 Roadmap

### **Phase 1** (Current)
- ✅ Core invoicing functionality
- ✅ AI-powered fiscal advice  
- ✅ URSSAF compliance tools
- ✅ Cost-optimized AI integration

### **Phase 2** (Q2 2025)
- 🔄 Advanced analytics dashboard
- 🔄 Mobile application (React Native)
- 🔄 Multi-language support
- 🔄 Advanced collective features

### **Phase 3** (Q3 2025)
- 🔄 API for third-party integrations
- 🔄 Marketplace for fiscal templates
- 🔄 Advanced AI predictions
- 🔄 European expansion

---

**Made with ❤️ for French micro-entrepreneurs**

*Empowering freelancers and small businesses with intelligent fiscal management.*
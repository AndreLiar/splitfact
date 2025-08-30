# Splitfact DevOps Pipeline

## Overview

This document outlines the comprehensive DevOps pipeline implemented for Splitfact to ensure code quality, security, and reliability before reaching production.

## Branch Strategy

```
Feature Branch → dev → staging → main
                 ↓      ↓        ↓
              Preview  Preview  Production
```

### Branch Roles:
- **Feature branches**: Development work
- **dev**: Integration branch with auto-promotion to staging
- **staging**: Pre-production testing environment  
- **main**: Production branch (protected)

## Pipeline Gates

### 1. Pull Request Validation (`.github/workflows/pr-validation.yml`)
**Triggers**: PR to dev/staging/main
**Required Checks**:
- ✅ ESLint code quality
- ✅ TypeScript compilation
- ✅ Security audit (npm audit)
- ✅ Unit & Integration tests (70% coverage minimum)
- ✅ API endpoint tests
- ✅ Build validation
- ✅ PWA validation

### 2. Security Scanning (`.github/workflows/security-scan.yml`)
**Triggers**: Push to main branches, PRs, weekly schedule
**Security Layers**:
- 🔒 **CodeQL Analysis**: Static code analysis for vulnerabilities
- 🔒 **Dependency Review**: License and vulnerability checking
- 🔒 **NPM Audit**: High/critical vulnerability detection
- 🔒 **Secret Scanning**: TruffleHog for leaked credentials

### 3. Branch Promotion (`.github/workflows/branch-promotion.yml`)
**Auto-promotion**: dev → staging (on successful push to dev)
**Manual promotion**: staging → main (workflow dispatch)

## Pipeline Flow

### 1. Feature Development
```bash
git checkout -b feature/your-feature
# Make changes
git push origin feature/your-feature
# Create PR to dev
```

### 2. Dev Integration
- PR validation runs automatically
- All checks must pass for merge
- Auto-promotion to staging after merge

### 3. Staging Validation
- Manual testing on preview deployment
- Additional validation in staging environment

### 4. Production Release
- Manual promotion using GitHub Actions workflow dispatch
- Enhanced validation including E2E tests
- Automatic release notes generation
- Git tags for version tracking

## Branch Protection Rules

### Required Settings (GitHub Repository Settings):
1. **dev branch**:
   - Require PR reviews: 1 reviewer
   - Require status checks: PR Validation Pipeline
   - Require up-to-date branches
   - Restrict pushes to admins only

2. **staging branch**:
   - Require PR reviews: 1 reviewer  
   - Require status checks: PR Validation Pipeline, Security Scanning
   - Auto-merge allowed from dev branch only

3. **main branch** (CRITICAL):
   - Require PR reviews: 2 reviewers
   - Require status checks: ALL workflows must pass
   - Require up-to-date branches
   - Restrict pushes to admins only
   - No direct pushes allowed

## Quality Standards

### Code Quality
- **ESLint**: Next.js recommended + custom rules
- **TypeScript**: Strict mode enabled
- **Test Coverage**: Minimum 70%
- **Security**: No high/critical vulnerabilities

### Testing Strategy
- **Unit Tests**: Component and utility functions
- **Integration Tests**: API endpoints and database
- **API Tests**: Comprehensive endpoint validation
- **E2E Tests**: Critical user flows (Playwright)

## Security Measures

### Static Analysis
- CodeQL security queries (security-and-quality + security-extended)
- Weekly automated scans
- Dependency vulnerability tracking

### Runtime Security
- NPM audit with strict thresholds
- Secret scanning in commits
- Dependency license compliance

## Deployment Integration

### Vercel Configuration
- **Production**: main branch → splitfact-app.vercel.app
- **Preview**: dev/staging branches → auto-generated URLs
- Build process includes PWA validation
- Environment variables managed per branch

## Monitoring & Alerts

### GitHub Actions
- Slack/email notifications for pipeline failures
- PR status checks prevent merging on failures
- Weekly security scan reports

### Coverage Reporting
- Codecov integration for coverage tracking
- Coverage trends and PR impact analysis

## Manual Override Process

In emergency situations:
1. Contact repository admin
2. Temporarily disable branch protection
3. Make necessary changes
4. Re-enable protection immediately
5. Create post-incident review

## Getting Started

### For Developers
1. Clone repository
2. Create feature branch from dev
3. Make changes following coding standards
4. Create PR to dev
5. Address any pipeline failures
6. Await review and merge

### For Maintainers
1. Review PRs thoroughly
2. Use manual promotion for staging → main
3. Monitor security scan results weekly
4. Update dependencies regularly

## Commands Reference

```bash
# Local development
npm run dev
npm run lint
npm run test
npm run test:coverage
npm run build
npm run pwa:validate

# Manual promotion (GitHub UI)
Actions → Branch Promotion Pipeline → Run workflow
```

## Files Created

- `.github/workflows/pr-validation.yml`: Main PR validation pipeline
- `.github/workflows/security-scan.yml`: Security scanning workflows  
- `.github/workflows/branch-promotion.yml`: Branch promotion automation
- `.github/codeql/codeql-config.yml`: CodeQL security analysis configuration

## Next Steps

1. **Configure branch protection rules** in GitHub repository settings
2. **Set up Codecov** for coverage reporting  
3. **Configure notification channels** (Slack/email)
4. **Review security scan results** and address any findings
5. **Train team** on new workflow processes

---

*This pipeline ensures that only thoroughly tested, secure, and high-quality code reaches production while maintaining development velocity.*
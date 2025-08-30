# Branch Protection Rules Setup Guide

## 🚨 CRITICAL: These rules must be configured to make your DevOps pipeline work!

### Step 1: Access Branch Protection Settings

1. Go to your GitHub repository: `https://github.com/AndreLiar/splitfact`
2. Click **Settings** tab
3. Click **Branches** in left sidebar
4. Click **Add rule** button

---

## Rule 1: MAIN Branch Protection (MOST CRITICAL)

### Branch name pattern: `main`

**Required settings:**
- ☑️ **Require a pull request before merging**
  - Required number of reviewers: `2`
  - ☑️ Dismiss stale PR approvals when new commits are pushed
  - ☑️ Require review from code owners (if you have CODEOWNERS file)

- ☑️ **Require status checks to pass before merging**
  - ☑️ Require branches to be up to date before merging
  - **Add these required status checks:**
    - `Validate Pull Request`
    - `CodeQL Security Analysis`
    - `NPM Security Audit`
    - `Secret Scanning`

- ☑️ **Restrict pushes that create files**
- ☑️ **Restrict force pushes**
- ☑️ **Do not allow bypassing the above settings**
- ☑️ **Include administrators** (This prevents even admins from bypassing)

Click **Create** to save main branch rule.

---

## Rule 2: STAGING Branch Protection

### Branch name pattern: `staging`

**Required settings:**
- ☑️ **Require a pull request before merging**
  - Required number of reviewers: `1`
  - ☑️ Dismiss stale PR approvals when new commits are pushed

- ☑️ **Require status checks to pass before merging**
  - ☑️ Require branches to be up to date before merging
  - **Add these required status checks:**
    - `Validate Pull Request`
    - `CodeQL Security Analysis`
    - `NPM Security Audit`

- ☑️ **Restrict pushes that create files**
- ☑️ **Restrict force pushes**

Click **Create** to save staging branch rule.

---

## Rule 3: DEV Branch Protection

### Branch name pattern: `dev`

**Required settings:**
- ☑️ **Require a pull request before merging**
  - Required number of reviewers: `1`

- ☑️ **Require status checks to pass before merging**
  - ☑️ Require branches to be up to date before merging
  - **Add these required status checks:**
    - `Validate Pull Request`

- ☑️ **Restrict force pushes**

Click **Create** to save dev branch rule.

---

## Step 2: Verify Setup

After creating all rules, you should see:
- 🔒 **main** - 2 reviewers, all status checks required
- 🔒 **staging** - 1 reviewer, security checks required  
- 🔒 **dev** - 1 reviewer, validation required

---

## Step 3: Test the Protection

1. Try pushing directly to main: `git push origin main`
   - Should be **BLOCKED** ❌
2. Create a test PR to dev
   - Should trigger **PR Validation Pipeline** ✅
3. PR should be **unmergeable** until checks pass

---

## Important Notes

### Status Check Names (must match exactly):
- `Validate Pull Request` (from pr-validation.yml)
- `CodeQL Security Analysis` (from security-scan.yml)
- `NPM Security Audit` (from security-scan.yml)
- `Secret Scanning` (from security-scan.yml)

### If Status Checks Don't Appear:
1. First push the workflow files to trigger GitHub Actions
2. Wait for workflows to run once
3. Then the status check names will appear in the dropdown

### Emergency Override:
- Only repository admins can temporarily disable protection
- **NEVER leave protection disabled**
- Re-enable immediately after emergency fix

---

## Verification Commands

```bash
# This should be blocked:
git push origin main
# Output: "main is protected"

# This should work:
git checkout -b feature/test
git push origin feature/test
# Create PR through GitHub UI
```

---

## What Each Protection Does

### Main Branch:
- **2 reviewers**: Critical changes need thorough review
- **All status checks**: Every security and quality gate must pass
- **Up-to-date**: No merge conflicts allowed
- **No direct pushes**: Forces PR workflow

### Staging Branch:
- **1 reviewer**: Less restrictive for testing
- **Security checks**: Still maintains security standards
- **No direct pushes**: Maintains code quality

### Dev Branch:
- **1 reviewer**: Collaborative development
- **Basic validation**: Ensures code compiles and tests pass
- **Force push protection**: Prevents history rewriting

This setup ensures your DevOps pipeline is **ENFORCED**, not optional!
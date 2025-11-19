---
description: Perform a security audit before production deployment.
---

# Security Audit Workflow

Run this workflow before deploying to production or when modifying sensitive components.

1. **Secret Scanning**
   // turbo
   Check for potential secrets in the codebase:
   ```bash
   grep -r "password\|secret\|key\|token" --include="*.ts" --include="*.tsx" src/
   grep -r "process.env" --include="*.ts" src/
   ```

2. **Dependency Audit**
   // turbo
   Check for vulnerable dependencies:
   ```bash
   npm audit
   ```

3. **OWASP Top 10 Checklist**
   Verify the following:

   - **Broken Access Control**: RLS policies on all tables? API routes verify auth?
   - **Cryptographic Failures**: No secrets in code? HTTPS enforced?
   - **Injection**: Parameterized queries used? Input validation?
   - **Insecure Design**: Rate limiting? Session management?
   - **Vulnerable Components**: Dependencies up to date?

4. **Supabase Security (Guideline 4.2)**
   - [ ] **RLS Enabled**: Verify `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` for all tables.
   - [ ] **Policies**: Verify policies exist for SELECT, INSERT, UPDATE, DELETE.
   - [ ] **Service Role**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is NEVER used in client components (`lib/supabase/client.ts`).

5. **Report Generation**
   Generate a security report summarizing findings, severity, and remediation steps.

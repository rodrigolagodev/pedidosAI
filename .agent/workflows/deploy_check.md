---
description: Checklist and verification before deployment.
---

# Deployment Check Workflow

Run this before triggering a deployment to production.

1. **Pre-Flight**
   Run the pre-flight checks.
   ```bash
   /pre_flight
   ```

2. **Security Audit**
   Run the security audit.
   ```bash
   /security_audit
   ```

3. **Build Verification**
   Ensure the project builds for production.
   ```bash
   pnpm build
   ```

4. **Manual Checklist (Guideline 6.3)**
   - [ ] Environment variables set in Vercel?
   - [ ] Database migrations applied to production Supabase?
   - [ ] Backup of production database taken?
   - [ ] "Definition of Done" met?

5. **Deploy**
   If all checks pass, push to `main` to trigger Vercel deployment.
   ```bash
   git push origin main
   ```

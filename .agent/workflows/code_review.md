---
description: Perform a comprehensive code review including linting, type checking, and manual checklist.
---

# Code Review Workflow

Run this workflow after implementing features, fixing bugs, or refactoring code.

1. **Automated Checks**
   Run the following commands to ensure basic quality:
   ```bash
   pnpm lint
   pnpm tsc --noEmit
   pnpm test
   ```

2. **Manual Review Checklist**
   Review the code against the following standards:

   **Code Quality**
   - [ ] Functions are small and focused (< 50 lines)
   - [ ] Clear, descriptive variable/function names (English)
   - [ ] No duplicated code (DRY)
   - [ ] Proper separation of concerns
   - [ ] **Voice-First Principle**: Does this UI support voice interaction? (Guideline 1.2)

   **TypeScript**
   - [ ] No `any` types (use `unknown` if needed)
   - [ ] Strict null checks handled
   - [ ] Exported types for public APIs
   - [ ] Interfaces/types for all data structures

   **React/Next.js**
   - [ ] **Co-location**: Components, tests, and styles are together (Guideline 3.2)
   - [ ] Correct use of Server vs Client Components
   - [ ] Proper use of hooks (dependency arrays correct)
   - [ ] Error boundaries where needed

   **Security**
   - [ ] No hardcoded secrets
   - [ ] Input validation on all user inputs
   - [ ] RLS policies for database access
   - [ ] No client-side usage of `SUPABASE_SERVICE_ROLE_KEY`

3. **Feedback Generation**
   If you are an agent performing this review, generate a report in the following format:

   ```markdown
   ## Code Review Summary
   [Summary]

   ### Critical Issues
   - [File:Line] Issue description

   ### Suggestions
   - [File:Line] Suggestion description
   ```

---
description: Run all static analysis and tests before pushing code.
---

# Pre-Flight Check Workflow

Run this before pushing any code to ensure it meets quality standards.

// turbo-all
1. **Linting**
   Fix auto-fixable issues and check for others.
   ```bash
   pnpm lint:fix
   ```

2. **Type Checking**
   Ensure no TypeScript errors.
   ```bash
   pnpm tsc --noEmit
   ```

3. **Formatting**
   Check formatting.
   ```bash
   pnpm format:check
   ```

4. **Testing**
   Run unit tests.
   ```bash
   pnpm test
   ```

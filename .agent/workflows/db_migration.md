---
description: Create and apply Supabase migrations and generate TypeScript types.
---

# Database Migration Workflow

Use this workflow when modifying the database schema.

1. **Create Migration**
   Ask the user for a descriptive name for the migration (e.g., `create_orders_table`).
   ```bash
   pnpm dlx supabase migration new <migration_name>
   ```

2. **Edit Migration**
   Open the newly created file in `supabase/migrations/` and allow the user (or agent) to write the SQL.
   *Reminder*: Always enable RLS and add policies!

3. **Apply Migration (Local)**
   Reset the local database to apply changes (or use `db push` if preferred, but reset is safer for consistency).
   ```bash
   pnpm dlx supabase db reset
   ```

4. **Generate Types**
   Update the TypeScript definitions to reflect the new schema.
   ```bash
   pnpm dlx supabase gen types typescript --project-id wdtjhxxqgwobalxizlic > src/types/database.ts
   ```

5. **Verify**
   Check that `src/types/database.ts` has been updated with the new tables/columns.

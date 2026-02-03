# Supabase Type Generation

When the database schema changes (new tables, columns, or migrations), regenerate the TypeScript types.

## Instructions

1. Read the project ID from `.env.local` (SUPABASE_PROJECT_ID)
2. Run the type generation command:
   ```bash
   npx supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > lib/supabase/database.types.ts
   ```
3. Verify the generated types file exists and contains the updated schema

## When to Use

- After creating new database migrations
- After modifying table schemas in Supabase dashboard
- When adding new tables, columns, or relationships
- If type errors appear related to Supabase queries

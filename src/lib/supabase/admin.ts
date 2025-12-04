import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Create a Supabase client with the Service Role Key.
 * This client bypasses Row Level Security (RLS) and should ONLY be used
 * on the server-side for administrative tasks or when accessing data
 * that requires elevated privileges (e.g., fetching invitations for anonymous users).
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Supabase configuration missing: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

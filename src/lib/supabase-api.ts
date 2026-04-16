import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Loosely typed Supabase client for API routes (avoids needing generated types)
type AnySupabaseClient = SupabaseClient<any, "public", any>;

const globalForSupabase = globalThis as unknown as {
  supabaseApi: AnySupabaseClient | undefined;
};

export const supabase: AnySupabaseClient =
  globalForSupabase.supabaseApi ??
  createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }) as AnySupabaseClient;

if (process.env.NODE_ENV !== 'production') globalForSupabase.supabaseApi = supabase;

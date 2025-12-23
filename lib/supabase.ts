import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Expo automatically loads EXPO_PUBLIC_* vars from .env
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file',
    );
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: undefined,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

// Lazy initialization - only creates client when accessed
let supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient();
  }
  return supabaseInstance;
}

// Export with proper typing using a getter-like approach
export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getSupabase();
      const value = (client as unknown as Record<PropertyKey, unknown>)[prop];
      return typeof value === 'function' ? value.bind(client) : value;
    },
  },
) as SupabaseClient;

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const globalProcess = typeof globalThis !== 'undefined' ? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process : undefined;
const env = typeof import.meta !== 'undefined' && (import.meta as { env?: Record<string, string | undefined> }).env
  ? (import.meta as { env: Record<string, string | undefined> }).env
  : (globalProcess?.env || {});

const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Checks whether Supabase environment variables are provided and not placeholders.
 */
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-anon-key')
);

/**
 * The initialized Supabase client singleton, or null if unconfigured.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Maps raw Supabase Auth and Database errors into clean, friendly student messages.
 */
export function formatSupabaseError(err: unknown): string {
  if (!err) return 'An unexpected error occurred. Please try again.';
  
  const message = typeof err === 'object' && err !== null && 'message' in err
    ? String((err as { message: unknown }).message)
    : String(err);

  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please double check and try again.';
  }
  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Your email has not been confirmed yet. Please check your inbox for the confirmation link from Supabase.';
  }
  if (lower.includes('password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }
  if (lower.includes('network') || lower.includes('failed to fetch')) {
    return 'Network connection issue. Please check your internet connection and try again.';
  }
  if (lower.includes('rate limit')) {
    return 'Too many attempts in a short time. Please wait a minute and try again.';
  }

  return message;
}

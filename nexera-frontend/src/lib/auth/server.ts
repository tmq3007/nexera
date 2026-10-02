import { createClient } from '@/utils/supabase/server';

/**
 * Lấy access token cho server-side API calls.
 * Dùng trong Server Components và Route Handlers.
 */
export async function getServerToken(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

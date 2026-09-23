import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const originalGetUser = supabase.auth.getUser.bind(supabase.auth);
  supabase.auth.getUser = async () => {
    // Import Server Action để fetch JWT trên Server
    const { getUserFromCookie } = await import('@/app/actions/auth');
    try {
      const userRes = await getUserFromCookie();
      if (userRes.data?.user) {
        return userRes as any;
      }
    } catch {
      // Bỏ qua lỗi
    }
    return originalGetUser();
  };

  return supabase;
}

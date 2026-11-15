import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabaseConfig } from '@/lib/supabase/server-env';

export async function createServerSupabaseClient(): Promise<SupabaseClient | null> {
  const cfg = getServerSupabaseConfig();
  if (!cfg.isConfigured) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(cfg.url, cfg.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called inside a Server Component where setting cookies is a no-op
        }
      },
    },
  });
}

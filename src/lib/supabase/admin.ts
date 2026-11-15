import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabaseConfig } from '@/lib/supabase/server-env';

export function createAdminSupabaseClient(): SupabaseClient | null {
  const cfg = getServerSupabaseConfig();
  if (!cfg.hasServiceRole) {
    return null;
  }

  return createClient(cfg.url, cfg.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

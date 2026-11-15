'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getPublicSupabaseConfig } from '@/lib/supabase/config';

let cachedKey = '';
let cachedClient: SupabaseClient | null = null;

export function createBrowserSupabaseClient(
  overrideUrl?: string,
  overrideAnonKey?: string
): SupabaseClient | null {
  const cfg = getPublicSupabaseConfig(overrideUrl, overrideAnonKey);
  if (!cfg.isConfigured) {
    return null;
  }

  const cacheSignature = `${cfg.url}|${cfg.anonKey}`;
  if (cachedClient && cachedKey === cacheSignature) {
    return cachedClient;
  }

  cachedKey = cacheSignature;
  cachedClient = createBrowserClient(cfg.url, cfg.anonKey);
  return cachedClient;
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSupabaseConfig } from '@/lib/supabase/server-env';

/**
 * Lightweight Supabase Keep-Alive probe invoked every 4 days by Vercel Cron
 * (`vercel.json` -> `0 8 *\/4 * *`) or manually from the Admin Control Center.
 * Prevents Supabase Free Plan projects from auto-pausing after 7 days of inactivity.
 */
export async function GET() {
  const cfg = getServerSupabaseConfig();
  const checkedAt = new Date().toISOString();

  if (!cfg.isConfigured) {
    return NextResponse.json({
      ok: false,
      configured: false,
      projectRef: cfg.projectRef,
      checkedAt,
      message: 'Supabase API keys are not configured yet; keep-alive skipped.',
    });
  }

  const startedAt = Date.now();
  const key = cfg.serviceRoleKey || cfg.anonKey;

  try {
    const client = createClient(cfg.url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await client
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    const latencyMs = Date.now() - startedAt;

    if (error && error.code !== 'PGRST116' && error.code !== 'PGRST205' && error.code !== '42P01') {
      return NextResponse.json(
        {
          ok: false,
          configured: true,
          projectRef: cfg.projectRef,
          schemaReady: false,
          latencyMs,
          checkedAt,
          message: error.message || 'Supabase probe returned an unexpected error.',
        },
        { status: 502 }
      );
    }

    const schemaReady = !error;
    return NextResponse.json({
      ok: true,
      configured: true,
      projectRef: cfg.projectRef,
      schemaReady,
      latencyMs,
      checkedAt,
      message: schemaReady
        ? `Keep-alive ping succeeded on ${cfg.projectRef} in ${latencyMs}ms.`
        : `Supabase ${cfg.projectRef} is awake (${latencyMs}ms); run supabase/schema.sql to initialize tables.`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        projectRef: cfg.projectRef,
        latencyMs: Date.now() - startedAt,
        checkedAt,
        message:
          err instanceof Error ? err.message : 'Unable to reach Supabase host.',
      },
      { status: 502 }
    );
  }
}

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_SUPABASE_URL,
  PRIMARY_ADMIN_EMAIL,
  SUPABASE_PROJECT_NAME,
  extractSupabaseProjectRef,
} from '@/lib/supabase/config';
import { getServerSupabaseConfig } from '@/lib/supabase/server-env';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resolveServerSession } from '@/lib/supabase/session';
import {
  checkRateLimit,
  getClientRateLimitKey,
} from '@/server/rate-limit/api-rate-limiter';

interface SetupProbeResult {
  keyValid: boolean;
  schemaReady: boolean;
  enabledProviders: string[];
  message: string;
}

async function probeSupabaseProject(
  url: string,
  anonKey: string,
  serviceRoleKey = ''
): Promise<SetupProbeResult> {
  if (!url || !anonKey) {
    return {
      keyValid: false,
      schemaReady: false,
      enabledProviders: [],
      message: 'Waiting for Supabase anon / publishable key.',
    };
  }

  let keyValid = false;
  const enabledProviders: string[] = [];

  try {
    const authRes = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: anonKey },
      cache: 'no-store',
    });
    if (authRes.ok) {
      keyValid = true;
      const settings = (await authRes.json().catch(() => ({}))) as {
        external?: Record<string, boolean>;
      };
      if (settings.external) {
        for (const [provider, enabled] of Object.entries(settings.external)) {
          if (enabled) enabledProviders.push(provider);
        }
      }
    } else if (authRes.status === 401 || authRes.status === 403) {
      return {
        keyValid: false,
        schemaReady: false,
        enabledProviders: [],
        message: 'Supabase rejected that API key. Check Project Settings -> API.',
      };
    }
  } catch {
    return {
      keyValid: false,
      schemaReady: false,
      enabledProviders: [],
      message: 'Could not reach Supabase Auth endpoint.',
    };
  }

  let schemaReady = false;
  const restKey = serviceRoleKey || anonKey;
  try {
    const tableRes = await fetch(
      `${url}/rest/v1/user_profiles?select=id&limit=1`,
      {
        headers: {
          apikey: restKey,
          ...(restKey.startsWith('eyJ')
            ? { Authorization: `Bearer ${restKey}` }
            : {}),
        },
        cache: 'no-store',
      }
    );
    if (tableRes.ok) {
      schemaReady = true;
    } else {
      const errBody = await tableRes.text();
      if (
        tableRes.status === 404 ||
        errBody.includes('PGRST205') ||
        errBody.includes('42P01')
      ) {
        schemaReady = false;
      } else if (tableRes.status === 401 || tableRes.status === 403) {
        // RLS or permission response still means the table exists if not PGRST205
        schemaReady = !errBody.includes('Invalid API key');
      }
    }
  } catch {
    schemaReady = false;
  }

  return {
    keyValid,
    schemaReady,
    enabledProviders,
    message: !keyValid
      ? 'Invalid Supabase key.'
      : schemaReady
        ? 'Connected to Supabase PostgreSQL & Auth.'
        : 'Key verified! Now run supabase/schema.sql in your Supabase SQL Editor.',
  };
}

async function upsertEnvVariables(updates: Record<string, string>) {
  const envPath = path.join(process.cwd(), '.env');
  let existing = '';
  try {
    existing = await fs.readFile(envPath, 'utf8');
  } catch {
    existing = '';
  }

  const lines = existing ? existing.split(/\r?\n/) : [];
  const handled = new Set<string>();
  const nextLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex <= 0) return line;
    const key = trimmed.slice(0, eqIndex).trim();
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      handled.add(key);
      return `${key}=${updates[key]}`;
    }
    return line;
  });

  for (const [key, value] of Object.entries(updates)) {
    if (!handled.has(key)) {
      nextLines.push(`${key}=${value}`);
    }
  }

  const normalized = `${nextLines.filter((l, i, arr) => i < arr.length - 1 || l !== '').join('\n')}\n`;
  await fs.writeFile(envPath, normalized, 'utf8');

  for (const [key, value] of Object.entries(updates)) {
    process.env[key] = value;
  }
}

export async function GET() {
  const cfg = getServerSupabaseConfig();
  const [probe, session] = await Promise.all([
    probeSupabaseProject(cfg.url, cfg.anonKey, cfg.serviceRoleKey),
    resolveServerSession(),
  ]);
  const vercelEnv =
    process.env.VERCEL_ENV || (process.env.VERCEL === '1' ? 'production' : 'local');
  const isAdmin = Boolean(session.authenticated && session.authUser?.isAdmin);
  const personalApiConfigured =
    isAdmin && Boolean(process.env.GEMINI_API_KEY?.trim());

  if (!isAdmin) {
    return NextResponse.json({
      url: cfg.url,
      anonKey: cfg.anonKey,
      enabledProviders: probe.enabledProviders,
    });
  }

  return NextResponse.json({
    url: cfg.url,
    projectName: SUPABASE_PROJECT_NAME,
    projectRef: cfg.projectRef,
    anonKey: cfg.anonKey,
    isConfigured: cfg.isConfigured,
    hasServiceRole: cfg.hasServiceRole,
    keyValid: probe.keyValid,
    schemaReady: probe.schemaReady,
    enabledProviders: probe.enabledProviders,
    message: probe.message,
    adminEmail: PRIMARY_ADMIN_EMAIL,
    vercelEnv,
    personalApiConfigured,
  });
}

export async function POST(request: NextRequest) {
  try {
    const rateKey = getClientRateLimitKey(request, 'setup-api');
    const decision = checkRateLimit(rateKey, 20, 60_000);
    if (!decision.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before trying again.' },
        { status: 429, headers: { 'Retry-After': String(decision.retryAfterSeconds) } }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      action?: 'save-keys' | 'signout';
      url?: string;
      anonKey?: string;
      serviceRoleKey?: string;
    };

    if (body.action === 'signout') {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        await supabase.auth.signOut().catch(() => undefined);
      }
      return NextResponse.json({ ok: true });
    }

    const session = await resolveServerSession();
    if (!session.authenticated || !session.authUser?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin authentication required to update Supabase keys.' },
        { status: 403 }
      );
    }

    const cfg = getServerSupabaseConfig();
    const targetUrl = DEFAULT_SUPABASE_URL;
    const anonKey = (body.anonKey ?? cfg.anonKey).trim();
    const serviceRoleKey = (body.serviceRoleKey ?? cfg.serviceRoleKey).trim();

    if (!anonKey) {
      return NextResponse.json(
        { error: 'Please paste your Supabase anon / publishable key.' },
        { status: 400 }
      );
    }

    const probe = await probeSupabaseProject(targetUrl, anonKey, serviceRoleKey);
    if (!probe.keyValid) {
      return NextResponse.json({ error: probe.message }, { status: 400 });
    }

    try {
      await upsertEnvVariables({
        NEXT_PUBLIC_SUPABASE_URL: targetUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
        ...(serviceRoleKey ? { SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey } : {}),
        ADMIN_EMAILS: cfg.adminEmails.join(','),
      });
    } catch {
      return NextResponse.json(
        {
          error:
            'Key verified, but .env is read-only here. Add NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment environment variables.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      url: targetUrl,
      projectRef: extractSupabaseProjectRef(targetUrl),
      anonKey,
      isConfigured: true,
      hasServiceRole: Boolean(serviceRoleKey),
      keyValid: probe.keyValid,
      schemaReady: probe.schemaReady,
      enabledProviders: probe.enabledProviders,
      message: probe.message,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Unable to save Supabase configuration.',
      },
      { status: 500 }
    );
  }
}

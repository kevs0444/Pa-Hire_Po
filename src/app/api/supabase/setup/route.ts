import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_SUPABASE_URL,
  LOCAL_ADMIN_COOKIE,
  PRIMARY_ADMIN_EMAIL,
  extractSupabaseProjectRef,
} from '@/lib/supabase/config';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getServerSupabaseConfig } from '@/lib/supabase/server-env';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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
  const probe = await probeSupabaseProject(
    cfg.url,
    cfg.anonKey,
    cfg.serviceRoleKey
  );
  const vercelEnv =
    process.env.VERCEL_ENV || (process.env.VERCEL === '1' ? 'production' : 'local');
  const personalApiConfigured = Boolean(process.env.GEMINI_API_KEY?.trim());
  const allowLocalAdmin =
    process.env.VERCEL !== '1' ||
    !cfg.isConfigured ||
    !probe.keyValid ||
    !probe.schemaReady;

  return NextResponse.json({
    url: cfg.url,
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
    allowLocalAdmin,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: 'save-keys' | 'enable-local-admin' | 'signout' | 'signup';
      url?: string;
      anonKey?: string;
      serviceRoleKey?: string;
      email?: string;
      password?: string;
      fullName?: string;
      primaryRole?: string;
    };

    if (body.action === 'signout') {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        await supabase.auth.signOut().catch(() => undefined);
      }
      const res = NextResponse.json({ ok: true });
      res.cookies.delete(LOCAL_ADMIN_COOKIE);
      return res;
    }

    if (body.action === 'signup') {
      const cleanEmail = (body.email || '').trim().toLowerCase();
      const password = body.password || '';
      if (!cleanEmail || !cleanEmail.includes('@') || password.length < 6) {
        return NextResponse.json(
          { error: 'Enter a valid email address and a password with at least 6 characters.' },
          { status: 400 }
        );
      }

      const adminClient = createAdminSupabaseClient();
      if (!adminClient) {
        return NextResponse.json({ ok: false, fallbackClientSignup: true });
      }

      const fullName =
        (body.fullName || '').trim() || cleanEmail.split('@')[0] || 'User';
      const primaryRole =
        (body.primaryRole || '').trim() || 'Data Analyst / Junior Data Analyst';

      const { error } = await adminClient.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          primary_role: primaryRole,
        },
      });

      if (error) {
        const msg = error.message || 'Could not create account.';
        const isExisting = msg.toLowerCase().includes('already');
        return NextResponse.json(
          {
            error: isExisting
              ? 'An account with this email already exists. Use Password sign-in or Reset Password.'
              : msg,
          },
          { status: isExisting ? 409 : 400 }
        );
      }

      return NextResponse.json({ ok: true, confirmed: true });
    }

    if (body.action === 'enable-local-admin') {
      const cfg = getServerSupabaseConfig();
      const probe = await probeSupabaseProject(
        cfg.url,
        cfg.anonKey,
        cfg.serviceRoleKey
      );
      if (
        process.env.VERCEL === '1' &&
        cfg.isConfigured &&
        probe.keyValid &&
        probe.schemaReady
      ) {
        return NextResponse.json(
          {
            error:
              'Supabase Auth & Schema are ready. Please sign in with your Supabase account.',
          },
          { status: 400 }
        );
      }

      const res = NextResponse.json({
        ok: true,
        mode: 'local-admin',
      });
      res.cookies.set(LOCAL_ADMIN_COOKIE, '1', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
      return res;
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

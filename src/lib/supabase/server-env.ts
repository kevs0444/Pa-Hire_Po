import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_SUPABASE_URL,
  PRIMARY_ADMIN_EMAIL,
  extractSupabaseProjectRef,
} from '@/lib/supabase/config';

export interface ServerSupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  postgresUrl: string;
  projectRef: string;
  isConfigured: boolean;
  hasServiceRole: boolean;
  adminEmails: string[];
}

const ENV_FILE_PRIORITY = ['.env.development.local', '.env.local', '.env'] as const;

function readEnvFileFallbacks(): Record<string, string> {
  if (process.env.VERCEL === '1') {
    return {};
  }
  const result: Record<string, string> = {};
  try {
    // Load lowest-priority first so higher-priority files (.env.development.local) override
    for (const fileName of [...ENV_FILE_PRIORITY].reverse()) {
      const envPath = path.join(/*turbopackIgnore: true*/ process.cwd(), fileName);
      if (!fs.existsSync(envPath)) continue;
      const raw = fs.readFileSync(envPath, 'utf8');
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex <= 0) continue;
        const key = trimmed.slice(0, eqIndex).trim();
        let val = trimmed.slice(eqIndex + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (val) {
          result[key] = val;
        }
      }
    }
  } catch {
    // Read-only / serverless environments fall back to process.env only
  }
  return result;
}

export function getServerSupabaseConfig(): ServerSupabaseConfig {
  const fileEnv = readEnvFileFallbacks();
  const url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    fileEnv.NEXT_PUBLIC_SUPABASE_URL ||
    fileEnv.SUPABASE_URL ||
    DEFAULT_SUPABASE_URL
  )
    .trim()
    .replace(/\/+$/, '');
  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    fileEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    fileEnv.SUPABASE_PUBLISHABLE_KEY ||
    fileEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    ''
  ).trim();
  const serviceRoleKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    fileEnv.SUPABASE_SERVICE_ROLE_KEY ||
    fileEnv.SUPABASE_SECRET_KEY ||
    ''
  ).trim();
  const postgresUrl = (
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    fileEnv.POSTGRES_URL_NON_POOLING ||
    fileEnv.POSTGRES_URL ||
    ''
  ).trim();

  const rawAdmins =
    process.env.ADMIN_EMAILS ||
    fileEnv.ADMIN_EMAILS ||
    PRIMARY_ADMIN_EMAIL;
  const adminEmails = Array.from(
    new Set(
      [
        PRIMARY_ADMIN_EMAIL,
        ...rawAdmins
          .split(',')
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean),
      ]
    )
  );

  return {
    url,
    anonKey,
    serviceRoleKey,
    postgresUrl,
    projectRef: extractSupabaseProjectRef(url),
    isConfigured: Boolean(url && anonKey),
    hasServiceRole: Boolean(url && serviceRoleKey),
    adminEmails,
  };
}

export function isServerAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  const { adminEmails } = getServerSupabaseConfig();
  return adminEmails.includes(clean);
}

export const DEFAULT_SUPABASE_URL = 'https://muftcprpqnzuzfosvftz.supabase.co';
export const DEFAULT_SUPABASE_PROJECT_REF = 'muftcprpqnzuzfosvftz';
export const PRIMARY_ADMIN_EMAIL = 'markevinalcantara40@gmail.com';
export const LOCAL_ADMIN_COOKIE = 'pahirepo_local_admin';
export const LOCAL_ADMIN_ID = '00000000-0000-4000-8000-000000000001';

export const SUPABASE_PROJECT_PRESETS = [
  {
    ref: 'muftcprpqnzuzfosvftz',
    label: 'supabase-erin-elephant (Vercel Store)',
    url: 'https://muftcprpqnzuzfosvftz.supabase.co',
  },
] as const;

export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
  projectRef: string;
  isConfigured: boolean;
}

export const SUPABASE_OAUTH_PROVIDERS = [
  { id: 'google', label: 'Google' },
  { id: 'linkedin_oidc', label: 'LinkedIn' },
  { id: 'github', label: 'GitHub' },
  { id: 'azure', label: 'Microsoft' },
  { id: 'discord', label: 'Discord' },
] as const;

export type SupportedOAuthProvider =
  (typeof SUPABASE_OAUTH_PROVIDERS)[number]['id'];

export function extractSupabaseProjectRef(url: string): string {
  try {
    const host = new URL(url).hostname;
    return host.split('.')[0] || DEFAULT_SUPABASE_PROJECT_REF;
  } catch {
    return DEFAULT_SUPABASE_PROJECT_REF;
  }
}

export function getPublicSupabaseConfig(
  overrideUrl?: string,
  overrideAnonKey?: string
): SupabasePublicConfig {
  const url = (
    overrideUrl ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    DEFAULT_SUPABASE_URL
  )
    .trim()
    .replace(/\/+$/, '');
  const anonKey = (
    overrideAnonKey ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    ''
  ).trim();

  return {
    url,
    anonKey,
    projectRef: extractSupabaseProjectRef(url),
    isConfigured: Boolean(url && anonKey),
  };
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  if (clean === PRIMARY_ADMIN_EMAIL) return true;

  const extra = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  return extra.includes(clean);
}

'use client';

import { FormEvent } from 'react';
import {
  Check,
  Copy,
  Database,
  ExternalLink,
  KeyRound,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { MonochromeTheme } from '@/types/job';
import {
  PRIMARY_ADMIN_EMAIL,
  SUPABASE_PROJECT_PRESETS,
} from '@/lib/supabase/config';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

export interface SetupStatus {
  url: string;
  projectRef: string;
  anonKey: string;
  isConfigured: boolean;
  hasServiceRole: boolean;
  keyValid: boolean;
  schemaReady: boolean;
  enabledProviders: string[];
  message: string;
  vercelEnv?: string;
  personalApiConfigured?: boolean;
}

interface SupabaseSetupPanelProps {
  theme: MonochromeTheme;
  setup: SetupStatus;
  dashboardBase: string;
  loadingSetup: boolean;
  showKeyForm: boolean;
  anonKeyInput: string;
  serviceRoleInput: string;
  savingKeys: boolean;
  copiedSql: boolean;
  submitting: boolean;
  onSelectPreset: (url: string, ref: string) => void;
  onRefreshSetup: () => void;
  onToggleKeyForm: () => void;
  onChangeAnonKey: (val: string) => void;
  onChangeServiceRole: (val: string) => void;
  onSaveKeys: (e: FormEvent) => void;
  onCopySql: () => void;
  onLocalAdminLogin: () => void;
}

export function SupabaseSetupPanel({
  theme,
  setup,
  dashboardBase,
  loadingSetup,
  showKeyForm,
  anonKeyInput,
  serviceRoleInput,
  savingKeys,
  copiedSql,
  submitting,
  onSelectPreset,
  onRefreshSetup,
  onToggleKeyForm,
  onChangeAnonKey,
  onChangeServiceRole,
  onSaveKeys,
  onCopySql,
  onLocalAdminLogin,
}: SupabaseSetupPanelProps) {
  const tokens = getThemeTokens(theme);

  return (
    <section className="space-y-4 lg:col-span-5">
      <div className={cn('rounded-lg border p-5 space-y-4', tokens.cardSurface)}>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-[#0a66c2]" />
              <h2 className="text-base font-bold">
                Connected Supabase Project
              </h2>
            </div>
            <p className={cn('font-mono text-xs break-all', tokens.mutedText)}>
              {setup.url}
            </p>
          </div>
          <button
            type="button"
            onClick={onRefreshSetup}
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium',
              tokens.secondaryBtn
            )}
            title="Recheck Supabase connection"
          >
            <RefreshCw className={cn('h-3 w-3', loadingSetup && 'animate-spin')} />
            Check
          </button>
        </div>

        {/* 1-Click Supabase Project Preset Switcher */}
        <div className="space-y-1.5">
          <div className={cn('text-[11px] font-medium', tokens.mutedText)}>
            Project Target (Vercel Store vs Direct Supabase):
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUPABASE_PROJECT_PRESETS.map((preset) => {
              const selected = setup.projectRef === preset.ref;
              return (
                <button
                  key={preset.ref}
                  type="button"
                  onClick={() => onSelectPreset(preset.url, preset.ref)}
                  className={cn(
                    'rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors',
                    selected ? tokens.primaryBtn : tokens.secondaryBtn
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Health Checklist */}
        <div className={cn('divide-y rounded-lg border text-xs', tokens.borderSubtle, tokens.subSurface)}>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="font-medium">1. API Key (.env)</span>
            <span
              className={cn(
                'rounded border px-2 py-0.5 font-mono text-[11px] font-medium',
                setup.keyValid
                  ? tokens.isDark
                    ? 'border-emerald-700/60 bg-emerald-950/60 text-emerald-300'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : tokens.secondaryBtn
              )}
            >
              {setup.keyValid ? '✓ Connected' : 'Key Needed'}
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="font-medium">2. SQL Tables &amp; RLS</span>
            <span
              className={cn(
                'rounded border px-2 py-0.5 font-mono text-[11px] font-medium',
                setup.schemaReady
                  ? tokens.isDark
                    ? 'border-emerald-700/60 bg-emerald-950/60 text-emerald-300'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : tokens.secondaryBtn
              )}
            >
              {setup.schemaReady ? '✓ Schema Live' : 'Run SQL Once'}
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="font-medium">3. Admin User Directory Key</span>
            <span
              className={cn(
                'rounded border px-2 py-0.5 font-mono text-[11px] font-medium',
                setup.hasServiceRole
                  ? tokens.isDark
                    ? 'border-emerald-700/60 bg-emerald-950/60 text-emerald-300'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : tokens.secondaryBtn
              )}
            >
              {setup.hasServiceRole ? '✓ Full Admin' : 'Optional'}
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="font-medium">4. Backend Runtime &amp; Gemini AI</span>
            <span
              className={cn(
                'rounded border px-2 py-0.5 font-mono text-[11px] font-medium',
                setup.personalApiConfigured
                  ? tokens.isDark
                    ? 'border-emerald-700/60 bg-emerald-950/60 text-emerald-300'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : tokens.secondaryBtn
              )}
            >
              {setup.vercelEnv || 'local'} • {setup.personalApiConfigured ? '✓ AI Active' : 'Smart Engine'}
            </span>
          </div>
        </div>

        <p className={cn('text-xs leading-relaxed', tokens.mutedText)}>
          {setup.message}
        </p>

        {/* Quick Links to Supabase Project Dashboard */}
        <div className="flex flex-wrap gap-2">
          <a
            href={`${dashboardBase}/settings/api`}
            target="_blank"
            rel="noreferrer"
            className={cn(
              'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium',
              tokens.secondaryBtn
            )}
          >
            <KeyRound className="h-3.5 w-3.5" />
            API Keys
            <ExternalLink className="h-3 w-3 opacity-70" />
          </a>
          <a
            href={`${dashboardBase}/sql/new`}
            target="_blank"
            rel="noreferrer"
            className={cn(
              'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium',
              tokens.secondaryBtn
            )}
          >
            <Database className="h-3.5 w-3.5" />
            SQL Editor
            <ExternalLink className="h-3 w-3 opacity-70" />
          </a>
          <a
            href={`${dashboardBase}/auth/providers`}
            target="_blank"
            rel="noreferrer"
            className={cn(
              'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium',
              tokens.secondaryBtn
            )}
          >
            <Shield className="h-3.5 w-3.5" />
            Auth Providers
            <ExternalLink className="h-3 w-3 opacity-70" />
          </a>
          <button
            type="button"
            onClick={onCopySql}
            className={cn(
              'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium',
              tokens.secondaryBtn
            )}
          >
            {copiedSql ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#057642]" />
                Copied SQL
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy schema.sql
              </>
            )}
          </button>
        </div>

        {/* Key Configuration Toggle / Form */}
        <div className={cn('border-t pt-3', tokens.borderSubtle)}>
          <button
            type="button"
            onClick={onToggleKeyForm}
            className={cn('text-xs font-semibold underline-offset-2 hover:underline', tokens.strongText)}
          >
            {showKeyForm ? 'Hide Supabase Key Setup' : 'Configure / Update Supabase API Keys'}
          </button>

          {showKeyForm && (
            <form onSubmit={onSaveKeys} className="mt-3 space-y-2.5">
              <div className={cn('rounded-lg border px-2.5 py-2 text-[11px]', tokens.subSurface)}>
                <div>
                  Target: <code className="font-mono font-semibold">{setup.url}</code>
                </div>
                <div className={cn('mt-1', tokens.mutedText)}>
                  Vercel integration tip: run{' '}
                  <code className="font-mono font-semibold">
                    npx vercel env pull .env.development.local
                  </code>{' '}
                  to sync keys automatically.
                </div>
              </div>
              <div>
                <label className={cn('mb-1 block text-xs font-medium', tokens.mutedText)}>
                  Anon / Publishable Key (Required)
                </label>
                <input
                  type="text"
                  value={anonKeyInput}
                  onChange={(e) => onChangeAnonKey(e.target.value)}
                  placeholder="eyJ... or sb_publishable_..."
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 font-mono text-xs focus:outline-none',
                    tokens.inputSurface
                  )}
                />
              </div>
              <div>
                <label className={cn('mb-1 block text-xs font-medium', tokens.mutedText)}>
                  Service Role Secret Key (Optional — enables Admin User Deletion)
                </label>
                <input
                  type="password"
                  value={serviceRoleInput}
                  onChange={(e) => onChangeServiceRole(e.target.value)}
                  placeholder="eyJ... or sb_secret_..."
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 font-mono text-xs focus:outline-none',
                    tokens.inputSurface
                  )}
                />
              </div>
              <button
                type="submit"
                disabled={savingKeys}
                className={cn(
                  'w-full rounded-lg px-3 py-2 text-xs transition-colors disabled:opacity-60',
                  tokens.primaryBtn
                )}
              >
                {savingKeys ? 'Verifying & Saving to .env...' : 'Save & Connect Supabase Project'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Admin & Multi-User Rules Notice */}
      <div className={cn('rounded-lg border p-4 space-y-2.5 text-xs', tokens.cardSurface)}>
        <div className="flex items-center gap-2 font-semibold">
          <Shield className="h-4 w-4 text-[#0a66c2]" />
          <span>Admin &amp; User Isolation Rules</span>
        </div>
        <ul className={cn('space-y-1.5 leading-relaxed', tokens.mutedText)}>
          <li>
            • Signing in with{' '}
            <code className="font-mono font-semibold">{PRIMARY_ADMIN_EMAIL}</code>{' '}
            automatically grants <strong>Admin</strong> access and seeds your full Mar Kevin profile &amp; resume.
          </li>
          <li>
            • Every other user gets a clean profile builder, private job pipeline, and isolated resume file storage.
          </li>
          <li>
            • In the <strong>Admin</strong> tab, you can view total user counts, inspect any user&apos;s profile/CV/jobs, and manage roles.
          </li>
        </ul>

        {(!setup.keyValid || !setup.schemaReady) && (
          <div className={cn('border-t pt-3 space-y-2', tokens.borderSubtle)}>
            <p className={cn('text-[11px]', tokens.mutedText)}>
              Want to explore the app &amp; Admin Control Center before pasting your Supabase keys?
            </p>
            <button
              type="button"
              disabled={submitting}
              onClick={onLocalAdminLogin}
              className={cn(
                'inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
                tokens.contrastBtn
              )}
            >
              <Shield className="h-3.5 w-3.5" />
              Continue in Local Admin Sandbox ({PRIMARY_ADMIN_EMAIL})
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

'use client';

import {
  Check,
  Cloud,
  Copy,
  Database,
  ExternalLink,
  KeyRound,
} from 'lucide-react';
import {
  AdminUsersApiResponse,
  PlatformStatusPayload,
  SetupStatus,
} from '@/features/admin/types';
import { AdminFreeTierCard } from '@/features/admin/components/AdminFreeTierCard';
import {
  DEFAULT_SUPABASE_PROJECT_REF,
  SUPABASE_PROJECT_NAME,
} from '@/lib/supabase/config';
import { MonochromeTheme } from '@/types/job';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface AdminInfraTabProps {
  theme: MonochromeTheme;
  data: AdminUsersApiResponse;
  setupStatus: SetupStatus | null;
  platformStatus: PlatformStatusPayload | null;
  copiedSql: boolean;
  runningKeepAlive: boolean;
  runningPrune: boolean;
  onCopySql: () => void;
  onOpenSetupModal: () => void;
  onPingKeepAlive: () => void;
  onRunPrune: () => void;
}

export function AdminInfraTab({
  theme,
  data,
  setupStatus,
  platformStatus,
  copiedSql,
  runningKeepAlive,
  runningPrune,
  onCopySql,
  onOpenSetupModal,
  onPingKeepAlive,
  onRunPrune,
}: AdminInfraTabProps) {
  const tokens = getThemeTokens(theme);
  const dashboardBase = `https://supabase.com/dashboard/project/${data.projectRef}`;
  const schemaReady =
    platformStatus?.supabase.dbProbe.schemaReady ??
    setupStatus?.schemaReady ??
    data.schemaReady;
  const hasServiceRole =
    platformStatus?.supabase.hasServiceRole ??
    setupStatus?.hasServiceRole ??
    data.hasServiceRole;
  const oauthProviders = (
    platformStatus?.supabase.authProbe.providers ||
    setupStatus?.enabledProviders ||
    []
  ).filter((p) => p !== 'email' && p !== 'phone');

  const vercelHobbySpecs = [
    {
      label: 'Fast Data Transfer (Monthly)',
      value: '100 GB / mo',
      note: 'Includes Edge & SSR responses on Hobby',
    },
    {
      label: 'Serverless Function Invocations',
      value: '100k / day',
      note: '60s max duration · 4.5 MB request body cap',
    },
    {
      label: 'Cron Jobs (vercel.json)',
      value: platformStatus?.vercel.keepAliveCron || '0 8 */4 * *',
      note: '1/day Hobby cap · runs every 4 days (safe)',
    },
    {
      label: 'Runtime Telemetry Mode',
      value: platformStatus?.vercel.tokenConfigured
        ? 'VERCEL_TOKEN Active'
        : 'Zero-Token Runtime',
      note: platformStatus?.vercel.tokenConfigured
        ? `Latest build: ${platformStatus.vercel.latestDeploymentState || 'Checked'}`
        : 'Reads VERCEL_* system env + vercel-status.com',
    },
  ];

  return (
    <div className="space-y-4">
      <AdminFreeTierCard
        theme={theme}
        stats={data.stats}
        runningKeepAlive={runningKeepAlive}
        runningPrune={runningPrune}
        onPingKeepAlive={onPingKeepAlive}
        onRunPrune={onRunPrune}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* SUPABASE DIAGNOSTICS & SETUP */}
        <section className={cn('rounded-lg border p-5 space-y-4', tokens.cardSurface)}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Database className="h-4 w-4 shrink-0" aria-hidden="true" />
                <h3 className="text-sm font-bold tracking-tight">
                  Supabase Project &amp; Setup Diagnostics
                </h3>
              </div>
              <p className={cn('font-mono text-xs break-all', tokens.mutedText)}>
                {setupStatus?.projectName || SUPABASE_PROJECT_NAME} ·{' '}
                {setupStatus?.url || data.supabaseUrl}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onCopySql}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                  tokens.secondaryBtn
                )}
              >
                {copiedSql ? (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    Copied SQL
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    Copy schema.sql
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onOpenSetupModal}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors',
                  tokens.primaryBtn
                )}
              >
                <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                Keys &amp; Email Templates
              </button>
            </div>
          </div>

          <div
            className={cn(
              'divide-y rounded-lg border text-xs',
              tokens.borderSubtle,
              tokens.subSurface
            )}
          >
            <div className="flex items-center justify-between gap-2 px-3 py-2">
              <span className="font-medium">1. API Key (.env)</span>
              <span
                className={cn(
                  'rounded border px-2 py-0.5 font-mono text-[11px] font-medium',
                  setupStatus?.keyValid ? tokens.badgeSuccess : tokens.badgeNeutral
                )}
              >
                {setupStatus
                  ? setupStatus.keyValid
                    ? '✓ Connected'
                    : 'Key Needed'
                  : 'Checking...'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 px-3 py-2">
              <span className="font-medium">2. SQL Tables &amp; RLS</span>
              <span
                className={cn(
                  'rounded border px-2 py-0.5 font-mono text-[11px] font-medium',
                  schemaReady ? tokens.badgeSuccess : tokens.badgeWarning
                )}
              >
                {schemaReady ? '✓ Schema Live' : '! Run SQL Once'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 px-3 py-2">
              <span className="font-medium">3. Admin Service Role Key</span>
              <span
                className={cn(
                  'rounded border px-2 py-0.5 font-mono text-[11px] font-medium',
                  hasServiceRole ? tokens.badgeSuccess : tokens.badgeNeutral
                )}
              >
                {hasServiceRole ? '✓ Full Admin' : 'Optional'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 px-3 py-2">
              <span className="font-medium">4. Gemini AI Server Key</span>
              <span
                className={cn(
                  'rounded border px-2 py-0.5 font-mono text-[11px] font-medium',
                  setupStatus?.personalApiConfigured
                    ? tokens.badgeSuccess
                    : tokens.badgeNeutral
                )}
              >
                {setupStatus?.personalApiConfigured
                  ? '✓ AI Active'
                  : 'Smart Fallback'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">5. Auth Sign-In Providers</span>
                <a
                  href={`${dashboardBase}/auth/providers`}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    'inline-flex items-center gap-1 text-[11px] hover:underline',
                    tokens.mutedText
                  )}
                >
                  Configure
                  <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
                </a>
              </div>
              <span
                className={cn(
                  'rounded border px-2 py-0.5 font-mono text-[11px] font-medium',
                  setupStatus?.keyValid ? tokens.badgeSuccess : tokens.badgeNeutral
                )}
              >
                {oauthProviders.length > 0
                  ? `Email + ${oauthProviders.join(', ')} ✓`
                  : 'Email + OTP ✓ (OAuth Off)'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <p className={tokens.mutedText}>
              {setupStatus?.message ||
                `${SUPABASE_PROJECT_NAME} (${data.projectRef || DEFAULT_SUPABASE_PROJECT_REF})`}
            </p>
            <a
              href={`${dashboardBase}/sql/new`}
              target="_blank"
              rel="noreferrer"
              className={cn(
                'inline-flex items-center gap-1 font-medium hover:underline',
                tokens.mutedText
              )}
            >
              Open SQL Editor
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        </section>

        {/* VERCEL HOBBY TIER GUARDRAILS & CONSOLE LINKS */}
        <section
          className={cn(
            'flex flex-col justify-between rounded-lg border p-5 space-y-4',
            tokens.cardSurface
          )}
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4 shrink-0" aria-hidden="true" />
                <h3 className="text-sm font-bold tracking-tight">
                  Vercel Hobby Tier Guardrails &amp; Limits
                </h3>
              </div>
              <p className={cn('text-xs', tokens.mutedText)}>
                Reference caps for Vercel Free (Hobby) hosting paired with your Supabase Free-Tier store.
              </p>
            </div>

            <div
              className={cn(
                'divide-y rounded-lg border text-xs',
                tokens.borderSubtle,
                tokens.subSurface
              )}
            >
              {vercelHobbySpecs.map((spec) => (
                <div
                  key={spec.label}
                  className="flex flex-col gap-0.5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-medium">{spec.label}</div>
                    <div className={cn('text-[11px]', tokens.mutedText)}>
                      {spec.note}
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] font-semibold">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            className={cn(
              'flex flex-wrap items-center gap-2 border-t pt-3 text-xs',
              tokens.borderSubtle
            )}
          >
            <span className={cn('font-medium', tokens.mutedText)}>
              Vercel Console:
            </span>
            {[
              { label: 'Deployments', href: 'https://vercel.com/dashboard' },
              {
                label: 'Hobby Limits',
                href: 'https://vercel.com/docs/limits/overview',
              },
              {
                label: 'Status Feed',
                href: 'https://www.vercel-status.com',
              },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  'inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium hover:underline',
                  tokens.subSurface
                )}
              >
                {link.label}
                <ExternalLink className="h-2.5 w-2.5 opacity-70" aria-hidden="true" />
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

'use client';

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Database,
  ExternalLink,
  Layers,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  AdminUsersApiResponse,
  PlatformStatusPayload,
  SetupStatus,
} from '@/features/admin/types';
import {
  formatComponentState,
  getHealthBadgeStyle,
} from '@/features/admin/lib/status-helpers';
import { MonochromeTheme } from '@/types/job';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface AdminOverviewTabProps {
  theme: MonochromeTheme;
  data: AdminUsersApiResponse;
  setupStatus: SetupStatus | null;
  platformStatus: PlatformStatusPayload | null;
  loadingStatus: boolean;
  onOpenUsersTab: () => void;
  onOpenInfraTab: () => void;
}

export function AdminOverviewTab({
  theme,
  data,
  setupStatus,
  platformStatus,
  loadingStatus,
  onOpenUsersTab,
  onOpenInfraTab,
}: AdminOverviewTabProps) {
  const tokens = getThemeTokens(theme);
  const dashboardBase = `https://supabase.com/dashboard/project/${data.projectRef}`;

  const vercelGlobal = platformStatus?.vercel.globalStatus;
  const supabaseGlobal = platformStatus?.supabase.globalStatus;
  const vercelBadge = getHealthBadgeStyle(
    vercelGlobal?.level || 'unknown',
    tokens
  );
  const supabaseBadge = getHealthBadgeStyle(
    supabaseGlobal?.level || 'unknown',
    tokens
  );

  const schemaReady =
    platformStatus?.supabase.dbProbe.schemaReady ??
    setupStatus?.schemaReady ??
    data.schemaReady;

  const kpiItems = [
    {
      label: 'Total Users',
      value: data.stats.totalUsers,
      sub: `${data.stats.activeLast7d} active in 7d`,
    },
    {
      label: 'Admin Accounts',
      value: data.stats.adminUsers,
      sub: `${data.stats.suspendedUsers} suspended`,
    },
    {
      label: 'Jobs Tracked',
      value: data.stats.totalJobsTracked,
      sub: 'Across all workspaces',
    },
    {
      label: 'Saved / Applied',
      value: `${data.stats.totalSavedJobs} / ${data.stats.totalAppliedJobs}`,
      sub: 'Pipeline progression',
    },
    {
      label: 'Scans / Stored CVs',
      value: `${data.stats.totalScans} / ${data.stats.resumesStoredCount}`,
      sub: 'Board runs & resumes',
    },
  ];

  const readinessItems = [
    {
      label: 'Custom Domain / Prod URL',
      ok: Boolean(platformStatus?.readiness.customDomainConfigured),
      detail: platformStatus?.vercel.productionUrl
        ? platformStatus.vercel.productionUrl.replace(/^https?:\/\//, '')
        : 'Using localhost / preview host',
    },
    {
      label: 'Public OAuth Providers',
      ok: Boolean(platformStatus?.readiness.oauthConfigured),
      detail:
        (platformStatus?.supabase.authProbe.providers || []).filter(
          (p) => p !== 'email' && p !== 'phone'
        ).length > 0
          ? (platformStatus?.supabase.authProbe.providers || [])
              .filter((p) => p !== 'email' && p !== 'phone')
              .join(', ')
          : 'Email + OTP active (OAuth off)',
    },
    {
      label: 'Server Gemini AI Key',
      ok: Boolean(
        platformStatus?.readiness.geminiServerConfigured ??
          setupStatus?.personalApiConfigured
      ),
      detail:
        platformStatus?.readiness.geminiServerConfigured ??
        setupStatus?.personalApiConfigured
          ? 'gemini-3.1-flash-lite ready'
          : 'Deterministic smart fallback',
    },
    {
      label: 'Free-Tier Keep-Alive Cron',
      ok: Boolean(platformStatus?.readiness.keepAliveConfigured ?? true),
      detail: platformStatus?.vercel.keepAliveCron || '0 8 */4 * *',
    },
  ];

  return (
    <div className="space-y-4">
      {/* 1. UNIFIED KPI LEDGER STRIP */}
      <section
        className={cn(
          'grid divide-y overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-5 lg:divide-x lg:divide-y-0',
          tokens.borderSubtle,
          tokens.cardSurface
        )}
      >
        {kpiItems.map((kpi) => (
          <div key={kpi.label} className="space-y-1 p-4">
            <div className={cn('text-xs font-medium', tokens.mutedText)}>
              {kpi.label}
            </div>
            <div className="font-mono text-2xl font-semibold tracking-tight tabular-nums">
              {kpi.value}
            </div>
            <div className={cn('text-[11px]', tokens.mutedText)}>{kpi.sub}</div>
          </div>
        ))}
      </section>

      {/* 2. LIVE VERCEL & SUPABASE STATUS PANELS */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* VERCEL STATUS CARD */}
        <section
          className={cn(
            'flex flex-col justify-between rounded-lg border p-5 space-y-4',
            tokens.cardSurface
          )}
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Cloud className="h-4 w-4 shrink-0" />
                  <h3 className="text-sm font-bold tracking-tight">
                    Vercel Status (Hobby Tier)
                  </h3>
                </div>
                <p className={cn('text-xs', tokens.mutedText)}>
                  {loadingStatus && !platformStatus
                    ? 'Checking Vercel runtime and platform feed...'
                    : vercelGlobal?.description || 'Runtime status ready'}
                </p>
              </div>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[11px] font-medium',
                  vercelBadge.className
                )}
              >
                <span aria-hidden="true">{vercelBadge.prefix}</span>
                {vercelBadge.label}
              </span>
            </div>

            {vercelGlobal?.activeIncidentTitle && (
              <div
                role="status"
                className={cn(
                  'flex items-start gap-2 rounded-lg border px-3 py-2 text-xs',
                  tokens.badgeWarning
                )}
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>Active Incident: {vercelGlobal.activeIncidentTitle}</span>
              </div>
            )}

            <div
              className={cn(
                'divide-y rounded-lg border text-xs',
                tokens.borderSubtle,
                tokens.subSurface
              )}
            >
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="font-medium">Runtime &amp; Region</span>
                <span className="font-mono text-[11px]">
                  {platformStatus?.vercel.runtimeEnv ||
                    setupStatus?.vercelEnv ||
                    'local'}{' '}
                  · {platformStatus?.vercel.region || 'local-host'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="font-medium">Deployment / Git</span>
                <span className="truncate font-mono text-[11px]">
                  {platformStatus?.vercel.gitBranch
                    ? `${platformStatus.vercel.gitBranch} (${platformStatus.vercel.gitCommitSha || 'head'})`
                    : 'Local Workspace'}
                  {platformStatus?.vercel.tokenConfigured &&
                  platformStatus.vercel.latestDeploymentState
                    ? ` · ${platformStatus.vercel.latestDeploymentState}`
                    : ''}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="font-medium">Keep-Alive Cron</span>
                <span
                  className={cn(
                    'rounded border px-2 py-0.5 font-mono text-[11px] font-medium',
                    tokens.badgeSuccess
                  )}
                >
                  ✓ {platformStatus?.vercel.keepAliveCron || '0 8 */4 * *'}
                </span>
              </div>
              {vercelGlobal?.components && vercelGlobal.components.length > 0 && (
                <div className="px-3 py-2 space-y-1.5">
                  <div className={cn('text-[11px] font-medium', tokens.mutedText)}>
                    vercel-status.com components
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {vercelGlobal.components.map((comp) => {
                      const state = formatComponentState(comp.status);
                      return (
                        <div
                          key={comp.name}
                          className="flex items-center justify-between gap-1 text-[11px]"
                        >
                          <span className="truncate">{comp.name}</span>
                          <span className="shrink-0 font-mono">
                            {state.prefix} {state.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            className={cn(
              'flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs',
              tokens.borderSubtle
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="https://www.vercel-status.com"
                target="_blank"
                rel="noreferrer"
                className={cn(
                  'inline-flex items-center gap-1 font-medium hover:underline',
                  tokens.mutedText
                )}
              >
                vercel-status.com
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
              <a
                href="https://vercel.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className={cn(
                  'inline-flex items-center gap-1 font-medium hover:underline',
                  tokens.mutedText
                )}
              >
                Vercel Dashboard
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
            {platformStatus?.vercel.productionUrl && (
              <a
                href={platformStatus.vercel.productionUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  'inline-flex items-center gap-1 font-mono text-[11px] hover:underline',
                  tokens.mutedText
                )}
              >
                Live App
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            )}
          </div>
        </section>

        {/* SUPABASE STATUS CARD */}
        <section
          className={cn(
            'flex flex-col justify-between rounded-lg border p-5 space-y-4',
            tokens.cardSurface
          )}
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 shrink-0" />
                  <h3 className="text-sm font-bold tracking-tight">
                    Supabase Status (Free Tier)
                  </h3>
                </div>
                <p className={cn('text-xs', tokens.mutedText)}>
                  {loadingStatus && !platformStatus
                    ? 'Probing Auth, Postgres, Storage, and status feed...'
                    : supabaseGlobal?.description ||
                      'Live project health probes'}
                </p>
              </div>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[11px] font-medium',
                  supabaseBadge.className
                )}
              >
                <span aria-hidden="true">{supabaseBadge.prefix}</span>
                {supabaseBadge.label}
              </span>
            </div>

            {supabaseGlobal?.activeIncidentTitle && (
              <div
                role="status"
                className={cn(
                  'flex items-start gap-2 rounded-lg border px-3 py-2 text-xs',
                  tokens.badgeWarning
                )}
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Active Incident: {supabaseGlobal.activeIncidentTitle}
                </span>
              </div>
            )}

            <div
              className={cn(
                'divide-y rounded-lg border text-xs',
                tokens.borderSubtle,
                tokens.subSurface
              )}
            >
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="font-medium">Auth (GoTrue)</span>
                <span
                  className={cn(
                    'rounded border px-2 py-0.5 font-mono text-[11px] font-medium',
                    platformStatus?.supabase.authProbe.ok
                      ? tokens.badgeSuccess
                      : tokens.badgeNeutral
                  )}
                >
                  {platformStatus
                    ? platformStatus.supabase.authProbe.ok
                      ? `✓ ${platformStatus.supabase.authProbe.detail}`
                      : `× ${platformStatus.supabase.authProbe.detail}`
                    : 'Probing...'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="font-medium">Postgres DB &amp; RLS</span>
                <span
                  className={cn(
                    'rounded border px-2 py-0.5 font-mono text-[11px] font-medium',
                    schemaReady
                      ? tokens.badgeSuccess
                      : tokens.badgeWarning
                  )}
                >
                  {platformStatus
                    ? schemaReady
                      ? `✓ ${platformStatus.supabase.dbProbe.detail}`
                      : `! ${platformStatus.supabase.dbProbe.detail}`
                    : schemaReady
                      ? '✓ Schema Live'
                      : 'Checking...'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="font-medium">Storage (resumes)</span>
                <span
                  className={cn(
                    'rounded border px-2 py-0.5 font-mono text-[11px] font-medium',
                    platformStatus?.supabase.storageProbe.bucketReady
                      ? tokens.badgeSuccess
                      : platformStatus?.supabase.storageProbe.ok
                        ? tokens.badgeNeutral
                        : tokens.badgeWarning
                  )}
                >
                  {platformStatus
                    ? `${platformStatus.supabase.storageProbe.bucketReady ? '✓' : '•'} ${platformStatus.supabase.storageProbe.detail}`
                    : 'Probing...'}
                </span>
              </div>
              {supabaseGlobal?.components &&
                supabaseGlobal.components.length > 0 && (
                  <div className="px-3 py-2 space-y-1.5">
                    <div
                      className={cn('text-[11px] font-medium', tokens.mutedText)}
                    >
                      status.supabase.com components
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      {supabaseGlobal.components.map((comp) => {
                        const state = formatComponentState(comp.status);
                        return (
                          <div
                            key={comp.name}
                            className="flex items-center justify-between gap-1 text-[11px]"
                          >
                            <span className="truncate">{comp.name}</span>
                            <span className="shrink-0 font-mono">
                              {state.prefix} {state.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>
          </div>

          <div
            className={cn(
              'flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs',
              tokens.borderSubtle
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="https://status.supabase.com"
                target="_blank"
                rel="noreferrer"
                className={cn(
                  'inline-flex items-center gap-1 font-medium hover:underline',
                  tokens.mutedText
                )}
              >
                status.supabase.com
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
              <a
                href={`${dashboardBase}/editor`}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  'inline-flex items-center gap-1 font-medium hover:underline',
                  tokens.mutedText
                )}
              >
                Table Editor
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
              <a
                href={`${dashboardBase}/auth/users`}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  'inline-flex items-center gap-1 font-medium hover:underline',
                  tokens.mutedText
                )}
              >
                Auth Users
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
            <button
              type="button"
              onClick={onOpenInfraTab}
              className={cn(
                'inline-flex items-center gap-1 font-medium hover:underline',
                tokens.mutedText
              )}
            >
              Free-Tier Caps
            </button>
          </div>
        </section>
      </div>

      {/* 3. P0 LAUNCH READINESS CHECKLIST (MOC ALIGNED) */}
      <section className={cn('rounded-lg border p-5 space-y-3', tokens.cardSurface)}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <h3 className="text-sm font-bold tracking-tight">
              P0 Launch Readiness &amp; Workspace Shortcuts
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenUsersTab}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                tokens.secondaryBtn
              )}
            >
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              Manage Users ({data.stats.totalUsers})
            </button>
            <button
              type="button"
              onClick={onOpenInfraTab}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                tokens.secondaryBtn
              )}
            >
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              Infra &amp; Keep-Alive
            </button>
          </div>
        </div>

        <div
          className={cn(
            'grid divide-y overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-y-0',
            tokens.borderSubtle,
            tokens.subSurface
          )}
        >
          {readinessItems.map((item) => (
            <div key={item.label} className="space-y-1 p-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{item.label}</span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium',
                    item.ok ? tokens.badgeSuccess : tokens.badgeNeutral
                  )}
                >
                  {item.ok ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      Ready
                    </>
                  ) : (
                    <>
                      <Layers className="h-3 w-3" aria-hidden="true" />
                      Pending
                    </>
                  )}
                </span>
              </div>
              <div className={cn('truncate font-mono text-[11px]', tokens.mutedText)}>
                {item.detail}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

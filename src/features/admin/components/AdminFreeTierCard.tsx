'use client';

import { Activity, Database, RefreshCw } from 'lucide-react';
import { AdminPlatformStats, MonochromeTheme } from '@/types/job';
import { FREE_TIER_LIMITS } from '@/lib/supabase/free-tier-limits';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface AdminFreeTierCardProps {
  theme: MonochromeTheme;
  stats: AdminPlatformStats;
  runningKeepAlive: boolean;
  runningPrune: boolean;
  onPingKeepAlive: () => void;
  onRunPrune: () => void;
}

export function AdminFreeTierCard({
  theme,
  stats,
  runningKeepAlive,
  runningPrune,
  onPingKeepAlive,
  onRunPrune,
}: AdminFreeTierCardProps) {
  const tokens = getThemeTokens(theme);

  const ft = stats.freeTier || {
    estimatedDbBytes: 0,
    maxDbBytes: FREE_TIER_LIMITS.maxDbSizeMb * 1024 * 1024,
    estimatedStorageFiles: stats.resumesStoredCount,
    maxSuggestedJobsPerUser: FREE_TIER_LIMITS.maxSuggestedJobsPerUser,
    maxScanLogsPerUser: FREE_TIER_LIMITS.maxScanLogsPerUser,
    targetUsers: FREE_TIER_LIMITS.targetActiveUsers,
    maxFreeMau: FREE_TIER_LIMITS.maxFreeMau,
    keepAliveCron: FREE_TIER_LIMITS.keepAliveCron,
  };
  const dbMb = (ft.estimatedDbBytes / (1024 * 1024)).toFixed(2);
  const maxDbMb = Math.round(ft.maxDbBytes / (1024 * 1024));
  const dbPct = Math.min(
    100,
    Math.max(1, (ft.estimatedDbBytes / Math.max(1, ft.maxDbBytes)) * 100)
  );

  return (
    <section className={cn('rounded-lg border p-5 space-y-4', tokens.cardSurface)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Activity className="h-4 w-4 text-[#0a66c2]" />
            <h3 className="text-sm font-bold">
              Free-Tier Capacity &amp; Scalability Guardrails (1–{ft.targetUsers} Users)
            </h3>
            <span
              className={cn(
                'rounded border px-2 py-0.5 font-mono text-[11px] font-medium',
                tokens.isDark
                  ? 'border-emerald-700/60 bg-emerald-950/60 text-emerald-300'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              )}
            >
              ✓ Auto-Keepalive ({ft.keepAliveCron})
            </span>
          </div>
          <p className={cn('text-xs', tokens.mutedText)}>
            Delta sync (750ms debounce), {ft.maxSuggestedJobsPerUser} suggested jobs/user cap,{' '}
            {ft.maxScanLogsPerUser} scans/user, {FREE_TIER_LIMITS.maxTailoredSnapshotsPerUser} AI snapshots/user, and single-slot CV overwrite (&le; 4.5 MB).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={runningKeepAlive}
            onClick={onPingKeepAlive}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-60',
              tokens.secondaryBtn
            )}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', runningKeepAlive && 'animate-spin')} />
            {runningKeepAlive ? 'Pinging...' : 'Ping Keep-Alive'}
          </button>
          <button
            type="button"
            disabled={runningPrune}
            onClick={onRunPrune}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-60',
              tokens.primaryBtn
            )}
          >
            <Database className="h-3.5 w-3.5" />
            {runningPrune ? 'Pruning DB...' : 'Run Free-Tier DB Prune'}
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={cn('rounded-lg border p-3 space-y-1', tokens.subSurface)}>
          <div className={cn('text-[11px] font-medium', tokens.mutedText)}>
            Active Users vs Launch Target
          </div>
          <div className="font-mono text-base font-semibold tabular-nums">
            {stats.totalUsers} / {ft.targetUsers} users
          </div>
          <div className={cn('text-[11px]', tokens.mutedText)}>
            Free plan allows {ft.maxFreeMau.toLocaleString()} MAU
          </div>
        </div>

        <div className={cn('rounded-lg border p-3 space-y-1.5', tokens.subSurface)}>
          <div className={cn('text-[11px] font-medium', tokens.mutedText)}>
            Est. Postgres DB Footprint
          </div>
          <div className="font-mono text-base font-semibold tabular-nums">
            {dbMb} MB / {maxDbMb} MB
          </div>
          <div className={cn('h-1.5 w-full overflow-hidden rounded-full', tokens.isDark ? 'bg-slate-800' : 'bg-slate-200')}>
            <div
              className="h-full rounded-full bg-[#0a66c2] transition-all"
              style={{ width: `${dbPct}%` }}
            />
          </div>
        </div>

        <div className={cn('rounded-lg border p-3 space-y-1', tokens.subSurface)}>
          <div className={cn('text-[11px] font-medium', tokens.mutedText)}>
            CV Storage (Single-Slot Overwrite)
          </div>
          <div className="font-mono text-base font-semibold tabular-nums">
            {ft.estimatedStorageFiles} file{ft.estimatedStorageFiles === 1 ? '' : 's'}
          </div>
          <div className={cn('text-[11px]', tokens.mutedText)}>
            {FREE_TIER_LIMITS.maxStorageSizeMb} MB bucket · 4.5 MB max upload
          </div>
        </div>

        <div className={cn('rounded-lg border p-3 space-y-1', tokens.subSurface)}>
          <div className={cn('text-[11px] font-medium', tokens.mutedText)}>
            Per-User Retention Caps
          </div>
          <div className="font-mono text-base font-semibold tabular-nums">
            {ft.maxSuggestedJobsPerUser} jobs · {ft.maxScanLogsPerUser} scans
          </div>
          <div className={cn('text-[11px]', tokens.mutedText)}>
            Saved/applied jobs are never auto-pruned
          </div>
        </div>
      </div>
    </section>
  );
}

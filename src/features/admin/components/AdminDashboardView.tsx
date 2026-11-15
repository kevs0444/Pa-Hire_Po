'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Ban,
  Check,
  Copy,
  Database,
  ExternalLink,
  Eye,
  FileText,
  KeyRound,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  AuthSessionUser,
  MonochromeTheme,
  UserRole,
} from '@/types/job';
import {
  AdminUsersApiResponse,
  InspectedUserPayload,
  SetupStatus,
} from '@/features/admin/types';
import { AdminFreeTierCard } from '@/features/admin/components/AdminFreeTierCard';
import { AdminSupabaseSetupDialog } from '@/features/admin/components/AdminSupabaseSetupDialog';
import { AdminUserInspectDialog } from '@/features/admin/components/AdminUserInspectDialog';
import {
  DEFAULT_SUPABASE_PROJECT_REF,
  DEFAULT_SUPABASE_URL,
  PRIMARY_ADMIN_EMAIL,
} from '@/lib/supabase/config';
import { SUPABASE_SCHEMA_SQL } from '@/lib/supabase/schema-sql';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface AdminDashboardViewProps {
  theme: MonochromeTheme;
  authUser: AuthSessionUser | null;
}

export function AdminDashboardView({
  theme,
  authUser,
}: AdminDashboardViewProps) {
  const tokens = getThemeTokens(theme);

  const [data, setData] = useState<AdminUsersApiResponse>({
    mode: 'loading',
    schemaReady: false,
    hasServiceRole: false,
    supabaseUrl: DEFAULT_SUPABASE_URL,
    projectRef: DEFAULT_SUPABASE_PROJECT_REF,
    stats: {
      totalUsers: 0,
      activeLast7d: 0,
      adminUsers: 0,
      suspendedUsers: 0,
      totalJobsTracked: 0,
      totalSavedJobs: 0,
      totalAppliedJobs: 0,
      totalScans: 0,
      resumesStoredCount: 0,
    },
    users: [],
  });
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<
    'all' | 'admin' | 'user' | 'suspended'
  >('all');
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // User Data Inspector dialog
  const [inspectedUser, setInspectedUser] = useState<InspectedUserPayload | null>(
    null
  );
  const [loadingInspect, setLoadingInspect] = useState(false);
  const [inspectTab, setInspectTab] = useState<
    'profile' | 'resume' | 'jobs' | 'scans'
  >('profile');

  // Setup & SQL dialog + Free-Tier actions
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [anonKeyDraft, setAnonKeyDraft] = useState('');
  const [serviceKeyDraft, setServiceKeyDraft] = useState('');
  const [savingKeys, setSavingKeys] = useState(false);
  const [runningKeepAlive, setRunningKeepAlive] = useState(false);
  const [runningPrune, setRunningPrune] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const [usersRes, setupRes] = await Promise.all([
        fetch('/api/admin/users', { cache: 'no-store' }),
        fetch('/api/supabase/setup', { cache: 'no-store' }).catch(() => null),
      ]);
      const payload = await usersRes.json();
      if (!usersRes.ok) {
        setActionMsg({
          type: 'err',
          text: payload.error || 'Failed to load admin user directory.',
        });
        return;
      }
      setData(payload as AdminUsersApiResponse);
      if (setupRes && setupRes.ok) {
        const setupPayload = (await setupRes.json()) as SetupStatus;
        setSetupStatus(setupPayload);
      }
    } catch {
      setActionMsg({
        type: 'err',
        text: 'Network error while fetching admin data.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/admin/users', { cache: 'no-store' }).then(async (res) => ({
        ok: res.ok,
        payload: await res.json(),
      })),
      fetch('/api/supabase/setup', { cache: 'no-store' })
        .then(async (res) => (res.ok ? ((await res.json()) as SetupStatus) : null))
        .catch(() => null),
    ])
      .then(([{ ok, payload }, setupPayload]) => {
        if (!active) return;
        if (!ok) {
          setActionMsg({
            type: 'err',
            text: payload.error || 'Failed to load admin user directory.',
          });
          return;
        }
        setData(payload as AdminUsersApiResponse);
        if (setupPayload) {
          setSetupStatus(setupPayload);
        }
      })
      .catch(() => {
        if (active) {
          setActionMsg({
            type: 'err',
            text: 'Network error while fetching admin data.',
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleInspectUser = async (userId: string) => {
    setLoadingInspect(true);
    setInspectTab('profile');
    setActionMsg(null);
    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}`,
        { cache: 'no-store' }
      );
      const payload = await res.json();
      if (!res.ok) {
        setActionMsg({
          type: 'err',
          text: payload.error || 'Unable to inspect user.',
        });
        setLoadingInspect(false);
        return;
      }
      setInspectedUser(payload as InspectedUserPayload);
    } catch {
      setActionMsg({
        type: 'err',
        text: 'Failed to load user details.',
      });
    } finally {
      setLoadingInspect(false);
    }
  };

  const handleUpdateUser = async (
    userId: string,
    updates: { role?: UserRole; isSuspended?: boolean }
  ) => {
    setBusyUserId(userId);
    setActionMsg(null);
    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }
      );
      const payload = await res.json();
      if (!res.ok) {
        setActionMsg({
          type: 'err',
          text: payload.error || 'Update failed.',
        });
        return;
      }
      setActionMsg({ type: 'ok', text: 'User permissions updated.' });
      await loadUsers();
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setBusyUserId(userId);
    setActionMsg(null);
    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}`,
        { method: 'DELETE' }
      );
      const payload = await res.json();
      if (!res.ok) {
        setActionMsg({
          type: 'err',
          text: payload.error || 'Unable to delete user.',
        });
        return;
      }
      setConfirmDeleteId(null);
      setActionMsg({
        type: 'ok',
        text: payload.warning || 'User account and data deleted.',
      });
      await loadUsers();
    } finally {
      setBusyUserId(null);
    }
  };

  const handleSaveKeys = async (e: FormEvent) => {
    e.preventDefault();
    setSavingKeys(true);
    setActionMsg(null);
    try {
      const res = await fetch('/api/supabase/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save-keys',
          url: DEFAULT_SUPABASE_URL,
          anonKey: anonKeyDraft,
          serviceRoleKey: serviceKeyDraft,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setActionMsg({
          type: 'err',
          text: payload.error || 'Could not save Supabase keys.',
        });
        return;
      }
      setSetupModalOpen(false);
      setActionMsg({
        type: 'ok',
        text: payload.message || 'Supabase credentials updated.',
      });
      await loadUsers();
    } finally {
      setSavingKeys(false);
    }
  };

  const handlePingKeepAlive = async () => {
    setRunningKeepAlive(true);
    setActionMsg(null);
    try {
      const res = await fetch('/api/supabase/keepalive', { cache: 'no-store' });
      const payload = await res.json();
      if (!res.ok || payload.ok === false) {
        setActionMsg({
          type: 'err',
          text: payload.message || 'Keep-alive probe reported an issue.',
        });
        return;
      }
      setActionMsg({
        type: 'ok',
        text: payload.message || 'Supabase keep-alive probe succeeded.',
      });
    } catch {
      setActionMsg({
        type: 'err',
        text: 'Network error while running Supabase keep-alive probe.',
      });
    } finally {
      setRunningKeepAlive(false);
    }
  };

  const handleRunFreeTierPrune = async () => {
    setRunningPrune(true);
    setActionMsg(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'prune-free-tier' }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setActionMsg({
          type: 'err',
          text: payload.error || 'Unable to run free-tier DB prune.',
        });
        return;
      }
      setActionMsg({
        type: 'ok',
        text: payload.message || 'Free-tier prune completed.',
      });
      await loadUsers();
    } catch {
      setActionMsg({
        type: 'err',
        text: 'Network error while pruning Supabase rows.',
      });
    } finally {
      setRunningPrune(false);
    }
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    } catch {
      setActionMsg({
        type: 'err',
        text: 'Clipboard blocked. Copy supabase/schema.sql from the repository.',
      });
    }
  };

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return data.users.filter((u) => {
      if (roleFilter === 'admin' && u.role !== 'admin') return false;
      if (roleFilter === 'user' && u.role !== 'user') return false;
      if (roleFilter === 'suspended' && !u.isSuspended) return false;
      if (!q) return true;
      const hay = `${u.fullName} ${u.email} ${u.primaryRole} ${u.location}`.toLowerCase();
      return hay.includes(q);
    });
  }, [data.users, roleFilter, searchQuery]);

  const dashboardBase = `https://supabase.com/dashboard/project/${data.projectRef}`;

  if (!authUser?.isAdmin) {
    return (
      <div className={cn('mx-auto max-w-xl rounded-lg border p-6 text-center space-y-2', tokens.cardSurface)}>
        <Shield className={cn('mx-auto h-8 w-8', tokens.mutedText)} />
        <h2 className="text-base font-bold">Admin Access Required</h2>
        <p className={cn('text-xs', tokens.mutedText)}>
          Sign in with an administrator account ({PRIMARY_ADMIN_EMAIL}) to inspect user counts and platform data.
        </p>
      </div>
    );
  }

  return (
    <div className="no-print space-y-4">
      {/* TOP ADMIN HEADER & SUPABASE CONNECTION BAR */}
      <section className={cn('rounded-lg border p-5 space-y-4', tokens.cardSurface)}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#0a66c2]" />
              <h2 className="text-lg font-bold tracking-tight">
                Admin Control Center
              </h2>
              <span
                className={cn(
                  'rounded border px-2 py-0.5 font-mono text-[11px] font-semibold',
                  (setupStatus?.schemaReady ?? data.schemaReady)
                    ? tokens.isDark
                      ? 'border-emerald-700/70 bg-emerald-950/60 text-emerald-300'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : tokens.secondaryBtn
                )}
              >
                {(setupStatus?.schemaReady ?? data.schemaReady)
                  ? '✓ Supabase Cloud Live'
                  : 'Schema Setup Pending'}
              </span>
              <span className={cn('rounded border px-2 py-0.5 font-mono text-[11px]', tokens.subSurface)}>
                Vercel Store: supabase-erin-elephant ({data.projectRef})
              </span>
            </div>
            <p className={cn('text-xs', tokens.mutedText)}>
              Monitor total registered accounts, inspect user resumes and job pipelines, manage Admin roles, and configure Vercel Store Supabase settings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                void loadUsers();
              }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium',
                tokens.secondaryBtn
              )}
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setSetupModalOpen(true)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium',
                tokens.secondaryBtn
              )}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Supabase Settings
            </button>
            <a
              href={`${dashboardBase}/editor`}
              target="_blank"
              rel="noreferrer"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs',
                tokens.primaryBtn
              )}
            >
              <Database className="h-3.5 w-3.5" />
              Supabase Studio
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Supabase Quick Console Links */}
        <div className={cn('flex flex-wrap items-center gap-2 border-t pt-3 text-xs', tokens.borderSubtle)}>
          <span className={cn('font-medium', tokens.mutedText)}>
            Quick Supabase links:
          </span>
          {[
            { label: 'Table Editor', href: `${dashboardBase}/editor` },
            { label: 'Auth Users', href: `${dashboardBase}/auth/users` },
            { label: 'Auth Providers', href: `${dashboardBase}/auth/providers` },
            { label: 'Resumes Storage', href: `${dashboardBase}/storage/buckets` },
            { label: 'SQL Editor', href: `${dashboardBase}/sql/new` },
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
              <ExternalLink className="h-2.5 w-2.5 opacity-70" />
            </a>
          ))}
        </div>

        {actionMsg && (
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium',
              actionMsg.type === 'ok'
                ? tokens.isDark
                  ? 'border-emerald-700/60 bg-emerald-950/60 text-emerald-200'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : tokens.isDark
                  ? 'border-red-500/40 bg-red-950/50 text-red-200'
                  : 'border-red-300 bg-red-50 text-red-800'
            )}
          >
            {actionMsg.type === 'ok' ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{actionMsg.text}</span>
          </div>
        )}
      </section>

      {/* CONNECTED SUPABASE PROJECT & SETTINGS (VERCEL STORE) */}
      <section className={cn('rounded-lg border p-5 space-y-4', tokens.cardSurface)}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Database className="h-4 w-4 text-[#0a66c2]" />
              <h3 className="text-sm font-bold tracking-tight">
                Connected Supabase Project
              </h3>
              <span className={cn('rounded border px-2 py-0.5 font-mono text-[11px]', tokens.subSurface)}>
                supabase-erin-elephant (Vercel Store)
              </span>
            </div>
            <p className={cn('font-mono text-xs break-all', tokens.mutedText)}>
              {setupStatus?.url || data.supabaseUrl}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                void loadUsers();
              }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium',
                tokens.secondaryBtn
              )}
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
              Check
            </button>
            <button
              type="button"
              onClick={() => void handleCopySql()}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium',
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
            <button
              type="button"
              onClick={() => setSetupModalOpen(true)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs',
                tokens.primaryBtn
              )}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Supabase Key &amp; SQL Setup
            </button>
          </div>
        </div>

        <div className={cn('divide-y rounded-lg border text-xs', tokens.borderSubtle, tokens.subSurface)}>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="font-medium">1. API Key (.env)</span>
            <span
              className={cn(
                'rounded border px-2 py-0.5 font-mono text-[11px] font-medium',
                setupStatus?.keyValid
                  ? tokens.isDark
                    ? 'border-emerald-700/60 bg-emerald-950/60 text-emerald-300'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : tokens.secondaryBtn
              )}
            >
              {setupStatus ? (setupStatus.keyValid ? '✓ Connected' : 'Key Needed') : 'Checking...'}
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="font-medium">2. SQL Tables &amp; RLS</span>
            <span
              className={cn(
                'rounded border px-2 py-0.5 font-mono text-[11px] font-medium',
                (setupStatus?.schemaReady ?? data.schemaReady)
                  ? tokens.isDark
                    ? 'border-emerald-700/60 bg-emerald-950/60 text-emerald-300'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : tokens.secondaryBtn
              )}
            >
              {(setupStatus?.schemaReady ?? data.schemaReady) ? '✓ Schema Live' : 'Run SQL Once'}
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="font-medium">3. Admin User Directory Key</span>
            <span
              className={cn(
                'rounded border px-2 py-0.5 font-mono text-[11px] font-medium',
                (setupStatus?.hasServiceRole ?? data.hasServiceRole)
                  ? tokens.isDark
                    ? 'border-emerald-700/60 bg-emerald-950/60 text-emerald-300'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : tokens.secondaryBtn
              )}
            >
              {(setupStatus?.hasServiceRole ?? data.hasServiceRole) ? '✓ Full Admin' : 'Optional'}
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="font-medium">4. Backend Runtime &amp; Gemini AI</span>
            <span
              className={cn(
                'rounded border px-2 py-0.5 font-mono text-[11px] font-medium',
                setupStatus?.personalApiConfigured
                  ? tokens.isDark
                    ? 'border-emerald-700/60 bg-emerald-950/60 text-emerald-300'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : tokens.secondaryBtn
              )}
            >
              {setupStatus?.vercelEnv || 'local'} •{' '}
              {setupStatus?.personalApiConfigured ? '✓ AI Active' : 'Smart Engine'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <p className={tokens.mutedText}>
            {setupStatus?.message ||
              'Vercel Store Supabase (muftcprpqnzuzfosvftz) health checks load here.'}
          </p>
          <a
            href={`${dashboardBase}/sql/new`}
            target="_blank"
            rel="noreferrer"
            className={cn('inline-flex items-center gap-1 font-medium hover:underline', tokens.mutedText)}
          >
            Open SQL Editor
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </section>

      {/* PLATFORM KPI METRICS */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
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
            label: 'Total Jobs in DB',
            value: data.stats.totalJobsTracked,
            sub: 'Across all users',
          },
          {
            label: 'Saved & Applied',
            value: `${data.stats.totalSavedJobs} / ${data.stats.totalAppliedJobs}`,
            sub: 'Saved / Applied pipeline',
          },
          {
            label: 'Board Scans & CVs',
            value: `${data.stats.totalScans} / ${data.stats.resumesStoredCount}`,
            sub: 'Scans / Stored PDFs',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={cn('rounded-lg border p-4 space-y-1', tokens.cardSurface)}
          >
            <div className={cn('text-xs font-medium', tokens.mutedText)}>
              {kpi.label}
            </div>
            <div className="font-mono text-2xl font-semibold tabular-nums">
              {kpi.value}
            </div>
            <div className={cn('text-[11px]', tokens.mutedText)}>{kpi.sub}</div>
          </div>
        ))}
      </section>

      <AdminFreeTierCard
        theme={theme}
        stats={data.stats}
        runningKeepAlive={runningKeepAlive}
        runningPrune={runningPrune}
        onPingKeepAlive={() => void handlePingKeepAlive()}
        onRunPrune={() => void handleRunFreeTierPrune()}
      />

      {/* SEARCHABLE USER DIRECTORY */}
      <section className={cn('rounded-lg border p-5 space-y-4', tokens.cardSurface)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Users className="h-4 w-4 text-[#0a66c2]" />
            <h3 className="text-sm font-bold">
              User Directory ({filteredUsers.length})
            </h3>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'admin', label: 'Admins' },
                  { id: 'user', label: 'Users' },
                  { id: 'suspended', label: 'Suspended' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRoleFilter(tab.id)}
                  className={cn(
                    'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                    roleFilter === tab.id ? tokens.primaryBtn : tokens.secondaryBtn
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className={cn('pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5', tokens.mutedText)} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, email, role..."
              className={cn(
                'w-full rounded-lg border py-1.5 pl-8 pr-3 text-xs focus:outline-none sm:w-64',
                tokens.inputSurface
              )}
            />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className={cn('rounded-lg border border-dashed p-8 text-center text-xs', tokens.mutedText)}>
            {loading
              ? 'Loading users...'
              : 'No user accounts match that filter yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className={cn('border-b', tokens.borderSubtle, tokens.mutedText)}>
                  <th className="py-2.5 pr-3 font-semibold">User</th>
                  <th className="py-2.5 px-3 font-semibold">Role &amp; Status</th>
                  <th className="py-2.5 px-3 font-semibold">Target Role &amp; Skills</th>
                  <th className="py-2.5 px-3 font-semibold">Jobs / Pipeline</th>
                  <th className="py-2.5 px-3 font-semibold">Last Active</th>
                  <th className="py-2.5 pl-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className={cn('divide-y', tokens.borderSubtle)}>
                {filteredUsers.map((u) => {
                  const isPrimaryAdmin =
                    u.email.toLowerCase() === PRIMARY_ADMIN_EMAIL;
                  const isBusy = busyUserId === u.id;
                  return (
                    <tr key={u.id} className="align-top">
                      <td className="py-3 pr-3">
                        <div className={cn('font-semibold', tokens.strongText)}>
                          {u.fullName}
                        </div>
                        <div className={cn('font-mono text-[11px]', tokens.mutedText)}>
                          {u.email || u.id}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <span className={cn('rounded border px-1.5 py-0.5 font-mono text-[10px]', tokens.subSurface)}>
                            {u.provider}
                          </span>
                          {u.resumeFileName && (
                            <span className={cn('inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px]', tokens.subSurface)}>
                              <FileText className="h-2.5 w-2.5" />
                              {u.resumeFileName}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 space-y-1">
                        <div>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[11px] font-semibold',
                              u.role === 'admin'
                                ? tokens.orangeBadge
                                : tokens.subSurface
                            )}
                          >
                            {u.role === 'admin' ? '✓ Admin' : 'User'}
                          </span>
                        </div>
                        {u.isSuspended && (
                          <div>
                            <span className="inline-flex items-center gap-1 rounded border border-red-300 bg-red-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-red-700">
                              Suspended
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium">{u.primaryRole}</div>
                        <div className={cn('text-[11px]', tokens.mutedText)}>
                          {u.location} •{' '}
                          <span className="font-mono tabular-nums">
                            {u.skillsCount} skills
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] tabular-nums">
                        <div>{u.totalJobs} tracked</div>
                        <div className={tokens.mutedText}>
                          {u.savedJobs} saved • {u.appliedJobs} applied • {u.scansCount} scans
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px]">
                        {u.lastActiveAt
                          ? new Date(u.lastActiveAt).toLocaleString()
                          : 'Never'}
                      </td>

                      <td className="py-3 pl-3 text-right">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => void handleInspectUser(u.id)}
                            className={cn(
                              'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium',
                              tokens.secondaryBtn
                            )}
                          >
                            <Eye className="h-3 w-3" />
                            Inspect
                          </button>

                          {!isPrimaryAdmin && data.schemaReady && (
                            <>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  void handleUpdateUser(u.id, {
                                    role: u.role === 'admin' ? 'user' : 'admin',
                                  })
                                }
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium disabled:opacity-50',
                                  tokens.secondaryBtn
                                )}
                              >
                                <UserCheck className="h-3 w-3" />
                                {u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                              </button>

                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  void handleUpdateUser(u.id, {
                                    isSuspended: !u.isSuspended,
                                  })
                                }
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium disabled:opacity-50',
                                  tokens.secondaryBtn
                                )}
                              >
                                <Ban className="h-3 w-3" />
                                {u.isSuspended ? 'Activate' : 'Suspend'}
                              </button>

                              {confirmDeleteId === u.id ? (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => void handleDeleteUser(u.id)}
                                  className="inline-flex items-center gap-1 rounded-md border border-red-400 bg-red-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-700"
                                >
                                  Confirm Delete
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => setConfirmDeleteId(u.id)}
                                  className={cn(
                                    'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium disabled:opacity-50',
                                    tokens.secondaryBtn
                                  )}
                                  title="Delete user account and data"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AdminUserInspectDialog
        theme={theme}
        inspectedUser={inspectedUser}
        loadingInspect={loadingInspect}
        inspectTab={inspectTab}
        onChangeInspectTab={setInspectTab}
        onClose={() => {
          setInspectedUser(null);
          setLoadingInspect(false);
        }}
      />

      <AdminSupabaseSetupDialog
        theme={theme}
        isOpen={setupModalOpen}
        supabaseUrl={DEFAULT_SUPABASE_URL}
        anonKeyDraft={anonKeyDraft}
        serviceKeyDraft={serviceKeyDraft}
        savingKeys={savingKeys}
        copiedSql={copiedSql}
        onClose={() => setSetupModalOpen(false)}
        onCopySql={() => void handleCopySql()}
        onChangeAnonKey={setAnonKeyDraft}
        onChangeServiceKey={setServiceKeyDraft}
        onSaveKeys={(e) => void handleSaveKeys(e)}
      />
    </div>
  );
}

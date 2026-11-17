'use client';

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AlertCircle,
  Check,
  Database,
  ExternalLink,
  KeyRound,
  RefreshCw,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { AuthSessionUser, MonochromeTheme, UserRole } from '@/types/job';
import {
  AdminUsersApiResponse,
  InspectedUserPayload,
  PlatformStatusPayload,
  SetupStatus,
} from '@/features/admin/types';
import { getHealthBadgeStyle } from '@/features/admin/lib/status-helpers';
import { AdminOverviewTab } from '@/features/admin/components/AdminOverviewTab';
import { AdminUserDirectoryTab } from '@/features/admin/components/AdminUserDirectoryTab';
import { AdminInfraTab } from '@/features/admin/components/AdminInfraTab';
import { AdminSupabaseSetupDialog } from '@/features/admin/components/AdminSupabaseSetupDialog';
import { AdminUserInspectDialog } from '@/features/admin/components/AdminUserInspectDialog';
import {
  DEFAULT_SUPABASE_PROJECT_REF,
  DEFAULT_SUPABASE_URL,
  PRIMARY_ADMIN_EMAIL,
  SUPABASE_PROJECT_NAME,
} from '@/lib/supabase/config';
import { SUPABASE_SCHEMA_SQL } from '@/lib/supabase/schema-sql';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

type AdminTabId = 'overview' | 'users' | 'infra';

interface AdminDashboardViewProps {
  theme: MonochromeTheme;
  authUser: AuthSessionUser | null;
}

export function AdminDashboardView({
  theme,
  authUser,
}: AdminDashboardViewProps) {
  const tokens = getThemeTokens(theme);
  const overviewTabId = useId();
  const usersTabId = useId();
  const infraTabId = useId();
  const tabRefs = useRef<Record<AdminTabId, HTMLButtonElement | null>>({
    overview: null,
    users: null,
    infra: null,
  });

  const [activeTab, setActiveTab] = useState<AdminTabId>('overview');

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
  const [loadingStatus, setLoadingStatus] = useState(true);
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

  const [inspectedUser, setInspectedUser] =
    useState<InspectedUserPayload | null>(null);
  const [loadingInspect, setLoadingInspect] = useState(false);
  const [inspectTab, setInspectTab] = useState<
    'profile' | 'resume' | 'jobs' | 'scans'
  >('profile');

  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [platformStatus, setPlatformStatus] =
    useState<PlatformStatusPayload | null>(null);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [anonKeyDraft, setAnonKeyDraft] = useState('');
  const [serviceKeyDraft, setServiceKeyDraft] = useState('');
  const [savingKeys, setSavingKeys] = useState(false);
  const [runningKeepAlive, setRunningKeepAlive] = useState(false);
  const [runningPrune, setRunningPrune] = useState(false);

  const loadAllAdminData = useCallback(async (forceStatus = false) => {
    setLoading(true);
    setLoadingStatus(true);
    try {
      const statusUrl = forceStatus
        ? '/api/admin/platform-status?force=1'
        : '/api/admin/platform-status';
      const [usersRes, setupRes, statusRes] = await Promise.all([
        fetch('/api/admin/users', { cache: 'no-store' }),
        fetch('/api/supabase/setup', { cache: 'no-store' }).catch(() => null),
        fetch(statusUrl, { cache: 'no-store' }).catch(() => null),
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
        setSetupStatus((await setupRes.json()) as SetupStatus);
      }
      if (statusRes && statusRes.ok) {
        setPlatformStatus((await statusRes.json()) as PlatformStatusPayload);
      }
    } catch {
      setActionMsg({
        type: 'err',
        text: 'Network error while fetching admin data.',
      });
    } finally {
      setLoading(false);
      setLoadingStatus(false);
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
        .then(async (res) =>
          res.ok ? ((await res.json()) as SetupStatus) : null
        )
        .catch(() => null),
      fetch('/api/admin/platform-status', { cache: 'no-store' })
        .then(async (res) =>
          res.ok ? ((await res.json()) as PlatformStatusPayload) : null
        )
        .catch(() => null),
    ])
      .then(([{ ok, payload }, setupPayload, statusPayload]) => {
        if (!active) return;
        if (!ok) {
          setActionMsg({
            type: 'err',
            text: payload.error || 'Failed to load admin user directory.',
          });
          return;
        }
        setData(payload as AdminUsersApiResponse);
        if (setupPayload) setSetupStatus(setupPayload);
        if (statusPayload) setPlatformStatus(statusPayload);
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
        if (active) {
          setLoading(false);
          setLoadingStatus(false);
        }
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
      await loadAllAdminData(false);
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
      await loadAllAdminData(false);
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
      await loadAllAdminData(true);
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
      await loadAllAdminData(true);
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
      await loadAllAdminData(false);
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
      const hay =
        `${u.fullName} ${u.email} ${u.primaryRole} ${u.location}`.toLowerCase();
      return hay.includes(q);
    });
  }, [data.users, roleFilter, searchQuery]);

  const tabOrder: AdminTabId[] = useMemo(
    () => ['overview', 'users', 'infra'],
    []
  );

  const selectTab = (nextTab: AdminTabId, moveFocus = false) => {
    setActiveTab(nextTab);
    if (moveFocus) {
      const el = tabRefs.current[nextTab];
      el?.focus();
      el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  };

  const handleTabKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = tabOrder.indexOf(activeTab);
    if (idx === -1) return;
    let nextIdx: number | null = null;
    if (e.key === 'ArrowRight') nextIdx = (idx + 1) % tabOrder.length;
    else if (e.key === 'ArrowLeft')
      nextIdx = (idx - 1 + tabOrder.length) % tabOrder.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = tabOrder.length - 1;

    if (nextIdx !== null) {
      e.preventDefault();
      selectTab(tabOrder[nextIdx], true);
    }
  };

  const dashboardBase = `https://supabase.com/dashboard/project/${data.projectRef}`;
  const vercelPill = getHealthBadgeStyle(
    platformStatus?.vercel.globalStatus.level || 'unknown',
    tokens
  );
  const supabasePill = getHealthBadgeStyle(
    platformStatus?.supabase.globalStatus.level ||
      ((setupStatus?.schemaReady ?? data.schemaReady)
        ? 'operational'
        : 'unknown'),
    tokens
  );
  const dbLatency = platformStatus?.supabase.dbProbe.latencyMs;

  if (!authUser?.isAdmin) {
    return (
      <div
        className={cn(
          'mx-auto max-w-xl rounded-lg border p-6 text-center space-y-2',
          tokens.cardSurface
        )}
      >
        <Shield className={cn('mx-auto h-8 w-8', tokens.mutedText)} />
        <h2 className="text-base font-bold">Admin Access Required</h2>
        <p className={cn('text-xs', tokens.mutedText)}>
          Sign in with an administrator account ({PRIMARY_ADMIN_EMAIL}) to
          inspect user counts and platform data.
        </p>
      </div>
    );
  }

  return (
    <div className="no-print space-y-4">
      {/* TOP COMMAND HEADER + ACCESSIBLE WORKSPACE TABS */}
      <section
        className={cn(
          'overflow-hidden rounded-lg border',
          tokens.borderSubtle,
          tokens.cardSurface
        )}
      >
        <div className="p-5 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
                <h2 className="text-lg font-bold tracking-tight">
                  Admin Control Center
                </h2>
                <span
                  className={cn(
                    'rounded border px-2 py-0.5 font-mono text-[11px] font-semibold',
                    vercelPill.className
                  )}
                >
                  {vercelPill.prefix} Vercel: {vercelPill.label} (
                  {platformStatus?.vercel.runtimeEnv ||
                    setupStatus?.vercelEnv ||
                    'local'}
                  )
                </span>
                <span
                  className={cn(
                    'rounded border px-2 py-0.5 font-mono text-[11px] font-semibold',
                    supabasePill.className
                  )}
                >
                  {supabasePill.prefix} Supabase:{' '}
                  {platformStatus?.supabase.dbProbe.schemaReady ??
                  setupStatus?.schemaReady ??
                  data.schemaReady
                    ? dbLatency
                      ? `Live (${dbLatency}ms)`
                      : 'Live'
                    : 'Setup Pending'}
                </span>
                <span
                  className={cn(
                    'rounded border px-2 py-0.5 font-mono text-[11px]',
                    tokens.subSurface
                  )}
                >
                  Store: {setupStatus?.projectName || SUPABASE_PROJECT_NAME} (
                  {data.projectRef})
                </span>
              </div>
              <p className={cn('text-xs', tokens.mutedText)}>
                Monitor Vercel Hobby &amp; Supabase Free-Tier health, inspect
                registered users and job pipelines, and manage schema or Auth
                email templates.
                {platformStatus?.checkedAt && (
                  <span className="ml-1 font-mono">
                    · Checked{' '}
                    {new Date(platformStatus.checkedAt).toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void loadAllAdminData(true)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                  tokens.secondaryBtn
                )}
              >
                <RefreshCw
                  className={cn(
                    'h-3.5 w-3.5',
                    (loading || loadingStatus) && 'animate-spin'
                  )}
                  aria-hidden="true"
                />
                Refresh All
              </button>
              <button
                type="button"
                onClick={() => setSetupModalOpen(true)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                  tokens.secondaryBtn
                )}
              >
                <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                Supabase Settings
              </button>
              <a
                href={`${dashboardBase}/editor`}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors',
                  tokens.primaryBtn
                )}
              >
                <Database className="h-3.5 w-3.5" aria-hidden="true" />
                Supabase Studio
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
          </div>

          {actionMsg && (
            <div
              role={actionMsg.type === 'err' ? 'alert' : 'status'}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium',
                actionMsg.type === 'ok'
                  ? tokens.badgeSuccess
                  : tokens.badgeDanger
              )}
            >
              {actionMsg.type === 'ok' ? (
                <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span>{actionMsg.text}</span>
            </div>
          )}
        </div>

        {/* Single-row accessible tablist (WCAG 1.4.1 underline + focusgroup + arrow-key fallback) */}
        <div
          role="tablist"
          aria-label="Admin Control Center sections"
          onKeyDown={handleTabKeyDown}
          {...({ focusgroup: 'tablist nomemory' } as Record<string, string>)}
          className={cn(
            'admin-tablist border-t px-5 gap-6',
            tokens.borderSubtle,
            tokens.subSurface
          )}
        >
          {(
            [
              {
                id: 'overview' as const,
                domId: overviewTabId,
                label: 'Overview & Platform Status',
              },
              {
                id: 'users' as const,
                domId: usersTabId,
                label: `Users (${data.users.length})`,
              },
              {
                id: 'infra' as const,
                domId: infraTabId,
                label: 'Infrastructure & Free-Tier',
              },
            ] as const
          ).map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                id={tab.domId}
                type="button"
                role="tab"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                {...(selected ? { focusgroupstart: '' } : {})}
                onClick={() => selectTab(tab.id)}
                className={cn(
                  'admin-tab py-2.5 text-xs font-semibold transition-colors focus:outline-none',
                  selected ? tokens.strongText : tokens.mutedText
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* TAB PANELS */}
      <div
        role="tabpanel"
        aria-labelledby={overviewTabId}
        hidden={activeTab !== 'overview'}
      >
        {activeTab === 'overview' && (
          <AdminOverviewTab
            theme={theme}
            data={data}
            setupStatus={setupStatus}
            platformStatus={platformStatus}
            loadingStatus={loadingStatus}
            onOpenUsersTab={() => selectTab('users', true)}
            onOpenInfraTab={() => selectTab('infra', true)}
          />
        )}
      </div>

      <div
        role="tabpanel"
        aria-labelledby={usersTabId}
        hidden={activeTab !== 'users'}
      >
        {activeTab === 'users' && (
          <AdminUserDirectoryTab
            theme={theme}
            users={filteredUsers}
            loading={loading}
            schemaReady={data.schemaReady}
            searchQuery={searchQuery}
            roleFilter={roleFilter}
            busyUserId={busyUserId}
            confirmDeleteId={confirmDeleteId}
            onSearchChange={setSearchQuery}
            onRoleFilterChange={setRoleFilter}
            onInspectUser={(id) => void handleInspectUser(id)}
            onUpdateUser={(id, updates) => void handleUpdateUser(id, updates)}
            onRequestDelete={setConfirmDeleteId}
            onConfirmDelete={(id) => void handleDeleteUser(id)}
          />
        )}
      </div>

      <div
        role="tabpanel"
        aria-labelledby={infraTabId}
        hidden={activeTab !== 'infra'}
      >
        {activeTab === 'infra' && (
          <AdminInfraTab
            theme={theme}
            data={data}
            setupStatus={setupStatus}
            platformStatus={platformStatus}
            copiedSql={copiedSql}
            runningKeepAlive={runningKeepAlive}
            runningPrune={runningPrune}
            onCopySql={() => void handleCopySql()}
            onOpenSetupModal={() => setSetupModalOpen(true)}
            onPingKeepAlive={() => void handlePingKeepAlive()}
            onRunPrune={() => void handleRunFreeTierPrune()}
          />
        )}
      </div>

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
        supabaseUrl={
          setupStatus?.url || data.supabaseUrl || DEFAULT_SUPABASE_URL
        }
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

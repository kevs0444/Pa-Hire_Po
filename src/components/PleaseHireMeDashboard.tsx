'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Briefcase,
  CheckCircle2,
  Compass,
  FileUser,
  Filter,
  Globe,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  AppStoreState,
  COUNTRY_CONFIGS,
  DynamicRoleSuggestion,
  JobListing,
  JobSource,
  JobStatus,
  ScanSourceMeta,
  UserProfile,
} from '@/types/job';
import {
  inferDynamicRoles,
  scoreJobAgainstProfile,
} from '@/lib/resume-analyzer';
import {
  fetchServerState,
  getDefaultStoreState,
  loadLocalState,
  saveLocalState,
  syncStateToServer,
} from '@/lib/storage';
import { JobCard } from '@/components/JobCard';
import { ProfilePanel } from '@/components/ProfilePanel';
import { cn } from '@/lib/utils';

const WITTY_TAGLINES = [
  'Because manually refreshing LinkedIn, JobStreet & Indeed is a full-time job.',
  'Rejecting the null hypothesis of unemployment.',
  'Automated job hunting for humans who have better things to analyze.',
  'Querying SELECT * FROM dream_jobs WHERE ghosting = FALSE.',
];

function rescoreJobsWithProfile(
  jobs: JobListing[],
  profile: UserProfile
): JobListing[] {
  return jobs.map((existing) => {
    const rescored = scoreJobAgainstProfile(
      {
        externalId: existing.id,
        title: existing.title,
        company: existing.company,
        location: existing.location,
        source: existing.source,
        url: existing.url,
        postedAt: existing.postedAt,
        salary: existing.salary,
        description: existing.description,
        workType: existing.workType,
        searchedRole: existing.searchedRole,
        isPivotSuggestion: existing.isPivotSuggestion,
        isFallback: existing.isFallback,
      },
      profile
    );

    return {
      ...rescored,
      id: existing.id,
      status: existing.status,
      discoveredAt: existing.discoveredAt,
    };
  });
}

export function PleaseHireMeDashboard() {
  const [hydrated, setHydrated] = useState(false);
  const [store, setStore] = useState<AppStoreState>(getDefaultStoreState);
  const [storageMode, setStorageMode] = useState<string>('browser-only');
  const [enabledSources, setEnabledSources] = useState<JobSource[]>([
    'linkedin',
    'jobstreet',
    'indeed',
  ]);
  const [boardMeta, setBoardMeta] = useState<ScanSourceMeta[]>([]);
  const [lastSearchedRoles, setLastSearchedRoles] = useState<
    { role: string; isPivot: boolean }[]
  >([]);

  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [autoPilot, setAutoPilot] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'active' | JobStatus>('active');
  const [sourceFilter, setSourceFilter] = useState<'all' | JobSource>('all');
  const [roleTypeFilter, setRoleTypeFilter] = useState<'all' | 'primary' | 'pivot'>('all');
  const [minScore, setMinScore] = useState<number>(30);
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic role controls
  const [roleDraft, setRoleDraft] = useState('Data Analyst');
  const [newCustomRole, setNewCustomRole] = useState('');
  const [taglineIndex, setTaglineIndex] = useState(0);

  const initialAutoScanRan = useRef(false);

  const persistStore = useCallback((next: AppStoreState) => {
    setStore(next);
    saveLocalState(next);
    void syncStateToServer(next).then((mode) => {
      if (mode) setStorageMode(mode);
    });
  }, []);

  const runJobScan = useCallback(
    async (overrideProfile?: UserProfile, explicitRoles?: string[]) => {
      const activeProfile = overrideProfile || store.profile;
      if (enabledSources.length === 0) {
        setScanError('Select at least one job board (LinkedIn, JobStreet, or Indeed).');
        return;
      }

      setScanning(true);
      setScanError(null);

      try {
        const res = await fetch('/api/jobs/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile: activeProfile,
            explicitRoles,
            sources: enabledSources,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Search failed');
        }

        const incoming: JobListing[] = Array.isArray(data.jobs) ? data.jobs : [];
        const meta: ScanSourceMeta[] = Array.isArray(data.meta) ? data.meta : [];
        const searchedRoles: { role: string; isPivot: boolean }[] =
          Array.isArray(data.searchedRoles) ? data.searchedRoles : [];

        setBoardMeta(meta);
        setLastSearchedRoles(searchedRoles);

        setStore((prev) => {
          const existingById = new Map(prev.jobs.map((j) => [j.id, j]));
          let newAdded = 0;

          for (const item of incoming) {
            const old = existingById.get(item.id);
            if (old) {
              existingById.set(item.id, {
                ...item,
                status: old.status,
                discoveredAt: old.discoveredAt,
              });
            } else {
              newAdded += 1;
              existingById.set(item.id, item);
            }
          }

          // Drop stale fallback placeholders once live jobs exist for that board
          const liveBoards = new Set(
            Array.from(existingById.values())
              .filter((j) => !j.isFallback)
              .map((j) => j.source)
          );
          const mergedJobs = Array.from(existingById.values())
            .filter((j) => !j.isFallback || !liveBoards.has(j.source))
            .sort((a, b) => {
              if (Boolean(a.isFallback) !== Boolean(b.isFallback)) {
                return a.isFallback ? 1 : -1;
              }
              return b.matchScore - a.matchScore;
            });

          const scannedAt = data.scannedAt || new Date().toISOString();
          const nextState: AppStoreState = {
            ...prev,
            profile: activeProfile,
            jobs: mergedJobs,
            lastScannedAt: scannedAt,
            scanHistory: [
              {
                id: `${Date.now()}`,
                timestamp: scannedAt,
                searchedRoles: searchedRoles.map((r) => r.role),
                totalFound: incoming.length,
                newAdded,
                meta,
              },
              ...prev.scanHistory.slice(0, 14),
            ],
          };

          saveLocalState(nextState);
          void syncStateToServer(nextState);
          return nextState;
        });
      } catch (err) {
        setScanError(
          err instanceof Error ? err.message : 'Unable to complete job scan.'
        );
      } finally {
        setScanning(false);
      }
    },
    [enabledSources, store.profile]
  );

  // Hydrate from localStorage + local server state
  useEffect(() => {
    let active = true;

    async function hydrate() {
      const local = loadLocalState();
      const server = await fetchServerState();
      if (!active) return;

      setStorageMode(server.storageMode);
      const chosen =
        server.state && server.state.jobs.length >= local.jobs.length
          ? server.state
          : local;

      setStore(chosen);
      setRoleDraft(chosen.profile.primaryRole);
      setSecondsLeft(chosen.profile.autoScanIntervalMinutes * 60);
      setHydrated(true);

      if (chosen.jobs.length === 0 && !initialAutoScanRan.current) {
        initialAutoScanRan.current = true;
        void runJobScan(chosen.profile);
      }
    }

    void hydrate();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rotate witty tagline gently on client only
  useEffect(() => {
    const timer = setInterval(() => {
      setTaglineIndex((i) => (i + 1) % WITTY_TAGLINES.length);
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  // Auto-Pilot background countdown & automated refresh
  useEffect(() => {
    if (!autoPilot) return;

    const tick = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          void runJobScan();
          return store.profile.autoScanIntervalMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [autoPilot, runJobScan, store.profile.autoScanIntervalMinutes]);

  const dynamicSuggestions: DynamicRoleSuggestion[] = useMemo(() => {
    return inferDynamicRoles(
      store.profile.resumeText,
      store.profile.skills,
      store.profile.primaryRole
    ).slice(0, 7);
  }, [store.profile.primaryRole, store.profile.resumeText, store.profile.skills]);

  const handleUpdateProfile = (nextProfile: UserProfile) => {
    setRoleDraft(nextProfile.primaryRole);
    const rescored = rescoreJobsWithProfile(store.jobs, nextProfile);
    persistStore({
      ...store,
      profile: nextProfile,
      jobs: rescored,
    });
  };

  const handleApplyPrimaryRole = (role: string, triggerScan = false) => {
    const clean = role.trim();
    if (!clean) return;
    const nextProfile: UserProfile = {
      ...store.profile,
      primaryRole: clean,
      title: clean,
    };
    setRoleDraft(clean);
    const rescored = rescoreJobsWithProfile(store.jobs, nextProfile);
    persistStore({
      ...store,
      profile: nextProfile,
      jobs: rescored,
    });
    if (triggerScan) {
      void runJobScan(nextProfile);
    }
  };

  const handleAddCustomRole = () => {
    const clean = newCustomRole.trim();
    if (!clean) return;
    if (
      !store.profile.customRoles.some(
        (r) => r.toLowerCase() === clean.toLowerCase()
      )
    ) {
      handleUpdateProfile({
        ...store.profile,
        customRoles: [...store.profile.customRoles, clean],
      });
    }
    setNewCustomRole('');
  };

  const handleRemoveCustomRole = (roleToRemove: string) => {
    handleUpdateProfile({
      ...store.profile,
      customRoles: store.profile.customRoles.filter((r) => r !== roleToRemove),
    });
  };

  const handleUpdateJobStatus = (jobId: string, status: JobStatus) => {
    const nextJobs = store.jobs.map((j) =>
      j.id === jobId ? { ...j, status } : j
    );
    persistStore({ ...store, jobs: nextJobs });
  };

  const handleClearSuggested = () => {
    const kept = store.jobs.filter(
      (j) => j.status === 'saved' || j.status === 'applied'
    );
    persistStore({ ...store, jobs: kept });
  };

  const toggleSource = (source: JobSource) => {
    setEnabledSources((prev) =>
      prev.includes(source)
        ? prev.filter((s) => s !== source)
        : [...prev, source]
    );
  };

  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return store.jobs.filter((job) => {
      if (statusFilter === 'active') {
        if (job.status === 'hidden') return false;
      } else if (job.status !== statusFilter) {
        return false;
      }

      if (sourceFilter !== 'all' && job.source !== sourceFilter) return false;
      if (roleTypeFilter === 'primary' && job.isPivotSuggestion) return false;
      if (roleTypeFilter === 'pivot' && !job.isPivotSuggestion) return false;
      if (job.matchScore < minScore) return false;

      if (q) {
        const hay = `${job.title} ${job.company} ${job.location} ${job.searchedRole} ${job.matchedSkills.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [
    minScore,
    roleTypeFilter,
    searchQuery,
    sourceFilter,
    statusFilter,
    store.jobs,
  ]);

  const stats = useMemo(() => {
    const visible = store.jobs.filter((j) => j.status !== 'hidden');
    return {
      total: visible.length,
      topMatches: visible.filter((j) => j.matchScore >= 75 && !j.isFallback).length,
      pivots: visible.filter((j) => j.isPivotSuggestion).length,
      savedOrApplied: store.jobs.filter(
        (j) => j.status === 'saved' || j.status === 'applied'
      ).length,
    };
  }, [store.jobs]);

  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/20">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  PleaseHireMe
                </h1>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                  Vercel Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {WITTY_TAGLINES[taglineIndex]}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Auto-Pilot Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !autoPilot;
                setAutoPilot(next);
                if (next) {
                  setSecondsLeft(store.profile.autoScanIntervalMinutes * 60);
                }
              }}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition',
                autoPilot
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
              )}
              title="Automatically scan LinkedIn, JobStreet, and Indeed on a timer"
            >
              {autoPilot ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  Auto-Pilot ON ({formatCountdown(secondsLeft)})
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Auto-Pilot OFF
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              <FileUser className="h-3.5 w-3.5 text-emerald-400" />
              Resume & Skills ({store.profile.skills.length})
            </button>

            <button
              type="button"
              disabled={scanning}
              onClick={() => void runJobScan()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:opacity-60"
            >
              <RefreshCw
                className={cn('h-3.5 w-3.5', scanning && 'animate-spin')}
              />
              {scanning ? 'Scanning 3 Boards...' : 'Find Jobs Now'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {/* Stats Row */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Discovered Jobs</span>
              <Briefcase className="h-4 w-4 text-sky-400" />
            </div>
            <p className="mt-1.5 text-2xl font-bold text-white tabular-nums">
              {stats.total}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Across LinkedIn, JobStreet & Indeed
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Top Matches (75%+)</span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="mt-1.5 text-2xl font-bold text-emerald-300 tabular-nums">
              {stats.topMatches}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Strong skill overlap with {store.profile.name}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Dynamic Role Pivots</span>
              <Compass className="h-4 w-4 text-violet-400" />
            </div>
            <p className="mt-1.5 text-2xl font-bold text-violet-300 tabular-nums">
              {stats.pivots}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Adjacent opportunities outside {store.profile.primaryRole}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Saved & Applied</span>
              <CheckCircle2 className="h-4 w-4 text-amber-400" />
            </div>
            <p className="mt-1.5 text-2xl font-bold text-white tabular-nums">
              {stats.savedOrApplied}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Storage: {storageMode === 'local-file' ? 'Local Disk + Browser' : 'Browser Sync'}
            </p>
          </div>
        </section>

        {/* Dynamic Role Switcher & Pivot Explorer */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">
                  Dynamic Role Engine (Currently targeting:{' '}
                  <span className="text-emerald-300">
                    {store.profile.primaryRole}
                  </span>
                  )
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Starts with Data Analyst by default, but switch to any profession anytime or let Dynamic Pivot suggest adjacent roles from your resume.
              </p>
            </div>

            {/* Dynamic Role Pivot Toggle */}
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3.5 py-2">
              <input
                type="checkbox"
                checked={store.profile.autoPivotRoles}
                onChange={(e) =>
                  handleUpdateProfile({
                    ...store.profile,
                    autoPivotRoles: e.target.checked,
                  })
                }
                className="h-4 w-4 accent-violet-500"
              />
              <div>
                <div className="text-xs font-semibold text-violet-200">
                  Dynamic Role Pivot Mode
                </div>
                <div className="text-[11px] text-violet-300/80">
                  Occasionally mix in high-overlap adjacent roles
                </div>
              </div>
            </label>
          </div>

          {/* Primary Role Input + Quick Country/Location + Add Custom Role */}
          <div className="grid gap-3 md:grid-cols-12">
            <div className="flex gap-2 md:col-span-5">
              <input
                type="text"
                value={roleDraft}
                onChange={(e) => setRoleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyPrimaryRole(roleDraft, true);
                  }
                }}
                placeholder="Type ANY target role (e.g. Data Analyst, Product Manager, React Dev)..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleApplyPrimaryRole(roleDraft, true)}
                className="rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-slate-700"
              >
                Switch & Scan
              </button>
            </div>

            <div className="flex items-center gap-2 md:col-span-4">
              <Globe className="h-4 w-4 shrink-0 text-slate-400" />
              <select
                value={store.profile.country}
                onChange={(e) => {
                  const code = e.target.value as keyof typeof COUNTRY_CONFIGS;
                  handleUpdateProfile({
                    ...store.profile,
                    country: code,
                    location: COUNTRY_CONFIGS[code].defaultLocation,
                  });
                }}
                className="rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                {Object.values(COUNTRY_CONFIGS).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={store.profile.location}
                onChange={(e) =>
                  handleUpdateProfile({
                    ...store.profile,
                    location: e.target.value,
                  })
                }
                placeholder="City / Location"
                className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 md:col-span-3">
              <input
                type="text"
                value={newCustomRole}
                onChange={(e) => setNewCustomRole(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomRole();
                  }
                }}
                placeholder="+ Add pivot role..."
                className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomRole}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
          </div>

          {/* Resume-Inferred & Custom Role Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Inferred from your resume:
            </span>
            {dynamicSuggestions.map((item) => {
              const isCurrent =
                item.role.toLowerCase() ===
                store.profile.primaryRole.toLowerCase();
              return (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleApplyPrimaryRole(item.role, true)}
                  title={`${item.rationale} — click to make this your Primary Role and scan`}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition',
                    isCurrent
                      ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-200'
                      : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-emerald-500/40 hover:text-white'
                  )}
                >
                  <span>{item.role}</span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] text-emerald-300">
                    {item.overlapPercent}%
                  </span>
                </button>
              );
            })}

            {store.profile.customRoles.map((role) => (
              <span
                key={`custom-${role}`}
                className="inline-flex items-center gap-1 rounded-full border border-violet-500/35 bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-200"
              >
                <button
                  type="button"
                  onClick={() => handleApplyPrimaryRole(role, true)}
                  className="hover:underline"
                  title="Switch to this role and scan"
                >
                  Pivot: {role}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveCustomRole(role)}
                  className="ml-0.5 text-violet-300/70 hover:text-white"
                  aria-label={`Remove ${role}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* 3-Board Scraper Status Strip */}
        <section className="grid gap-3 md:grid-cols-3">
          {(['linkedin', 'jobstreet', 'indeed'] as JobSource[]).map((board) => {
            const active = enabledSources.includes(board);
            const meta = boardMeta.find((m) => m.source === board);
            const label =
              board === 'linkedin'
                ? 'LinkedIn'
                : board === 'jobstreet'
                  ? 'JobStreet'
                  : 'Indeed';

            return (
              <div
                key={board}
                className={cn(
                  'flex items-center justify-between rounded-2xl border p-3.5 transition',
                  active
                    ? 'border-slate-800 bg-slate-900/70'
                    : 'border-slate-900 bg-slate-950 opacity-60'
                )}
              >
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleSource(board)}
                    className="h-4 w-4 accent-emerald-500"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {label}
                      </span>
                      {meta && (
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                            meta.status === 'live'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : meta.status === 'fallback'
                                ? 'bg-amber-500/15 text-amber-300'
                                : 'bg-rose-500/15 text-rose-300'
                          )}
                        >
                          {meta.status === 'live'
                            ? `${meta.count} live`
                            : meta.status === 'fallback'
                              ? 'direct link'
                              : 'error'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {scanning && active
                        ? 'Scanning live listings...'
                        : meta?.message || 'Ready to scan'}
                    </p>
                  </div>
                </label>

                {meta && (
                  <span className="text-[11px] font-mono text-slate-500">
                    {(meta.durationMs / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
            );
          })}
        </section>

        {/* Active Scan Roles Summary */}
        {lastSearchedRoles.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-900/40 px-4 py-2.5 text-xs text-slate-300">
            <div className="flex flex-wrap items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span>Last scan queried:</span>
              {lastSearchedRoles.map((r) => (
                <span
                  key={`${r.role}-${r.isPivot}`}
                  className={cn(
                    'rounded-md px-2 py-0.5 text-[11px] font-medium',
                    r.isPivot
                      ? 'bg-violet-500/15 text-violet-300'
                      : 'bg-emerald-500/15 text-emerald-300'
                  )}
                >
                  {r.role} {r.isPivot ? '(Dynamic Pivot)' : '(Primary)'}
                </span>
              ))}
            </div>
            {store.lastScannedAt && hydrated && (
              <span className="text-[11px] text-slate-500">
                Updated {new Date(store.lastScannedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        )}

        {scanError && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            {scanError}
          </div>
        )}

        {/* Filter & Search Toolbar */}
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { key: 'active', label: 'Inbox' },
                { key: 'saved', label: 'Saved' },
                { key: 'applied', label: 'Applied' },
                { key: 'hidden', label: 'Hidden' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs font-semibold transition',
                  statusFilter === tab.key
                    ? 'bg-white text-slate-950'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                )}
              >
                {tab.label}
              </button>
            ))}

            <div className="mx-1 h-5 w-px bg-slate-800" />

            {(
              [
                { key: 'all', label: 'All Boards' },
                { key: 'linkedin', label: 'LinkedIn' },
                { key: 'jobstreet', label: 'JobStreet' },
                { key: 'indeed', label: 'Indeed' },
              ] as const
            ).map((src) => (
              <button
                key={src.key}
                type="button"
                onClick={() => setSourceFilter(src.key)}
                className={cn(
                  'rounded-xl border px-2.5 py-1.5 text-xs font-medium transition',
                  sourceFilter === src.key
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                )}
              >
                {src.label}
              </button>
            ))}

            <select
              value={roleTypeFilter}
              onChange={(e) =>
                setRoleTypeFilter(e.target.value as 'all' | 'primary' | 'pivot')
              }
              className="rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">Primary + Pivot Roles</option>
              <option value="primary">Primary Role Only</option>
              <option value="pivot">Role Pivots Only</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by title, company, skill..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-8 pr-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-400">
              <Filter className="h-3.5 w-3.5" />
              <span>Min {minScore}%</span>
              <input
                type="range"
                min={0}
                max={85}
                step={5}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-20 accent-emerald-500"
              />
            </label>

            {store.jobs.length > 0 && (
              <button
                type="button"
                onClick={handleClearSuggested}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-300"
                title="Clear unsaved job inbox"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Inbox
              </button>
            )}
          </div>
        </section>

        {/* Job Results Feed */}
        <section className="space-y-3">
          {scanning && store.jobs.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-40 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/50 p-5"
                />
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-14 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-emerald-400" />
              <h3 className="mt-3 text-base font-semibold text-white">
                {store.jobs.length === 0
                  ? 'Ready to unleash PleaseHireMe'
                  : 'No jobs match your current filters'}
              </h3>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-400">
                {store.jobs.length === 0
                  ? `Click "Find Jobs Now" to scrape LinkedIn, JobStreet, and Indeed for ${store.profile.primaryRole} + dynamic skill-matched pivots.`
                  : 'Try lowering the minimum match score slider, switching status back to Inbox, or running a fresh scan.'}
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => void runJobScan()}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
                >
                  Scan LinkedIn, JobStreet & Indeed
                </button>
                {minScore > 0 && store.jobs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMinScore(0)}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200"
                  >
                    Reset Min Score
                  </button>
                )}
              </div>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onUpdateStatus={handleUpdateJobStatus}
              />
            ))
          )}
        </section>
      </main>

      <ProfilePanel
        isOpen={profileOpen}
        profile={store.profile}
        suggestedRoles={dynamicSuggestions}
        onClose={() => setProfileOpen(false)}
        onUpdateProfile={handleUpdateProfile}
        onApplyParsedResume={(nextProfile, roles) => {
          handleUpdateProfile(nextProfile);
          if (roles.length > 0 && !nextProfile.primaryRole) {
            handleApplyPrimaryRole(roles[0].role, false);
          }
        }}
      />
    </div>
  );
}

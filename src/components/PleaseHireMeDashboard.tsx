'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Activity,
  Award,
  BarChart3,
  Briefcase,
  Compass,
  FileText,
  Filter,
  Flame,
  HelpCircle,
  Home,
  Moon,
  RefreshCw,
  Search,
  Sparkles,
  Sun,
  Trash2,
  UserCheck,
  UserCircle2,
  Wallet,
} from 'lucide-react';
import {
  AppStoreState,
  AutoApplyConfig,
  COUNTRY_CONFIGS,
  JobListing,
  JobSource,
  JobStatus,
  ScanSourceMeta,
  StructuredResume,
  UserProfile,
} from '@/types/job';
import {
  createBlankUserProfile,
  resumeToPlainText,
} from '@/lib/default-profile';
import { scoreJobAgainstProfile } from '@/features/resume/lib/resume-analyzer';
import {
  fetchServerState,
  getActiveUser,
  getDefaultStoreState,
  loadLocalState,
  saveLocalState,
  syncStateToServer,
} from '@/lib/storage';
import { A4ResumePreview } from '@/features/resume/components/A4ResumePreview';
import { createDefaultAutoApplyConfig } from '@/features/auto-apply/types';
import { JobAnalyticsView } from '@/features/analytics/components/JobAnalyticsView';
import { ApplyFlowModal } from '@/features/jobs/components/ApplyFlowModal';
import { HowItWorksModal } from '@/features/jobs/components/HowItWorksModal';
import { JobDetailPane } from '@/features/jobs/components/JobDetailPane';
import { TopChoicesSpotlight } from '@/features/jobs/components/TopChoicesSpotlight';
import { LinkedInProfileView } from '@/features/profile/components/LinkedInProfileView';
import { LandingPageView } from '@/components/LandingPageView';
import { BoardLogo } from '@/components/ui/BrandLogos';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

export type ActiveTab = 'home' | 'jobs' | 'analytics' | 'profile' | 'resume';

const REFRESH_OPTIONS = [
  { label: 'Off', seconds: 0 },
  { label: '5s Live', seconds: 5 },
  { label: '15s', seconds: 15 },
  { label: '30s', seconds: 30 },
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

export function PleaseHireMeDashboard({
  initialTab = 'home',
}: {
  initialTab?: ActiveTab;
}) {
  const [hydrated, setHydrated] = useState(false);
  const [isDesktopApp, setIsDesktopApp] = useState(false);
  const [store, setStore] = useState<AppStoreState>(getDefaultStoreState);
  const [storageMode, setStorageMode] = useState<string>('browser-only');
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);

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
  const [autoRefreshSeconds, setAutoRefreshSeconds] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(5);

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [applyModalJob, setApplyModalJob] = useState<JobListing | null>(null);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  // Resume Studio state
  const [tailoredResume, setTailoredResume] = useState<StructuredResume | null>(
    null
  );
  const [tailoring, setTailoring] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'active' | JobStatus>('active');
  const [sourceFilter, setSourceFilter] = useState<'all' | JobSource>('all');
  const [fitFilter, setFitFilter] = useState<'all' | 'applicable'>('all');
  const [minScore, setMinScore] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleDraft, setRoleDraft] = useState('Data Analyst');

  const initialAutoScanRan = useRef(false);
  const scanInFlightRef = useRef(false);

  const activeProfile = useMemo(() => getActiveUser(store), [store]);
  const theme = store.theme;

  const queuedJobIds = useMemo(
    () => store.queuedJobIds || [],
    [store.queuedJobIds]
  );

  const autoApplyConfig = useMemo<AutoApplyConfig>(
    () =>
      store.autoApplyConfig || createDefaultAutoApplyConfig(activeProfile),
    [activeProfile, store.autoApplyConfig]
  );

  const persistStore = useCallback((next: AppStoreState) => {
    setStore(next);
    saveLocalState(next);
    void syncStateToServer(next).then((mode) => {
      if (mode) setStorageMode(mode);
    });
  }, []);

  const updateActiveUserProfile = useCallback(
    (nextProfile: UserProfile, rescore = true) => {
      setRoleDraft(nextProfile.primaryRole);
      setStore((prev) => {
        const nextUsers = prev.users.map((u) =>
          u.id === nextProfile.id ? nextProfile : u
        );
        const nextJobs = rescore
          ? rescoreJobsWithProfile(prev.jobs, nextProfile)
          : prev.jobs;
        const nextState: AppStoreState = {
          ...prev,
          users: nextUsers,
          jobs: nextJobs,
        };
        saveLocalState(nextState);
        void syncStateToServer(nextState);
        return nextState;
      });
    },
    []
  );

  const runJobScan = useCallback(
    async (overrideProfile?: UserProfile, explicitRoles?: string[]) => {
      if (scanInFlightRef.current) return;
      const targetProfile = overrideProfile || activeProfile;
      if (enabledSources.length === 0) {
        setScanError(
          'Enable at least one board (LinkedIn, JobStreet, or Indeed).'
        );
        return;
      }

      scanInFlightRef.current = true;
      setScanning(true);
      setScanError(null);

      try {
        const res = await fetch('/api/jobs/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile: targetProfile,
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
            users: prev.users.map((u) =>
              u.id === targetProfile.id ? targetProfile : u
            ),
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
        scanInFlightRef.current = false;
        setScanning(false);
      }
    },
    [activeProfile, enabledSources]
  );

  // Hydrate initial state + detect Electron Desktop host
  useEffect(() => {
    let active = true;

    async function hydrate() {
      const local = loadLocalState();
      const server = await fetchServerState();
      if (!active) return;

      setIsDesktopApp(
        Boolean(
          (window as unknown as { electronAPI?: { isDesktop?: boolean } })
            .electronAPI?.isDesktop
        )
      );
      setStorageMode(server.storageMode);
      const chosen =
        server.state && server.state.jobs.length >= local.jobs.length
          ? server.state
          : local;

      const user = getActiveUser(chosen);
      setStore(chosen);
      setRoleDraft(user.primaryRole);
      setHydrated(true);

      if (chosen.jobs.length === 0 && !initialAutoScanRan.current) {
        initialAutoScanRan.current = true;
        void runJobScan(user);
      }
    }

    void hydrate();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Non-overlapping 5s / 15s / 30s Live Auto-Refresh Loop
  useEffect(() => {
    if (autoRefreshSeconds <= 0) return;

    const timer = setInterval(() => {
      if (scanInFlightRef.current) return;
      setCountdown((prev) => {
        if (prev <= 1) {
          void runJobScan();
          return autoRefreshSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshSeconds, runJobScan]);

  const handleApplyPrimaryRole = (role: string, triggerScan = true) => {
    const clean = role.trim();
    if (!clean) return;
    const nextProfile: UserProfile = {
      ...activeProfile,
      primaryRole: clean,
      title: clean,
    };
    updateActiveUserProfile(nextProfile, true);
    if (triggerScan) {
      void runJobScan(nextProfile);
    }
  };

  const handleSelectUser = (userId: string) => {
    const target = store.users.find((u) => u.id === userId);
    if (!target) return;
    setTailoredResume(null);
    setRoleDraft(target.primaryRole);
    const rescored = rescoreJobsWithProfile(store.jobs, target);
    persistStore({
      ...store,
      activeUserId: target.id,
      jobs: rescored,
    });
  };

  const handleCreateUser = (payload: {
    name: string;
    email?: string;
    primaryRole: string;
    preferredRoles?: string[];
    location?: string;
  }) => {
    const created = createBlankUserProfile(payload);
    setTailoredResume(null);
    setRoleDraft(created.primaryRole);
    const rescored = rescoreJobsWithProfile(store.jobs, created);
    persistStore({
      ...store,
      users: [...store.users, created],
      activeUserId: created.id,
      jobs: rescored,
    });
  };

  const handleUpdateJobStatus = (jobId: string, status: JobStatus) => {
    const nextJobs = store.jobs.map((j) =>
      j.id === jobId ? { ...j, status } : j
    );
    persistStore({ ...store, jobs: nextJobs });
  };

  const handleToggleQueueJob = (jobId: string) => {
    const exists = queuedJobIds.includes(jobId);
    const nextQueue = exists
      ? queuedJobIds.filter((id) => id !== jobId)
      : [...queuedJobIds, jobId];
    persistStore({ ...store, queuedJobIds: nextQueue });
  };

  const handleAddSkillToProfile = (skill: string) => {
    const clean = skill.trim();
    if (!clean) return;
    const exists = activeProfile.skills.some(
      (s) => s.toLowerCase() === clean.toLowerCase()
    );
    if (exists) return;

    const nextSkills = [...activeProfile.skills, clean];
    const existingCats = activeProfile.structuredResume.skillCategories;
    const updatedCats =
      existingCats.length > 0
        ? existingCats.map((c, idx) =>
            idx === 0 ? { ...c, items: `${c.items}, ${clean}` } : c
          )
        : [{ category: 'Technical Skills', items: clean }];

    const nextStructured: StructuredResume = {
      ...activeProfile.structuredResume,
      skillCategories: updatedCats,
    };

    updateActiveUserProfile(
      {
        ...activeProfile,
        skills: nextSkills,
        structuredResume: nextStructured,
        resumeText: resumeToPlainText(nextStructured),
      },
      true
    );
  };

  const handleTailorInStudio = async (
    targetJob: JobListing | null,
    targetRole?: string
  ) => {
    setTailoring(true);
    try {
      const res = await fetch('/api/resume/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: activeProfile,
          targetJob,
          targetRole: targetRole || activeProfile.primaryRole,
          geminiApiKey: store.geminiApiKey || '',
        }),
      });
      const data = await res.json();
      if (res.ok && data.resume) {
        setTailoredResume(data.resume as StructuredResume);
      }
    } finally {
      setTailoring(false);
    }
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
      if (fitFilter === 'applicable' && job.experienceFit === 'senior-warning') {
        return false;
      }
      if (job.matchScore < minScore) return false;

      if (q) {
        const hay = `${job.title} ${job.company} ${job.location} ${job.searchedRole} ${job.experienceRequired} ${job.matchedSkills.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [
    fitFilter,
    minScore,
    searchQuery,
    sourceFilter,
    statusFilter,
    store.jobs,
  ]);

  // Top 3 Applicable Choices for the current user
  const top3Choices = useMemo(() => {
    const applicable = store.jobs.filter(
      (j) =>
        !j.isFallback &&
        j.status !== 'hidden' &&
        j.experienceFit !== 'senior-warning'
    );
    const pool =
      applicable.length >= 3
        ? applicable
        : store.jobs.filter((j) => !j.isFallback && j.status !== 'hidden');
    return pool.slice(0, 3);
  }, [store.jobs]);

  const handleQueueTopChoices = () => {
    const topIds = top3Choices.map((j) => j.id);
    const merged = Array.from(new Set([...queuedJobIds, ...topIds]));
    persistStore({ ...store, queuedJobIds: merged });
  };

  const selectedJob = useMemo(() => {
    if (filteredJobs.length === 0) return null;
    return (
      filteredJobs.find((j) => j.id === selectedJobId) || filteredJobs[0]
    );
  }, [filteredJobs, selectedJobId]);

  const activeJobsCount = useMemo(
    () => store.jobs.filter((j) => j.status !== 'hidden').length,
    [store.jobs]
  );

  const applicableJobsCount = useMemo(
    () =>
      store.jobs.filter(
        (j) => j.status !== 'hidden' && j.experienceFit !== 'senior-warning'
      ).length,
    [store.jobs]
  );

  // 3-Color Theme Tokens (Black / White / Orange #f97316)
  const {
    pageBg,
    navBg,
    cardSurface,
    subSurface,
    inputSurface,
    primaryBtn,
    secondaryBtn,
    orangeBadge,
    selectedCard,
    mutedText,
    navTrack,
    borderSubtle,
  } = getThemeTokens(theme);

  return (
    <div className={cn('min-h-screen transition-colors', pageBg)}>
      {/* Top Navbar */}
      <header className={cn('no-print sticky top-0 z-30 border-b backdrop-blur-md', navBg)}>
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 text-left transition hover:opacity-90"
            title="Go to Pa-Hire Po Landing Page"
          >
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-orange-500/50 bg-white shadow-sm">
              <Image
                src="/pa-hire-po-logo.jpg"
                alt="Pa-Hire Po Logo"
                fill
                sizes="40px"
                className="object-cover"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight">
                  Pa-Hire <span className="text-orange-500">Po</span>
                </h1>
                <span
                  className={cn(
                    'hidden sm:inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                    orangeBadge
                  )}
                >
                  JobStreet × LinkedIn
                </span>
                <span
                  className={cn(
                    'hidden xl:inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                    secondaryBtn
                  )}
                >
                  {isDesktopApp ? 'Electron Desktop' : 'Web + Desktop Ready'}
                </span>
              </div>
              <p className={cn('hidden md:block text-[11px]', mutedText)}>
                {activeProfile.name} • {activeProfile.primaryRole}
              </p>
            </div>
          </button>

          {/* Primary Navigation Tabs */}
          <nav
            className={cn(
              'inline-flex flex-wrap rounded-xl border p-0.5',
              navTrack
            )}
          >
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition',
                activeTab === 'home' ? primaryBtn : mutedText
              )}
            >
              <Home className="h-3.5 w-3.5" />
              Home
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('jobs')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition',
                activeTab === 'jobs' ? primaryBtn : mutedText
              )}
            >
              <Briefcase className="h-3.5 w-3.5" />
              Find Jobs
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition',
                activeTab === 'analytics' ? primaryBtn : mutedText
              )}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics
              {hydrated && activeJobsCount > 0 && (
                <span className="rounded px-1 text-[10px] font-extrabold opacity-80">
                  ({activeJobsCount})
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition',
                activeTab === 'profile' ? primaryBtn : mutedText
              )}
            >
              <UserCircle2 className="h-3.5 w-3.5" />
              My Profile
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('resume')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition',
                activeTab === 'resume' ? primaryBtn : mutedText
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              A4 Resume
            </button>
          </nav>

          {/* Utility Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setHowItWorksOpen(true)}
              className={cn(
                'inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-semibold',
                secondaryBtn
              )}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">How It Works</span>
            </button>

            <div className="flex items-center gap-1">
              <UserCheck className={cn('h-3.5 w-3.5', mutedText)} />
              <select
                value={activeProfile.id}
                onChange={(e) => handleSelectUser(e.target.value)}
                aria-label="Switch user profile"
                className={cn(
                  'rounded-xl border px-2.5 py-1.5 text-xs font-semibold focus:outline-none',
                  inputSurface
                )}
              >
                {store.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3-Color Theme Variant Switcher (Dark | Light | Orange) */}
            <div
              className={cn('inline-flex items-center rounded-xl border p-0.5', navTrack)}
              role="group"
              aria-label="Theme color variant switcher"
            >
              {(
                [
                  { id: 'dark', label: 'Dark', icon: Moon, title: 'Black + Orange Theme' },
                  { id: 'light', label: 'Light', icon: Sun, title: 'White + Orange Theme' },
                  { id: 'orange', label: 'Orange', icon: Flame, title: 'Warm Orange Studio Theme' },
                ] as const
              ).map((opt) => {
                const Icon = opt.icon;
                const active = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      persistStore({
                        ...store,
                        theme: opt.id,
                      })
                    }
                    className={cn(
                      'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition',
                      active ? primaryBtn : mutedText
                    )}
                    title={opt.title}
                  >
                    <Icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6">
        {/* TAB 0: WEB & DESKTOP APP LANDING PAGE */}
        {activeTab === 'home' && (
          <LandingPageView
            theme={theme}
            onChangeTheme={(nextTheme) =>
              persistStore({
                ...store,
                theme: nextTheme,
              })
            }
            activeProfile={activeProfile}
            totalJobsCount={activeJobsCount}
            applicableJobsCount={applicableJobsCount}
            queuedCount={queuedJobIds.length}
            isDesktopApp={isDesktopApp}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onSelectBoardAndLaunch={(board) => {
              setSourceFilter(board);
              setStatusFilter('active');
              setActiveTab('jobs');
            }}
          />
        )}

        {/* TAB 1: JOBSTREET-INSPIRED FIND JOBS VIEW */}
        {activeTab === 'jobs' && (
          <div className="no-print space-y-5">
            {/* JobStreet-Style Search Banner */}
            <section className={cn('space-y-3.5 rounded-3xl border p-4 sm:p-5', cardSurface)}>
              <div className="grid gap-2.5 lg:grid-cols-12">
                {/* WHAT */}
                <div className="lg:col-span-5">
                  <label className={cn('mb-1 block text-[11px] font-bold uppercase tracking-wider', mutedText)}>
                    What role are you looking for?
                  </label>
                  <div className="relative">
                    <Search className={cn('pointer-events-none absolute left-3 top-2.5 h-4 w-4', mutedText)} />
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
                      placeholder="Data Analyst, BI Analyst, Junior Data Engineer..."
                      className={cn('w-full rounded-xl border py-2 pl-9 pr-3 text-xs font-medium focus:outline-none', inputSurface)}
                    />
                  </div>
                </div>

                {/* WHERE */}
                <div className="lg:col-span-4">
                  <label className={cn('mb-1 block text-[11px] font-bold uppercase tracking-wider', mutedText)}>
                    Where
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={activeProfile.country}
                      onChange={(e) => {
                        const code = e.target.value as keyof typeof COUNTRY_CONFIGS;
                        updateActiveUserProfile({
                          ...activeProfile,
                          country: code,
                          location: COUNTRY_CONFIGS[code].defaultLocation,
                        });
                      }}
                      className={cn('rounded-xl border px-2.5 py-2 text-xs font-medium focus:outline-none', inputSurface)}
                    >
                      {Object.values(COUNTRY_CONFIGS).map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={activeProfile.location}
                      onChange={(e) =>
                        updateActiveUserProfile({
                          ...activeProfile,
                          location: e.target.value,
                        })
                      }
                      placeholder="Taguig City, Metro Manila"
                      className={cn('min-w-0 flex-1 rounded-xl border px-3 py-2 text-xs focus:outline-none', inputSurface)}
                    />
                  </div>
                </div>

                {/* MANUAL + 5s AUTO-REFRESH CONTROLS */}
                <div className="flex flex-col justify-end lg:col-span-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={scanning}
                      onClick={() => handleApplyPrimaryRole(roleDraft, true)}
                      className={cn(
                        'inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition disabled:opacity-60',
                        primaryBtn
                      )}
                    >
                      <RefreshCw className={cn('h-3.5 w-3.5', scanning && 'animate-spin')} />
                      {scanning ? 'Finding...' : 'Find Jobs Now'}
                    </button>

                    <div className={cn('inline-flex items-center rounded-xl border p-0.5', subSurface)}>
                      {REFRESH_OPTIONS.map((opt) => {
                        const active = autoRefreshSeconds === opt.seconds;
                        return (
                          <button
                            key={opt.seconds}
                            type="button"
                            onClick={() => {
                              setAutoRefreshSeconds(opt.seconds);
                              setCountdown(opt.seconds || 5);
                            }}
                            className={cn(
                              'rounded-lg px-2 py-1.5 text-[10px] font-bold transition',
                              active ? primaryBtn : mutedText
                            )}
                            title={
                              opt.seconds === 0
                                ? 'Manual refresh only'
                                : `Auto-refresh every ${opt.seconds} seconds`
                            }
                          >
                            {opt.seconds > 0 && active
                              ? `${countdown}s`
                              : opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Desired Role Quick Chips + Board Logo Statuses */}
              <div className={cn('flex flex-col gap-3 border-t pt-3 lg:flex-row lg:items-center lg:justify-between', borderSubtle)}>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={cn('mr-1 text-[11px] font-bold uppercase tracking-wider', mutedText)}>
                    Your Role Choices:
                  </span>
                  {activeProfile.preferredRoles.map((role) => {
                    const isCurrent =
                      role.toLowerCase() === activeProfile.primaryRole.toLowerCase();
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleApplyPrimaryRole(role, true)}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs font-semibold transition',
                          isCurrent ? primaryBtn : secondaryBtn
                        )}
                      >
                        {role}
                      </button>
                    );
                  })}

                  <label className={cn('ml-2 inline-flex cursor-pointer items-center gap-1.5 text-[11px]', mutedText)}>
                    <input
                      type="checkbox"
                      checked={activeProfile.autoPivotRoles}
                      onChange={(e) =>
                        updateActiveUserProfile({
                          ...activeProfile,
                          autoPivotRoles: e.target.checked,
                        })
                      }
                      className="h-3.5 w-3.5 accent-orange-500"
                    />
                    Pivot Mode
                  </label>
                </div>

                {/* Official Board Logos + Live Counts */}
                <div className="flex flex-wrap items-center gap-2">
                  {(['linkedin', 'jobstreet', 'indeed'] as JobSource[]).map((board) => {
                    const enabled = enabledSources.includes(board);
                    const meta = boardMeta.find((m) => m.source === board);
                    return (
                      <button
                        key={board}
                        type="button"
                        onClick={() => toggleSource(board)}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-xl border px-2.5 py-1 text-xs transition',
                          enabled ? secondaryBtn : 'border-neutral-800 opacity-45'
                        )}
                        title="Toggle searching this board"
                      >
                        <BoardLogo source={board} theme={theme} size="sm" />
                        {meta && (
                          <span
                            className={cn(
                              'rounded px-1.5 py-0.5 text-[10px] font-bold',
                              meta.status === 'live' ? primaryBtn : subSurface
                            )}
                          >
                            {meta.count} {meta.status}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {(lastSearchedRoles.length > 0 || autoRefreshSeconds > 0) && (
                <div className={cn('flex flex-wrap items-center justify-between gap-2 text-[11px]', mutedText)}>
                  <span className="inline-flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" />
                    Last queried:{' '}
                    {lastSearchedRoles
                      .map((r) => `${r.role}${r.isPivot ? ' (Pivot)' : ''}`)
                      .join(' • ')}
                    {autoRefreshSeconds > 0 && (
                      <strong className="ml-2">
                        • Auto-refreshing every {autoRefreshSeconds}s (next in {countdown}s)
                      </strong>
                    )}
                  </span>
                  {store.lastScannedAt && hydrated && (
                    <span>
                      Updated {new Date(store.lastScannedAt).toLocaleTimeString()} • {storageMode === 'local-file' ? 'Local + Browser' : 'Browser'}
                    </span>
                  )}
                </div>
              )}

              {scanError && (
                <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {scanError}
                </p>
              )}
            </section>

            {/* TOP 3 APPLICABLE CHOICES SPOTLIGHT */}
            <TopChoicesSpotlight
              choices={top3Choices}
              selectedJobId={selectedJob?.id || null}
              activeProfileName={activeProfile.name}
              experienceLevel={activeProfile.experienceLevel}
              theme={theme}
              queuedJobIds={queuedJobIds}
              onSelectJob={(id) => setSelectedJobId(id)}
              onOpenApplyModal={(job) => setApplyModalJob(job)}
              onToggleQueueJob={handleToggleQueueJob}
            />

            {/* FILTER BAR */}
            <section className={cn('flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border p-3', cardSurface)}>
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { key: 'active', label: 'All Active' },
                    { key: 'saved', label: 'Saved' },
                    { key: 'applied', label: 'Applied' },
                    { key: 'hidden', label: 'Hidden' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setStatusFilter(t.key)}
                    className={cn(
                      'rounded-lg border px-2.5 py-1 text-xs font-semibold',
                      statusFilter === t.key ? primaryBtn : secondaryBtn
                    )}
                  >
                    {t.label}
                  </button>
                ))}

                <div className="mx-1 h-4 w-px bg-neutral-700/40" />

                <button
                  type="button"
                  onClick={() => setSourceFilter('all')}
                  className={cn(
                    'rounded-lg border px-2.5 py-1 text-xs font-semibold',
                    sourceFilter === 'all' ? primaryBtn : secondaryBtn
                  )}
                >
                  All Sites ({store.jobs.length})
                </button>
                {(['linkedin', 'jobstreet', 'indeed'] as JobSource[]).map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setSourceFilter(src)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold',
                      sourceFilter === src ? primaryBtn : secondaryBtn
                    )}
                  >
                    <BoardLogo source={src} theme={theme} size="sm" />
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setFitFilter((f) => (f === 'all' ? 'applicable' : 'all'))
                  }
                  className={cn(
                    'rounded-lg border px-2.5 py-1 text-xs font-semibold',
                    fitFilter === 'applicable' ? primaryBtn : secondaryBtn
                  )}
                >
                  {fitFilter === 'applicable'
                    ? '✓ Applicable Exp Only'
                    : 'Filter: Entry/Applicable Exp'}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className={cn('pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5', mutedText)} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter results..."
                    className={cn('w-44 rounded-xl border py-1.5 pl-8 pr-3 text-xs focus:outline-none', inputSurface)}
                  />
                </div>

                <label className={cn('flex items-center gap-1.5 text-xs', mutedText)}>
                  <Filter className="h-3.5 w-3.5" />
                  <span>Min {minScore}%</span>
                  <input
                    type="range"
                    min={0}
                    max={80}
                    step={5}
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                    className="w-20 accent-orange-500"
                  />
                </label>

                {store.jobs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const kept = store.jobs.filter(
                        (j) => j.status === 'saved' || j.status === 'applied'
                      );
                      persistStore({ ...store, jobs: kept });
                    }}
                    className={cn('inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs', secondaryBtn)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear
                  </button>
                )}
              </div>
            </section>

            {/* JOBSTREET 2-COLUMN MASTER-DETAIL EXPLORER */}
            <section className="grid items-start gap-5 lg:grid-cols-12">
              {/* LEFT COLUMN: JOB LIST */}
              <div className="space-y-2.5 lg:col-span-5">
                {scanning && store.jobs.length === 0 ? (
                  <div className="space-y-2.5">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className={cn('h-32 animate-pulse rounded-2xl border p-4', cardSurface)}
                      />
                    ))}
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div className={cn('space-y-3 rounded-2xl border border-dashed p-10 text-center', cardSurface)}>
                    <Sparkles className="mx-auto h-7 w-7" />
                    <p className="text-sm font-bold">No matching jobs yet</p>
                    <p className={cn('text-xs', mutedText)}>
                      Click &ldquo;Find Jobs Now&rdquo; to scrape LinkedIn, JobStreet, and Indeed.
                    </p>
                    <button
                      type="button"
                      onClick={() => void runJobScan()}
                      className={cn('rounded-xl px-4 py-2 text-xs font-bold', primaryBtn)}
                    >
                      Find Jobs Now
                    </button>
                  </div>
                ) : (
                  filteredJobs.map((job) => {
                    const isSelected = selectedJob?.id === job.id;
                    return (
                      <article
                        key={job.id}
                        onClick={() => setSelectedJobId(job.id)}
                        className={cn(
                          'cursor-pointer space-y-2.5 rounded-2xl border p-4 transition-all',
                          isSelected ? selectedCard : cardSurface
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <BoardLogo source={job.source} theme={theme} size="sm" />
                            {job.isPivotSuggestion && (
                              <span className={cn('inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold', secondaryBtn)}>
                                <Compass className="h-2.5 w-2.5" />
                                Pivot
                              </span>
                            )}
                            {job.status === 'applied' && (
                              <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold uppercase', primaryBtn)}>
                                Applied
                              </span>
                            )}
                          </div>
                          <span className={cn('rounded-md px-2 py-0.5 text-xs font-extrabold tabular-nums', primaryBtn)}>
                            {job.matchScore}%
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm font-bold leading-snug">{job.title}</h3>
                          <p className={cn('mt-0.5 text-xs font-medium', mutedText)}>
                            {job.company} • {job.location}
                          </p>
                        </div>

                        {/* Emphasized Experience Needed Pill */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-bold',
                              job.experienceFit === 'senior-warning'
                                ? 'border-dashed border-neutral-500 opacity-75'
                                : secondaryBtn
                            )}
                          >
                            <Award className="h-3 w-3" />
                            Exp Needed: {job.experienceRequired}
                          </span>
                          {job.salary && (
                            <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold', mutedText)}>
                              <Wallet className="h-3 w-3" />
                              {job.salary}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex flex-wrap gap-1">
                            {job.matchedSkills.slice(0, 3).map((s) => (
                              <span
                                key={s}
                                className={cn('rounded border px-1.5 py-0.5 text-[10px] font-semibold', subSurface)}
                              >
                                ✓ {s}
                              </span>
                            ))}
                          </div>
                          <span className={cn('text-[10px]', mutedText)}>
                            {job.postedAt}
                          </span>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>

              {/* RIGHT COLUMN: STICKY JOBSTREET-STYLE JOB DETAILS PANE */}
              <div className="lg:sticky lg:top-20 lg:col-span-7">
                <JobDetailPane
                  job={selectedJob}
                  activeProfileName={activeProfile.name}
                  theme={theme}
                  isQueued={
                    selectedJob ? queuedJobIds.includes(selectedJob.id) : false
                  }
                  onOpenApplyModal={(job) => setApplyModalJob(job)}
                  onToggleQueueJob={handleToggleQueueJob}
                  onUpdateStatus={handleUpdateJobStatus}
                />
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: JOB BOARD ANALYTICS & AUTO-APPLY BLUEPRINT */}
        {activeTab === 'analytics' && (
          <JobAnalyticsView
            jobs={store.jobs}
            boardMeta={boardMeta}
            activeProfile={activeProfile}
            theme={theme}
            queuedJobIds={queuedJobIds}
            autoApplyConfig={autoApplyConfig}
            isDesktopApp={isDesktopApp}
            scanning={scanning}
            onTriggerScan={() => void runJobScan()}
            onUpdateAutoApplyConfig={(next) =>
              persistStore({ ...store, autoApplyConfig: next })
            }
            onToggleQueueJob={handleToggleQueueJob}
            onQueueTopChoices={handleQueueTopChoices}
            onSelectBoardFilter={(board) => {
              setSourceFilter(board);
              setStatusFilter('active');
              setActiveTab('jobs');
            }}
            onOpenJobInExplorer={(jobId) => {
              setSelectedJobId(jobId);
              setSourceFilter('all');
              setStatusFilter('active');
              setActiveTab('jobs');
            }}
            onOpenApplyModal={(job) => setApplyModalJob(job)}
            onAddSkillToProfile={handleAddSkillToProfile}
          />
        )}

        {/* TAB 3: LINKEDIN-STYLE PROFILE VIEW (SYNCED 2-WAY WITH A4 RESUME) */}
        {activeTab === 'profile' && (
          <LinkedInProfileView
            users={store.users}
            profile={activeProfile}
            theme={store.theme}
            geminiApiKey={store.geminiApiKey || ''}
            onSelectUser={handleSelectUser}
            onCreateUser={handleCreateUser}
            onUpdateGeminiKey={(key) =>
              persistStore({ ...store, geminiApiKey: key })
            }
            onUpdateProfile={(next) => updateActiveUserProfile(next, true)}
            onOpenA4Studio={() => setActiveTab('resume')}
          />
        )}

        {/* TAB 4: FULL A4 RESUME STUDIO */}
        {activeTab === 'resume' && (
          <div className="mx-auto max-w-4xl">
            <A4ResumePreview
              profile={activeProfile}
              activeResume={tailoredResume || activeProfile.structuredResume}
              activeTailorJob={selectedJob}
              theme={store.theme}
              geminiApiKey={store.geminiApiKey || ''}
              tailoring={tailoring}
              onUpdateGeminiKey={(key) =>
                persistStore({ ...store, geminiApiKey: key })
              }
              onTailorResume={(job, role) => void handleTailorInStudio(job, role)}
              onUpdateResume={(nextResume) => {
                setTailoredResume(nextResume);
                if (nextResume.tailorMethod === 'base') {
                  updateActiveUserProfile({
                    ...activeProfile,
                    structuredResume: nextResume,
                    resumeText: resumeToPlainText(nextResume),
                  });
                }
              }}
              onResetResume={() => setTailoredResume(null)}
            />
          </div>
        )}
      </main>

      {/* STEP-BY-STEP APPLY & A4 RESUME TAILOR MODAL */}
      <ApplyFlowModal
        key={applyModalJob?.id || 'closed'}
        job={applyModalJob}
        profile={activeProfile}
        theme={store.theme}
        geminiApiKey={store.geminiApiKey || ''}
        onClose={() => setApplyModalJob(null)}
        onMarkApplied={(id) => handleUpdateJobStatus(id, 'applied')}
        onUpdateGeminiKey={(key) =>
          persistStore({ ...store, geminiApiKey: key })
        }
      />

      {/* HOW JOB FINDING WORKS MODAL */}
      <HowItWorksModal
        isOpen={howItWorksOpen}
        theme={store.theme}
        onClose={() => setHowItWorksOpen(false)}
      />
    </div>
  );
}

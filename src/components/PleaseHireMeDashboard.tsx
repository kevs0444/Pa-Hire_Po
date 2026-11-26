'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpDown,
  Briefcase,
} from 'lucide-react';
import {
  ActiveTab,
  AppStoreState,
  ApplicationStage,
  AuthSessionUser,
  AutoApplyConfig,
  COUNTRY_CONFIGS,
  DateFilterOption,
  JobListing,
  JobSortOption,
  JobSource,
  JobStatus,
  RecentJobSearch,
  SavedJobSearch,
  ScanSourceMeta,
  StructuredResume,
  TailoredResumeRecord,
  UserProfile,
} from '@/types/job';
import { sortJobs } from '@/features/jobs/lib/job-date-utils';
import {
  applyBannerFilters,
  buildAppliedRoleKeys,
  DEFAULT_PAY_FILTER,
  isJobNewToMe,
  isJobSaved,
  PayFilterConfig,
} from '@/features/jobs/lib/job-filters';
import {
  createBlankUserProfile,
  resumeToPlainText,
} from '@/lib/default-profile';
import { scoreJobAgainstProfile } from '@/features/resume/lib/resume-analyzer';
import {
  clearLegacyUnscopedLocalState,
  fetchServerState,
  getActiveUser,
  getDefaultStoreState,
  loadLocalState,
  patchPendingSyncJob,
  saveLocalState,
  saveLocalStateDebounced,
  syncSingleJobToServer,
  syncStateToServer,
} from '@/lib/storage';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { A4ResumePreview } from '@/features/resume/components/A4ResumePreview';
import type { ResumeUploadConfirmOptions } from '@/features/resume/components/ResumeUploadDialog';
import {
  buildSmartProfilePatchFromResume,
  type ParsedResumePayload,
} from '@/features/resume/lib/resume-parser';
import { AdminDashboardView } from '@/features/admin/components/AdminDashboardView';
import { createDefaultAutoApplyConfig } from '@/features/auto-apply/types';
import { JobAnalyticsView } from '@/features/analytics/components/JobAnalyticsView';
import { ApplyFlowModal } from '@/features/jobs/components/ApplyFlowModal';
import { DiscoveryJobCard } from '@/features/jobs/components/DiscoveryJobCard';
import { HowItWorksModal } from '@/features/jobs/components/HowItWorksModal';
import { JobDetailPane } from '@/features/jobs/components/JobDetailPane';
import { JobDiscoveryFeed } from '@/features/jobs/components/JobDiscoveryFeed';
import { JobSearchBanner } from '@/features/jobs/components/JobSearchBanner';
import { SavedSearchesDialog } from '@/features/jobs/components/SavedSearchesDialog';
import { LinkedInProfileView } from '@/features/profile/components/LinkedInProfileView';
import { ApplicationsCompilationView } from '@/features/applications/components/ApplicationsCompilationView';
import {
  SettingsSection,
  SettingsSidepanel,
} from '@/features/settings/components/SettingsSidepanel';
import { ChangelogModal } from '@/features/changelog/components/ChangelogModal';
import {
  CHANGELOG_SEEN_STORAGE_KEY,
  LATEST_CHANGELOG_RELEASE,
} from '@/features/changelog/data/changelog-data';
import type { ActivityNotification } from '@/features/notifications/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AppTopNavbar } from '@/components/layout/AppTopNavbar';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

export type { ActiveTab };

const AUTO_REFRESH_INTERVAL_SECONDS = 60;

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
      savedAt: existing.savedAt ?? null,
      appliedAt: existing.appliedAt ?? null,
      hiddenAt: existing.hiddenAt ?? null,
      applicationStage: existing.applicationStage || 'applied',
      applicationNotes: existing.applicationNotes || '',
      tailoredResumeId: existing.tailoredResumeId ?? null,
      statusUpdatedAt: existing.statusUpdatedAt ?? null,
    };
  });
}

async function yieldToMainThread(): Promise<void> {
  if (
    typeof window !== 'undefined' &&
    'scheduler' in window &&
    typeof (window as unknown as { scheduler?: { yield?: () => Promise<void> } })
      .scheduler?.yield === 'function'
  ) {
    await (
      window as unknown as { scheduler: { yield: () => Promise<void> } }
    ).scheduler.yield();
    return;
  }
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

async function rescoreJobsAsync(
  jobs: JobListing[],
  profile: UserProfile,
  signal: { cancelled: boolean }
): Promise<JobListing[] | null> {
  const output: JobListing[] = new Array(jobs.length);
  let deadline =
    typeof performance !== 'undefined' ? performance.now() + 50 : Infinity;

  for (let i = 0; i < jobs.length; i++) {
    if (signal.cancelled) return null;
    const existing = jobs[i];
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

    output[i] = {
      ...rescored,
      id: existing.id,
      status: existing.status,
      discoveredAt: existing.discoveredAt,
      savedAt: existing.savedAt ?? null,
      appliedAt: existing.appliedAt ?? null,
      hiddenAt: existing.hiddenAt ?? null,
      applicationStage: existing.applicationStage || 'applied',
      applicationNotes: existing.applicationNotes || '',
      tailoredResumeId: existing.tailoredResumeId ?? null,
      statusUpdatedAt: existing.statusUpdatedAt ?? null,
    };

    if (
      typeof performance !== 'undefined' &&
      performance.now() >= deadline &&
      i < jobs.length - 1
    ) {
      await yieldToMainThread();
      deadline = performance.now() + 50;
    }
  }

  return signal.cancelled ? null : output;
}

export function PleaseHireMeDashboard({
  initialTab = 'home',
}: {
  initialTab?: ActiveTab;
}) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [clientNow, setClientNow] = useState<number | null>(null);
  const [isDesktopApp, setIsDesktopApp] = useState(false);
  const [store, setStore] = useState<AppStoreState>(getDefaultStoreState);
  const [authUser, setAuthUser] = useState<AuthSessionUser | null>(null);
  const [adminUserCount, setAdminUserCount] = useState<number | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [storageMode, setStorageMode] = useState<string>('browser-only');
  const [personalApiConfigured, setPersonalApiConfigured] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);

  const [enabledSources, setEnabledSources] = useState<JobSource[]>([
    'linkedin',
    'jobstreet',
    'indeed',
  ]);
  const [boardMeta, setBoardMeta] = useState<ScanSourceMeta[]>([]);

  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [savedSearchesOpen, setSavedSearchesOpen] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [payFilter, setPayFilter] = useState<PayFilterConfig>(DEFAULT_PAY_FILTER);
  const [jobTypeFilters, setJobTypeFilters] = useState<string[]>([]);
  const [remoteFilters, setRemoteFilters] = useState<string[]>([]);
  const [classificationFilters, setClassificationFilters] = useState<string[]>([]);
  const [applicationsSubView, setApplicationsSubView] = useState<{
    view: 'applied' | 'saved' | 'hidden' | 'resumes';
    seq: number;
  }>({ view: 'applied', seq: 0 });
  const [countdown, setCountdown] = useState<number>(AUTO_REFRESH_INTERVAL_SECONDS);

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [applyModalJob, setApplyModalJob] = useState<JobListing | null>(null);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] =
    useState<SettingsSection>('personal');
  const [dbSyncCount, setDbSyncCount] = useState(0);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [notifications, setNotifications] = useState<ActivityNotification[]>([
    {
      id: `release-${LATEST_CHANGELOG_RELEASE.version}`,
      kind: 'release',
      title: `What is New (${LATEST_CHANGELOG_RELEASE.version})`,
      detail: LATEST_CHANGELOG_RELEASE.headline,
      createdAt: LATEST_CHANGELOG_RELEASE.isoDate,
      read: false,
    },
  ]);

  const markChangelogSeen = useCallback(() => {
    try {
      window.localStorage.setItem(
        CHANGELOG_SEEN_STORAGE_KEY,
        LATEST_CHANGELOG_RELEASE.version
      );
    } catch {
      // Ignore storage restriction
    }
    setNotifications((prev) =>
      prev.map((n) => (n.kind === 'release' ? { ...n, read: true } : n))
    );
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const seen = window.localStorage.getItem(CHANGELOG_SEEN_STORAGE_KEY);
        if (seen === LATEST_CHANGELOG_RELEASE.version) {
          setNotifications((prev) =>
            prev.map((n) => (n.kind === 'release' ? { ...n, read: true } : n))
          );
        }
      } catch {
        // Ignore storage restriction
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Resume Compilation state
  const [resumeRecords, setResumeRecords] = useState<TailoredResumeRecord[]>(
    []
  );
  const [loadingResumes, setLoadingResumes] = useState(false);

  // Resume Studio state
  const [tailoredResume, setTailoredResume] = useState<StructuredResume | null>(
    null
  );
  const [tailoring, setTailoring] = useState(false);

  // Filters & Sorting
  const [statusFilter, setStatusFilter] = useState<'active' | JobStatus>('active');
  const [sourceFilter, setSourceFilter] = useState<'all' | JobSource>('all');
  const [fitFilter, setFitFilter] = useState<'all' | 'applicable'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [sortBy, setSortBy] = useState<JobSortOption>('match');
  const [minScore, setMinScore] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleDraft, setRoleDraft] = useState('Data Analyst / Junior Data Analyst');
  const [companyDraft, setCompanyDraft] = useState('');
  const [activeSearchMeta, setActiveSearchMeta] = useState<{
    role: string;
    company: string;
  }>({ role: '', company: '' });

  const initialAutoScanRan = useRef(false);
  const scanInFlightRef = useRef(false);
  const countdownRef = useRef<number>(AUTO_REFRESH_INTERVAL_SECONDS);
  const activeTabRef = useRef<ActiveTab>(initialTab);
  const activeRescoreSignalRef = useRef<{ cancelled: boolean } | null>(null);
  const authUserIdRef = useRef<string | null>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const storeRef = useRef<AppStoreState>(store);
  const activeSearchMetaRef = useRef(activeSearchMeta);

  useEffect(() => {
    storeRef.current = store;
  }, [store]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    activeSearchMetaRef.current = activeSearchMeta;
  }, [activeSearchMeta]);

  const handleSelectTab = useCallback((nextTab: ActiveTab) => {
    if (nextTab === 'jobs' || nextTab === 'home') {
      setCountdown(countdownRef.current);
    }
    if (nextTab === 'applications') {
      setApplicationsSubView((prev) => ({ view: 'applied', seq: prev.seq + 1 }));
    }
    setActiveTab(nextTab);
  }, []);

  const pushNotification = useCallback(
    (
      entry: Omit<ActivityNotification, 'id' | 'createdAt' | 'read'>,
      broadcast = true
    ) => {
      const nextItem: ActivityNotification = {
        ...entry,
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [nextItem, ...prev].slice(0, 30));
      if (broadcast && broadcastRef.current) {
        try {
          broadcastRef.current.postMessage({ type: 'notification', item: nextItem });
        } catch {
          // Ignore closed channel
        }
      }
    },
    []
  );

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

  const persistStore = useCallback(
    (
      next: AppStoreState,
      syncScope: 'full' | 'profile-only' = 'full',
      options?: { immediate?: boolean }
    ) => {
      storeRef.current = next;
      setStore(next);
      saveLocalState(next, authUserIdRef.current);
      setDbSyncCount((c) => c + 1);
      void syncStateToServer(next, syncScope, options)
        .then((mode) => {
          if (mode) setStorageMode(mode);
        })
        .finally(() => {
          setDbSyncCount((c) => Math.max(0, c - 1));
        });
    },
    []
  );

  const loadResumeHistory = useCallback(async () => {
    setLoadingResumes(true);
    try {
      const res = await fetch('/api/resumes/history', { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as {
          records?: TailoredResumeRecord[];
        };
        if (Array.isArray(data.records)) {
          setResumeRecords(data.records);
        }
      }
    } catch {
      // Ignore transient load error
    } finally {
      setLoadingResumes(false);
    }
  }, []);

  const updateActiveUserProfile = useCallback(
    (nextProfile: UserProfile, rescore = false) => {
      setRoleDraft((prevRole) =>
        prevRole === nextProfile.primaryRole
          ? prevRole
          : nextProfile.primaryRole
      );
      const prev = storeRef.current;
      const nextUsers = prev.users.map((u) =>
        u.id === nextProfile.id ? nextProfile : u
      );
      const nextState: AppStoreState = {
        ...prev,
        users: nextUsers,
      };
      storeRef.current = nextState;
      setStore(nextState);
      saveLocalStateDebounced(nextState, authUserIdRef.current);
      void syncStateToServer(nextState, rescore ? 'full' : 'profile-only');

      if (rescore && prev.jobs.length > 0) {
        if (activeRescoreSignalRef.current) {
          activeRescoreSignalRef.current.cancelled = true;
        }
        const signal = { cancelled: false };
        activeRescoreSignalRef.current = signal;
        void rescoreJobsAsync(prev.jobs, nextProfile, signal).then(
          (rescoredJobs) => {
            if (!rescoredJobs || signal.cancelled) return;
            const latest = storeRef.current;
            const rescoredState: AppStoreState = {
              ...latest,
              jobs: rescoredJobs,
            };
            storeRef.current = rescoredState;
            setStore(rescoredState);
            saveLocalStateDebounced(rescoredState, authUserIdRef.current);
            void syncStateToServer(rescoredState, 'full');
          }
        );
      }
    },
    []
  );

  const runJobScan = useCallback(
    async (
      overrideProfile?: UserProfile,
      explicitRoles?: string[],
      options?: {
        companyQuery?: string;
        replaceUnsavedSuggestions?: boolean;
        forceRefresh?: boolean;
      }
    ) => {
      if (scanInFlightRef.current) return;
      const targetProfile = overrideProfile || getActiveUser(storeRef.current);
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
            companyQuery: options?.companyQuery || undefined,
            sources: enabledSources,
            forceRefresh: Boolean(options?.forceRefresh),
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

        // Read latest state from storeRef AFTER await so any Save/Applied/Hidden clicks
        // made while the scrape was in-flight are strictly preserved.
        const prev = storeRef.current;
        const queuedSet = new Set(prev.queuedJobIds || []);
        const baseJobs = options?.replaceUnsavedSuggestions
          ? prev.jobs.filter(
              (j) =>
                j.status === 'saved' ||
                j.status === 'applied' ||
                j.status === 'hidden' ||
                queuedSet.has(j.id)
            )
          : prev.jobs;

        const existingById = new Map(baseJobs.map((j) => [j.id, j]));
        let newAdded = 0;

        for (const item of incoming) {
          const old = existingById.get(item.id);
          if (old) {
            existingById.set(item.id, {
              ...item,
              status: old.status,
              discoveredAt: old.discoveredAt,
              savedAt: old.savedAt ?? null,
              appliedAt: old.appliedAt ?? null,
              hiddenAt: old.hiddenAt ?? null,
              applicationStage: old.applicationStage || 'applied',
              applicationNotes: old.applicationNotes || '',
              tailoredResumeId: old.tailoredResumeId ?? null,
              statusUpdatedAt: old.statusUpdatedAt ?? null,
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
        const currentStoredUser =
          prev.users.find((u) => u.id === targetProfile.id) || targetProfile;
        let nextRecentSearches = currentStoredUser.recentSearches || [];

        if (options?.replaceUnsavedSuggestions || options?.forceRefresh) {
          const searchQueryText = (
            explicitRoles?.[0] ||
            targetProfile.primaryRole ||
            ''
          ).trim();
          const companyText = (options?.companyQuery || '').trim();
          const label = companyText
            ? searchQueryText
              ? `${searchQueryText} at ${companyText}`
              : companyText
            : searchQueryText;
          if (label) {
            const locationText = (
              targetProfile.location ||
              COUNTRY_CONFIGS[targetProfile.country]?.defaultLocation ||
              ''
            ).trim();
            const entry: RecentJobSearch = {
              id: `rec-${Date.now().toString(36)}`,
              label,
              query: searchQueryText,
              company: companyText || undefined,
              country: targetProfile.country,
              location: locationText,
              newCount: newAdded > 0 ? newAdded : incoming.length,
              totalCount: incoming.length,
              searchedAt: scannedAt,
            };
            const dedupedRecent = nextRecentSearches.filter(
              (r) =>
                !(
                  r.label.toLowerCase() === label.toLowerCase() &&
                  r.location.toLowerCase() === locationText.toLowerCase() &&
                  r.country === targetProfile.country
                )
            );
            nextRecentSearches = [entry, ...dedupedRecent].slice(0, 8);
          }
        }

        const updatedTargetUser: UserProfile = {
          ...targetProfile,
          recentSearches: nextRecentSearches,
        };

        const nextState: AppStoreState = {
          ...prev,
          users: prev.users.map((u) =>
            u.id === targetProfile.id ? updatedTargetUser : u
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

        storeRef.current = nextState;
        setStore(nextState);
        saveLocalState(nextState, authUserIdRef.current);
        setDbSyncCount((c) => c + 1);
        void syncStateToServer(nextState)
          .then((mode) => {
            if (mode) setStorageMode(mode);
          })
          .finally(() => {
            setDbSyncCount((c) => Math.max(0, c - 1));
          });

        if (incoming.length > 0) {
          const searchLabel = options?.companyQuery
            ? `${searchedRoles.map((r) => r.role).slice(0, 1).join(', ')} at ${options.companyQuery}`
            : searchedRoles.map((r) => r.role).slice(0, 2).join(', ');
          pushNotification({
            kind: 'scan',
            title: 'Job search updated',
            detail: `Found ${incoming.length} listings for ${searchLabel}.`,
            targetTab: 'jobs',
          });
        }
      } catch (err) {
        setScanError(
          err instanceof Error ? err.message : 'Unable to complete job scan.'
        );
      } finally {
        scanInFlightRef.current = false;
        setScanning(false);
        countdownRef.current = AUTO_REFRESH_INTERVAL_SECONDS;
        if (activeTabRef.current === 'jobs' || activeTabRef.current === 'home') {
          setCountdown(AUTO_REFRESH_INTERVAL_SECONDS);
        }
      }
    },
    [enabledSources, pushNotification]
  );

  // Hydrate initial state + detect Electron Desktop host
  useEffect(() => {
    let active = true;

    async function hydrate() {
      const server = await fetchServerState();
      if (!active) return;

      if (server.unauthorized) {
        router.replace('/login');
        return;
      }

      authUserIdRef.current = server.authUser?.id || null;
      setAuthUser(server.authUser);

      if (activeTab === 'admin' && !server.authUser?.isAdmin) {
        setActiveTab('home');
      }

      const local = loadLocalState(server.authUser?.id);

      setIsDesktopApp(
        Boolean(
          (window as unknown as { electronAPI?: { isDesktop?: boolean } })
            .electronAPI?.isDesktop
        )
      );
      setStorageMode(server.storageMode);
      setPersonalApiConfigured(server.personalApiConfigured);
      const chosen =
        server.storageMode === 'supabase-cloud' && server.state
          ? server.state
          : server.state && server.state.jobs.length >= local.jobs.length
            ? server.state
            : local;

      const user = getActiveUser(chosen);
      storeRef.current = chosen;
      setStore(chosen);
      setRoleDraft(user.primaryRole);
      setHydrated(true);
      setClientNow(Date.now());
      void loadResumeHistory();

      if (server.authUser?.isAdmin) {
        void fetch('/api/admin/users', { cache: 'no-store' })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (active && d?.stats && typeof d.stats.totalUsers === 'number') {
              setAdminUserCount(d.stats.totalUsers);
            }
          })
          .catch(() => undefined);
      }

      if (!initialAutoScanRan.current) {
        initialAutoScanRan.current = true;
        void runJobScan(user);
      }
    }

    void hydrate();
    const clockInterval = setInterval(() => {
      setClientNow(Date.now());
    }, 60000);

    return () => {
      active = false;
      clearInterval(clockInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time activity sync across open tabs + Supabase Realtime
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('pa-hire-po-notifications');
      broadcastRef.current = channel;
      channel.onmessage = (event: MessageEvent) => {
        const data = event.data as {
          type?: string;
          item?: ActivityNotification;
        };
        if (data?.type === 'notification' && data.item) {
          setNotifications((prev) => {
            if (prev.some((n) => n.id === data.item!.id)) return prev;
            return [data.item!, ...prev].slice(0, 30);
          });
        }
      };
    }

    let cancelled = false;
    let activeChannel: ReturnType<
      NonNullable<ReturnType<typeof createBrowserSupabaseClient>>['channel']
    > | null = null;
    let activeSupabase: ReturnType<typeof createBrowserSupabaseClient> = null;

    async function connectRealtime() {
      if (!authUser?.id || storageMode !== 'supabase-cloud') return;
      const setupRes = await fetch('/api/supabase/setup', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      if (cancelled) return;

      const supabase = createBrowserSupabaseClient(
        setupRes?.url,
        setupRes?.anonKey
      );
      if (!supabase) return;
      activeSupabase = supabase;

      activeChannel = supabase
        .channel(`user-activity-${authUser.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_jobs',
            filter: `user_id=eq.${authUser.id}`,
          },
          (payload) => {
            const row = (payload.new || payload.old) as {
              id?: string;
              title?: string;
              company?: string;
              status?: string;
            };
            if (!row?.id) return;
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              if (
                row.status === 'saved' ||
                row.status === 'applied' ||
                row.status === 'hidden'
              ) {
                const label =
                  row.status === 'applied'
                    ? 'Application synced'
                    : row.status === 'saved'
                      ? 'Saved job synced'
                      : 'Hidden job synced';
                pushNotification(
                  {
                    kind: row.status,
                    title: label,
                    detail: `${row.title || 'Job'} at ${row.company || 'Company'}`,
                    targetTab: row.status === 'applied' ? 'applications' : 'jobs',
                    targetJobId: row.id,
                  },
                  false
                );
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'tailored_resumes',
            filter: `user_id=eq.${authUser.id}`,
          },
          (payload) => {
            const row = payload.new as {
              company?: string;
              job_title?: string;
            };
            void loadResumeHistory();
            pushNotification(
              {
                kind: 'resume',
                title: 'Resume version saved',
                detail: `${row?.job_title || 'Resume'}${row?.company ? ` for ${row.company}` : ''}`,
                targetTab: 'applications',
              },
              false
            );
          }
        )
        .subscribe((status) => {
          if (!cancelled) {
            setIsRealtimeConnected(status === 'SUBSCRIBED');
          }
        });
    }

    void connectRealtime();

    return () => {
      cancelled = true;
      setIsRealtimeConnected(false);
      if (broadcastRef.current) {
        broadcastRef.current.close();
        broadcastRef.current = null;
      }
      if (activeSupabase && activeChannel) {
        void activeSupabase.removeChannel(activeChannel);
      }
    };
  }, [authUser?.id, loadResumeHistory, pushNotification, storageMode]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const setupRes = await fetch('/api/supabase/setup', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      const supabase = createBrowserSupabaseClient(
        setupRes?.url,
        setupRes?.anonKey
      );
      if (supabase) {
        await supabase.auth.signOut().catch(() => undefined);
      }
      await fetch('/api/supabase/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signout' }),
      });
      clearLegacyUnscopedLocalState();
    } finally {
      router.replace('/login');
      router.refresh();
      setSigningOut(false);
    }
  };

  // Non-overlapping 1-Minute (60s) Default Auto-Refresh Loop (paused when tab hidden)
  useEffect(() => {
    if (!hydrated) return;

    const timer = setInterval(() => {
      if (scanInFlightRef.current) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }

      const nextTick = countdownRef.current - 1;
      if (nextTick <= 0) {
        countdownRef.current = AUTO_REFRESH_INTERVAL_SECONDS;
        if (activeTabRef.current === 'jobs' || activeTabRef.current === 'home') {
          setCountdown(AUTO_REFRESH_INTERVAL_SECONDS);
        }
        const currentSearch = activeSearchMetaRef.current;
        if (currentSearch.role || currentSearch.company) {
          void runJobScan(
            undefined,
            currentSearch.role ? [currentSearch.role] : undefined,
            {
              companyQuery: currentSearch.company || undefined,
            }
          );
        } else {
          void runJobScan();
        }
        return;
      }

      countdownRef.current = nextTick;
      if (activeTabRef.current === 'jobs' || activeTabRef.current === 'home') {
        setCountdown(nextTick);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [hydrated, runJobScan]);

  const handleExecuteJobSearch = (
    roleInput: string,
    companyInput: string,
    overrideProfile?: UserProfile
  ) => {
    const trimmedRole = roleInput.trim();
    const trimmedCompany = companyInput.trim();

    let cleanRole = trimmedRole;
    let cleanCompany = trimmedCompany;

    if (!cleanCompany && trimmedRole) {
      const atMatch = trimmedRole.match(
        /^(.+?)\s+(?:at|@)\s+([A-Za-z0-9][A-Za-z0-9\s.&'-]{1,48})$/i
      );
      if (atMatch) {
        cleanRole = atMatch[1].trim();
        cleanCompany = atMatch[2].trim();
        setRoleDraft(cleanRole);
        setCompanyDraft(cleanCompany);
      }
    }

    if (!cleanRole && !cleanCompany) return;

    setActiveSearchMeta({ role: cleanRole, company: cleanCompany });
    setMobileDetailOpen(false);
    setActiveTab('jobs');
    void runJobScan(
      overrideProfile || activeProfile,
      cleanRole ? [cleanRole] : undefined,
      {
        companyQuery: cleanCompany || undefined,
        replaceUnsavedSuggestions: true,
        forceRefresh: true,
      }
    );
  };

  const handleMarkJobViewed = useCallback(
    (jobId: string) => {
      if (!jobId) return;
      const currentProfile = getActiveUser(storeRef.current);
      const existing = currentProfile.viewedJobIds || [];
      if (existing[0] === jobId) return;
      const nextViewed = [jobId, ...existing.filter((id) => id !== jobId)].slice(
        0,
        150
      );
      updateActiveUserProfile(
        {
          ...currentProfile,
          viewedJobIds: nextViewed,
        },
        false
      );
    },
    [updateActiveUserProfile]
  );

  const handleSaveCurrentSearch = useCallback(() => {
    const query = (roleDraft.trim() || activeProfile.primaryRole || '').trim();
    const company = companyDraft.trim();
    const location = (
      activeProfile.location ||
      COUNTRY_CONFIGS[activeProfile.country]?.defaultLocation ||
      ''
    ).trim();
    if (!query && !company) return;

    const label = company
      ? query
        ? `${query} at ${company}`
        : `Company: ${company}`
      : query;

    const existing = activeProfile.savedSearches || [];
    const deduped = existing.filter(
      (item) =>
        !(
          item.query.toLowerCase() === query.toLowerCase() &&
          (item.company || '').toLowerCase() === company.toLowerCase() &&
          item.country === activeProfile.country &&
          item.location.toLowerCase() === location.toLowerCase()
        )
    );

    const nextEntry: SavedJobSearch = {
      id: `srch-${Date.now().toString(36)}`,
      label,
      query,
      company: company || undefined,
      country: activeProfile.country,
      location,
      createdAt: new Date().toISOString(),
    };

    updateActiveUserProfile(
      {
        ...activeProfile,
        savedSearches: [nextEntry, ...deduped].slice(0, 20),
      },
      false
    );
    pushNotification({
      kind: 'settings',
      title: 'Search saved',
      detail: `${label}${location ? ` • ${location}` : ''}`,
      targetTab: 'home',
    });
  }, [activeProfile, companyDraft, pushNotification, roleDraft, updateActiveUserProfile]);

  const handleRunSavedSearch = (saved: SavedJobSearch | RecentJobSearch) => {
    const nextProfile: UserProfile = {
      ...activeProfile,
      country: saved.country,
      location:
        saved.location ||
        COUNTRY_CONFIGS[saved.country]?.defaultLocation ||
        activeProfile.location,
    };
    setRoleDraft(saved.query);
    setCompanyDraft(saved.company || '');
    updateActiveUserProfile(nextProfile, false);
    handleExecuteJobSearch(saved.query, saved.company || '', nextProfile);
  };

  const handleDeleteSavedSearch = (id: string) => {
    const nextSaved = (activeProfile.savedSearches || []).filter(
      (item) => item.id !== id
    );
    updateActiveUserProfile(
      {
        ...activeProfile,
        savedSearches: nextSaved,
      },
      false
    );
  };

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
      setCompanyDraft('');
      setActiveSearchMeta({ role: '', company: '' });
      void runJobScan(nextProfile, undefined, {
        replaceUnsavedSuggestions: true,
        forceRefresh: true,
      });
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

  const handleUpdateJobStatus = (
    jobId: string,
    status: JobStatus,
    tailoredResumeId?: string | null
  ) => {
    const nowIso = new Date().toISOString();
    const prev = storeRef.current;
    let updatedJob: JobListing | null = null;

    const nextJobs = prev.jobs.map((j) => {
      if (j.id !== jobId) return j;
      updatedJob = {
        ...j,
        status,
        statusUpdatedAt: nowIso,
        savedAt:
          status === 'saved' || status === 'applied' ? j.savedAt || nowIso : null,
        appliedAt: status === 'applied' ? j.appliedAt || nowIso : null,
        hiddenAt: status === 'hidden' ? j.hiddenAt || nowIso : null,
        applicationStage:
          status === 'applied'
            ? j.applicationStage || 'applied'
            : j.applicationStage,
        tailoredResumeId:
          tailoredResumeId !== undefined
            ? tailoredResumeId
            : j.tailoredResumeId ?? null,
      };
      return updatedJob;
    });

    const nextUsers =
      status === 'applied'
        ? prev.users.map((u) =>
            u.id === prev.activeUserId
              ? {
                  ...u,
                  unsavedAppliedJobIds: (u.unsavedAppliedJobIds || []).filter(
                    (id) => id !== jobId
                  ),
                }
              : u
          )
        : prev.users;

    const nextState: AppStoreState = { ...prev, users: nextUsers, jobs: nextJobs };
    storeRef.current = nextState;
    setStore(nextState);
    saveLocalState(nextState, authUserIdRef.current);

    if (updatedJob) {
      const savedTarget: JobListing = updatedJob;
      patchPendingSyncJob(savedTarget);
      setDbSyncCount((c) => c + 1);
      void syncSingleJobToServer(savedTarget)
        .then((res) => {
          if (res.saved) {
            setStorageMode(res.storageMode);
            setSyncError(null);
          } else {
            setSyncError(
              res.error
                ? `Cloud save failed: ${res.error}`
                : 'Unable to save job status to cloud database.'
            );
          }
        })
        .finally(() => {
          setDbSyncCount((c) => Math.max(0, c - 1));
        });

      if (status === 'saved' || status === 'applied' || status === 'hidden') {
        const titleMap = {
          saved: 'Job saved',
          applied: 'Application logged',
          hidden: 'Job hidden',
        } as const;
        pushNotification({
          kind: status,
          title: titleMap[status],
          detail: `${savedTarget.title} at ${savedTarget.company}`,
          targetTab: status === 'applied' ? 'applications' : 'jobs',
          targetJobId: savedTarget.id,
        });
      }
    }
    if (status === 'applied') {
      void loadResumeHistory();
    }
  };

  const handleUpdateJobApplication = (
    jobId: string,
    patch: {
      status?: JobStatus;
      title?: string;
      company?: string;
      source?: JobSource;
      appliedAt?: string | null;
      applicationStage?: ApplicationStage;
      applicationNotes?: string;
      tailoredResumeId?: string | null;
      url?: string;
      location?: string;
      workType?: string;
      salary?: string | null;
    }
  ) => {
    const nowIso = new Date().toISOString();
    const prev = storeRef.current;
    let updatedJob: JobListing | null = null;

    const nextJobs = prev.jobs.map((j) => {
      if (j.id !== jobId) return j;
      const nextStatus = patch.status ?? j.status;
      updatedJob = {
        ...j,
        ...patch,
        status: nextStatus,
        statusUpdatedAt: nowIso,
        savedAt:
          nextStatus === 'saved' || nextStatus === 'applied'
            ? j.savedAt || nowIso
            : null,
        appliedAt:
          nextStatus === 'applied' ? patch.appliedAt ?? j.appliedAt ?? nowIso : null,
        hiddenAt: nextStatus === 'hidden' ? j.hiddenAt || nowIso : null,
      };
      return updatedJob;
    });

    const nextUsers =
      patch.status === 'applied'
        ? prev.users.map((u) =>
            u.id === prev.activeUserId
              ? {
                  ...u,
                  unsavedAppliedJobIds: (u.unsavedAppliedJobIds || []).filter(
                    (id) => id !== jobId
                  ),
                }
              : u
          )
        : prev.users;

    const nextState: AppStoreState = { ...prev, users: nextUsers, jobs: nextJobs };
    storeRef.current = nextState;
    setStore(nextState);
    saveLocalState(nextState, authUserIdRef.current);

    if (updatedJob) {
      patchPendingSyncJob(updatedJob);
      setDbSyncCount((c) => c + 1);
      void syncSingleJobToServer(updatedJob)
        .then((res) => {
          if (res.saved) {
            setStorageMode(res.storageMode);
            setSyncError(null);
          } else {
            setSyncError(
              res.error
                ? `Cloud save failed: ${res.error}`
                : 'Unable to save application changes to cloud database.'
            );
          }
        })
        .finally(() => {
          setDbSyncCount((c) => Math.max(0, c - 1));
        });
    }
  };

  const handleImportParsedResume = async (
    parsed: ParsedResumePayload,
    options: ResumeUploadConfirmOptions
  ) => {
    const nextProfile = buildSmartProfilePatchFromResume(
      activeProfile,
      parsed,
      { syncSmartProfile: options.syncSmartProfile }
    );
    updateActiveUserProfile(nextProfile, true);

    const versionLabel = `Imported: ${parsed.fileName || 'Resume'}`;
    const importedResume: StructuredResume = {
      ...nextProfile.structuredResume,
      versionName: options.saveVersionSnapshot ? versionLabel : undefined,
    };
    setTailoredResume(importedResume);

    if (options.saveVersionSnapshot) {
      await handleSaveResumeSnapshot({
        company: 'Imported Base CV',
        jobTitle: nextProfile.primaryRole || importedResume.targetHeadline || 'Resume',
        jobId: null,
        versionName: versionLabel,
        resume: importedResume,
        isSent: false,
        notes: `Imported from ${parsed.fileName || 'file'} via ${
          parsed.parseMethod === 'gemini-ai' ? 'AI Structured Parser' : 'Smart Parser'
        }`,
      });
    }

    setActiveTab('resume');
  };

  const handleSaveResumeSnapshot = async (params: {
    company: string | null;
    jobTitle: string;
    jobId: string | null;
    versionName?: string;
    resume: StructuredResume;
    isSent: boolean;
    notes: string;
    syncToProfile?: boolean;
  }) => {
    if (params.syncToProfile) {
      handleApplyResumeToProfile(params.resume);
    }

    const res = await fetch('/api/resumes/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: params.jobId,
        jobTitle: params.jobTitle,
        company: params.company,
        versionName: params.versionName || params.resume.versionName,
        tailorMethod: params.resume.tailorMethod || 'base',
        sourceType:
          params.resume.tailorMethod === 'gemini-ai'
            ? 'ai-tailor'
            : params.resume.tailorMethod === 'smart-engine'
              ? 'smart-engine'
              : 'manual-edit',
        isSent: params.isSent,
        notes: params.notes,
        syncToProfile: Boolean(params.syncToProfile),
        resumeData: {
          ...params.resume,
          ...(params.versionName ? { versionName: params.versionName } : {}),
        },
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { record?: TailoredResumeRecord };
      if (data.record && params.jobId && params.isSent) {
        handleUpdateJobStatus(params.jobId, 'applied', data.record.id);
      } else {
        pushNotification({
          kind: 'resume',
          title: 'Resume snapshot archived',
          detail:
            params.versionName ||
            (params.company
              ? `${params.jobTitle} for ${params.company}`
              : params.jobTitle),
          targetTab: 'resume',
        });
      }
      await loadResumeHistory();
    }
  };

  const handleLogExternalApplication = async (payload: {
    company: string;
    title: string;
    source: JobSource;
    url: string;
    location?: string;
    workType?: string;
    salary?: string;
    stage?: ApplicationStage;
    appliedDate?: string;
    notes: string;
    resumeRecordId?: string;
    resume: StructuredResume;
  }) => {
    const nowIso = new Date().toISOString();
    const parsedAppliedTime = payload.appliedDate
      ? new Date(`${payload.appliedDate}T12:00:00`)
      : null;
    const appliedIso =
      parsedAppliedTime && !Number.isNaN(parsedAppliedTime.getTime())
        ? parsedAppliedTime.toISOString()
        : nowIso;
    const jobId = `ext-${Date.now().toString(36)}`;
    const inferredSource =
      payload.resume.tailorMethod === 'gemini-ai'
        ? 'ai-tailor'
        : payload.resume.tailorMethod === 'smart-engine'
          ? 'smart-engine'
          : 'base';
    setDbSyncCount((c) => c + 1);
    try {
      let linkedResumeId: string | null = null;
      if (payload.resumeRecordId && payload.resumeRecordId !== 'base') {
        linkedResumeId = payload.resumeRecordId;
        await fetch('/api/resumes/history', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: payload.resumeRecordId,
            isSent: true,
            company: payload.company,
            jobTitle: payload.title,
          }),
        }).catch(() => undefined);
      } else {
        const snapshotRes = await fetch('/api/resumes/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId,
            jobTitle: payload.title,
            company: payload.company,
            tailorMethod: payload.resume.tailorMethod || 'base',
            sourceType: inferredSource,
            isSent: true,
            notes: payload.notes,
            resumeData: {
              ...payload.resume,
              tailoredForCompany: payload.company,
              tailoredForJobTitle: payload.title,
            },
          }),
        });
        const snapshotData = snapshotRes.ok
          ? ((await snapshotRes.json()) as { record?: TailoredResumeRecord })
          : null;
        linkedResumeId = snapshotData?.record?.id || null;
      }

      const cleanUrl = (payload.url || '').trim();
      const newJob: JobListing = {
        id: jobId,
        title: payload.title,
        company: payload.company,
        location: payload.location?.trim() || activeProfile.location || 'Remote',
        source: payload.source,
        url: cleanUrl || '#',
        postedAt: appliedIso,
        salary:
          payload.salary?.trim() || activeProfile.salaryExpectation || null,
        description:
          payload.notes ||
          `Application logged for ${payload.title} at ${payload.company}.`,
        workType: payload.workType?.trim() || activeProfile.workType || 'Flexible',
        searchedRole: payload.title,
        isPivotSuggestion: false,
        experienceRequired: 'Open / Not Specified',
        experienceFit: 'fit',
        matchScore: 85,
        matchedSkills: activeProfile.skills.slice(0, 4),
        missingSkills: [],
        matchReason: 'Application logged by user in Job Tracking',
        tailoringTips: [],
        status: 'applied',
        discoveredAt: appliedIso,
        savedAt: nowIso,
        appliedAt: appliedIso,
        applicationStage: payload.stage || 'applied',
        applicationNotes: payload.notes,
        tailoredResumeId: linkedResumeId,
        statusUpdatedAt: nowIso,
      };

      const prev = storeRef.current;
      const nextState: AppStoreState = {
        ...prev,
        jobs: [newJob, ...prev.jobs],
      };
      storeRef.current = nextState;
      setStore(nextState);
      saveLocalState(nextState, authUserIdRef.current);
      patchPendingSyncJob(newJob);
      await syncSingleJobToServer(newJob);
      await loadResumeHistory();
      pushNotification({
        kind: 'applied',
        title: 'Job application logged',
        detail: `${payload.title} at ${payload.company}`,
        targetTab: 'applications',
        targetJobId: jobId,
      });
    } finally {
      setDbSyncCount((c) => Math.max(0, c - 1));
    }
  };

  const handleToggleSaveJob = (jobId: string) => {
    const prev = storeRef.current;
    const target = prev.jobs.find((j) => j.id === jobId);
    if (!target) return;

    if (target.status === 'applied') {
      const currentUser = getActiveUser(prev);
      const currentUnsaved = currentUser.unsavedAppliedJobIds || [];
      const isCurrentlyUnsaved = currentUnsaved.includes(jobId);
      const nextUnsaved = isCurrentlyUnsaved
        ? currentUnsaved.filter((id) => id !== jobId)
        : [jobId, ...currentUnsaved.filter((id) => id !== jobId)].slice(0, 200);
      const nowIso = new Date().toISOString();
      const updatedJob: JobListing = {
        ...target,
        savedAt: isCurrentlyUnsaved ? target.savedAt || nowIso : null,
        statusUpdatedAt: nowIso,
      };
      const nextUsers = prev.users.map((u) =>
        u.id === currentUser.id
          ? { ...u, unsavedAppliedJobIds: nextUnsaved }
          : u
      );
      const nextJobs = prev.jobs.map((j) => (j.id === jobId ? updatedJob : j));
      const nextState: AppStoreState = { ...prev, users: nextUsers, jobs: nextJobs };
      storeRef.current = nextState;
      setStore(nextState);
      saveLocalStateDebounced(nextState, authUserIdRef.current);
      patchPendingSyncJob(updatedJob);
      void syncSingleJobToServer(updatedJob);
      void syncStateToServer(nextState, 'profile-only');
      return;
    }

    handleUpdateJobStatus(jobId, target.status === 'saved' ? 'suggested' : 'saved');
  };

  const handleTogglePinActivity = (pinKey: string) => {
    const prev = storeRef.current;
    const currentUser = getActiveUser(prev);
    const currentPins = currentUser.pinnedActivityIds || [];
    const isPinned = currentPins.includes(pinKey);
    const nextPins = isPinned
      ? currentPins.filter((k) => k !== pinKey)
      : [pinKey, ...currentPins.filter((k) => k !== pinKey)].slice(0, 25);

    const nextUsers = prev.users.map((u) =>
      u.id === currentUser.id ? { ...u, pinnedActivityIds: nextPins } : u
    );
    const nextState: AppStoreState = { ...prev, users: nextUsers };
    storeRef.current = nextState;
    setStore(nextState);
    saveLocalStateDebounced(nextState, authUserIdRef.current);
    void syncStateToServer(nextState, 'profile-only');
  };

  const handleUpdateResumeRecord = async (
    id: string,
    patch: {
      isSent?: boolean;
      notes?: string;
      company?: string;
      jobTitle?: string;
      versionName?: string | null;
      resumeData?: StructuredResume;
    }
  ) => {
    const res = await fetch('/api/resumes/history', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    });
    if (res.ok) {
      await loadResumeHistory();
      if (patch.versionName) {
        pushNotification({
          kind: 'resume',
          title: 'Resume version renamed',
          detail: patch.versionName,
          targetTab: 'resume',
        });
      }
    }
  };

  const handleDeleteResumeRecord = async (id: string) => {
    const res = await fetch(`/api/resumes/history?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setResumeRecords((prev) => prev.filter((r) => r.id !== id));
      const prevStore = storeRef.current;
      const currentUser = getActiveUser(prevStore);
      const pinKey = `rec:${id}`;
      if ((currentUser.pinnedActivityIds || []).includes(pinKey)) {
        const nextUsers = prevStore.users.map((u) =>
          u.id === currentUser.id
            ? {
                ...u,
                pinnedActivityIds: (u.pinnedActivityIds || []).filter(
                  (k) => k !== pinKey
                ),
              }
            : u
        );
        const nextState: AppStoreState = { ...prevStore, users: nextUsers };
        storeRef.current = nextState;
        setStore(nextState);
        saveLocalStateDebounced(nextState, authUserIdRef.current);
        void syncStateToServer(nextState, 'profile-only');
      }
      pushNotification({
        kind: 'resume',
        title: 'Resume version deleted',
        detail: 'Snapshot removed from history.',
        targetTab: 'resume',
      });
    }
  };

  const handleApplyResumeToProfile = (resume: StructuredResume) => {
    const nextProfile: UserProfile = {
      ...activeProfile,
      name: resume.fullName || activeProfile.name,
      title: resume.targetHeadline || activeProfile.title,
      summary: resume.tailoredSummary || activeProfile.summary,
      location: resume.location || activeProfile.location,
      structuredResume: resume,
      resumeText: resumeToPlainText(resume),
    };
    updateActiveUserProfile(nextProfile, true);
    pushNotification({
      kind: 'resume',
      title: 'Profile Updated',
      detail: 'Edits from Resume Studio applied to your master profile.',
      targetTab: 'profile',
    });
  };

  const handleToggleQueueJob = (jobId: string) => {
    const exists = queuedJobIds.includes(jobId);
    const nextQueue = exists
      ? queuedJobIds.filter((id) => id !== jobId)
      : [...queuedJobIds, jobId];
    persistStore({ ...store, queuedJobIds: nextQueue }, 'profile-only');
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
      const currentResume = tailoredResume || activeProfile.structuredResume;
      const res = await fetch('/api/resume/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: activeProfile,
          targetJob,
          targetRole: targetRole || activeProfile.primaryRole,
          geminiApiKey: store.geminiApiKey || '',
          pageSize: currentResume.pageSize || 'a4',
        }),
      });
      const data = await res.json();
      if (res.ok && data.resume) {
        const nextTailored = data.resume as StructuredResume;
        setTailoredResume({
          ...nextTailored,
          pageSize: currentResume.pageSize || nextTailored.pageSize || 'a4',
          density: currentResume.density || nextTailored.density || 'standard',
          fontFamily:
            currentResume.fontFamily || nextTailored.fontFamily || 'calibri',
        });
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

  const activeFilterCount = useMemo(
    () =>
      [
        payFilter.min !== null || payFilter.max !== null,
        jobTypeFilters.length > 0,
        remoteFilters.length > 0,
        classificationFilters.length > 0,
        dateFilter !== 'all',
        sourceFilter !== 'all',
        fitFilter !== 'all',
        minScore > 0,
        Boolean(searchQuery.trim()),
        Boolean(companyDraft.trim()),
        enabledSources.length < 3,
      ].filter(Boolean).length,
    [
      classificationFilters.length,
      companyDraft,
      dateFilter,
      enabledSources.length,
      fitFilter,
      jobTypeFilters.length,
      minScore,
      payFilter.max,
      payFilter.min,
      remoteFilters.length,
      searchQuery,
      sourceFilter,
    ]
  );

  const handleResetAllFilters = () => {
    setPayFilter(DEFAULT_PAY_FILTER);
    setJobTypeFilters([]);
    setRemoteFilters([]);
    setClassificationFilters([]);
    setDateFilter('all');
    setSourceFilter('all');
    setFitFilter('all');
    setMinScore(0);
    setSearchQuery('');
    setSortBy('match');
    setEnabledSources(['linkedin', 'jobstreet', 'indeed']);
  };

  const newToMeOnly = activeProfile.newToMeOnly ?? true;
  const queuedJobSet = useMemo(() => new Set(queuedJobIds), [queuedJobIds]);
  const appliedRoleKeys = useMemo(
    () => buildAppliedRoleKeys(store.jobs),
    [store.jobs]
  );

  const handleToggleNewToMe = () => {
    updateActiveUserProfile(
      { ...activeProfile, newToMeOnly: !newToMeOnly },
      false
    );
  };

  const handleDisableNewToMe = () => {
    updateActiveUserProfile(
      { ...activeProfile, newToMeOnly: false },
      false
    );
  };

  const filteredDiscoveryJobs = useMemo(
    () =>
      applyBannerFilters(
        store.jobs.filter(
          (j) =>
            j.status !== 'hidden' &&
            (!newToMeOnly || isJobNewToMe(j, queuedJobSet, appliedRoleKeys))
        ),
        {
          sourceFilter,
          fitFilter,
          dateFilter,
          minScore,
          searchQuery,
          payFilter,
          jobTypeFilters,
          remoteFilters,
          classificationFilters,
          referenceNow: clientNow ?? undefined,
        }
      ),
    [
      appliedRoleKeys,
      classificationFilters,
      clientNow,
      dateFilter,
      fitFilter,
      jobTypeFilters,
      minScore,
      newToMeOnly,
      payFilter,
      queuedJobSet,
      remoteFilters,
      searchQuery,
      sourceFilter,
      store.jobs,
    ]
  );

  const filteredJobs = useMemo(() => {
    const statusMatched = store.jobs.filter((job) => {
      if (statusFilter === 'active') {
        return (
          job.status !== 'hidden' &&
          (!newToMeOnly || isJobNewToMe(job, queuedJobSet, appliedRoleKeys))
        );
      }
      if (statusFilter === 'saved') {
        return isJobSaved(job, activeProfile.unsavedAppliedJobIds);
      }
      return job.status === statusFilter;
    });

    const bannerFiltered = applyBannerFilters(statusMatched, {
      sourceFilter,
      fitFilter,
      dateFilter,
      minScore,
      searchQuery,
      payFilter,
      jobTypeFilters,
      remoteFilters,
      classificationFilters,
      referenceNow: clientNow ?? undefined,
    });
    return sortJobs(bannerFiltered, sortBy, clientNow ?? undefined);
  }, [
    activeProfile.unsavedAppliedJobIds,
    appliedRoleKeys,
    classificationFilters,
    clientNow,
    dateFilter,
    fitFilter,
    jobTypeFilters,
    minScore,
    newToMeOnly,
    payFilter,
    queuedJobSet,
    remoteFilters,
    searchQuery,
    sortBy,
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
    persistStore({ ...store, queuedJobIds: merged }, 'profile-only');
  };

  const selectedJob = useMemo(() => {
    if (filteredJobs.length === 0) return null;
    return (
      filteredJobs.find((j) => j.id === selectedJobId) || filteredJobs[0]
    );
  }, [filteredJobs, selectedJobId]);

  const activeJobsCount = useMemo(
    () =>
      store.jobs.filter(
        (j) =>
          j.status !== 'hidden' &&
          (!newToMeOnly || isJobNewToMe(j, queuedJobSet, appliedRoleKeys))
      ).length,
    [appliedRoleKeys, newToMeOnly, queuedJobSet, store.jobs]
  );

  const savedJobsCount = useMemo(
    () =>
      store.jobs.filter((j) =>
        isJobSaved(j, activeProfile.unsavedAppliedJobIds)
      ).length,
    [activeProfile.unsavedAppliedJobIds, store.jobs]
  );

  const appliedJobsCount = useMemo(
    () => store.jobs.filter((j) => j.status === 'applied').length,
    [store.jobs]
  );

  // Civic Career Utility theme tokens (Light / Dark Slate)
  const {
    isDark,
    pageBg,
    cardSurface,
    inputSurface,
    primaryBtn,
    secondaryBtn,
    mutedText,
    strongText,
  } = getThemeTokens(theme);

  useEffect(() => {
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark]);

  return (
    <div
      className={cn(
        'min-h-screen transition-colors print:min-h-0 print:bg-white! print:text-black!',
        pageBg
      )}
      style={{ colorScheme: isDark ? 'dark' : 'light' }}
    >
      <AppTopNavbar
        theme={theme}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        activeProfile={activeProfile}
        isDesktopApp={isDesktopApp}
        hydrated={hydrated}
        activeJobsCount={activeJobsCount}
        savedCount={savedJobsCount}
        savedSearchesCount={(activeProfile.savedSearches || []).length}
        appliedCount={appliedJobsCount}
        dbSyncing={dbSyncCount > 0}
        notifications={notifications}
        unreadCount={notifications.filter((n) => !n.read).length}
        nowMs={clientNow}
        isRealtimeConnected={isRealtimeConnected}
        authUser={authUser}
        storageMode={storageMode}
        adminUserCount={adminUserCount}
        signingOut={signingOut}
        onSignOut={() => void handleSignOut()}
        onOpenHowItWorks={() => setHowItWorksOpen(true)}
        onOpenSettings={() => {
          setSettingsSection('personal');
          setSettingsOpen(true);
        }}
        onOpenSavedSearches={() => setSavedSearchesOpen(true)}
        onOpenSavedJobs={() => {
          setApplicationsSubView((prev) => ({ view: 'saved', seq: prev.seq + 1 }));
          setActiveTab('applications');
        }}
        onOpenChangelog={() => {
          markChangelogSeen();
          setChangelogOpen(true);
        }}
        onMarkAllNotificationsRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
        onClearNotifications={() => setNotifications([])}
        onSelectNotification={(item) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
          );
          if (item.kind === 'release') {
            markChangelogSeen();
            setChangelogOpen(true);
            return;
          }
          if (item.targetJobId) {
            setSelectedJobId(item.targetJobId);
          }
          if (item.targetTab) {
            setActiveTab(item.targetTab);
          }
        }}
        onChangeTheme={(nextTheme) =>
          persistStore(
            {
              ...store,
              theme: nextTheme,
            },
            'profile-only'
          )
        }
      />

      {hydrated && (activeTab === 'home' || activeTab === 'jobs') && (
        <JobSearchBanner
          theme={theme}
          wideContainer={activeTab === 'jobs'}
          activeProfile={activeProfile}
          roleDraft={roleDraft}
          companyDraft={companyDraft}
          activeSearchMeta={activeSearchMeta}
          scanning={scanning}
          scanError={scanError}
          countdown={countdown}
          enabledSources={enabledSources}
          boardMeta={boardMeta}
          totalJobsCount={store.jobs.length}
          sourceFilter={sourceFilter}
          fitFilter={fitFilter}
          dateFilter={dateFilter}
          sortBy={sortBy}
          minScore={minScore}
          searchQuery={searchQuery}
          payFilter={payFilter}
          jobTypeFilters={jobTypeFilters}
          remoteFilters={remoteFilters}
          classificationFilters={classificationFilters}
          newToMeOnly={newToMeOnly}
          activeFilterCount={activeFilterCount}
          onChangeRoleDraft={setRoleDraft}
          onChangeCompanyDraft={setCompanyDraft}
          onUpdateProfile={(next, rescore = false) =>
            updateActiveUserProfile(next, rescore)
          }
          onExecuteSearch={(role, company) =>
            handleExecuteJobSearch(role, company)
          }
          onSaveCurrentSearch={handleSaveCurrentSearch}
          onApplyPrimaryRole={(role, trigger) =>
            handleApplyPrimaryRole(role, trigger)
          }
          onToggleSource={toggleSource}
          onChangeSourceFilter={setSourceFilter}
          onToggleFitFilter={() =>
            setFitFilter((f) => (f === 'all' ? 'applicable' : 'all'))
          }
          onChangeDateFilter={setDateFilter}
          onChangeSortBy={setSortBy}
          onChangeMinScore={setMinScore}
          onChangeSearchQuery={setSearchQuery}
          onChangePayFilter={setPayFilter}
          onToggleJobTypeFilter={(val) =>
            setJobTypeFilters((prev) =>
              prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
            )
          }
          onToggleRemoteFilter={(val) =>
            setRemoteFilters((prev) =>
              prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
            )
          }
          onToggleClassificationFilter={(val) =>
            setClassificationFilters((prev) =>
              prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
            )
          }
          onToggleNewToMe={handleToggleNewToMe}
          onResetAllFilters={handleResetAllFilters}
          onRunRecentSearch={(item) => handleRunSavedSearch(item)}
          onClearUnsavedJobs={() => {
            const queuedSet = new Set(queuedJobIds);
            const kept = store.jobs.filter(
              (j) =>
                j.status === 'saved' ||
                j.status === 'applied' ||
                j.status === 'hidden' ||
                queuedSet.has(j.id)
            );
            persistStore({ ...store, jobs: kept }, 'full', { immediate: true });
          }}
        />
      )}

      <main className="mx-auto max-w-[1440px] px-4 py-5 pb-24 sm:px-6 md:pb-8 print:m-0! print:max-w-none! print:p-0! print:bg-white!">
        {!hydrated ? (
          <div className="space-y-4">
            <div className={cn('flex items-center gap-3 rounded-lg border p-5', cardSurface)}>
              <LoadingSpinner
                size={24}
                thickness={2.5}
                isDark={isDark}
                label="Loading workspace from database"
              />
              <div>
                <p className="text-sm font-semibold">
                  Loading your workspace...
                </p>
                <p className={cn('text-xs', mutedText)}>
                  Syncing saved jobs, applications, target roles, and resume snapshots.
                </p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={cn('h-28 animate-pulse rounded-lg border p-4', cardSurface)}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
        {syncError && (
          <div
            role="alert"
            className={cn(
              'no-print mb-4 flex items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-xs font-medium',
              isDark
                ? 'border-red-500/40 bg-red-950/50 text-red-300'
                : 'border-red-300 bg-red-50 text-red-700'
            )}
          >
            <span>{syncError}</span>
            <button
              type="button"
              onClick={() => setSyncError(null)}
              className={cn('rounded border px-2 py-0.5 text-[11px]', secondaryBtn)}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 0: JOBSTREET-INSPIRED DISCOVERY FEED */}
        {activeTab === 'home' && (
          <JobDiscoveryFeed
            theme={theme}
            activeProfile={activeProfile}
            jobs={filteredDiscoveryJobs}
            allJobs={store.jobs}
            activeFilterCount={activeFilterCount}
            newToMeOnly={newToMeOnly}
            scanning={scanning}
            isDesktopApp={isDesktopApp}
            nowMs={clientNow}
            onSelectJob={(jobId) => {
              const clickedJob = store.jobs.find((j) => j.id === jobId);
              handleMarkJobViewed(jobId);
              setSelectedJobId(jobId);
              setMobileDetailOpen(true);
              setSourceFilter('all');
              if (clickedJob?.status === 'applied') {
                setStatusFilter('applied');
              } else if (
                clickedJob &&
                isJobSaved(clickedJob, activeProfile.unsavedAppliedJobIds)
              ) {
                setStatusFilter('saved');
              } else {
                setStatusFilter('active');
              }
              setActiveTab('jobs');
            }}
            onToggleSaveJob={handleToggleSaveJob}
            onUpdateJobStatus={(jobId, status) =>
              handleUpdateJobStatus(jobId, status)
            }
            onOpenExplorer={() => {
              setSourceFilter('all');
              setStatusFilter('active');
              setMobileDetailOpen(false);
              setActiveTab('jobs');
            }}
            onOpenSavedJobs={() => {
              setApplicationsSubView((prev) => ({
                view: 'saved',
                seq: prev.seq + 1,
              }));
              setActiveTab('applications');
            }}
            onOpenPreferences={() => {
              setSettingsSection('roles');
              setSettingsOpen(true);
            }}
            onOpenDesktopSetup={() => {
              setSettingsSection('desktop');
              setSettingsOpen(true);
            }}
            onRunSavedSearch={handleRunSavedSearch}
            onDeleteSavedSearch={handleDeleteSavedSearch}
            onDisableNewToMe={handleDisableNewToMe}
            onResetFilters={handleResetAllFilters}
            onTriggerScan={() => void runJobScan()}
          />
        )}

        {/* TAB 1: SIMPLIFIED 2-COLUMN JOB EXPLORER */}
        {activeTab === 'jobs' && (
          <div className="no-print space-y-4">
            {/* Compact Explorer Breadcrumb + Quick Status & Sort Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMobileDetailOpen(false);
                    setActiveTab('home');
                  }}
                  className={cn(
                    'civic-touch-target inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                    secondaryBtn
                  )}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Recommended</span>
                </button>
                <span className={cn('text-xs', mutedText)}>
                  Showing <strong className={strongText}>{filteredJobs.length}</strong> of{' '}
                  {store.jobs.length} jobs
                </span>
              </div>

              <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto">
                <div className="no-scrollbar flex flex-nowrap items-center gap-1 overflow-x-auto">
                  {(
                    [
                      { key: 'active', label: 'All Active', count: activeJobsCount },
                      {
                        key: 'saved',
                        label: 'Saved',
                        count: savedJobsCount,
                      },
                      {
                        key: 'applied',
                        label: 'Applied',
                        count: appliedJobsCount,
                      },
                      {
                        key: 'hidden',
                        label: 'Hidden',
                        count: store.jobs.filter((j) => j.status === 'hidden').length,
                      },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => {
                        setStatusFilter(t.key);
                        setMobileDetailOpen(false);
                      }}
                      className={cn(
                        'civic-touch-target inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                        statusFilter === t.key ? primaryBtn : secondaryBtn
                      )}
                    >
                      <span>{t.label}</span>
                      {hydrated && t.count > 0 && (
                        <span className="font-mono text-[11px] tabular-nums opacity-85">
                          ({t.count})
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="relative flex items-center">
                  <ArrowUpDown
                    className={cn(
                      'pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5',
                      mutedText
                    )}
                  />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as JobSortOption)}
                    aria-label="Sort jobs"
                    className={cn(
                      'min-h-[36px] rounded-lg border py-1.5 pl-8 pr-2.5 text-xs font-medium focus:outline-none',
                      inputSurface
                    )}
                  >
                    <option value="match">Sort: Best Match</option>
                    <option value="newest">Sort: Newest First</option>
                    <option value="oldest">Sort: Oldest First</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2-COLUMN MASTER-DETAIL EXPLORER (Focused Switch on < 1024px) */}
            <section className="grid items-start gap-5 lg:grid-cols-12">
              {/* LEFT COLUMN: JOB LIST */}
              <div
                className={cn(
                  'space-y-2 lg:col-span-5',
                  mobileDetailOpen && 'hidden lg:block'
                )}
              >
                {scanning && store.jobs.length === 0 ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className={cn('h-28 animate-pulse rounded-lg border p-4', cardSurface)}
                      />
                    ))}
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div className={cn('space-y-3 rounded-lg border border-dashed p-10 text-center', cardSurface)}>
                    <Briefcase className={cn('mx-auto h-7 w-7', mutedText)} />
                    {(() => {
                      const hiddenByNewToMeOnly =
                        statusFilter === 'active' &&
                        newToMeOnly &&
                        store.jobs.some((j) => j.status !== 'hidden');
                      return (
                        <>
                          <p className="text-sm font-semibold">
                            {hiddenByNewToMeOnly
                              ? 'All loaded jobs are already applied, saved, or queued'
                              : 'No matching jobs yet'}
                          </p>
                          <p className={cn('text-xs', mutedText)}>
                            {hiddenByNewToMeOnly
                              ? 'Turn off "New to me" to show applied, saved, or queued listings, or scan for new openings.'
                              : 'Try adjusting filters or click Search to scan LinkedIn, JobStreet, and Indeed.'}
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            {hiddenByNewToMeOnly && (
                              <button
                                type="button"
                                onClick={handleDisableNewToMe}
                                className={cn(
                                  'min-h-[42px] rounded-lg border px-4 py-2 text-xs font-semibold transition-colors',
                                  secondaryBtn
                                )}
                              >
                                Show applied &amp; saved jobs
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => void runJobScan()}
                              className={cn('min-h-[42px] rounded-lg px-4 py-2 text-xs', primaryBtn)}
                            >
                              Search Jobs
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  filteredJobs.map((job) => (
                    <DiscoveryJobCard
                      key={job.id}
                      job={job}
                      theme={theme}
                      variant="explorer"
                      isSelected={selectedJob?.id === job.id}
                      isSaved={isJobSaved(job, activeProfile.unsavedAppliedJobIds)}
                      isViewed={(activeProfile.viewedJobIds || []).includes(job.id)}
                      nowMs={clientNow}
                      onSelect={() => {
                        handleMarkJobViewed(job.id);
                        setSelectedJobId(job.id);
                        setMobileDetailOpen(true);
                      }}
                      onToggleSave={() => handleToggleSaveJob(job.id)}
                      onHide={() => handleUpdateJobStatus(job.id, 'hidden')}
                      onUnhide={() => handleUpdateJobStatus(job.id, 'suggested')}
                    />
                  ))
                )}
              </div>

              {/* RIGHT COLUMN: STICKY JOB DETAILS PANE */}
              <div
                className={cn(
                  'scroll-mt-20 space-y-2 lg:sticky lg:top-16 lg:col-span-7',
                  !mobileDetailOpen && 'hidden lg:block'
                )}
              >
                <div className="flex items-center justify-between lg:hidden">
                  <button
                    type="button"
                    onClick={() => setMobileDetailOpen(false)}
                    className={cn(
                      'civic-touch-target inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium',
                      secondaryBtn
                    )}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to results
                  </button>
                </div>
                <JobDetailPane
                  job={selectedJob}
                  activeProfileName={activeProfile.name}
                  theme={theme}
                  isQueued={
                    selectedJob ? queuedJobIds.includes(selectedJob.id) : false
                  }
                  isSaved={
                    selectedJob
                      ? isJobSaved(selectedJob, activeProfile.unsavedAppliedJobIds)
                      : false
                  }
                  onToggleSave={() => {
                    if (selectedJob) handleToggleSaveJob(selectedJob.id);
                  }}
                  onOpenApplyModal={(job) => setApplyModalJob(job)}
                  onToggleQueueJob={handleToggleQueueJob}
                  onUpdateStatus={handleUpdateJobStatus}
                />
              </div>
            </section>
          </div>
        )}

        {/* TAB 1B: ACTIVITY (SAVED, APPLIED, RESUME APPLIED, HIDDEN) */}
        {activeTab === 'applications' && (
          <ApplicationsCompilationView
            key={`${applicationsSubView.view}-${applicationsSubView.seq}`}
            initialSubView={applicationsSubView.view}
            theme={store.theme}
            profile={activeProfile}
            jobs={store.jobs}
            resumeRecords={resumeRecords}
            loadingResumes={loadingResumes}
            unsavedAppliedJobIds={activeProfile.unsavedAppliedJobIds || []}
            pinnedActivityIds={activeProfile.pinnedActivityIds || []}
            nowMs={clientNow}
            onRefreshResumes={loadResumeHistory}
            onToggleSaveJob={handleToggleSaveJob}
            onTogglePinActivity={handleTogglePinActivity}
            onOpenApplyModal={(job) => setApplyModalJob(job)}
            onUpdateJobApplication={handleUpdateJobApplication}
            onLogExternalApplication={handleLogExternalApplication}
            onUpdateResumeRecord={handleUpdateResumeRecord}
            onDeleteResumeRecord={handleDeleteResumeRecord}
            onOpenInResumeStudio={(resume, job) => {
              setTailoredResume(resume);
              if (job) setSelectedJobId(job.id);
              setActiveTab('resume');
            }}
            onOpenJobInExplorer={(jobId) => {
              setSelectedJobId(jobId);
              setMobileDetailOpen(true);
              setSourceFilter('all');
              setStatusFilter('active');
              setActiveTab('jobs');
            }}
          />
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
              persistStore({ ...store, autoApplyConfig: next }, 'profile-only')
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

        {/* TAB 3: LINKEDIN-STYLE PROFILE VIEW (SYNCED 2-WAY WITH RESUME STUDIO AI) */}
        {activeTab === 'profile' && (
          <LinkedInProfileView
            users={store.users}
            profile={activeProfile}
            theme={store.theme}
            geminiApiKey={store.geminiApiKey || ''}
            personalApiConfigured={personalApiConfigured}
            onSelectUser={handleSelectUser}
            onCreateUser={handleCreateUser}
            onUpdateGeminiKey={(key) =>
              persistStore({ ...store, geminiApiKey: key }, 'profile-only')
            }
            onUpdateProfile={(next, rescore = false) =>
              updateActiveUserProfile(next, rescore)
            }
            onOpenA4Studio={() => handleSelectTab('resume')}
            onImportResume={handleImportParsedResume}
          />
        )}

        {/* TAB 4: RESUME STUDIO (AI) */}
        {activeTab === 'resume' && (
          <div className="mx-auto max-w-[1400px] print:m-0! print:max-w-none! print:p-0!">
            <A4ResumePreview
              profile={activeProfile}
              activeResume={tailoredResume || activeProfile.structuredResume}
              activeTailorJob={selectedJob}
              theme={store.theme}
              geminiApiKey={store.geminiApiKey || ''}
              personalApiConfigured={personalApiConfigured}
              tailoring={tailoring}
              resumeRecords={resumeRecords}
              onUpdateGeminiKey={(key) =>
                persistStore({ ...store, geminiApiKey: key }, 'profile-only')
              }
              onTailorResume={(job, role) => void handleTailorInStudio(job, role)}
              onSaveSnapshot={handleSaveResumeSnapshot}
              onImportResume={handleImportParsedResume}
              onUpdateResumeRecord={handleUpdateResumeRecord}
              onDeleteResumeRecord={handleDeleteResumeRecord}
              onApplyToProfile={handleApplyResumeToProfile}
              onSelectResumeVersion={(selected) => setTailoredResume(selected)}
              onUpdateResume={(nextResume) => {
                setTailoredResume(nextResume);
                if (nextResume.tailorMethod === 'base') {
                  updateActiveUserProfile(
                    {
                      ...activeProfile,
                      structuredResume: nextResume,
                      resumeText: resumeToPlainText(nextResume),
                    },
                    false
                  );
                } else {
                  updateActiveUserProfile(
                    {
                      ...activeProfile,
                      structuredResume: {
                        ...activeProfile.structuredResume,
                        pageSize: nextResume.pageSize || 'a4',
                        density: nextResume.density || 'standard',
                        fontFamily: nextResume.fontFamily || 'calibri',
                        fitOnePage: nextResume.fitOnePage,
                      },
                    },
                    false
                  );
                }
              }}
              onResetResume={() => setTailoredResume(null)}
            />
          </div>
        )}

        {/* TAB 5: ADMIN CONTROL CENTER */}
        {activeTab === 'admin' && authUser?.isAdmin && (
          <AdminDashboardView theme={store.theme} authUser={authUser} />
        )}
          </>
        )}
      </main>

      {/* STEP-BY-STEP APPLY & RESUME STUDIO AI MODAL */}
      <ApplyFlowModal
        job={applyModalJob}
        profile={activeProfile}
        theme={store.theme}
        geminiApiKey={store.geminiApiKey || ''}
        personalApiConfigured={personalApiConfigured}
        onClose={() => setApplyModalJob(null)}
        onMarkApplied={(id, tailoredResumeId) =>
          handleUpdateJobStatus(id, 'applied', tailoredResumeId)
        }
        onUpdateGeminiKey={(key) =>
          persistStore({ ...store, geminiApiKey: key }, 'profile-only')
        }
      />

      {/* RIGHT-SIDE SETTINGS, ROLES & DESKTOP APP SIDEPANEL */}
      <SettingsSidepanel
        isOpen={settingsOpen}
        section={settingsSection}
        onChangeSection={setSettingsSection}
        theme={store.theme}
        profile={activeProfile}
        autoApplyConfig={autoApplyConfig}
        isDesktopApp={isDesktopApp}
        isAdmin={Boolean(authUser?.isAdmin)}
        storageMode={storageMode}
        onClose={() => setSettingsOpen(false)}
        onSaveProfile={(next, rescore = false) =>
          updateActiveUserProfile(next, rescore)
        }
        onSaveAutoApplyConfig={(next) =>
          persistStore({ ...store, autoApplyConfig: next }, 'profile-only', {
            immediate: true,
          })
        }
      />

      {/* HOW JOB FINDING WORKS MODAL */}
      <HowItWorksModal
        isOpen={howItWorksOpen}
        theme={store.theme}
        onClose={() => setHowItWorksOpen(false)}
      />

      {/* CUSTOMER-FRIENDLY WHAT'S NEW CHANGELOG MODAL */}
      <ChangelogModal
        isOpen={changelogOpen}
        theme={store.theme}
        onClose={() => setChangelogOpen(false)}
      />

      {/* SAVED SEARCHES DIALOG */}
      <SavedSearchesDialog
        isOpen={savedSearchesOpen}
        theme={store.theme}
        savedSearches={activeProfile.savedSearches || []}
        currentQueryLabel={`${roleDraft.trim() || activeProfile.primaryRole}${
          companyDraft.trim() ? ` at ${companyDraft.trim()}` : ''
        } • ${activeProfile.location || COUNTRY_CONFIGS[activeProfile.country]?.defaultLocation || ''}`}
        onClose={() => setSavedSearchesOpen(false)}
        onSaveCurrentSearch={handleSaveCurrentSearch}
        onRunSearch={handleRunSavedSearch}
        onDeleteSearch={handleDeleteSavedSearch}
      />
    </div>
  );
}

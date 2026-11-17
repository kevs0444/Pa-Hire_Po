'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowUp,
  ArrowUpDown,
  Briefcase,
  Calendar,
  Clock,
  Compass,
  Filter,
  Search,
  SlidersHorizontal,
  Trash2,
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
  ScanSourceMeta,
  StructuredResume,
  TailoredResumeRecord,
  UserProfile,
} from '@/types/job';
import {
  filterJobsByDate,
  formatJobDateLabel,
  sortJobs,
} from '@/features/jobs/lib/job-date-utils';
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
import { HowItWorksModal } from '@/features/jobs/components/HowItWorksModal';
import { JobDetailPane } from '@/features/jobs/components/JobDetailPane';
import { TopChoicesSpotlight } from '@/features/jobs/components/TopChoicesSpotlight';
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
import { LandingPageView } from '@/components/LandingPageView';
import { AppTopNavbar } from '@/components/layout/AppTopNavbar';
import { BoardLogo } from '@/components/ui/BrandLogos';
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
  const [lastSearchedRoles, setLastSearchedRoles] = useState<
    { role: string; isPivot: boolean }[]
  >([]);

  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
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

  const initialAutoScanRan = useRef(false);
  const scanInFlightRef = useRef(false);
  const authUserIdRef = useRef<string | null>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const storeRef = useRef<AppStoreState>(store);
  const detailPaneRef = useRef<HTMLDivElement | null>(null);
  const jobListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    storeRef.current = store;
  }, [store]);

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
    (nextProfile: UserProfile, rescore = true) => {
      setRoleDraft(nextProfile.primaryRole);
      const prev = storeRef.current;
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
      storeRef.current = nextState;
      setStore(nextState);
      saveLocalState(nextState, authUserIdRef.current);
      void syncStateToServer(nextState, rescore ? 'full' : 'profile-only');
    },
    []
  );

  const runJobScan = useCallback(
    async (overrideProfile?: UserProfile, explicitRoles?: string[]) => {
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

        // Read latest state from storeRef AFTER await so any Save/Applied/Hidden clicks
        // made while the scrape was in-flight are strictly preserved.
        const prev = storeRef.current;
        const existingById = new Map(prev.jobs.map((j) => [j.id, j]));
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
          pushNotification({
            kind: 'scan',
            title: 'Job search updated',
            detail: `Found ${incoming.length} listings for ${searchedRoles.map((r) => r.role).slice(0, 2).join(', ')}.`,
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
        setCountdown(AUTO_REFRESH_INTERVAL_SECONDS);
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
      setCountdown((prev) => {
        if (prev <= 1) {
          void runJobScan();
          return AUTO_REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hydrated, runJobScan]);

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
        savedAt: status === 'saved' ? j.savedAt || nowIso : null,
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

    const nextState: AppStoreState = { ...prev, jobs: nextJobs };
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
      applicationStage?: ApplicationStage;
      applicationNotes?: string;
      tailoredResumeId?: string | null;
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
        savedAt: nextStatus === 'saved' ? j.savedAt || nowIso : null,
        appliedAt: nextStatus === 'applied' ? j.appliedAt || nowIso : null,
        hiddenAt: nextStatus === 'hidden' ? j.hiddenAt || nowIso : null,
      };
      return updatedJob;
    });

    const nextState: AppStoreState = { ...prev, jobs: nextJobs };
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
    notes: string;
    resume: StructuredResume;
  }) => {
    const nowIso = new Date().toISOString();
    const jobId = `ext-${Date.now().toString(36)}`;
    const inferredSource =
      payload.resume.tailorMethod === 'gemini-ai'
        ? 'ai-tailor'
        : payload.resume.tailorMethod === 'smart-engine'
          ? 'smart-engine'
          : 'base';
    setDbSyncCount((c) => c + 1);
    try {
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

      const newJob: JobListing = {
        id: jobId,
        title: payload.title,
        company: payload.company,
        location: activeProfile.location || 'Remote',
        source: payload.source,
        url: payload.url || '#',
        postedAt: nowIso,
        salary: activeProfile.salaryExpectation || null,
        description:
          payload.notes ||
          `External application logged for ${payload.company}.`,
        workType: activeProfile.workType || 'any',
        searchedRole: payload.title,
        isPivotSuggestion: false,
        experienceRequired: 'Open / Not Specified',
        experienceFit: 'fit',
        matchScore: 85,
        matchedSkills: activeProfile.skills.slice(0, 4),
        missingSkills: [],
        matchReason: 'External application logged by user',
        tailoringTips: [],
        status: 'applied',
        discoveredAt: nowIso,
        appliedAt: nowIso,
        applicationStage: 'applied',
        applicationNotes: payload.notes,
        tailoredResumeId: snapshotData?.record?.id || null,
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
        title: 'External application logged',
        detail: `${payload.title} at ${payload.company}`,
        targetTab: 'applications',
        targetJobId: jobId,
      });
    } finally {
      setDbSyncCount((c) => Math.max(0, c - 1));
    }
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

  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matched = store.jobs.filter((job) => {
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

    const dateFiltered = filterJobsByDate(
      matched,
      dateFilter,
      clientNow ?? undefined
    );
    return sortJobs(dateFiltered, sortBy, clientNow ?? undefined);
  }, [
    clientNow,
    dateFilter,
    fitFilter,
    minScore,
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

  // Civic Career Utility theme tokens (Light / Dark Slate)
  const {
    isDark,
    pageBg,
    cardSurface,
    subSurface,
    inputSurface,
    primaryBtn,
    secondaryBtn,
    selectedCard,
    mutedText,
    strongText,
    borderSubtle,
  } = getThemeTokens(theme);

  useEffect(() => {
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark]);

  return (
    <div
      className={cn('min-h-screen transition-colors', pageBg)}
      style={{ colorScheme: isDark ? 'dark' : 'light' }}
    >
      <AppTopNavbar
        theme={theme}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeProfile={activeProfile}
        isDesktopApp={isDesktopApp}
        hydrated={hydrated}
        activeJobsCount={activeJobsCount}
        appliedCount={store.jobs.filter((j) => j.status === 'applied').length}
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

      <main className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6">
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

        {/* TAB 0: OVERVIEW */}
        {activeTab === 'home' && (
          <LandingPageView
            theme={theme}
            onChangeTheme={(nextTheme) =>
              persistStore(
                {
                  ...store,
                  theme: nextTheme,
                },
                'profile-only'
              )
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
            onOpenSettingsSection={(sec) => {
              setSettingsSection(sec);
              setSettingsOpen(true);
            }}
          />
        )}

        {/* TAB 1: JOBSTREET-INSPIRED FIND JOBS VIEW */}
        {activeTab === 'jobs' && (
          <div className="no-print space-y-4">
            {/* Search Banner */}
            <section className={cn('space-y-3 rounded-lg border p-4', cardSurface)}>
              <div className="grid gap-3 lg:grid-cols-12">
                {/* WHAT */}
                <div className="lg:col-span-5">
                  <label className={cn('mb-1 block text-xs font-medium', mutedText)}>
                    Role or keyword
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
                      placeholder="Data Analyst / Junior Data Analyst, BI Analyst, Junior Data Engineer..."
                      className={cn('w-full rounded-lg border py-2 pl-9 pr-3 text-xs font-medium focus:outline-none', inputSurface)}
                    />
                  </div>
                </div>

                {/* WHERE */}
                <div className="lg:col-span-5">
                  <label className={cn('mb-1 block text-xs font-medium', mutedText)}>
                    Location
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
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
                      className={cn('w-full rounded-lg border px-2.5 py-2 text-xs font-medium focus:outline-none sm:w-auto', inputSurface)}
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
                      className={cn('min-w-0 flex-1 rounded-lg border px-3 py-2 text-xs focus:outline-none', inputSurface)}
                    />
                  </div>
                </div>

                {/* SEARCH ACTION (Auto-refresh runs silently every 1m + on page load) */}
                <div className="flex flex-col justify-end lg:col-span-2">
                  <button
                    type="button"
                    disabled={scanning}
                    onClick={() => handleApplyPrimaryRole(roleDraft, true)}
                    className={cn(
                      'inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs transition-colors disabled:opacity-60',
                      primaryBtn
                    )}
                  >
                    <Search className="h-3.5 w-3.5" />
                    {scanning ? 'Searching...' : 'Search Jobs'}
                  </button>
                </div>
              </div>

              {/* Desired Role Quick Chips + Board Logo Statuses */}
              <div className={cn('flex flex-col gap-3 border-t pt-3 lg:flex-row lg:items-center lg:justify-between', borderSubtle)}>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={cn('mr-1 text-xs font-medium', mutedText)}>
                    Target roles:
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
                          'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                          isCurrent ? primaryBtn : secondaryBtn
                        )}
                      >
                        {role}
                      </button>
                    );
                  })}

                  <label className={cn('ml-2 inline-flex cursor-pointer items-center gap-1.5 text-xs', mutedText)}>
                    <input
                      type="checkbox"
                      checked={activeProfile.autoPivotRoles}
                      onChange={(e) =>
                        updateActiveUserProfile({
                          ...activeProfile,
                          autoPivotRoles: e.target.checked,
                        })
                      }
                      className="h-3.5 w-3.5"
                    />
                    <span>Pivot Mode</span>
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
                          'inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs transition-opacity',
                          enabled ? secondaryBtn : 'border-slate-300 opacity-50'
                        )}
                        title="Toggle searching this board"
                      >
                        <BoardLogo source={board} theme={theme} size="sm" />
                        {meta && (
                          <span
                            className={cn(
                              'rounded px-1.5 py-0.5 font-mono text-[11px] font-medium',
                              meta.status === 'live'
                                ? isDark
                                  ? 'bg-emerald-950/60 text-emerald-300'
                                  : 'bg-emerald-50 text-emerald-800'
                                : subSurface
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

              {(lastSearchedRoles.length > 0 || hydrated) && (
                <div className={cn('flex flex-wrap items-center justify-between gap-2 text-xs', mutedText)}>
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 shrink-0" />
                    {lastSearchedRoles.length > 0 && (
                      <span>
                        Last queried:{' '}
                        {lastSearchedRoles
                          .map((r) => `${r.role}${r.isPivot ? ' (Pivot)' : ''}`)
                          .join(' • ')}
                      </span>
                    )}
                    <strong className="font-semibold">
                      {lastSearchedRoles.length > 0 ? '• ' : ''}Auto-refreshes every 1m (next in {countdown}s)
                    </strong>
                  </span>
                  {store.lastScannedAt && hydrated && (
                    <span>
                      Updated {new Date(store.lastScannedAt).toLocaleTimeString()} •{' '}
                      {authUser?.isAdmin
                        ? storageMode === 'supabase-cloud'
                          ? 'Supabase Cloud'
                          : storageMode === 'local-file'
                            ? 'Local + Browser'
                            : 'Browser'
                        : 'Cloud Synced'}
                    </span>
                  )}
                </div>
              )}

              {scanError && (
                <p
                  className={cn(
                    'rounded-lg border px-3 py-2 text-xs font-medium',
                    isDark
                      ? 'border-red-500/40 bg-red-950/50 text-red-300'
                      : 'border-red-300 bg-red-50 text-red-700'
                  )}
                >
                  {scanError}
                </p>
              )}
            </section>

            {/* RECOMMENDED TOP 3 */}
            <TopChoicesSpotlight
              choices={top3Choices}
              selectedJobId={selectedJob?.id || null}
              activeProfileName={activeProfile.name}
              experienceLevel={activeProfile.experienceLevel}
              theme={theme}
              queuedJobIds={queuedJobIds}
              onSelectJob={(id) => {
                setSelectedJobId(id);
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  requestAnimationFrame(() => {
                    detailPaneRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                  });
                }
              }}
              onOpenApplyModal={(job) => setApplyModalJob(job)}
              onToggleQueueJob={handleToggleQueueJob}
            />

            {/* FILTER BAR */}
            <section className={cn('space-y-2.5 rounded-lg border px-3 py-2.5', cardSurface)}>
              {/* Row 1 (Always Visible): Status Tabs + Mobile Filter Toggle */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-1 flex-nowrap items-center gap-1.5 overflow-x-auto pb-0.5 sm:flex-wrap sm:pb-0">
                  {(
                    [
                      { key: 'active', label: 'All Active', count: activeJobsCount },
                      {
                        key: 'saved',
                        label: 'Saved',
                        count: store.jobs.filter((j) => j.status === 'saved').length,
                      },
                      {
                        key: 'applied',
                        label: 'Applied',
                        count: store.jobs.filter((j) => j.status === 'applied').length,
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
                      onClick={() => setStatusFilter(t.key)}
                      className={cn(
                        'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
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

                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen((v) => !v)}
                  aria-expanded={mobileFiltersOpen}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium sm:hidden',
                    mobileFiltersOpen ||
                      sourceFilter !== 'all' ||
                      fitFilter !== 'all' ||
                      dateFilter !== 'all' ||
                      sortBy !== 'match' ||
                      minScore > 0 ||
                      searchQuery.trim()
                      ? primaryBtn
                      : secondaryBtn
                  )}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Filters</span>
                </button>
              </div>

              {/* Row 2 (Collapsible on Mobile, Always Open on sm+) */}
              <div
                className={cn(
                  'flex-col gap-2.5 border-t pt-2.5 lg:flex-row lg:items-center lg:justify-between',
                  borderSubtle,
                  mobileFiltersOpen ? 'flex' : 'hidden sm:flex'
                )}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSourceFilter('all')}
                    className={cn(
                      'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
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
                        'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
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
                      'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                      fitFilter === 'applicable' ? primaryBtn : secondaryBtn
                    )}
                  >
                    {fitFilter === 'applicable'
                      ? '✓ Applicable Exp Only'
                      : 'Entry / Applicable Exp'}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
                  <div className="relative">
                    <Search className={cn('pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5', mutedText)} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter results..."
                      className={cn('w-full rounded-lg border py-1.5 pl-8 pr-3 text-xs focus:outline-none sm:w-44', inputSurface)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                    {/* DATE RECENCY FILTER */}
                    <div className="relative flex items-center">
                      <Calendar className={cn('pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5', mutedText)} />
                      <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value as DateFilterOption)}
                        aria-label="Filter jobs by date posted"
                        className={cn(
                          'w-full rounded-lg border py-1.5 pl-8 pr-2 text-xs font-medium focus:outline-none sm:w-auto',
                          inputSurface
                        )}
                      >
                        <option value="all">All Dates</option>
                        <option value="24h">Past 24 Hours / Today</option>
                        <option value="7d">Past Week</option>
                        <option value="30d">Past Month</option>
                      </select>
                    </div>

                    {/* SORT STRATEGY */}
                    <div className="relative flex items-center">
                      <ArrowUpDown className={cn('pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5', mutedText)} />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as JobSortOption)}
                        aria-label="Sort jobs"
                        className={cn(
                          'w-full rounded-lg border py-1.5 pl-8 pr-2 text-xs font-medium focus:outline-none sm:w-auto',
                          inputSurface
                        )}
                      >
                        <option value="match">Sort: Best Match</option>
                        <option value="newest">Sort: Newest First</option>
                        <option value="oldest">Sort: Oldest First</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <label className={cn('flex flex-1 items-center gap-1.5 text-xs', mutedText)}>
                      <Filter className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-mono text-[11px] tabular-nums">Min {minScore}%</span>
                      <input
                        type="range"
                        min={0}
                        max={80}
                        step={5}
                        value={minScore}
                        onChange={(e) => setMinScore(Number(e.target.value))}
                        className="w-full max-w-[140px] sm:w-20"
                      />
                    </label>

                    {store.jobs.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const queuedSet = new Set(queuedJobIds);
                          const kept = store.jobs.filter(
                            (j) =>
                              j.status === 'saved' ||
                              j.status === 'applied' ||
                              j.status === 'hidden' ||
                              queuedSet.has(j.id)
                          );
                          persistStore({ ...store, jobs: kept }, 'full', {
                            immediate: true,
                          });
                        }}
                        className={cn('inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium', secondaryBtn)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* JOBSTREET 2-COLUMN MASTER-DETAIL EXPLORER */}
            <section className="grid items-start gap-5 lg:grid-cols-12">
              {/* LEFT COLUMN: JOB LIST */}
              <div ref={jobListRef} className="space-y-2 lg:col-span-5">
                {store.jobs.length > 0 && (
                  <div className={cn('flex items-center justify-between px-1 text-xs', mutedText)}>
                    <span>
                      Showing <strong className={strongText}>{filteredJobs.length}</strong> of{' '}
                      {store.jobs.length} jobs
                    </span>
                    <span className="font-mono text-[11px]">
                      {sortBy === 'newest'
                        ? 'Newest first'
                        : sortBy === 'oldest'
                          ? 'Oldest first'
                          : 'Best match'}
                      {dateFilter !== 'all' && (
                        <> • {dateFilter === '24h' ? 'Past 24h' : dateFilter === '7d' ? 'Past week' : 'Past month'}</>
                      )}
                    </span>
                  </div>
                )}

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
                    <p className="text-sm font-semibold">No matching jobs yet</p>
                    <p className={cn('text-xs', mutedText)}>
                      Click &ldquo;Search Jobs&rdquo; to search LinkedIn, JobStreet, and Indeed.
                    </p>
                    <button
                      type="button"
                      onClick={() => void runJobScan()}
                      className={cn('rounded-lg px-4 py-2 text-xs', primaryBtn)}
                    >
                      Search Jobs
                    </button>
                  </div>
                ) : (
                  filteredJobs.map((job) => {
                    const isSelected = selectedJob?.id === job.id;
                    const matchBadgeTone =
                      job.matchScore >= 75
                        ? isDark
                          ? 'border-zinc-700 bg-zinc-800 text-zinc-100 font-semibold'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : job.matchScore >= 55
                          ? isDark
                            ? 'border-zinc-800 bg-zinc-800/60 text-zinc-300'
                            : 'border-blue-200 bg-blue-50 text-[#0a66c2]'
                          : isDark
                            ? 'border-zinc-800 bg-zinc-900 text-zinc-400'
                            : 'border-slate-200 bg-slate-100 text-slate-700';

                    return (
                      <article
                        key={job.id}
                        onClick={() => {
                          setSelectedJobId(job.id);
                          if (
                            typeof window !== 'undefined' &&
                            window.innerWidth < 1024
                          ) {
                            requestAnimationFrame(() => {
                              detailPaneRef.current?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                              });
                            });
                          }
                        }}
                        className={cn(
                          'cursor-pointer space-y-2 rounded-lg border p-3.5 transition-colors',
                          isSelected ? selectedCard : cardSurface
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <BoardLogo source={job.source} theme={theme} size="sm" />
                            {job.isPivotSuggestion && (
                              <span className={cn('inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium', secondaryBtn)}>
                                <Compass className="h-3 w-3" />
                                Pivot
                              </span>
                            )}
                            {job.status === 'saved' && (
                              <span
                                className={cn(
                                  'rounded border px-1.5 py-0.5 text-[11px] font-semibold',
                                  isDark
                                    ? 'border-blue-700/70 bg-blue-950/60 text-blue-300'
                                    : 'border-blue-200 bg-blue-50 text-[#0a66c2]'
                                )}
                              >
                                Saved
                              </span>
                            )}
                            {job.status === 'applied' && (
                              <span
                                className={cn(
                                  'rounded border px-1.5 py-0.5 text-[11px] font-semibold',
                                  isDark
                                    ? 'border-emerald-700/70 bg-emerald-950/60 text-emerald-300'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                )}
                              >
                                Applied
                              </span>
                            )}
                          </div>
                          <span className={cn('rounded border px-2 py-0.5 font-mono text-xs font-medium tabular-nums', matchBadgeTone)}>
                            {job.matchScore >= 75 ? `✓ ${job.matchScore}%` : `${job.matchScore}%`}
                          </span>
                        </div>

                        <div>
                          <h3 className={cn('text-[15px] font-semibold leading-snug', strongText)}>
                            {job.title}
                          </h3>
                          <p className={cn('mt-0.5 text-xs font-medium', mutedText)}>
                            {job.company} • {job.location}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span
                            className={cn(
                              'rounded border px-2 py-0.5 text-[11px] font-medium',
                              job.experienceFit === 'senior-warning'
                                ? cn('border-dashed', borderSubtle, mutedText)
                                : subSurface
                            )}
                          >
                            Exp: {job.experienceRequired}
                          </span>
                          {job.salary && (
                            <span className={cn('font-mono text-[11px] font-medium', mutedText)}>
                              {job.salary}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                          <div className="flex flex-wrap gap-1">
                            {job.matchedSkills.slice(0, 3).map((s) => (
                              <span
                                key={s}
                                className={cn('rounded border px-1.5 py-0.5 text-[11px] font-medium', subSurface)}
                              >
                                ✓ {s}
                              </span>
                            ))}
                          </div>
                          <span
                            className={cn('inline-flex items-center gap-1 font-mono text-[11px]', mutedText)}
                            title={`Posted: ${job.postedAt}`}
                          >
                            <Clock className="h-3 w-3 opacity-70" />
                            {formatJobDateLabel(job, clientNow ?? undefined)}
                          </span>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>

              {/* RIGHT COLUMN: STICKY JOB DETAILS PANE */}
              <div
                ref={detailPaneRef}
                className="scroll-mt-20 space-y-2 lg:sticky lg:top-16 lg:col-span-7"
              >
                <div className="flex justify-end lg:hidden">
                  <button
                    type="button"
                    onClick={() =>
                      jobListRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      })
                    }
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium',
                      secondaryBtn
                    )}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                    Back to Job List
                  </button>
                </div>
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

        {/* TAB 1B: APPLIED COMPANIES & EDITED RESUMES COMPILATION */}
        {activeTab === 'applications' && (
          <ApplicationsCompilationView
            theme={store.theme}
            profile={activeProfile}
            jobs={store.jobs}
            resumeRecords={resumeRecords}
            loadingResumes={loadingResumes}
            onRefreshResumes={loadResumeHistory}
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
            onUpdateProfile={(next) => updateActiveUserProfile(next, true)}
            onOpenA4Studio={() => setActiveTab('resume')}
            onImportResume={handleImportParsedResume}
          />
        )}

        {/* TAB 4: RESUME STUDIO (AI) */}
        {activeTab === 'resume' && (
          <div className="mx-auto max-w-[1400px]">
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
                  updateActiveUserProfile({
                    ...activeProfile,
                    structuredResume: nextResume,
                    resumeText: resumeToPlainText(nextResume),
                  });
                } else {
                  updateActiveUserProfile(
                    {
                      ...activeProfile,
                      structuredResume: {
                        ...activeProfile.structuredResume,
                        pageSize: nextResume.pageSize || 'a4',
                        density: nextResume.density || 'standard',
                        fontFamily: nextResume.fontFamily || 'calibri',
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
    </div>
  );
}

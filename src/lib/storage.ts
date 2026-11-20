import {
  AppStoreState,
  AuthSessionUser,
  JobListing,
  UserProfile,
} from '@/types/job';
import { createBlankUserProfile } from '@/lib/default-profile';
import { pruneStateForFreeTier } from '@/lib/supabase/free-tier-limits';

const STORAGE_KEY_PREFIX = 'pahirepo_state_v1';
const LEGACY_STORAGE_KEY = 'pleasehireme_state_v2';

function createNeutralStarterProfile(): UserProfile {
  return createBlankUserProfile({
    id: 'starter-profile',
    name: 'Applicant',
    email: '',
    primaryRole: 'Data Analyst / Junior Data Analyst',
  });
}

function getStorageKey(userId?: string | null): string {
  return userId ? `${STORAGE_KEY_PREFIX}:${userId}` : STORAGE_KEY_PREFIX;
}

export function getDefaultStoreState(): AppStoreState {
  const starter = createNeutralStarterProfile();
  return {
    users: [starter],
    activeUserId: starter.id,
    theme: 'light',
    geminiApiKey: '',
    jobs: [],
    queuedJobIds: [],
    scanHistory: [],
    lastScannedAt: null,
  };
}

export function getActiveUser(state: AppStoreState): UserProfile {
  return (
    state.users.find((u) => u.id === state.activeUserId) ||
    state.users[0] ||
    createNeutralStarterProfile()
  );
}

export function normalizeStoreState(
  raw: Partial<AppStoreState> & { profile?: Partial<UserProfile> }
): AppStoreState {
  const defaults = getDefaultStoreState();
  const neutralTemplate = createNeutralStarterProfile();
  const users: UserProfile[] =
    Array.isArray(raw.users) && raw.users.length > 0
      ? raw.users.map((u) => {
          const merged: UserProfile = {
            ...neutralTemplate,
            ...u,
            structuredResume: {
              ...neutralTemplate.structuredResume,
              ...(u.structuredResume || {}),
            },
          };

          if (merged.id === 'mar-kevin-alcantara') {
            const legacyDefaults = new Set([
              'Data Analyst',
              'Junior Data Engineer',
            ]);
            const normalizedPrimaryRole =
              !merged.primaryRole?.trim() ||
              legacyDefaults.has(merged.primaryRole.trim())
                ? 'Data Analyst / Junior Data Analyst'
                : merged.primaryRole;
            const normalizedTitle =
              !merged.title?.trim() || legacyDefaults.has(merged.title.trim())
                ? 'Data Analyst / Junior Data Analyst'
                : merged.title;

            return {
              ...merged,
              title: normalizedTitle,
              primaryRole: normalizedPrimaryRole,
              preferredRoles: Array.from(
                new Set([
                  'Data Analyst / Junior Data Analyst',
                  ...(Array.isArray(merged.preferredRoles)
                    ? merged.preferredRoles
                    : [normalizedPrimaryRole]),
                ])
              ).filter(Boolean),
            };
          }

          return merged;
        })
      : [neutralTemplate];

  const activeUserId = users.some((u) => u.id === raw.activeUserId)
    ? (raw.activeUserId as string)
    : users[0].id;

  return {
    users,
    activeUserId,
    theme: raw.theme === 'dark' ? 'dark' : 'light',
    geminiApiKey: raw.geminiApiKey ?? defaults.geminiApiKey,
    jobs: Array.isArray(raw.jobs)
      ? raw.jobs.map((j) => ({
          ...j,
          experienceRequired: j.experienceRequired || 'Open / Not Specified',
          experienceFit: j.experienceFit || 'fit',
          savedAt: j.savedAt ?? null,
          appliedAt: j.appliedAt ?? null,
          hiddenAt: j.hiddenAt ?? null,
          applicationStage: j.applicationStage || 'applied',
          applicationNotes: j.applicationNotes || '',
          tailoredResumeId: j.tailoredResumeId ?? null,
          statusUpdatedAt: j.statusUpdatedAt ?? null,
        }))
      : [],
    queuedJobIds: Array.isArray(raw.queuedJobIds) ? raw.queuedJobIds : [],
    autoApplyConfig: raw.autoApplyConfig,
    scanHistory: Array.isArray(raw.scanHistory) ? raw.scanHistory : [],
    lastScannedAt: raw.lastScannedAt ?? null,
  };
}

export function loadLocalState(userId?: string | null): AppStoreState {
  if (typeof window === 'undefined') {
    return getDefaultStoreState();
  }

  try {
    const raw =
      window.localStorage.getItem(getStorageKey(userId)) ||
      (userId ? null : window.localStorage.getItem(STORAGE_KEY_PREFIX)) ||
      (userId ? null : window.localStorage.getItem(LEGACY_STORAGE_KEY));
    if (!raw) return getDefaultStoreState();
    const parsed = JSON.parse(raw) as Partial<AppStoreState>;
    return normalizeStoreState(parsed);
  } catch {
    return getDefaultStoreState();
  }
}

export function saveLocalState(
  state: AppStoreState,
  userId?: string | null
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

let pendingLocalSaveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingLocalSavePayload: {
  state: AppStoreState;
  userId?: string | null;
} | null = null;

export function saveLocalStateDebounced(
  state: AppStoreState,
  userId?: string | null,
  delayMs = 450
): void {
  if (typeof window === 'undefined') return;
  pendingLocalSavePayload = { state, userId };
  if (pendingLocalSaveTimer) {
    clearTimeout(pendingLocalSaveTimer);
  }
  pendingLocalSaveTimer = setTimeout(() => {
    pendingLocalSaveTimer = null;
    const latest = pendingLocalSavePayload;
    pendingLocalSavePayload = null;
    if (latest) {
      saveLocalState(latest.state, latest.userId);
    }
  }, delayMs);
}

export function clearLegacyUnscopedLocalState(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY_PREFIX);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export async function fetchServerState(): Promise<{
  state: AppStoreState | null;
  storageMode: string;
  personalApiConfigured: boolean;
  authUser: AuthSessionUser | null;
  unauthorized: boolean;
  schemaReady: boolean;
}> {
  try {
    const res = await fetch('/api/state', { cache: 'no-store' });
    if (res.status === 401) {
      return {
        state: null,
        storageMode: 'unauthenticated',
        personalApiConfigured: false,
        authUser: null,
        unauthorized: true,
        schemaReady: false,
      };
    }
    if (!res.ok) {
      return {
        state: null,
        storageMode: 'browser-only',
        personalApiConfigured: false,
        authUser: null,
        unauthorized: false,
        schemaReady: false,
      };
    }
    const data = (await res.json()) as {
      exists?: boolean;
      state?: Partial<AppStoreState> | null;
      storageMode?: string;
      personalApiConfigured?: boolean;
      authUser?: AuthSessionUser | null;
      schemaReady?: boolean;
    };
    return {
      state: data.exists && data.state ? normalizeStoreState(data.state) : null,
      storageMode: data.storageMode || 'browser-only',
      personalApiConfigured: Boolean(data.personalApiConfigured),
      authUser: data.authUser || null,
      unauthorized: false,
      schemaReady: Boolean(data.schemaReady),
    };
  } catch {
    return {
      state: null,
      storageMode: 'browser-only',
      personalApiConfigured: false,
      authUser: null,
      unauthorized: false,
      schemaReady: false,
    };
  }
}

let pendingSyncTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSyncState: AppStoreState | null = null;
let pendingSyncScope: 'full' | 'profile-only' = 'profile-only';
let pendingSyncResolvers: Array<(mode: string) => void> = [];

async function flushPendingSync(): Promise<string> {
  const payload = pendingSyncState;
  const effectiveScope = pendingSyncScope;
  const resolvers = pendingSyncResolvers;
  pendingSyncTimer = null;
  pendingSyncState = null;
  pendingSyncScope = 'profile-only';
  pendingSyncResolvers = [];

  if (!payload) {
    resolvers.forEach((r) => r('browser-only'));
    return 'browser-only';
  }

  try {
    // Do NOT set keepalive: true on full-state sync; payloads with 150 jobs exceed
    // the browser's 64 KiB keepalive limit and get silently rejected.
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, _syncScope: effectiveScope }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      storageMode?: string;
      saved?: boolean;
    };
    const mode = res.ok ? data.storageMode || 'browser-only' : 'browser-only';
    resolvers.forEach((r) => r(mode));
    return mode;
  } catch {
    resolvers.forEach((r) => r('browser-only'));
    return 'browser-only';
  }
}

export async function syncSingleJobToServer(job: JobListing): Promise<{
  saved: boolean;
  storageMode: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/jobs/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({ job }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      saved?: boolean;
      storageMode?: string;
      error?: string;
    };
    return {
      saved: res.ok && Boolean(data.saved),
      storageMode: data.storageMode || 'browser-only',
      error: data.error,
    };
  } catch (err) {
    return {
      saved: false,
      storageMode: 'browser-only',
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

/**
 * Ensures any pending debounced full-state sync reflects the latest single-job status update
 * so an older queued scan payload never overwrites saved/applied/hidden changes.
 */
export function patchPendingSyncJob(updatedJob: JobListing): void {
  if (!pendingSyncState) return;
  const exists = pendingSyncState.jobs.some((j) => j.id === updatedJob.id);
  const nextJobs = exists
    ? pendingSyncState.jobs.map((j) => (j.id === updatedJob.id ? updatedJob : j))
    : [updatedJob, ...pendingSyncState.jobs];
  pendingSyncState = pruneStateForFreeTier({
    ...pendingSyncState,
    jobs: nextJobs,
  });
}

export function syncStateToServer(
  state: AppStoreState,
  syncScope: 'full' | 'profile-only' = 'full',
  options?: { immediate?: boolean }
): Promise<string> {
  pendingSyncState = pruneStateForFreeTier(state);
  if (syncScope === 'full') {
    pendingSyncScope = 'full';
  }

  if (options?.immediate) {
    if (pendingSyncTimer) {
      clearTimeout(pendingSyncTimer);
      pendingSyncTimer = null;
    }
    return flushPendingSync();
  }

  return new Promise((resolve) => {
    pendingSyncResolvers.push(resolve);
    if (pendingSyncTimer) {
      clearTimeout(pendingSyncTimer);
    }

    pendingSyncTimer = setTimeout(() => {
      void flushPendingSync();
    }, 750);
  });
}

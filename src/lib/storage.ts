import {
  AppStoreState,
  AuthSessionUser,
  UserProfile,
} from '@/types/job';
import { MAR_KEVIN_PROFILE } from '@/lib/default-profile';
import { pruneStateForFreeTier } from '@/lib/supabase/free-tier-limits';

const STORAGE_KEY_PREFIX = 'pahirepo_state_v1';
const LEGACY_STORAGE_KEY = 'pleasehireme_state_v2';

function getStorageKey(userId?: string | null): string {
  return userId ? `${STORAGE_KEY_PREFIX}:${userId}` : STORAGE_KEY_PREFIX;
}

export function getDefaultStoreState(): AppStoreState {
  return {
    users: [MAR_KEVIN_PROFILE],
    activeUserId: MAR_KEVIN_PROFILE.id,
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
    MAR_KEVIN_PROFILE
  );
}

export function normalizeStoreState(
  raw: Partial<AppStoreState> & { profile?: Partial<UserProfile> }
): AppStoreState {
  const defaults = getDefaultStoreState();
  const users: UserProfile[] =
    Array.isArray(raw.users) && raw.users.length > 0
      ? raw.users.map((u) => {
          const merged: UserProfile = {
            ...MAR_KEVIN_PROFILE,
            ...u,
            structuredResume: {
              ...MAR_KEVIN_PROFILE.structuredResume,
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
                    : MAR_KEVIN_PROFILE.preferredRoles),
                ])
              ).filter(Boolean),
            };
          }

          return merged;
        })
      : [MAR_KEVIN_PROFILE];

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

export function syncStateToServer(
  state: AppStoreState,
  syncScope: 'full' | 'profile-only' = 'full'
): Promise<string> {
  pendingSyncState = pruneStateForFreeTier(state);
  if (syncScope === 'full') {
    pendingSyncScope = 'full';
  }

  return new Promise((resolve) => {
    pendingSyncResolvers.push(resolve);
    if (pendingSyncTimer) {
      clearTimeout(pendingSyncTimer);
    }

    pendingSyncTimer = setTimeout(async () => {
      const payload = pendingSyncState;
      const effectiveScope = pendingSyncScope;
      const resolvers = pendingSyncResolvers;
      pendingSyncTimer = null;
      pendingSyncState = null;
      pendingSyncScope = 'profile-only';
      pendingSyncResolvers = [];

      if (!payload) {
        resolvers.forEach((r) => r('browser-only'));
        return;
      }

      try {
        const res = await fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, _syncScope: effectiveScope }),
        });
        const data = (await res.json()) as { storageMode?: string };
        const mode = data.storageMode || 'browser-only';
        resolvers.forEach((r) => r(mode));
      } catch {
        resolvers.forEach((r) => r('browser-only'));
      }
    }, 750);
  });
}

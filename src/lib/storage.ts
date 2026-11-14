import { AppStoreState, UserProfile } from '@/types/job';
import { MAR_KEVIN_PROFILE } from '@/lib/default-profile';

const STORAGE_KEY = 'pahirepo_state_v1';
const LEGACY_STORAGE_KEY = 'pleasehireme_state_v2';

export function getDefaultStoreState(): AppStoreState {
  return {
    users: [MAR_KEVIN_PROFILE],
    activeUserId: MAR_KEVIN_PROFILE.id,
    theme: 'dark',
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
      ? raw.users.map((u) => ({
          ...MAR_KEVIN_PROFILE,
          ...u,
          structuredResume: {
            ...MAR_KEVIN_PROFILE.structuredResume,
            ...(u.structuredResume || {}),
          },
        }))
      : [MAR_KEVIN_PROFILE];

  const activeUserId = users.some((u) => u.id === raw.activeUserId)
    ? (raw.activeUserId as string)
    : users[0].id;

  return {
    users,
    activeUserId,
    theme:
      raw.theme === 'light' || raw.theme === 'orange' || raw.theme === 'dark'
        ? raw.theme
        : 'dark',
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

export function loadLocalState(): AppStoreState {
  if (typeof window === 'undefined') {
    return getDefaultStoreState();
  }

  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ||
      window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return getDefaultStoreState();
    const parsed = JSON.parse(raw) as Partial<AppStoreState>;
    return normalizeStoreState(parsed);
  } catch {
    return getDefaultStoreState();
  }
}

export function saveLocalState(state: AppStoreState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export async function fetchServerState(): Promise<{
  state: AppStoreState | null;
  storageMode: string;
}> {
  try {
    const res = await fetch('/api/state', { cache: 'no-store' });
    if (!res.ok) return { state: null, storageMode: 'browser-only' };
    const data = (await res.json()) as {
      exists?: boolean;
      state?: Partial<AppStoreState> | null;
      storageMode?: string;
    };
    return {
      state: data.exists && data.state ? normalizeStoreState(data.state) : null,
      storageMode: data.storageMode || 'browser-only',
    };
  } catch {
    return { state: null, storageMode: 'browser-only' };
  }
}

export async function syncStateToServer(state: AppStoreState): Promise<string> {
  try {
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
    const data = (await res.json()) as { storageMode?: string };
    return data.storageMode || 'browser-only';
  } catch {
    return 'browser-only';
  }
}

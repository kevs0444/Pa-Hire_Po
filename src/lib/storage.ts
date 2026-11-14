import { AppStoreState, DEFAULT_USER_PROFILE } from '@/types/job';

const STORAGE_KEY = 'pleasehireme_state_v1';

export function getDefaultStoreState(): AppStoreState {
  return {
    profile: DEFAULT_USER_PROFILE,
    jobs: [],
    scanHistory: [],
    lastScannedAt: null,
  };
}

export function loadLocalState(): AppStoreState {
  if (typeof window === 'undefined') {
    return getDefaultStoreState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultStoreState();
    const parsed = JSON.parse(raw) as Partial<AppStoreState>;
    return {
      profile: {
        ...DEFAULT_USER_PROFILE,
        ...(parsed.profile || {}),
      },
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
      scanHistory: Array.isArray(parsed.scanHistory) ? parsed.scanHistory : [],
      lastScannedAt: parsed.lastScannedAt ?? null,
    };
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
      state?: AppStoreState | null;
      storageMode?: string;
    };
    return {
      state: data.exists && data.state ? data.state : null,
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

import type { JobListing, JobSource } from './job';
import type { UserProfile } from './profile';

export type MonochromeTheme = 'dark' | 'light' | 'orange';

export interface ScanSourceMeta {
  source: JobSource;
  status: 'live' | 'fallback' | 'error';
  count: number;
  message?: string;
  durationMs: number;
}

export interface ScanHistoryEntry {
  id: string;
  timestamp: string;
  searchedRoles: string[];
  totalFound: number;
  newAdded: number;
  meta: ScanSourceMeta[];
}

export interface AutoApplyConfig {
  expectedSalary: string;
  noticePeriod: string;
  workAuthorization: string;
  willingToRelocate: string;
  autoTailorResume: boolean;
  humanReviewBeforeSubmit: boolean;
}

export interface AppStoreState {
  users: UserProfile[];
  activeUserId: string;
  theme: MonochromeTheme;
  geminiApiKey?: string;
  jobs: JobListing[];
  queuedJobIds?: string[];
  autoApplyConfig?: AutoApplyConfig;
  scanHistory: ScanHistoryEntry[];
  lastScannedAt: string | null;
}

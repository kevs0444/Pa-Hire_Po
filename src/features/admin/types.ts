import {
  AdminPlatformStats,
  AdminUserRecord,
  JobListing,
  ScanHistoryEntry,
  UserProfile,
  UserRole,
} from '@/types/job';

export interface SetupStatus {
  url: string;
  projectRef: string;
  anonKey: string;
  isConfigured: boolean;
  hasServiceRole: boolean;
  keyValid: boolean;
  schemaReady: boolean;
  enabledProviders: string[];
  message: string;
  vercelEnv?: string;
  personalApiConfigured?: boolean;
}

export interface AdminUsersApiResponse {
  mode: string;
  schemaReady: boolean;
  hasServiceRole: boolean;
  supabaseUrl: string;
  projectRef: string;
  stats: AdminPlatformStats;
  users: AdminUserRecord[];
}

export interface InspectedUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  isSuspended: boolean;
  resumeFileName: string | null;
  resumeFilePath: string | null;
  resumeDownloadUrl: string | null;
  lastActiveAt: string | null;
  createdAt: string | null;
  profile: UserProfile;
  jobs: JobListing[];
  scanHistory: ScanHistoryEntry[];
  tailoredResumes: {
    id: string;
    job_title: string | null;
    company: string | null;
    tailor_method: string | null;
    created_at: string;
  }[];
}

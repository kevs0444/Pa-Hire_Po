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
  anonKey: string;
  enabledProviders: string[];
  projectName?: string;
  projectRef?: string;
  isConfigured?: boolean;
  hasServiceRole?: boolean;
  keyValid?: boolean;
  schemaReady?: boolean;
  message?: string;
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

export type ServiceHealthLevel =
  | 'operational'
  | 'degraded'
  | 'outage'
  | 'maintenance'
  | 'unknown';

export interface ExternalComponentStatus {
  name: string;
  status: string;
}

export interface ExternalProviderStatus {
  provider: 'vercel' | 'supabase';
  statusPageUrl: string;
  indicator: 'none' | 'minor' | 'major' | 'critical' | 'unknown';
  description: string;
  level: ServiceHealthLevel;
  activeIncidentTitle: string | null;
  components: ExternalComponentStatus[];
  fetchedAt: string;
  reachable: boolean;
}

export interface PlatformStatusPayload {
  checkedAt: string;
  cached: boolean;
  vercel: {
    runtimeEnv: string;
    isVercelHosted: boolean;
    region: string | null;
    deploymentUrl: string | null;
    productionUrl: string | null;
    gitBranch: string | null;
    gitCommitSha: string | null;
    gitCommitMessage: string | null;
    keepAliveCron: string;
    tokenConfigured: boolean;
    latestDeploymentState: string | null;
    latestDeploymentCreatedAt: string | null;
    globalStatus: ExternalProviderStatus;
  };
  supabase: {
    projectName: string;
    projectRef: string;
    url: string;
    authProbe: {
      ok: boolean;
      latencyMs: number;
      providers: string[];
      detail: string;
    };
    dbProbe: {
      ok: boolean;
      schemaReady: boolean;
      latencyMs: number;
      detail: string;
    };
    storageProbe: {
      ok: boolean;
      bucketReady: boolean;
      latencyMs: number;
      detail: string;
    };
    hasServiceRole: boolean;
    globalStatus: ExternalProviderStatus;
  };
  readiness: {
    customDomainConfigured: boolean;
    oauthConfigured: boolean;
    geminiServerConfigured: boolean;
    keepAliveConfigured: boolean;
  };
}

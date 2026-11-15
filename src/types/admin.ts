import type { UserRole } from './auth';

export interface AdminUserRecord {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isSuspended: boolean;
  primaryRole: string;
  location: string;
  skillsCount: number;
  totalJobs: number;
  savedJobs: number;
  appliedJobs: number;
  scansCount: number;
  resumeFileName: string | null;
  resumeFilePath: string | null;
  provider: string;
  lastActiveAt: string | null;
  createdAt: string | null;
}

export interface FreeTierTelemetry {
  estimatedDbBytes: number;
  maxDbBytes: number;
  estimatedStorageFiles: number;
  maxSuggestedJobsPerUser: number;
  maxScanLogsPerUser: number;
  targetUsers: number;
  maxFreeMau: number;
  keepAliveCron: string;
}

export interface AdminPlatformStats {
  totalUsers: number;
  activeLast7d: number;
  adminUsers: number;
  suspendedUsers: number;
  totalJobsTracked: number;
  totalSavedJobs: number;
  totalAppliedJobs: number;
  totalScans: number;
  resumesStoredCount: number;
  freeTier?: FreeTierTelemetry;
}

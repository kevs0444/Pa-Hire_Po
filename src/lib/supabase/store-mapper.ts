import type { SupabaseClient } from '@supabase/supabase-js';
import {
  AppStoreState,
  ApplicationStage,
  AutoApplyConfig,
  JobListing,
  MonochromeTheme,
  ScanHistoryEntry,
  ScanSourceMeta,
  UserProfile,
} from '@/types/job';
import {
  MAR_KEVIN_PROFILE,
  createBlankUserProfile,
} from '@/lib/default-profile';
import {
  FREE_TIER_LIMITS,
  pruneStateForFreeTier,
} from '@/lib/supabase/free-tier-limits';

export interface UserProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  is_suspended: boolean;
  profile_data: Partial<UserProfile> | null;
  auto_apply_config: AutoApplyConfig | null;
  queued_job_ids: string[] | null;
  theme: string | null;
  resume_file_path: string | null;
  resume_file_name: string | null;
  last_scanned_at: string | null;
  last_active_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserJobRow {
  user_id: string;
  id: string;
  title: string;
  company: string;
  location: string;
  source: JobListing['source'];
  url: string;
  posted_at: string;
  salary: string | null;
  description: string;
  work_type: string;
  searched_role: string;
  is_pivot_suggestion: boolean;
  is_fallback: boolean | null;
  experience_required: string;
  experience_fit: JobListing['experienceFit'];
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  match_reason: string;
  tailoring_tips: string[];
  status: JobListing['status'];
  discovered_at: string;
  saved_at?: string | null;
  applied_at?: string | null;
  hidden_at?: string | null;
  application_stage?: ApplicationStage | null;
  application_notes?: string | null;
  tailored_resume_id?: string | null;
  status_updated_at?: string | null;
  updated_at?: string;
}

export interface ScanLogRow {
  user_id: string;
  id: string;
  timestamp: string;
  searched_roles: string[];
  total_found: number;
  new_added: number;
  meta: ScanSourceMeta[];
}

export function buildSeededUserProfile(params: {
  userId: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
  primaryRole?: string;
  localBackupState?: AppStoreState | null;
}): {
  profile: UserProfile;
  jobs: JobListing[];
  scanHistory: ScanHistoryEntry[];
  queuedJobIds: string[];
  autoApplyConfig?: AutoApplyConfig;
  theme: MonochromeTheme;
  lastScannedAt: string | null;
} {
  if (params.isAdmin) {
    const localUsers = params.localBackupState?.users || [];
    const localMarKevin =
      localUsers.find((u) => u.id === 'mar-kevin-alcantara') || localUsers[0];
    const baseProfile: UserProfile = localMarKevin
      ? {
          ...MAR_KEVIN_PROFILE,
          ...localMarKevin,
          id: params.userId,
          structuredResume: {
            ...MAR_KEVIN_PROFILE.structuredResume,
            ...(localMarKevin.structuredResume || {}),
            email: params.email || MAR_KEVIN_PROFILE.structuredResume.email,
          },
        }
      : {
          ...MAR_KEVIN_PROFILE,
          id: params.userId,
        };

    return {
      profile: baseProfile,
      jobs: params.localBackupState?.jobs || [],
      scanHistory: params.localBackupState?.scanHistory || [],
      queuedJobIds: params.localBackupState?.queuedJobIds || [],
      autoApplyConfig: params.localBackupState?.autoApplyConfig,
      theme:
        params.localBackupState?.theme === 'dark' ? 'dark' : 'light',
      lastScannedAt: params.localBackupState?.lastScannedAt || null,
    };
  }

  const starter = createBlankUserProfile({
    name: params.fullName || params.email.split('@')[0] || 'Applicant',
    email: params.email,
    primaryRole: params.primaryRole || 'Data Analyst / Junior Data Analyst',
  });

  return {
    profile: {
      ...starter,
      id: params.userId,
    },
    jobs: [],
    scanHistory: [],
    queuedJobIds: [],
    theme: 'light',
    lastScannedAt: null,
  };
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function sanitizeUuid(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return UUID_REGEX.test(trimmed) ? trimmed : null;
}

export function isMissingJobColumnError(err: unknown): boolean {
  const code = (err as { code?: string })?.code || '';
  const msg = (err as { message?: string })?.message || '';
  return (
    code === '42703' ||
    code === 'PGRST204' ||
    msg.includes('application_stage') ||
    msg.includes('application_notes') ||
    msg.includes('tailored_resume_id') ||
    msg.includes('status_updated_at') ||
    msg.includes('saved_at') ||
    msg.includes('applied_at') ||
    msg.includes('hidden_at')
  );
}

export function jobListingToRow(
  userId: string,
  job: JobListing,
  includeExtendedColumns = true
): UserJobRow {
  const base: UserJobRow = {
    user_id: userId,
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    source: job.source,
    url: job.url,
    posted_at: job.postedAt,
    salary: job.salary ?? null,
    description: job.description,
    work_type: job.workType,
    searched_role: job.searchedRole,
    is_pivot_suggestion: Boolean(job.isPivotSuggestion),
    is_fallback: Boolean(job.isFallback),
    experience_required: job.experienceRequired || 'Open / Not Specified',
    experience_fit: job.experienceFit || 'fit',
    match_score: Math.round(Number(job.matchScore) || 0),
    matched_skills: Array.isArray(job.matchedSkills) ? job.matchedSkills : [],
    missing_skills: Array.isArray(job.missingSkills) ? job.missingSkills : [],
    match_reason: job.matchReason || '',
    tailoring_tips: Array.isArray(job.tailoringTips) ? job.tailoringTips : [],
    status: job.status || 'suggested',
    discovered_at: job.discoveredAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!includeExtendedColumns) {
    return base;
  }

  return {
    ...base,
    saved_at: job.savedAt ?? null,
    applied_at: job.appliedAt ?? null,
    hidden_at: job.hiddenAt ?? null,
    application_stage: job.applicationStage || 'applied',
    application_notes: job.applicationNotes || '',
    tailored_resume_id: sanitizeUuid(job.tailoredResumeId),
    status_updated_at: job.statusUpdatedAt || new Date().toISOString(),
  };
}

export function rowToJobListing(row: UserJobRow): JobListing {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location,
    source: row.source,
    url: row.url,
    postedAt: row.posted_at,
    salary: row.salary,
    description: row.description,
    workType: row.work_type,
    searchedRole: row.searched_role,
    isPivotSuggestion: Boolean(row.is_pivot_suggestion),
    isFallback: Boolean(row.is_fallback),
    experienceRequired: row.experience_required || 'Open / Not Specified',
    experienceFit: row.experience_fit || 'fit',
    matchScore: row.match_score,
    matchedSkills: Array.isArray(row.matched_skills) ? row.matched_skills : [],
    missingSkills: Array.isArray(row.missing_skills) ? row.missing_skills : [],
    matchReason: row.match_reason || '',
    tailoringTips: Array.isArray(row.tailoring_tips) ? row.tailoring_tips : [],
    status: row.status,
    discoveredAt: row.discovered_at,
    savedAt: row.saved_at ?? null,
    appliedAt: row.applied_at ?? null,
    hiddenAt: row.hidden_at ?? null,
    applicationStage: row.application_stage || 'applied',
    applicationNotes: row.application_notes || '',
    tailoredResumeId: row.tailored_resume_id ?? null,
    statusUpdatedAt: row.status_updated_at ?? null,
  };
}

export function rowToScanEntry(row: ScanLogRow): ScanHistoryEntry {
  return {
    id: row.id,
    timestamp: row.timestamp,
    searchedRoles: Array.isArray(row.searched_roles) ? row.searched_roles : [],
    totalFound: row.total_found,
    newAdded: row.new_added,
    meta: Array.isArray(row.meta) ? row.meta : [],
  };
}

export function scanEntryToRow(
  userId: string,
  entry: ScanHistoryEntry
): ScanLogRow {
  return {
    user_id: userId,
    id: entry.id,
    timestamp: entry.timestamp || new Date().toISOString(),
    searched_roles: Array.isArray(entry.searchedRoles)
      ? entry.searchedRoles
      : [],
    total_found: Math.round(Number(entry.totalFound) || 0),
    new_added: Math.round(Number(entry.newAdded) || 0),
    meta: Array.isArray(entry.meta) ? entry.meta : [],
  };
}

export async function fetchUserStoreFromSupabase(
  db: SupabaseClient,
  userId: string,
  fallbackProfile: UserProfile
): Promise<{
  profileRow: UserProfileRow | null;
  state: AppStoreState;
} | null> {
  const { data: profileRow, error: profileErr } = await db
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle<UserProfileRow>();

  if (profileErr) {
    throw profileErr;
  }

  if (!profileRow) {
    return null;
  }

  const [{ data: jobRows, error: jobsErr }, { data: scanRows, error: scanErr }] =
    await Promise.all([
      db
        .from('user_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('match_score', { ascending: false })
        .returns<UserJobRow[]>(),
      db
        .from('scan_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(FREE_TIER_LIMITS.maxScanLogsPerUser)
        .returns<ScanLogRow[]>(),
    ]);

  if (jobsErr) throw jobsErr;
  if (scanErr) throw scanErr;

  const rawProfile = (profileRow.profile_data || {}) as Partial<UserProfile>;
  const mergedProfile: UserProfile = {
    ...fallbackProfile,
    ...rawProfile,
    id: userId,
    name: rawProfile.name || profileRow.full_name || fallbackProfile.name,
    resumeFileName:
      profileRow.resume_file_name ?? rawProfile.resumeFileName ?? null,
    structuredResume: {
      ...fallbackProfile.structuredResume,
      ...(rawProfile.structuredResume || {}),
      email:
        rawProfile.structuredResume?.email ||
        profileRow.email ||
        fallbackProfile.structuredResume.email,
    },
  };

  return {
    profileRow,
    state: {
      users: [mergedProfile],
      activeUserId: userId,
      theme: profileRow.theme === 'dark' ? 'dark' : 'light',
      geminiApiKey: '',
      jobs: (jobRows || []).map(rowToJobListing),
      queuedJobIds: Array.isArray(profileRow.queued_job_ids)
        ? profileRow.queued_job_ids
        : [],
      autoApplyConfig: profileRow.auto_apply_config || undefined,
      scanHistory: (scanRows || []).map(rowToScanEntry),
      lastScannedAt: profileRow.last_scanned_at || null,
    },
  };
}

export async function syncUserStoreToSupabase(
  db: SupabaseClient,
  params: {
    userId: string;
    email: string;
    role: 'admin' | 'user';
    state: AppStoreState;
    syncScope?: 'full' | 'profile-only';
  }
): Promise<void> {
  const prunedState = pruneStateForFreeTier(params.state);

  const active =
    prunedState.users.find((u) => u.id === prunedState.activeUserId) ||
    prunedState.users[0] ||
    MAR_KEVIN_PROFILE;

  const cleanProfile: UserProfile = {
    ...active,
    id: params.userId,
  };

  const { error: profileError } = await db.from('user_profiles').upsert(
    {
      id: params.userId,
      email: params.email || cleanProfile.structuredResume?.email || '',
      full_name: cleanProfile.name || 'User',
      role: params.role,
      profile_data: cleanProfile,
      auto_apply_config: prunedState.autoApplyConfig || null,
      queued_job_ids: prunedState.queuedJobIds || [],
      theme: prunedState.theme === 'dark' ? 'dark' : 'light',
      resume_file_name: cleanProfile.resumeFileName ?? null,
      last_scanned_at: prunedState.lastScannedAt || null,
      last_active_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    throw profileError;
  }

  // Fast path: skip all user_jobs and scan_logs queries when only profile/theme/queue changed
  if (params.syncScope === 'profile-only') {
    return;
  }

  // Delta-sync Jobs (delete removed + upsert only new or modified rows)
  const incomingJobs = Array.isArray(prunedState.jobs) ? prunedState.jobs : [];
  const incomingJobIds = new Set(incomingJobs.map((j) => j.id));

  let supportsExtendedColumns = true;
  let existingRowsRaw: Array<{
    id: string;
    status: string;
    match_score: number;
    application_stage?: string | null;
    application_notes?: string | null;
    tailored_resume_id?: string | null;
    status_updated_at?: string | null;
  }> = [];

  const extRes = await db
    .from('user_jobs')
    .select(
      'id, status, match_score, application_stage, application_notes, tailored_resume_id, status_updated_at'
    )
    .eq('user_id', params.userId);

  if (extRes.error) {
    if (isMissingJobColumnError(extRes.error)) {
      supportsExtendedColumns = false;
      const fallbackRes = await db
        .from('user_jobs')
        .select('id, status, match_score')
        .eq('user_id', params.userId);
      if (fallbackRes.error) throw fallbackRes.error;
      existingRowsRaw = fallbackRes.data || [];
    } else {
      throw extRes.error;
    }
  } else {
    existingRowsRaw = extRes.data || [];
  }

  const existingById = new Map<
    string,
    {
      status: string;
      match_score: number;
      application_stage?: string | null;
      application_notes?: string | null;
      tailored_resume_id?: string | null;
      status_updated_at?: string | null;
    }
  >();
  const toDeleteIds: string[] = [];

  for (const row of existingRowsRaw) {
    if (
      !incomingJobIds.has(row.id) &&
      row.status !== 'saved' &&
      row.status !== 'applied'
    ) {
      toDeleteIds.push(row.id);
    } else {
      existingById.set(row.id, row);
    }
  }

  if (toDeleteIds.length > 0) {
    for (let i = 0; i < toDeleteIds.length; i += 100) {
      const chunk = toDeleteIds.slice(i, i + 100);
      const { error: delErr } = await db
        .from('user_jobs')
        .delete()
        .eq('user_id', params.userId)
        .in('id', chunk);
      if (delErr) throw delErr;
    }
  }

  const changedOrNewJobs = incomingJobs.filter((j) => {
    const prev = existingById.get(j.id);
    if (!prev) return true;
    if (
      prev.status !== (j.status || 'suggested') ||
      prev.match_score !== Math.round(Number(j.matchScore) || 0)
    ) {
      return true;
    }
    if (!supportsExtendedColumns) return false;
    return (
      (prev.application_stage || 'applied') !==
        (j.applicationStage || 'applied') ||
      (prev.application_notes || '') !== (j.applicationNotes || '') ||
      (prev.tailored_resume_id || null) !== (j.tailoredResumeId || null) ||
      (prev.status_updated_at || null) !== (j.statusUpdatedAt || null)
    );
  });

  if (changedOrNewJobs.length > 0) {
    const jobRows = changedOrNewJobs.map((j) =>
      jobListingToRow(params.userId, j, supportsExtendedColumns)
    );
    for (let i = 0; i < jobRows.length; i += 100) {
      const chunk = jobRows.slice(i, i + 100);
      const { error: upsertErr } = await db
        .from('user_jobs')
        .upsert(chunk, { onConflict: 'user_id,id' });
      if (upsertErr) throw upsertErr;
    }
  }

  // Sync Scan Logs & enforce 25-log cap per user
  const incomingScans = Array.isArray(prunedState.scanHistory)
    ? prunedState.scanHistory.slice(0, FREE_TIER_LIMITS.maxScanLogsPerUser)
    : [];
  if (incomingScans.length > 0) {
    const scanRows = incomingScans.map((entry) =>
      scanEntryToRow(params.userId, entry)
    );
    const { error: scanErr } = await db
      .from('scan_logs')
      .upsert(scanRows, { onConflict: 'user_id,id' });
    if (scanErr) throw scanErr;

    const { data: oldScans } = await db
      .from('scan_logs')
      .select('id')
      .eq('user_id', params.userId)
      .order('timestamp', { ascending: false })
      .range(FREE_TIER_LIMITS.maxScanLogsPerUser, 500);

    if (oldScans && oldScans.length > 0) {
      await db
        .from('scan_logs')
        .delete()
        .eq('user_id', params.userId)
        .in(
          'id',
          oldScans.map((s) => s.id as string)
        );
    }
  }
}

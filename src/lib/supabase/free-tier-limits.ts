import { AppStoreState, JobListing } from '@/types/job';

export const FREE_TIER_LIMITS = {
  maxDbSizeMb: 500,
  maxStorageSizeMb: 1024,
  maxMonthlyEgressGb: 5,
  maxFreeMau: 50000,
  targetActiveUsers: 10,
  maxSuggestedJobsPerUser: 150,
  maxJobDescriptionChars: 3500,
  maxScanLogsPerUser: 25,
  maxTailoredSnapshotsPerUser: 15,
  maxResumeUploadBytes: Math.floor(4.5 * 1024 * 1024),
  keepAliveCron: '0 8 */4 * *',
} as const;

export function truncateJobForFreeTier(job: JobListing): JobListing {
  if (!job.description || job.description.length <= FREE_TIER_LIMITS.maxJobDescriptionChars) {
    return job;
  }
  return {
    ...job,
    description: `${job.description.slice(0, FREE_TIER_LIMITS.maxJobDescriptionChars - 3)}...`,
  };
}

export function pruneJobsForFreeTier(
  jobs: JobListing[],
  queuedJobIds: string[] = []
): JobListing[] {
  if (!Array.isArray(jobs) || jobs.length === 0) return [];
  const queuedSet = new Set(queuedJobIds);

  const protectedJobs: JobListing[] = [];
  const ephemeralJobs: JobListing[] = [];

  for (const rawJob of jobs) {
    const job = truncateJobForFreeTier(rawJob);
    if (
      job.status === 'saved' ||
      job.status === 'applied' ||
      queuedSet.has(job.id)
    ) {
      protectedJobs.push(job);
    } else {
      ephemeralJobs.push(job);
    }
  }

  ephemeralJobs.sort((a, b) => {
    if (Boolean(a.isFallback) !== Boolean(b.isFallback)) {
      return a.isFallback ? 1 : -1;
    }
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return (
      new Date(b.discoveredAt || 0).getTime() -
      new Date(a.discoveredAt || 0).getTime()
    );
  });

  return [
    ...protectedJobs,
    ...ephemeralJobs.slice(0, FREE_TIER_LIMITS.maxSuggestedJobsPerUser),
  ];
}

export function pruneStateForFreeTier(state: AppStoreState): AppStoreState {
  const prunedJobs = pruneJobsForFreeTier(state.jobs || [], state.queuedJobIds || []);
  const prunedScans = Array.isArray(state.scanHistory)
    ? state.scanHistory.slice(0, FREE_TIER_LIMITS.maxScanLogsPerUser)
    : [];

  return {
    ...state,
    jobs: prunedJobs,
    scanHistory: prunedScans,
  };
}

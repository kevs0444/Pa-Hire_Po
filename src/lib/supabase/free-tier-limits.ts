import type { AppStoreState, JobListing } from '@/types/job';

export const FREE_TIER_LIMITS = {
  maxDbSizeMb: 500,
  maxStorageSizeMb: 1024,
  maxMonthlyEgressGb: 5,
  maxFreeMau: 50000,
  targetActiveUsers: 10,
  maxSuggestedJobsPerUser: 150,
  maxJobDescriptionChars: 3500,
  maxScanLogsPerUser: 25,
  maxTailoredSnapshotsPerUser: 50,
  maxHiddenJobsPerUser: 500,
  maxSavedSearchesPerUser: 20,
  maxRecentSearchesPerUser: 8,
  maxViewedJobIdsPerUser: 150,
  maxUnsavedAppliedIdsPerUser: 200,
  maxPinnedActivityIdsPerUser: 25,
  maxResumeUploadBytes: Math.floor(4.5 * 1024 * 1024),
  keepAliveCron: '0 8 */4 * *',
} as const;

export function truncateJobForFreeTier(job: JobListing): JobListing {
  const maxChars =
    job.status === 'hidden' ? 240 : FREE_TIER_LIMITS.maxJobDescriptionChars;
  if (!job.description || job.description.length <= maxChars) {
    return job;
  }
  return {
    ...job,
    description: `${job.description.slice(0, maxChars - 3)}...`,
  };
}

export function pruneJobsForFreeTier(
  jobs: JobListing[],
  queuedJobIds: string[] = []
): JobListing[] {
  if (!Array.isArray(jobs) || jobs.length === 0) return [];
  const queuedSet = new Set(queuedJobIds);

  const protectedJobs: JobListing[] = [];
  const hiddenJobs: JobListing[] = [];
  const ephemeralJobs: JobListing[] = [];

  for (const rawJob of jobs) {
    const job = truncateJobForFreeTier(rawJob);
    if (
      job.status === 'saved' ||
      job.status === 'applied' ||
      queuedSet.has(job.id)
    ) {
      protectedJobs.push(job);
    } else if (job.status === 'hidden') {
      hiddenJobs.push(job);
    } else {
      ephemeralJobs.push(job);
    }
  }

  hiddenJobs.sort(
    (a, b) =>
      new Date(b.hiddenAt || b.statusUpdatedAt || b.discoveredAt || 0).getTime() -
      new Date(a.hiddenAt || a.statusUpdatedAt || a.discoveredAt || 0).getTime()
  );

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
    ...hiddenJobs.slice(0, FREE_TIER_LIMITS.maxHiddenJobsPerUser),
    ...ephemeralJobs.slice(0, FREE_TIER_LIMITS.maxSuggestedJobsPerUser),
  ];
}

export function pruneStateForFreeTier(state: AppStoreState): AppStoreState {
  const prunedJobs = pruneJobsForFreeTier(state.jobs || [], state.queuedJobIds || []);
  const prunedScans = Array.isArray(state.scanHistory)
    ? state.scanHistory.slice(0, FREE_TIER_LIMITS.maxScanLogsPerUser)
    : [];
  const prunedUsers = Array.isArray(state.users)
    ? state.users.map((user) => ({
        ...user,
        savedSearches: Array.isArray(user.savedSearches)
          ? user.savedSearches.slice(0, FREE_TIER_LIMITS.maxSavedSearchesPerUser)
          : user.savedSearches,
        recentSearches: Array.isArray(user.recentSearches)
          ? user.recentSearches.slice(0, FREE_TIER_LIMITS.maxRecentSearchesPerUser)
          : user.recentSearches,
        viewedJobIds: Array.isArray(user.viewedJobIds)
          ? user.viewedJobIds.slice(0, FREE_TIER_LIMITS.maxViewedJobIdsPerUser)
          : user.viewedJobIds,
        unsavedAppliedJobIds: Array.isArray(user.unsavedAppliedJobIds)
          ? user.unsavedAppliedJobIds.slice(0, FREE_TIER_LIMITS.maxUnsavedAppliedIdsPerUser)
          : user.unsavedAppliedJobIds,
        pinnedActivityIds: Array.isArray(user.pinnedActivityIds)
          ? user.pinnedActivityIds.slice(0, FREE_TIER_LIMITS.maxPinnedActivityIdsPerUser)
          : user.pinnedActivityIds,
      }))
    : state.users;

  return {
    ...state,
    users: prunedUsers,
    jobs: prunedJobs,
    scanHistory: prunedScans,
  };
}

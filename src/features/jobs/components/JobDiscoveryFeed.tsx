'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  Briefcase,
  Info,
  Laptop,
  RotateCcw,
  Settings,
  X,
} from 'lucide-react';
import {
  JobListing,
  JobStatus,
  MonochromeTheme,
  SavedJobSearch,
  UserProfile,
} from '@/types/job';
import { formatJobDateLabel } from '@/features/jobs/lib/job-date-utils';
import { isJobSaved } from '@/features/jobs/lib/job-filters';
import { DiscoveryJobCard } from '@/features/jobs/components/DiscoveryJobCard';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface JobDiscoveryFeedProps {
  theme: MonochromeTheme;
  activeProfile: UserProfile;
  jobs: JobListing[];
  allJobs?: JobListing[];
  activeFilterCount?: number;
  scanning: boolean;
  isDesktopApp: boolean;
  nowMs?: number | null;
  onSelectJob: (jobId: string) => void;
  onToggleSaveJob: (jobId: string) => void;
  onUpdateJobStatus: (jobId: string, status: JobStatus) => void;
  onOpenExplorer: () => void;
  onOpenSavedJobs: () => void;
  onOpenPreferences: () => void;
  onOpenDesktopSetup: () => void;
  onRunSavedSearch: (saved: SavedJobSearch) => void;
  onDeleteSavedSearch: (id: string) => void;
  onResetFilters?: () => void;
  onTriggerScan: () => void;
}

export function JobDiscoveryFeed({
  theme,
  activeProfile,
  jobs,
  allJobs,
  activeFilterCount = 0,
  scanning,
  isDesktopApp,
  nowMs = null,
  onSelectJob,
  onToggleSaveJob,
  onUpdateJobStatus,
  onOpenExplorer,
  onOpenSavedJobs,
  onOpenPreferences,
  onOpenDesktopSetup,
  onRunSavedSearch,
  onDeleteSavedSearch,
  onResetFilters,
  onTriggerScan,
}: JobDiscoveryFeedProps) {
  const infoPopoverId = useId();
  const infoTriggerRef = useRef<HTMLButtonElement>(null);
  const infoPopoverRef = useRef<HTMLDivElement>(null);
  const [mobilePanel, setMobilePanel] = useState<'recommended' | 'saved'>(
    'recommended'
  );

  const tokens = getThemeTokens(theme);

  useEffect(() => {
    const popover = infoPopoverRef.current;
    const trigger = infoTriggerRef.current;
    if (!popover || !trigger) return;

    const handleBeforeToggle = (event: Event) => {
      const toggleEvent = event as ToggleEvent;
      if (toggleEvent.newState !== 'open') return;
      if (
        typeof CSS !== 'undefined' &&
        typeof CSS.supports === 'function' &&
        CSS.supports('position-area: block-end')
      ) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const maxWidth = Math.min(288, window.innerWidth - 24);
      const leftPos = Math.max(
        12,
        Math.min(rect.left, window.innerWidth - maxWidth - 12)
      );
      popover.style.position = 'fixed';
      popover.style.margin = '0';
      popover.style.top = `${Math.round(rect.bottom + 8)}px`;
      popover.style.left = `${Math.round(leftPos)}px`;
      popover.style.maxWidth = `${maxWidth}px`;
    };

    popover.addEventListener('beforetoggle', handleBeforeToggle);
    return () => {
      popover.removeEventListener('beforetoggle', handleBeforeToggle);
    };
  }, []);

  const viewedSet = useMemo(
    () => new Set(activeProfile.viewedJobIds || []),
    [activeProfile.viewedJobIds]
  );

  const unsavedAppliedSet = useMemo(
    () => new Set(activeProfile.unsavedAppliedJobIds || []),
    [activeProfile.unsavedAppliedJobIds]
  );

  const recommendedJobs = useMemo(() => {
    const active = jobs.filter((j) => j.status !== 'hidden');
    return [...active].sort((a, b) => {
      if (Boolean(a.isFallback) !== Boolean(b.isFallback)) {
        return a.isFallback ? 1 : -1;
      }
      const aSenior = a.experienceFit === 'senior-warning' ? 1 : 0;
      const bSenior = b.experienceFit === 'senior-warning' ? 1 : 0;
      if (aSenior !== bSenior) return aSenior - bSenior;
      return b.matchScore - a.matchScore;
    });
  }, [jobs]);

  const savedSourceJobs = allJobs || jobs;
  const savedJobs = useMemo(
    () =>
      savedSourceJobs
        .filter((j) => isJobSaved(j, unsavedAppliedSet))
        .sort(
          (a, b) =>
            new Date(
              b.savedAt || b.appliedAt || b.statusUpdatedAt || b.discoveredAt || 0
            ).getTime() -
            new Date(
              a.savedAt || a.appliedAt || a.statusUpdatedAt || a.discoveredAt || 0
            ).getTime()
        ),
    [savedSourceJobs, unsavedAppliedSet]
  );

  const savedSearches = activeProfile.savedSearches || [];
  const visibleRecommended = recommendedJobs.slice(0, 10);

  return (
    <div className="no-print mx-auto max-w-[1140px] py-2 pb-10">
      {/* Mobile / Tablet 1-Tap Switcher (< 1024px) */}
      <div
        className={cn(
          'mb-4 grid grid-cols-2 gap-1.5 rounded-xl border p-1 lg:hidden',
          tokens.cardSurface
        )}
        role="tablist"
        aria-label="Discovery view sections"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mobilePanel === 'recommended'}
          onClick={() => setMobilePanel('recommended')}
          className={cn(
            'min-h-[44px] rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
            mobilePanel === 'recommended'
              ? tokens.primaryBtn
              : tokens.mutedText
          )}
        >
          Recommended ({recommendedJobs.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobilePanel === 'saved'}
          onClick={() => setMobilePanel('saved')}
          className={cn(
            'min-h-[44px] rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
            mobilePanel === 'saved' ? tokens.primaryBtn : tokens.mutedText
          )}
        >
          Saved jobs ({savedJobs.length})
        </button>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN (Pic 1): RECOMMENDED FEED */}
        <section
          className={cn(
            'space-y-4 lg:col-span-8',
            mobilePanel !== 'recommended' && 'hidden lg:block'
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="relative inline-flex items-center gap-2">
              <h2
                className={cn(
                  'font-display text-xl font-bold tracking-tight',
                  tokens.strongText
                )}
              >
                Recommended
              </h2>
              <button
                ref={infoTriggerRef}
                type="button"
                aria-label="How recommendations are ranked"
                aria-controls={infoPopoverId}
                {...({ popoverTarget: infoPopoverId } as Record<string, string>)}
                className={cn(
                  'civic-touch-target inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                  tokens.mutedText,
                  tokens.isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-200/70'
                )}
              >
                <Info className="h-4 w-4" />
              </button>

              <div
                id={infoPopoverId}
                ref={infoPopoverRef}
                {...({ popover: 'auto' } as Record<string, string>)}
                className={cn(
                  'civic-popover-panel-start w-[min(90dvw,288px)] rounded-xl border p-3.5 text-xs leading-relaxed shadow-lg',
                  tokens.cardSurface
                )}
              >
                <p className={cn('font-semibold', tokens.strongText)}>
                  Honest Match Ranking
                </p>
                <p className={cn('mt-1', tokens.mutedText)}>
                  Jobs from LinkedIn, JobStreet, and Indeed are scored against your{' '}
                  <strong className={tokens.strongText}>
                    {activeProfile.primaryRole}
                  </strong>{' '}
                  target role, skills, resume keywords, and{' '}
                  {activeProfile.experienceLevel} experience level.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenPreferences}
              className={cn(
                'civic-touch-target inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors',
                tokens.mutedText,
                tokens.isDark
                  ? 'hover:bg-zinc-800 hover:text-zinc-100'
                  : 'hover:bg-slate-200/60 hover:text-slate-900'
              )}
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Preferences</span>
            </button>
          </div>

          {scanning && savedSourceJobs.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className={cn(
                    'h-44 animate-pulse rounded-lg border p-5',
                    tokens.cardSurface
                  )}
                />
              ))}
            </div>
          ) : visibleRecommended.length === 0 ? (
            <div
              className={cn(
                'space-y-3 rounded-lg border border-dashed p-8 text-center sm:p-10',
                tokens.cardSurface
              )}
            >
              <Briefcase className={cn('mx-auto h-7 w-7', tokens.mutedText)} />
              <p className="text-sm font-semibold">
                {activeFilterCount > 0
                  ? 'No jobs match your active filters'
                  : 'No recommended jobs loaded yet'}
              </p>
              <p className={cn('mx-auto max-w-md text-xs', tokens.mutedText)}>
                {activeFilterCount > 0
                  ? 'Adjust or clear your banner filters to see all discovered matches.'
                  : 'Run a search across LinkedIn, JobStreet, and Indeed or adjust your target roles in Preferences.'}
              </p>
              {activeFilterCount > 0 && onResetFilters ? (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className={cn(
                    'inline-flex min-h-[42px] items-center gap-1.5 rounded-lg px-4 py-2 text-xs transition-colors',
                    tokens.primaryBtn
                  )}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Clear Active Filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onTriggerScan}
                  className={cn(
                    'min-h-[42px] rounded-lg px-4 py-2 text-xs transition-colors',
                    tokens.primaryBtn
                  )}
                >
                  Search Jobs Now
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {visibleRecommended.map((job) => (
                <DiscoveryJobCard
                  key={job.id}
                  job={job}
                  theme={theme}
                  variant="discovery"
                  isSaved={isJobSaved(job, unsavedAppliedSet)}
                  isViewed={viewedSet.has(job.id)}
                  nowMs={nowMs}
                  onSelect={() => onSelectJob(job.id)}
                  onToggleSave={() => onToggleSaveJob(job.id)}
                  onHide={() => onUpdateJobStatus(job.id, 'hidden')}
                />
              ))}

              {recommendedJobs.length > 0 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onOpenExplorer}
                    className={cn(
                      'inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-colors',
                      tokens.secondaryBtn
                    )}
                  >
                    <span>
                      Explore all {recommendedJobs.length} active jobs in Explorer
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* RIGHT COLUMN (Pic 1): SAVED JOBS + SUBTLE SAVED SEARCHES & DESKTOP APP */}
        <aside
          className={cn(
            'space-y-5 lg:sticky lg:top-20 lg:col-span-4',
            mobilePanel !== 'saved' && 'hidden lg:block'
          )}
        >
          <section className="space-y-3">
            <h2
              className={cn(
                'font-display text-xl font-bold tracking-tight',
                tokens.strongText
              )}
            >
              Saved jobs
            </h2>

            {savedJobs.length === 0 ? (
              <div
                className={cn(
                  'rounded-lg border p-4 text-xs leading-relaxed',
                  tokens.cardSurface,
                  tokens.mutedText
                )}
              >
                <div className="flex items-center gap-2 font-semibold text-current">
                  <Bookmark className="h-4 w-4 shrink-0" />
                  <span>No saved jobs yet</span>
                </div>
                <p className="mt-1">
                  Bookmark any listing or apply to a job and it will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedJobs.slice(0, 4).map((job) => (
                  <button
                    key={`saved-${job.id}`}
                    type="button"
                    onClick={() => onSelectJob(job.id)}
                    className={cn(
                      'block w-full rounded-lg border p-4 text-left transition-colors',
                      tokens.cardSurface,
                      tokens.isDark ? 'hover:border-zinc-700' : 'hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={cn('text-sm font-bold leading-snug', tokens.strongText)}>
                        {job.title}
                      </h3>
                      {job.status === 'applied' && (
                        <span
                          className={cn(
                            'shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold',
                            tokens.badgeSuccess
                          )}
                        >
                          ✓ Applied
                        </span>
                      )}
                    </div>
                    <p className={cn('mt-1 text-xs font-medium', tokens.mutedText)}>
                      {job.company}
                    </p>
                    <p className={cn('mt-0.5 text-xs', tokens.mutedText)}>
                      {job.location}
                    </p>
                    <p className={cn('mt-2 text-xs', tokens.mutedText)}>
                      {formatJobDateLabel(job, nowMs ?? undefined)}
                    </p>
                  </button>
                ))}

                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={onOpenSavedJobs}
                    className={cn(
                      'civic-touch-target inline-flex items-center gap-1.5 text-xs font-semibold underline-offset-4 hover:underline',
                      tokens.strongText
                    )}
                  >
                    <span>View all ({savedJobs.length})</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Subtle Saved Searches Chips (shown only when saved searches exist) */}
          {savedSearches.length > 0 && (
            <section
              className={cn('space-y-2.5 border-t pt-4', tokens.borderSubtle)}
            >
              <h3 className={cn('text-xs font-semibold', tokens.mutedText)}>
                Saved searches
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {savedSearches.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border pl-2.5 pr-1.5 py-1 text-xs',
                      tokens.cardSurface
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onRunSavedSearch(item)}
                      className="max-w-[190px] truncate font-medium hover:underline"
                      title={`Run search: ${item.label}`}
                    >
                      {item.label}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSavedSearch(item.id)}
                      aria-label={`Remove saved search ${item.label}`}
                      className={cn(
                        'rounded-full p-1 transition-colors',
                        tokens.mutedText,
                        tokens.isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'
                      )}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Subtle 1-Line Desktop App Utility Link */}
          <div className={cn('border-t pt-3', tokens.borderSubtle)}>
            <button
              type="button"
              onClick={onOpenDesktopSetup}
              className={cn(
                'civic-touch-target inline-flex items-center gap-2 text-xs font-medium transition-colors',
                tokens.mutedText,
                tokens.isDark ? 'hover:text-zinc-100' : 'hover:text-slate-900'
              )}
            >
              <Laptop className="h-3.5 w-3.5 shrink-0" />
              <span>
                {isDesktopApp
                  ? 'Pa-Hire Po Desktop App active • Setup'
                  : 'Use Pa-Hire Po Desktop App'}
              </span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

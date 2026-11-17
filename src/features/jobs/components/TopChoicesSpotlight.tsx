'use client';

import { Check, ListPlus } from 'lucide-react';
import { JobListing, MonochromeTheme } from '@/types/job';
import { BoardLogo } from '@/components/ui/BrandLogos';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface TopChoicesSpotlightProps {
  choices: JobListing[];
  selectedJobId: string | null;
  activeProfileName: string;
  experienceLevel: string;
  theme: MonochromeTheme;
  queuedJobIds: string[];
  onSelectJob: (jobId: string) => void;
  onOpenApplyModal: (job: JobListing) => void;
  onToggleQueueJob: (jobId: string) => void;
}

export function TopChoicesSpotlight({
  choices,
  selectedJobId,
  activeProfileName,
  experienceLevel,
  theme,
  queuedJobIds,
  onSelectJob,
  onOpenApplyModal,
  onToggleQueueJob,
}: TopChoicesSpotlightProps) {
  if (choices.length === 0) return null;

  const {
    isDark,
    cardSurface,
    primaryBtn,
    secondaryBtn,
    mutedText,
    borderSubtle,
    badgeSuccess,
    badgeNeutral,
  } = getThemeTokens(theme);

  return (
    <section className={cn('rounded-lg border overflow-hidden', cardSurface)}>
      <div className={cn('flex flex-wrap items-baseline justify-between gap-2 border-b px-4 py-2.5', borderSubtle)}>
        <h2 className="text-xs font-semibold tracking-tight uppercase">
          Recommended for {activeProfileName}
        </h2>
        <span className={cn('text-xs', mutedText)}>
          Top {choices.length} matches for {experienceLevel} level
        </span>
      </div>

      <div className={cn('grid divide-y md:grid-cols-3 md:divide-y-0 md:divide-x', borderSubtle)}>
        {choices.map((job, idx) => {
          const isQueued = queuedJobIds.includes(job.id);
          const isSelected = selectedJobId === job.id;

          return (
            <div
              key={`top3-${job.id}`}
              onClick={() => onSelectJob(job.id)}
              className={cn(
                'flex cursor-pointer flex-col justify-between gap-3 p-4 transition-colors',
                isSelected
                  ? isDark
                    ? 'bg-[#222227] border-l-[3px] border-l-zinc-300 md:border-l-0 md:border-t-[3px] md:border-t-zinc-300'
                    : 'bg-[#f8fafc] border-l-[3px] border-l-[#0a66c2] md:border-l-0 md:border-t-[3px] md:border-t-[#0a66c2]'
                  : isDark
                    ? 'hover:bg-zinc-800/40'
                    : 'hover:bg-slate-50/75'
              )}
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <BoardLogo source={job.source} theme={theme} size="sm" />
                  <span
                    className={cn(
                      'rounded border px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums',
                      idx === 0 || job.matchScore >= 75 ? badgeSuccess : badgeNeutral
                    )}
                  >
                    {idx === 0 || job.matchScore >= 75 ? '✓ ' : ''}#{idx + 1} • {job.matchScore}%
                  </span>
                </div>

                <div className="min-w-0">
                  <h3 className="line-clamp-1 text-sm font-semibold">
                    {job.title}
                  </h3>
                  <p className={cn('line-clamp-1 text-xs', mutedText)}>
                    {job.company} • {job.location}
                  </p>
                </div>

                <p className={cn('text-xs font-mono tabular-nums', mutedText)}>
                  Exp: {job.experienceRequired}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenApplyModal(job);
                  }}
                  className={cn(
                    'inline-flex flex-1 items-center justify-center rounded-lg px-3 py-1.5 text-xs transition-colors',
                    primaryBtn
                  )}
                >
                  Apply &amp; Tailor
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleQueueJob(job.id);
                  }}
                  title={
                    isQueued
                      ? 'Remove from Auto-Apply Queue'
                      : 'Add to Auto-Apply Queue'
                  }
                  aria-label={
                    isQueued
                      ? 'Remove from Auto-Apply Queue'
                      : 'Add to Auto-Apply Queue'
                  }
                  className={cn(
                    'inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                    isQueued ? primaryBtn : secondaryBtn
                  )}
                >
                  {isQueued ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <ListPlus className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

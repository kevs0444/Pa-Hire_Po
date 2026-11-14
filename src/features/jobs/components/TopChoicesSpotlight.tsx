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
    selectedCard,
    mutedText,
  } = getThemeTokens(theme);

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight">
          Recommended for {activeProfileName}
        </h2>
        <span className={cn('text-xs', mutedText)}>
          Top 3 matches for {experienceLevel} level
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {choices.map((job, idx) => {
          const isQueued = queuedJobIds.includes(job.id);
          const isSelected = selectedJobId === job.id;

          return (
            <div
              key={`top3-${job.id}`}
              onClick={() => onSelectJob(job.id)}
              className={cn(
                'flex cursor-pointer flex-col justify-between gap-3 rounded-lg border p-3.5 transition-colors',
                isSelected ? selectedCard : cardSurface
              )}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <BoardLogo source={job.source} theme={theme} size="sm" />
                  <span
                    className={cn(
                      'rounded border px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums',
                      idx === 0
                        ? isDark
                          ? 'border-emerald-700/70 bg-emerald-950/60 text-emerald-300'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : isDark
                          ? 'border-slate-700 bg-slate-800 text-slate-200'
                          : 'border-slate-200 bg-slate-100 text-slate-700'
                    )}
                  >
                    #{idx + 1} • {job.matchScore}%
                  </span>
                </div>

                <div>
                  <h3 className="line-clamp-1 text-sm font-semibold">
                    {job.title}
                  </h3>
                  <p className={cn('line-clamp-1 text-xs', mutedText)}>
                    {job.company} • {job.location}
                  </p>
                </div>

                <p className={cn('text-xs', mutedText)}>
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
                    'inline-flex flex-1 items-center justify-center rounded-lg py-1.5 text-xs transition-colors',
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

'use client';

import { Award, ListPlus, Check, Trophy, Wand2 } from 'lucide-react';
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
    cardSurface,
    subSurface,
    primaryBtn,
    secondaryBtn,
    orangeBadge,
    selectedCard,
    mutedText,
  } = getThemeTokens(theme);

  return (
    <section className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-orange-500" />
          <h2 className="text-sm font-extrabold uppercase tracking-wider">
            Top 3 Choices for {activeProfileName}
          </h2>
        </div>
        <span className={cn('text-xs', mutedText)}>
          Ranked by skill overlap &amp; experience applicability ({experienceLevel})
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
                'flex cursor-pointer flex-col justify-between gap-3 rounded-2xl border p-4 transition',
                isSelected ? selectedCard : cardSurface
              )}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase',
                      idx === 0 ? primaryBtn : cn('border', orangeBadge)
                    )}
                  >
                    #{idx + 1} Choice • {job.matchScore}%
                  </span>
                  <BoardLogo source={job.source} theme={theme} size="sm" />
                </div>

                <div>
                  <h3 className="line-clamp-1 text-sm font-bold">{job.title}</h3>
                  <p className={cn('line-clamp-1 text-xs', mutedText)}>
                    {job.company} • {job.location}
                  </p>
                </div>

                <div
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold',
                    subSurface
                  )}
                >
                  <Award className="h-3.5 w-3.5 shrink-0" />
                  <span>Exp: {job.experienceRequired}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenApplyModal(job);
                  }}
                  className={cn(
                    'inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-bold',
                    primaryBtn
                  )}
                >
                  <Wand2 className="h-3.5 w-3.5" />
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
                  className={cn(
                    'inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-semibold',
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

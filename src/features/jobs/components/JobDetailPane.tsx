'use client';

import {
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  EyeOff,
  ListPlus,
  MapPin,
  Wallet,
} from 'lucide-react';
import { JobListing, JobStatus, MonochromeTheme } from '@/types/job';
import { BoardLogo } from '@/components/ui/BrandLogos';
import { CopyUrlButton } from '@/components/ui/CopyUrlButton';
import { MatchScoreRing } from '@/components/ui/MatchScoreRing';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface JobDetailPaneProps {
  job: JobListing | null;
  activeProfileName: string;
  theme: MonochromeTheme;
  isQueued: boolean;
  isSaved?: boolean;
  onToggleSave?: () => void;
  onOpenApplyModal: (job: JobListing) => void;
  onToggleQueueJob: (jobId: string) => void;
  onUpdateStatus: (jobId: string, status: JobStatus) => void;
}

function getExpBadgeLabel(job: JobListing) {
  if (job.experienceFit === 'fit') return '✓ Matches Your Level';
  if (job.experienceFit === 'stretch') return 'Slight Stretch';
  return 'Senior Exp Requested';
}

export function JobDetailPane({
  job,
  activeProfileName,
  theme,
  isQueued,
  isSaved: isSavedProp,
  onToggleSave,
  onOpenApplyModal,
  onToggleQueueJob,
  onUpdateStatus,
}: JobDetailPaneProps) {
  const {
    isDark,
    cardSurface,
    primaryBtn,
    secondaryBtn,
    mutedText,
    strongText,
    borderSubtle,
  } = getThemeTokens(theme);

  if (!job) {
    return (
      <div
        className={cn(
          'rounded-lg border border-dashed p-12 text-center',
          cardSurface
        )}
      >
        <Briefcase className={cn('mx-auto h-7 w-7', mutedText)} />
        <p className="mt-3 text-sm font-semibold">Select a job listing</p>
        <p className={cn('mt-1 text-xs', mutedText)}>
          Choose any role on the left to inspect requirements, skill alignment,
          and open Resume Studio (AI) before applying.
        </p>
      </div>
    );
  }

  const fitBadgeTone =
    job.experienceFit === 'fit'
      ? isDark
        ? 'border-zinc-700 bg-zinc-800 text-zinc-100 font-semibold'
        : 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : job.experienceFit === 'stretch'
        ? isDark
          ? 'border-zinc-700 bg-zinc-800/60 text-zinc-300'
          : 'border-amber-200 bg-amber-50 text-amber-800'
        : isDark
          ? 'border-zinc-800 bg-zinc-900 text-zinc-400'
          : 'border-slate-300 bg-slate-100 text-slate-700';

  const effectiveSaved = isSavedProp ?? job.status === 'saved';

  return (
    <div className={cn('space-y-5 rounded-lg border p-4 sm:p-6', cardSurface)}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <BoardLogo source={job.source} theme={theme} size="md" />
            {job.isPivotSuggestion && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium',
                  secondaryBtn
                )}
              >
                <Compass className="h-3 w-3" />
                Pivot: {job.searchedRole}
              </span>
            )}
            {job.isFallback && (
              <span
                className={cn(
                  'rounded border border-dashed px-2 py-0.5 text-[11px]',
                  borderSubtle,
                  mutedText
                )}
              >
                Direct Search Link
              </span>
            )}
          </div>

          <h2 className="text-xl font-bold leading-snug tracking-tight">
            {job.title}
          </h2>

          <div
            className={cn(
              'flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]',
              mutedText
            )}
          >
            <span
              className={cn(
                'inline-flex items-center gap-1.5 font-semibold',
                strongText
              )}
            >
              <Building2 className="h-4 w-4" />
              {job.company}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {job.postedAt}
            </span>
            {job.salary && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 font-mono text-xs font-medium',
                  strongText
                )}
              >
                <Wallet className="h-3.5 w-3.5" />
                {job.salary}
              </span>
            )}
          </div>
        </div>

        <MatchScoreRing score={job.matchScore} size={58} theme={theme} />
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onOpenApplyModal(job)}
          className={cn(
            'civic-btn-motion inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs transition-colors sm:min-h-0 sm:w-auto',
            primaryBtn
          )}
        >
          Apply &amp; Tailor Resume
        </button>

        <button
          type="button"
          onClick={() => onToggleQueueJob(job.id)}
          className={cn(
            'civic-btn-motion civic-touch-target inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
            isQueued ? primaryBtn : secondaryBtn
          )}
        >
          {isQueued ? (
            <Check key="queued-check" className="civic-confirm-pop h-3.5 w-3.5" />
          ) : (
            <ListPlus className="h-3.5 w-3.5" />
          )}
          {isQueued ? 'Queued' : 'Queue'}
        </button>

        <button
          type="button"
          onClick={() => {
            if (onToggleSave) {
              onToggleSave();
            } else {
              onUpdateStatus(job.id, effectiveSaved ? 'suggested' : 'saved');
            }
          }}
          className={cn(
            'civic-btn-motion civic-touch-target inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
            effectiveSaved ? primaryBtn : secondaryBtn
          )}
          aria-pressed={effectiveSaved}
        >
          {effectiveSaved ? (
            <BookmarkCheck key="saved-check" className="civic-confirm-pop h-3.5 w-3.5" />
          ) : (
            <Bookmark className="h-3.5 w-3.5" />
          )}
          {effectiveSaved ? 'Saved' : 'Save'}
        </button>

        <button
          type="button"
          onClick={() =>
            onUpdateStatus(
              job.id,
              job.status === 'applied' ? 'suggested' : 'applied'
            )
          }
          className={cn(
            'civic-btn-motion inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
            job.status === 'applied'
              ? isDark
                ? 'border-emerald-700/70 bg-emerald-950/60 text-emerald-300'
                : 'border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold'
              : secondaryBtn
          )}
          aria-pressed={job.status === 'applied'}
        >
          <CheckCircle2
            key={job.status === 'applied' ? 'applied-check' : 'applied-idle'}
            className={cn(
              'h-3.5 w-3.5',
              job.status === 'applied' && 'civic-confirm-pop'
            )}
          />
          {job.status === 'applied' ? 'Applied' : 'Mark Applied'}
        </button>

        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'civic-btn-motion inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
            secondaryBtn
          )}
        >
          Open Original
          <ExternalLink className="h-3.5 w-3.5" />
        </a>

        <CopyUrlButton
          url={job.url}
          theme={theme}
          className="py-2"
        />

        <button
          type="button"
          onClick={() =>
            onUpdateStatus(job.id, job.status === 'hidden' ? 'suggested' : 'hidden')
          }
          className={cn(
            'civic-btn-motion ml-auto rounded-lg border p-2 transition-colors',
            job.status === 'hidden' ? primaryBtn : secondaryBtn
          )}
          title={job.status === 'hidden' ? 'Unhide job' : 'Hide job'}
          aria-label={job.status === 'hidden' ? 'Unhide job' : 'Hide job'}
          aria-pressed={job.status === 'hidden'}
        >
          <EyeOff className="h-4 w-4" />
        </button>
      </div>

      {/* Experience & Fit Strip */}
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-2 border-y py-3 text-xs',
          borderSubtle
        )}
      >
        <div>
          <span className={mutedText}>Experience required: </span>
          <span className="font-semibold">{job.experienceRequired}</span>
        </div>
        <span
          className={cn(
            'rounded border px-2.5 py-0.5 text-xs font-semibold',
            fitBadgeTone
          )}
        >
          {getExpBadgeLabel(job)}
        </span>
      </div>

      {/* Match Rationale & Skills */}
      <div className="space-y-2.5">
        <p className="text-xs leading-relaxed">
          <span className="font-semibold">Fit summary for {activeProfileName}: </span>
          <span className={mutedText}>{job.matchReason}</span>
        </p>

        <div className="flex flex-wrap gap-1.5">
          {job.matchedSkills.map((s) => (
            <span
              key={`d-m-${s}`}
              className={cn(
                'rounded border px-2 py-0.5 text-[11px] font-medium',
                isDark
                  ? 'border-zinc-700 bg-zinc-800/80 text-zinc-100 font-medium'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              )}
            >
              ✓ {s}
            </span>
          ))}
          {job.missingSkills.map((s) => (
            <span
              key={`d-x-${s}`}
              className={cn(
                'rounded border border-dashed px-2 py-0.5 text-[11px]',
                borderSubtle,
                mutedText
              )}
            >
              + {s}
            </span>
          ))}
        </div>
      </div>

      {/* Job Description */}
      <div className={cn('space-y-2 border-t pt-4', borderSubtle)}>
        <h3 className="text-sm font-semibold">Job Description</h3>
        <div className="whitespace-pre-line text-sm leading-relaxed lg:max-h-[420px] lg:overflow-y-auto lg:pr-2">
          {job.description}
        </div>
      </div>

      {/* Tailoring Tips */}
      {job.tailoringTips.length > 0 && (
        <div className={cn('space-y-1.5 border-t pt-4 text-xs', borderSubtle)}>
          <h3 className="text-sm font-semibold">Resume Tailoring Notes</h3>
          <ul className={cn('list-disc space-y-1 pl-4', mutedText)}>
            {job.tailoringTips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

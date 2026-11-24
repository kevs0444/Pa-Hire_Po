'use client';

import { Bookmark, Clock, Compass, RotateCcw, X } from 'lucide-react';
import { JobListing, MonochromeTheme } from '@/types/job';
import { formatJobDateLabel } from '@/features/jobs/lib/job-date-utils';
import { BoardLogo } from '@/components/ui/BrandLogos';
import { CopyUrlButton } from '@/components/ui/CopyUrlButton';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface DiscoveryJobCardProps {
  job: JobListing;
  theme: MonochromeTheme;
  variant?: 'discovery' | 'explorer';
  isSelected?: boolean;
  isSaved?: boolean;
  isViewed?: boolean;
  nowMs?: number | null;
  onSelect: () => void;
  onToggleSave: () => void;
  onHide: () => void;
  onUnhide?: () => void;
}

function getMatchTier(
  score: number,
  tokens: ReturnType<typeof getThemeTokens>
): { label: string; className: string } {
  if (score >= 75) {
    return {
      label: `✓ ${score}% Very strong match`,
      className: tokens.badgeSuccess,
    };
  }
  if (score >= 55) {
    return {
      label: `✓ ${score}% Strong match`,
      className: tokens.badgeAccent,
    };
  }
  return {
    label: `${score}% Match`,
    className: tokens.badgeNeutral,
  };
}

function buildDiscoveryHighlights(job: JobListing): string[] {
  const bullets: string[] = [];

  const fitCopy =
    job.experienceFit === 'fit'
      ? 'Matches your level'
      : job.experienceFit === 'stretch'
        ? 'Slight stretch'
        : 'Senior experience requested';
  bullets.push(`Exp: ${job.experienceRequired} • ${fitCopy}`);

  if (job.matchedSkills.length > 0) {
    bullets.push(`Matched skills: ${job.matchedSkills.slice(0, 4).join(', ')}`);
  }

  const tip = (job.tailoringTips[0] || job.matchReason || '').trim();
  if (tip) {
    bullets.push(tip.length > 105 ? `${tip.slice(0, 102).trimEnd()}...` : tip);
  }

  return bullets.slice(0, 3);
}

export function DiscoveryJobCard({
  job,
  theme,
  variant = 'discovery',
  isSelected = false,
  isSaved: isSavedProp,
  isViewed = false,
  nowMs = null,
  onSelect,
  onToggleSave,
  onHide,
  onUnhide,
}: DiscoveryJobCardProps) {
  const tokens = getThemeTokens(theme);
  const matchTier = getMatchTier(job.matchScore, tokens);
  const isSaved = isSavedProp ?? job.status === 'saved';
  const isApplied = job.status === 'applied';
  const isHidden = job.status === 'hidden';
  const dateLabel = formatJobDateLabel(job, nowMs ?? undefined);

  if (variant === 'explorer') {
    return (
      <div className="discovery-card-container">
        <article
          onClick={onSelect}
          className={cn(
            'cursor-pointer space-y-2 rounded-lg border p-3.5 transition-colors',
            isSelected ? tokens.selectedCard : tokens.cardSurface
          )}
        >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <BoardLogo source={job.source} theme={theme} size="sm" />
            {job.isPivotSuggestion && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium',
                  tokens.secondaryBtn
                )}
              >
                <Compass className="h-3 w-3" />
                Pivot
              </span>
            )}
            {isSaved && (
              <span
                className={cn(
                  'rounded border px-1.5 py-0.5 text-[11px] font-semibold',
                  tokens.badgeAccent
                )}
              >
                Saved
              </span>
            )}
            {isApplied && (
              <span
                className={cn(
                  'rounded border px-1.5 py-0.5 text-[11px] font-semibold',
                  tokens.badgeSuccess
                )}
              >
                Applied
              </span>
            )}
          </div>
          <span
            className={cn(
              'shrink-0 rounded border px-2 py-0.5 font-mono text-xs font-medium tabular-nums',
              matchTier.className
            )}
          >
            {job.matchScore >= 75 ? `✓ ${job.matchScore}%` : `${job.matchScore}%`}
          </span>
        </div>

        <div>
          <h3 className={cn('text-[15px] font-semibold leading-snug', tokens.strongText)}>
            {job.title}
          </h3>
          <p className={cn('mt-0.5 text-xs font-medium', tokens.mutedText)}>
            {job.company} • {job.location}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={cn(
              'rounded border px-2 py-0.5 text-[11px] font-medium',
              job.experienceFit === 'senior-warning'
                ? cn('border-dashed', tokens.borderSubtle, tokens.mutedText)
                : tokens.subSurface
            )}
          >
            Exp: {job.experienceRequired}
          </span>
          {job.salary && (
            <span className={cn('font-mono text-[11px] font-medium', tokens.mutedText)}>
              {job.salary}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <div className="flex flex-wrap gap-1">
            {job.matchedSkills.slice(0, 3).map((s) => (
              <span
                key={s}
                className={cn('rounded border px-1.5 py-0.5 text-[11px] font-medium', tokens.subSurface)}
              >
                ✓ {s}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <CopyUrlButton url={job.url} theme={theme} compact />
            <span
              className={cn('inline-flex items-center gap-1 font-mono text-[11px]', tokens.mutedText)}
              title={`Posted: ${job.postedAt}`}
            >
              <Clock className="h-3 w-3 opacity-70" />
              {dateLabel}
              {isViewed ? ' • Viewed' : ''}
            </span>
          </div>
        </div>
        </article>
      </div>
    );
  }

  const highlights = buildDiscoveryHighlights(job);

  return (
    <div className="discovery-card-container">
      <article
        onClick={onSelect}
        className={cn(
          'group cursor-pointer rounded-lg border p-4 transition-colors sm:p-5',
          tokens.cardSurface,
          tokens.isDark ? 'hover:border-zinc-700' : 'hover:border-slate-300'
        )}
      >
        {/* Top Row: Title + Company + Match Pill on Left, Board Logo on Right */}
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0 space-y-1.5">
            <div>
              <h3
                className={cn(
                  'font-display text-[clamp(0.95rem,0.9rem+0.4cqi,1.0625rem)] font-bold leading-snug group-hover:underline',
                  tokens.strongText
                )}
              >
                {job.title}
              </h3>
            <p className={cn('mt-0.5 text-[13px] font-medium', tokens.mutedText)}>
              {job.company}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span
              className={cn(
                'inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums',
                matchTier.className
              )}
            >
              {matchTier.label}
            </span>
            {isApplied && (
              <span
                className={cn(
                  'rounded-md border px-2 py-0.5 text-[11px] font-semibold',
                  tokens.badgeSuccess
                )}
              >
                ✓ Applied
              </span>
            )}
            {job.isPivotSuggestion && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium',
                  tokens.badgeNeutral
                )}
              >
                <Compass className="h-3 w-3" />
                Pivot
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 pt-0.5">
          <BoardLogo source={job.source} theme={theme} size="md" />
        </div>
      </div>

      {/* Stacked Location / Work Type / Salary Specs (Pic 1 Rhythm) */}
      <div className={cn('mt-3 space-y-0.5 text-[13px]', tokens.mutedText)}>
        {job.workType && <p>{job.workType}</p>}
        <p>{job.location}</p>
        {job.salary && (
          <p className={cn('font-mono text-xs font-medium', tokens.strongText)}>
            {job.salary}
          </p>
        )}
      </div>

      {/* Concise Highlights */}
      {highlights.length > 0 && (
        <ul className={cn('mt-2.5 list-disc space-y-0.5 pl-4 text-[13px]', tokens.mutedText)}>
          {highlights.map((item, idx) => (
            <li key={`${job.id}-hl-${idx}`} className="leading-snug">
              {item}
            </li>
          ))}
        </ul>
      )}

      {/* Footer Row: Date + Viewed + Copy URL on Left, Bookmark + Hide on Right */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn('text-xs font-medium', tokens.mutedText)}
            title={`Posted: ${job.postedAt}`}
          >
            {dateLabel}
            {isViewed ? ' • Viewed' : ''}
          </span>
          <CopyUrlButton url={job.url} theme={theme} compact />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-pressed={isSaved}
            aria-label={isSaved ? 'Remove from Saved jobs' : 'Save job'}
            title={isSaved ? 'Saved' : 'Save job'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave();
            }}
            className={cn(
              'civic-touch-target inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
              isSaved
                ? tokens.isDark
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'bg-[#0a66c2]/10 text-[#0a66c2]'
                : cn(
                    tokens.mutedText,
                    tokens.isDark ? 'hover:bg-zinc-800/70' : 'hover:bg-slate-100'
                  )
            )}
          >
            <Bookmark
              className={cn('h-4 w-4', isSaved && 'fill-current')}
            />
          </button>

          {isHidden && onUnhide ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUnhide();
              }}
              className={cn(
                'civic-touch-target inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                tokens.mutedText,
                tokens.isDark ? 'hover:bg-zinc-800/70' : 'hover:bg-slate-100'
              )}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restore</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onHide();
              }}
              className={cn(
                'civic-touch-target inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                tokens.mutedText,
                tokens.isDark ? 'hover:bg-zinc-800/70' : 'hover:bg-slate-100'
              )}
              title="Hide job"
            >
              <X className="h-3.5 w-3.5" />
              <span>Hide</span>
            </button>
          )}
        </div>
      </div>
      </article>
    </div>
  );
}

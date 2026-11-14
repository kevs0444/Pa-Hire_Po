'use client';

import {
  Award,
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
  Lightbulb,
  ListPlus,
  MapPin,
  Sparkles,
  Wallet,
  Wand2,
} from 'lucide-react';
import { JobListing, JobStatus, MonochromeTheme } from '@/types/job';
import { BoardLogo } from '@/components/ui/BrandLogos';
import { MatchScoreRing } from '@/components/ui/MatchScoreRing';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface JobDetailPaneProps {
  job: JobListing | null;
  activeProfileName: string;
  theme: MonochromeTheme;
  isQueued: boolean;
  onOpenApplyModal: (job: JobListing) => void;
  onToggleQueueJob: (jobId: string) => void;
  onUpdateStatus: (jobId: string, status: JobStatus) => void;
}

function getExpBadgeLabel(job: JobListing) {
  if (job.experienceFit === 'fit') return 'Matches Your Level';
  if (job.experienceFit === 'stretch') return 'Slight Stretch';
  return 'Senior Exp Requested';
}

export function JobDetailPane({
  job,
  activeProfileName,
  theme,
  isQueued,
  onOpenApplyModal,
  onToggleQueueJob,
  onUpdateStatus,
}: JobDetailPaneProps) {
  const {
    cardSurface,
    subSurface,
    primaryBtn,
    secondaryBtn,
    orangeBadge,
    mutedText,
    strongText,
  } = getThemeTokens(theme);

  if (!job) {
    return (
      <div className={cn('rounded-3xl border border-dashed p-12 text-center', cardSurface)}>
        <Briefcase className="mx-auto h-8 w-8 opacity-60" />
        <p className="mt-3 text-sm font-bold">Select a job on the left</p>
        <p className={cn('mt-1 text-xs', mutedText)}>
          Click any job card to inspect experience requirements, matched skills, and apply with step-by-step A4 resume tailoring.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-5 rounded-3xl border p-5 sm:p-6', cardSurface)}>
      {/* Detail Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <BoardLogo source={job.source} theme={theme} size="lg" />
            {job.isPivotSuggestion && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold',
                  secondaryBtn
                )}
              >
                <Compass className="h-3 w-3" />
                Pivot Role: {job.searchedRole}
              </span>
            )}
            {job.isFallback && (
              <span
                className={cn(
                  'rounded-md border border-dashed px-2 py-0.5 text-[10px]',
                  mutedText
                )}
              >
                Direct Search Link
              </span>
            )}
          </div>

          <h2 className="text-xl font-extrabold leading-tight">{job.title}</h2>

          <div
            className={cn(
              'flex flex-wrap items-center gap-x-4 gap-y-1 text-xs',
              mutedText
            )}
          >
            <span
              className={cn(
                'inline-flex items-center gap-1.5 font-bold',
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
                  'inline-flex items-center gap-1 font-bold',
                  strongText
                )}
              >
                <Wallet className="h-3.5 w-3.5 text-orange-500" />
                {job.salary}
              </span>
            )}
          </div>
        </div>

        <MatchScoreRing score={job.matchScore} size={64} theme={theme} />
      </div>

      {/* PROMINENT EXPERIENCE NEEDED CALLOUT */}
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-2 rounded-2xl border p-3.5',
          subSurface
        )}
      >
        <div className="flex items-center gap-2.5">
          <Award className="h-5 w-5 shrink-0 text-orange-500" />
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider opacity-70">
              Experience Needed
            </div>
            <div className="text-sm font-extrabold">{job.experienceRequired}</div>
          </div>
        </div>
        <span
          className={cn(
            'rounded-lg border px-2.5 py-1 text-xs font-bold',
            job.experienceFit === 'fit' ? orangeBadge : secondaryBtn
          )}
        >
          {getExpBadgeLabel(job)}
        </span>
      </div>

      {/* JOBSTREET-STYLE ACTION BAR */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onOpenApplyModal(job)}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-extrabold transition',
            primaryBtn
          )}
        >
          <Wand2 className="h-4 w-4" />
          Apply for This Job (Tailor A4 Resume)
        </button>

        <button
          type="button"
          onClick={() => onToggleQueueJob(job.id)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition',
            isQueued ? primaryBtn : secondaryBtn
          )}
        >
          {isQueued ? (
            <Check className="h-4 w-4" />
          ) : (
            <ListPlus className="h-4 w-4" />
          )}
          {isQueued ? 'In Auto-Apply Queue' : 'Add to Auto-Apply Queue'}
        </button>

        <button
          type="button"
          onClick={() =>
            onUpdateStatus(job.id, job.status === 'saved' ? 'suggested' : 'saved')
          }
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold',
            secondaryBtn
          )}
        >
          {job.status === 'saved' ? (
            <BookmarkCheck className="h-4 w-4" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
          {job.status === 'saved' ? 'Saved' : 'Save'}
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
            'inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold',
            secondaryBtn
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          {job.status === 'applied' ? 'Applied' : 'Mark Applied'}
        </button>

        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold',
            secondaryBtn
          )}
        >
          Open Original
          <ExternalLink className="h-3.5 w-3.5" />
        </a>

        <button
          type="button"
          onClick={() =>
            onUpdateStatus(job.id, job.status === 'hidden' ? 'suggested' : 'hidden')
          }
          className={cn('ml-auto rounded-xl border p-2.5', secondaryBtn)}
          title="Hide job"
        >
          <EyeOff className="h-4 w-4" />
        </button>
      </div>

      {/* MATCH RATIONALE & SKILLS */}
      <div className={cn('space-y-3 rounded-2xl border p-4', subSurface)}>
        <div className="flex items-start gap-2 text-xs">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <strong>Why this fits {activeProfileName}: </strong>
            {job.matchReason}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {job.matchedSkills.map((s) => (
            <span
              key={`d-m-${s}`}
              className={cn(
                'rounded-md border px-2 py-0.5 text-[11px] font-bold',
                secondaryBtn
              )}
            >
              ✓ {s}
            </span>
          ))}
          {job.missingSkills.map((s) => (
            <span
              key={`d-x-${s}`}
              className={cn(
                'rounded-md border border-dashed px-2 py-0.5 text-[11px]',
                mutedText
              )}
            >
              + {s}
            </span>
          ))}
        </div>
      </div>

      {/* JOB DESCRIPTION */}
      <div className="space-y-2">
        <h3 className="text-xs font-extrabold uppercase tracking-wider">
          Job Description &amp; Details
        </h3>
        <div
          className={cn(
            'max-h-[340px] overflow-y-auto whitespace-pre-line rounded-2xl border p-4 text-xs leading-relaxed',
            subSurface
          )}
        >
          {job.description}
        </div>
      </div>

      {/* TAILORING TIPS */}
      {job.tailoringTips.length > 0 && (
        <div className={cn('space-y-1.5 rounded-2xl border p-4 text-xs', subSurface)}>
          <div className="flex items-center gap-1.5 font-bold">
            <Lightbulb className="h-4 w-4" />
            <span>How to Tailor Before Applying:</span>
          </div>
          <ul className="list-disc space-y-1 pl-4 opacity-90">
            {job.tailoringTips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

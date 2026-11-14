'use client';

import { useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  ExternalLink,
  EyeOff,
  Lightbulb,
  MapPin,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { JobListing, JobSource, JobStatus } from '@/types/job';
import { MatchScoreRing } from '@/components/MatchScoreRing';
import { cn } from '@/lib/utils';

interface JobCardProps {
  job: JobListing;
  onUpdateStatus: (jobId: string, status: JobStatus) => void;
}

const SOURCE_META: Record<
  JobSource,
  { label: string; badgeClass: string }
> = {
  linkedin: {
    label: 'LinkedIn',
    badgeClass: 'border-sky-500/30 bg-sky-500/15 text-sky-300',
  },
  jobstreet: {
    label: 'JobStreet',
    badgeClass: 'border-fuchsia-500/30 bg-fuchsia-500/15 text-fuchsia-300',
  },
  indeed: {
    label: 'Indeed',
    badgeClass: 'border-indigo-500/30 bg-indigo-500/15 text-indigo-300',
  },
};

export function JobCard({ job, onUpdateStatus }: JobCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const sourceInfo = SOURCE_META[job.source];
  const isSaved = job.status === 'saved';
  const isApplied = job.status === 'applied';

  return (
    <article
      className={cn(
        'group rounded-2xl border bg-slate-900/75 p-5 transition-all hover:border-slate-600/80 hover:bg-slate-900',
        job.isPivotSuggestion
          ? 'border-violet-500/30 shadow-[0_0_24px_-12px_rgba(139,92,246,0.35)]'
          : 'border-slate-800'
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <MatchScoreRing score={job.matchScore} />

          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                  sourceInfo.badgeClass
                )}
              >
                {sourceInfo.label}
              </span>

              {job.isPivotSuggestion ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/40 bg-violet-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-violet-300">
                  <Compass className="h-3 w-3" />
                  Role Pivot: {job.searchedRole}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                  Target: {job.searchedRole}
                </span>
              )}

              {job.isFallback && (
                <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                  Direct Board Link
                </span>
              )}

              {isApplied && (
                <span className="inline-flex items-center gap-1 rounded-full border border-teal-500/40 bg-teal-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-teal-300">
                  <CheckCircle2 className="h-3 w-3" />
                  Applied
                </span>
              )}
            </div>

            <h3 className="text-lg font-semibold leading-snug text-slate-50">
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-300 hover:underline"
              >
                {job.title}
              </a>
            </h3>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5 text-slate-200 font-medium">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                {job.company}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {job.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                {job.postedAt}
              </span>
              {job.salary && (
                <span className="inline-flex items-center gap-1 text-emerald-300 font-medium">
                  <Wallet className="h-3.5 w-3.5" />
                  {job.salary}
                </span>
              )}
              {job.workType && (
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[11px] text-slate-300">
                  {job.workType}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Apply on {sourceInfo.label}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <button
            type="button"
            onClick={() => onUpdateStatus(job.id, isSaved ? 'suggested' : 'saved')}
            className={cn(
              'inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-medium transition',
              isSaved
                ? 'border-amber-400/40 bg-amber-400/15 text-amber-300'
                : 'border-slate-700 bg-slate-800/70 text-slate-300 hover:border-slate-600 hover:text-white'
            )}
            title={isSaved ? 'Remove from saved' : 'Save job'}
          >
            {isSaved ? (
              <BookmarkCheck className="h-3.5 w-3.5" />
            ) : (
              <Bookmark className="h-3.5 w-3.5" />
            )}
            {isSaved ? 'Saved' : 'Save'}
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdateStatus(job.id, isApplied ? 'suggested' : 'applied')
            }
            className={cn(
              'inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-medium transition',
              isApplied
                ? 'border-teal-400/40 bg-teal-400/15 text-teal-300'
                : 'border-slate-700 bg-slate-800/70 text-slate-300 hover:border-slate-600 hover:text-white'
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {isApplied ? 'Applied' : 'Mark Applied'}
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdateStatus(job.id, job.status === 'hidden' ? 'suggested' : 'hidden')
            }
            className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-800/40 p-2 text-slate-400 transition hover:border-slate-700 hover:text-slate-200"
            title={job.status === 'hidden' ? 'Restore job' : 'Hide job'}
          >
            <EyeOff className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Match Explanation */}
      <div className="mt-4 rounded-xl border border-slate-800/90 bg-slate-950/60 px-3.5 py-2.5 text-xs text-slate-300">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <p>
            <span className="font-semibold text-slate-100">
              Why PleaseHireMe picked this:{' '}
            </span>
            {job.matchReason}
          </p>
        </div>
      </div>

      {/* Skills Match Pills */}
      {(job.matchedSkills.length > 0 || job.missingSkills.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {job.matchedSkills.map((skill) => (
            <span
              key={`match-${skill}`}
              className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300"
            >
              ✓ {skill}
            </span>
          ))}
          {job.missingSkills.map((skill) => (
            <span
              key={`miss-${skill}`}
              className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300"
              title="Mentioned in job posting or role blueprint, not currently listed in your skills"
            >
              + {skill}
            </span>
          ))}
        </div>
      )}

      {/* Expandable Description & Resume Tips */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-200"
          >
            {expanded ? (
              <>
                Hide description <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Preview listing <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowTips((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs font-medium text-amber-300/90 hover:text-amber-200"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            {showTips ? 'Hide tailoring tips' : 'Tailor resume tips'}
          </button>
        </div>

        <span className="text-[11px] text-slate-500">
          {job.matchedSkills.length} matched skills
        </span>
      </div>

      {expanded && (
        <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 text-xs leading-relaxed text-slate-300 whitespace-pre-line">
          {job.description}
        </div>
      )}

      {showTips && job.tailoringTips.length > 0 && (
        <div className="mt-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 text-xs text-amber-100">
          <p className="mb-1.5 font-semibold text-amber-300">
            Quick Resume Tailoring Tips for {job.company}:
          </p>
          <ul className="list-disc space-y-1 pl-4">
            {job.tailoringTips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

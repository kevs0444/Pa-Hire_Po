'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Printer,
  X,
} from 'lucide-react';
import {
  JobListing,
  MonochromeTheme,
  StructuredResume,
  UserProfile,
} from '@/types/job';
import { A4ResumePreview } from '@/features/resume/components/A4ResumePreview';
import { BoardLogo } from '@/components/ui/BrandLogos';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { RESUME_PRINT_REQUEST_EVENT } from '@/features/resume/lib/resume-print';

interface ApplyFlowModalProps {
  job: JobListing | null;
  profile: UserProfile;
  theme: MonochromeTheme;
  geminiApiKey: string;
  personalApiConfigured?: boolean;
  onClose: () => void;
  onMarkApplied: (jobId: string, tailoredResumeId?: string | null) => void;
  onUpdateGeminiKey: (key: string) => void;
}

function ApplyFlowContent({
  job,
  profile,
  theme,
  geminiApiKey,
  personalApiConfigured = false,
  titleId,
  onClose,
  onMarkApplied,
  onUpdateGeminiKey,
}: Omit<ApplyFlowModalProps, 'job'> & { job: JobListing; titleId: string }) {
  const [step, setStep] = useState<'prompt' | 'preview'>('prompt');
  const [tailoring, setTailoring] = useState(false);
  const [tailoredResume, setTailoredResume] = useState<StructuredResume | null>(
    null
  );
  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tokens = getThemeTokens(theme);
  const boardName =
    job.source === 'linkedin'
      ? 'LinkedIn'
      : job.source === 'jobstreet'
        ? 'JobStreet'
        : 'Indeed';

  const boxSurface = tokens.subSurface;
  const primaryBtn = tokens.primaryBtn;
  const secondaryBtn = tokens.secondaryBtn;
  const mutedText = tokens.mutedText;
  const borderSubtle = tokens.borderSubtle;

  const handleTailorForJob = async () => {
    setTailoring(true);
    setError(null);

    try {
      const res = await fetch('/api/resume/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          targetJob: job,
          targetRole: job.title,
          geminiApiKey,
          pageSize: (tailoredResume || profile.structuredResume).pageSize || 'a4',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.resume) {
        throw new Error(data.error || 'Could not tailor resume');
      }
      setTailoredResume(data.resume as StructuredResume);
      setSnapshotId(typeof data.snapshotId === 'string' ? data.snapshotId : null);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tailoring failed');
    } finally {
      setTailoring(false);
    }
  };

  const handleApplyAndMark = () => {
    window.open(job.url, '_blank', 'noopener,noreferrer');
    const resumeUsed = tailoredResume || profile.structuredResume;
    const isModifiedFromBase =
      Boolean(tailoredResume) &&
      JSON.stringify(tailoredResume) !== JSON.stringify(profile.structuredResume);
    const inferredSourceType =
      resumeUsed.tailorMethod === 'gemini-ai'
        ? 'ai-tailor'
        : resumeUsed.tailorMethod === 'smart-engine'
          ? 'smart-engine'
          : isModifiedFromBase
            ? 'manual-edit'
            : 'base';

    if (snapshotId) {
      void fetch('/api/resumes/history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          id: snapshotId,
          isSent: true,
          company: job.company,
          jobTitle: job.title,
          resumeData: resumeUsed,
        }),
      }).catch(() => undefined);
      onMarkApplied(job.id, snapshotId);
    } else {
      void fetch('/api/resumes/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          tailorMethod: resumeUsed.tailorMethod || 'base',
          sourceType: inferredSourceType,
          isSent: true,
          resumeData: {
            ...resumeUsed,
            tailoredForJobTitle: job.title,
            tailoredForCompany: job.company,
          },
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          onMarkApplied(job.id, d?.record?.id || null);
        })
        .catch(() => {
          onMarkApplied(job.id, null);
        });
    }
    onClose();
  };

  return (
    <div
      className={cn(
        'flex max-h-[92vh] w-full flex-col overflow-hidden print:max-h-none print:overflow-visible print:w-full! print:max-w-none! print:m-0! print:p-0! print:bg-white!',
        step === 'preview' ? 'sm:w-[min(92vw,1024px)]' : 'sm:w-[min(92vw,672px)]'
      )}
    >
      {/* Top Step Indicator Header */}
      <div
        className={cn(
          'no-print flex items-center justify-between gap-3 border-b px-5 py-4',
          borderSubtle
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <BoardLogo source={job.source} theme={theme} size="md" showLabel={false} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className={step === 'prompt' ? 'font-semibold' : mutedText}>
                1. Tailor Resume
              </span>
              <span className={mutedText}>→</span>
              <span className={step === 'preview' ? 'font-semibold' : mutedText}>
                2. Preview &amp; Apply
              </span>
            </div>
            <h2 id={titleId} className="truncate text-sm font-semibold">
              {job.title} — {job.company}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={cn('rounded-lg border p-2 transition-colors', secondaryBtn)}
          aria-label="Close application modal"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Modal Body */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 print:overflow-visible print:p-0">
        {step === 'prompt' ? (
          <div className="space-y-4">
            {/* Job Summary */}
            <div className={cn('rounded-lg border p-4 space-y-3', boxSurface)}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <BoardLogo source={job.source} theme={theme} size="md" />
                <span
                  className={cn(
                    'rounded border px-2.5 py-0.5 font-mono text-xs font-medium tabular-nums',
                    tokens.orangeBadge
                  )}
                >
                  {job.matchScore}% Match
                </span>
              </div>

              <div>
                <h3 className="text-base font-semibold">{job.title}</h3>
                <p className={cn('text-xs', mutedText)}>
                  {job.company} • {job.location} • {job.postedAt}
                </p>
              </div>

              <div
                className={cn(
                  'flex flex-wrap items-center justify-between gap-2 border-t pt-2.5 text-xs',
                  borderSubtle
                )}
              >
                <span className="font-medium">
                  Experience required: {job.experienceRequired}
                </span>
                <span className="font-medium">
                  {job.experienceFit === 'fit'
                    ? '✓ Applicable to your level'
                    : job.experienceFit === 'stretch'
                      ? 'Slight stretch'
                      : 'Senior experience requested'}
                </span>
              </div>

              {job.matchedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {job.matchedSkills.map((s) => (
                    <span
                      key={s}
                      className={cn(
                        'rounded border px-2 py-0.5 text-[11px] font-medium',
                        secondaryBtn
                      )}
                    >
                      ✓ {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Tailor Decision */}
            <div className="space-y-3 pt-1">
              <div>
                <h4 className="text-sm font-semibold">
                  Tailor your resume in Resume Studio (AI) before applying?
                </h4>
                <p className={cn('mt-1 text-xs leading-relaxed', mutedText)}>
                  Reorders relevant experience and projects from{' '}
                  <strong className="font-semibold">{profile.name}</strong>&apos;s
                  profile using {personalApiConfigured ? 'your personal AI key' : 'Smart Tailor & AI Studio'} to highlight requirements for{' '}
                  <strong className="font-semibold">{job.title}</strong> at{' '}
                  <strong className="font-semibold">{job.company}</strong> (defaults to A4, resizable in Studio).
                </p>
              </div>

              {error && (
                <p
                  className={cn(
                    'rounded-lg border px-3 py-2 text-xs',
                    tokens.isDark
                      ? 'border-red-500/40 bg-red-950/50 text-red-300'
                      : 'border-red-300 bg-red-50 text-red-700'
                  )}
                >
                  {error}
                </p>
              )}

              <div className="flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  autoFocus
                  disabled={tailoring}
                  onClick={() => void handleTailorForJob()}
                  className={cn(
                    'inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs transition-colors disabled:opacity-60',
                    primaryBtn
                  )}
                >
                    {tailoring ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Tailoring Resume for {job.company}...
                      </>
                    ) : (
                      <>
                        Tailor in Resume Studio (AI)
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyAndMark}
                    className={cn(
                      'inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-medium transition-colors',
                      secondaryBtn
                    )}
                  >
                    Skip &amp; Open on {boardName}
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 print:space-y-0! print:m-0! print:p-0!">
              {/* Step 2 Action Bar */}
              <div
                className={cn(
                  'no-print flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3',
                  boxSurface
                )}
              >
                <button
                  type="button"
                  onClick={() => setStep('prompt')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium',
                    secondaryBtn
                  )}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent(RESUME_PRINT_REQUEST_EVENT)
                      )
                    }
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs font-medium',
                      secondaryBtn
                    )}
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print / Save PDF
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyAndMark}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs',
                      primaryBtn
                    )}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Continue to {boardName} &amp; Mark Applied
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <A4ResumePreview
                profile={profile}
                activeResume={tailoredResume || profile.structuredResume}
                activeTailorJob={job}
                theme={theme}
                geminiApiKey={geminiApiKey}
                personalApiConfigured={personalApiConfigured}
                tailoring={tailoring}
                onUpdateGeminiKey={onUpdateGeminiKey}
                onTailorResume={() => void handleTailorForJob()}
                onUpdateResume={(next) => setTailoredResume(next)}
                onResetResume={() => setTailoredResume(profile.structuredResume)}
              />
            </div>
          )}
      </div>
    </div>
  );
}

export function ApplyFlowModal({
  job,
  profile,
  theme,
  geminiApiKey,
  personalApiConfigured = false,
  onClose,
  onMarkApplied,
  onUpdateGeminiKey,
}: ApplyFlowModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const tokens = getThemeTokens(theme);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (job && !dialog.open) {
      dialog.showModal();
    } else if (!job && dialog.open) {
      dialog.close();
    }
  }, [job]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleNativeClose = () => {
      dialog.returnValue = '';
      onClose();
    };
    dialog.addEventListener('close', handleNativeClose);

    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const outside = (e: PointerEvent) => {
        const r = dialog.getBoundingClientRect();
        return (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        );
      };
      let pressedOutside = false;
      const onPointerDown = (e: PointerEvent) => {
        pressedOutside = outside(e);
      };
      const onPointerUp = (e: PointerEvent) => {
        if (pressedOutside && outside(e)) {
          dialog.close();
        }
      };
      dialog.addEventListener('pointerdown', onPointerDown);
      dialog.addEventListener('pointerup', onPointerUp);
      return () => {
        dialog.removeEventListener('close', handleNativeClose);
        dialog.removeEventListener('pointerdown', onPointerDown);
        dialog.removeEventListener('pointerup', onPointerUp);
      };
    }

    return () => {
      dialog.removeEventListener('close', handleNativeClose);
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      {...({ closedby: 'any' } as Record<string, string>)}
      className={cn(
        'm-auto max-w-[94vw] rounded-xl border p-0 shadow-xl print:m-0! print:max-w-none! print:w-full! print:rounded-none! print:border-0! print:bg-white! print:p-0! print:shadow-none!',
        tokens.cardSurface
      )}
    >
      {job && (
        <ApplyFlowContent
          key={job.id}
          job={job}
          profile={profile}
          theme={theme}
          geminiApiKey={geminiApiKey}
          personalApiConfigured={personalApiConfigured}
          titleId={titleId}
          onClose={() => dialogRef.current?.close()}
          onMarkApplied={onMarkApplied}
          onUpdateGeminiKey={onUpdateGeminiKey}
        />
      )}
    </dialog>
  );
}

'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Printer,
  Sparkles,
  Wand2,
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
import { cn } from '@/lib/utils';

interface ApplyFlowModalProps {
  job: JobListing | null;
  profile: UserProfile;
  theme: MonochromeTheme;
  geminiApiKey: string;
  onClose: () => void;
  onMarkApplied: (jobId: string) => void;
  onUpdateGeminiKey: (key: string) => void;
}

export function ApplyFlowModal({
  job,
  profile,
  theme,
  geminiApiKey,
  onClose,
  onMarkApplied,
  onUpdateGeminiKey,
}: ApplyFlowModalProps) {
  const [step, setStep] = useState<'prompt' | 'preview'>('prompt');
  const [tailoring, setTailoring] = useState(false);
  const [tailoredResume, setTailoredResume] = useState<StructuredResume | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  if (!job) return null;

  const isDark = theme === 'dark';
  const boardName =
    job.source === 'linkedin'
      ? 'LinkedIn'
      : job.source === 'jobstreet'
        ? 'JobStreet'
        : 'Indeed';

  const modalSurface = isDark
    ? 'border-neutral-800 bg-black text-white'
    : 'border-neutral-200 bg-white text-black';
  const boxSurface = isDark
    ? 'border-neutral-800 bg-neutral-950'
    : 'border-neutral-200 bg-neutral-50';
  const primaryBtn = isDark
    ? 'bg-white text-black hover:bg-neutral-200'
    : 'bg-black text-white hover:bg-neutral-800';
  const secondaryBtn = isDark
    ? 'border-neutral-700 bg-black text-neutral-200 hover:border-white'
    : 'border-neutral-300 bg-white text-neutral-800 hover:border-black';
  const mutedText = isDark ? 'text-neutral-400' : 'text-neutral-600';

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
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.resume) {
        throw new Error(data.error || 'Could not tailor resume');
      }
      setTailoredResume(data.resume as StructuredResume);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tailoring failed');
    } finally {
      setTailoring(false);
    }
  };

  const handleApplyAndMark = () => {
    window.open(job.url, '_blank', 'noopener,noreferrer');
    onMarkApplied(job.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6">
      <div
        className={cn(
          'flex max-h-[94vh] w-full flex-col overflow-hidden rounded-3xl border shadow-2xl',
          step === 'preview' ? 'max-w-5xl' : 'max-w-2xl',
          modalSurface
        )}
      >
        {/* Top Step Indicator Header */}
        <div
          className={cn(
            'no-print flex items-center justify-between gap-3 border-b px-5 py-4',
            isDark ? 'border-neutral-800' : 'border-neutral-200'
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <BoardLogo source={job.source} theme={theme} size="md" showLabel={false} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                <span className={step === 'prompt' ? '' : mutedText}>
                  Step 1: Tailor Choice
                </span>
                <span className={mutedText}>→</span>
                <span className={step === 'preview' ? '' : mutedText}>
                  Step 2: A4 Resume &amp; Apply
                </span>
              </div>
              <h2 className="truncate text-sm font-bold">
                {job.title} — {job.company}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={cn('rounded-xl border p-2', secondaryBtn)}
            aria-label="Close application modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {step === 'prompt' ? (
            <div className="space-y-5">
              {/* Job Summary Card */}
              <div className={cn('rounded-2xl border p-4 space-y-3', boxSurface)}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <BoardLogo source={job.source} theme={theme} size="md" />
                  <span
                    className={cn(
                      'rounded-lg px-2.5 py-1 text-xs font-bold',
                      primaryBtn
                    )}
                  >
                    {job.matchScore}% Match
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold">{job.title}</h3>
                  <p className={cn('text-xs', mutedText)}>
                    {job.company} • {job.location} • {job.postedAt}
                  </p>
                </div>

                {/* Experience Needed Highlight */}
                <div
                  className={cn(
                    'flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs',
                    isDark
                      ? 'border-neutral-700 bg-black'
                      : 'border-neutral-300 bg-white'
                  )}
                >
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Award className="h-4 w-4" />
                    Experience Needed: {job.experienceRequired}
                  </span>
                  <span className="font-semibold">
                    {job.experienceFit === 'fit'
                      ? '✓ Applicable to your level'
                      : job.experienceFit === 'stretch'
                        ? '⚡ Slight stretch'
                        : '⚠️ Senior experience requested'}
                  </span>
                </div>

                {job.matchedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {job.matchedSkills.map((s) => (
                      <span
                        key={s}
                        className={cn(
                          'rounded-md border px-2 py-0.5 text-[11px] font-semibold',
                          secondaryBtn
                        )}
                      >
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Tailor Question */}
              <div className={cn('rounded-2xl border p-5 space-y-4', boxSurface)}>
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                      primaryBtn
                    )}
                  >
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold">
                      Do you want to fix &amp; tailor your A4 Resume for this job before applying?
                    </h4>
                    <p className={cn('mt-1 text-xs leading-relaxed', mutedText)}>
                      We will emphasize your matching projects (e.g., LUXASIA, Phoenix Petroleum, Denso Ten, LEAP AURA, FOVB-AIoT) and skills from{' '}
                      <strong>{profile.name}</strong>&apos;s Career Journey to fit{' '}
                      <strong>{job.title}</strong> at <strong>{job.company}</strong>.
                    </p>
                  </div>
                </div>

                {error && (
                  <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                    {error}
                  </p>
                )}

                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <button
                    type="button"
                    disabled={tailoring}
                    onClick={() => void handleTailorForJob()}
                    className={cn(
                      'inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition disabled:opacity-60',
                      primaryBtn
                    )}
                  >
                    {tailoring ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Tailoring A4 Resume for {job.company}...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        Yes, Tailor My A4 Resume (Step 2)
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyAndMark}
                    className={cn(
                      'inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold transition',
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
            <div className="space-y-4">
              {/* Step 2 Action Bar */}
              <div
                className={cn(
                  'no-print flex flex-wrap items-center justify-between gap-2 rounded-2xl border p-3.5',
                  boxSurface
                )}
              >
                <button
                  type="button"
                  onClick={() => setStep('prompt')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold',
                    secondaryBtn
                  )}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold',
                      secondaryBtn
                    )}
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print / Save A4 PDF
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyAndMark}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold',
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
    </div>
  );
}

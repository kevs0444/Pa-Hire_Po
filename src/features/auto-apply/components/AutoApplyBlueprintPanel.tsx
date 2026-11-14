'use client';

import {
  ExternalLink,
  ListChecks,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';
import { JobListing, MonochromeTheme, UserProfile } from '@/types/job';
import { BoardLogo } from '@/components/ui/BrandLogos';
import { AutoApplyConfig } from '@/features/auto-apply/types';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface AutoApplyBlueprintPanelProps {
  queuedJobs: JobListing[];
  activeProfile: UserProfile;
  config: AutoApplyConfig;
  theme: MonochromeTheme;
  isDesktopApp: boolean;
  onUpdateConfig: (next: AutoApplyConfig) => void;
  onQueueTopChoices: () => void;
  onRemoveQueuedJob: (jobId: string) => void;
  onOpenApplyModal: (job: JobListing) => void;
  onOpenJobInExplorer: (jobId: string) => void;
}

export function AutoApplyBlueprintPanel({
  queuedJobs,
  activeProfile,
  config,
  theme,
  isDesktopApp,
  onUpdateConfig,
  onQueueTopChoices,
  onRemoveQueuedJob,
  onOpenApplyModal,
  onOpenJobInExplorer,
}: AutoApplyBlueprintPanelProps) {
  const {
    cardSurface,
    subSurface,
    inputSurface,
    primaryBtn,
    secondaryBtn,
    mutedText,
    borderSubtle,
  } = getThemeTokens(theme);

  return (
    <section className={cn('space-y-4 rounded-lg border p-5', cardSurface)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight">
              Application Queue &amp; Saved Screening Answers
            </h2>
            <span className={cn('rounded border px-2 py-0.5 text-[11px] font-medium', subSurface, mutedText)}>
              {isDesktopApp ? 'Electron session active' : 'Browser assisted mode'}
            </span>
          </div>
          <p className={cn('max-w-3xl text-xs', mutedText)}>
            Maintain standard screening responses for{' '}
            <strong className="font-semibold">{activeProfile.name}</strong> and launch tailored step-by-step applications from your queue.
          </p>
        </div>

        <button
          type="button"
          onClick={onQueueTopChoices}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs transition-colors',
            primaryBtn
          )}
        >
          <Plus className="h-3.5 w-3.5" />
          Queue Top 3 Matches
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        {/* LEFT: SAVED SCREENING ANSWERS */}
        <div className={cn('space-y-3 rounded-lg border p-4 lg:col-span-5', subSurface)}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold">Saved Screening Answers</h3>
            <span className={cn('rounded border px-2 py-0.5 text-[11px]', secondaryBtn)}>
              Per User
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <label className="block space-y-1">
              <span className={cn('text-[11px] font-medium', mutedText)}>
                Expected Salary
              </span>
              <input
                type="text"
                value={config.expectedSalary}
                onChange={(e) =>
                  onUpdateConfig({ ...config, expectedSalary: e.target.value })
                }
                className={cn('w-full rounded-lg border px-3 py-2 text-xs focus:outline-none', inputSurface)}
              />
            </label>

            <label className="block space-y-1">
              <span className={cn('text-[11px] font-medium', mutedText)}>
                Notice Period / Availability
              </span>
              <input
                type="text"
                value={config.noticePeriod}
                onChange={(e) =>
                  onUpdateConfig({ ...config, noticePeriod: e.target.value })
                }
                className={cn('w-full rounded-lg border px-3 py-2 text-xs focus:outline-none', inputSurface)}
              />
            </label>

            <label className="block space-y-1">
              <span className={cn('text-[11px] font-medium', mutedText)}>
                Work Authorization
              </span>
              <input
                type="text"
                value={config.workAuthorization}
                onChange={(e) =>
                  onUpdateConfig({ ...config, workAuthorization: e.target.value })
                }
                className={cn('w-full rounded-lg border px-3 py-2 text-xs focus:outline-none', inputSurface)}
              />
            </label>

            <label className="block space-y-1">
              <span className={cn('text-[11px] font-medium', mutedText)}>
                Setup / Relocation Readiness
              </span>
              <input
                type="text"
                value={config.willingToRelocate}
                onChange={(e) =>
                  onUpdateConfig({ ...config, willingToRelocate: e.target.value })
                }
                className={cn('w-full rounded-lg border px-3 py-2 text-xs focus:outline-none', inputSurface)}
              />
            </label>

            <div className="grid gap-2 pt-1 sm:grid-cols-2">
              <label className={cn('flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-xs', cardSurface)}>
                <input
                  type="checkbox"
                  checked={config.autoTailorResume}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, autoTailorResume: e.target.checked })
                  }
                  className="h-3.5 w-3.5"
                />
                <span className="font-medium">Auto-Tailor A4</span>
              </label>

              <label className={cn('flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-xs', cardSurface)}>
                <input
                  type="checkbox"
                  checked={config.humanReviewBeforeSubmit}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      humanReviewBeforeSubmit: e.target.checked,
                    })
                  }
                  className="h-3.5 w-3.5"
                />
                <span className="font-medium">Confirm Submit</span>
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT: QUEUED JOBS + ASSISTED LAUNCH */}
        <div className={cn('space-y-3 rounded-lg border p-4 lg:col-span-7', subSurface)}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              <h3 className="text-xs font-semibold">
                Queued Applications ({queuedJobs.length})
              </h3>
            </div>
            <span className={cn('text-[11px]', mutedText)}>
              Tailors A4 PDF before opening the application page
            </span>
          </div>

          {queuedJobs.length === 0 ? (
            <div className={cn('rounded-lg border border-dashed p-6 text-center space-y-1.5', cardSurface)}>
              <p className="text-xs font-semibold">No jobs in your queue yet</p>
              <p className={cn('text-xs', mutedText)}>
                Click &ldquo;Queue Top 3 Matches&rdquo; or add roles from Find Jobs.
              </p>
            </div>
          ) : (
            <div className={cn('max-h-[300px] divide-y overflow-y-auto rounded-lg border', borderSubtle, cardSurface)}>
              {queuedJobs.map((job, idx) => (
                <div
                  key={`queue-${job.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold">
                        #{idx + 1}
                      </span>
                      <BoardLogo source={job.source} theme={theme} size="sm" />
                      <span className="font-mono text-[11px] font-medium tabular-nums">
                        {job.matchScore}% match
                      </span>
                      <span className={cn('rounded border px-1.5 py-0.5 text-[11px]', subSurface, mutedText)}>
                        Exp: {job.experienceRequired}
                      </span>
                      {job.status === 'applied' && (
                        <span className={cn('rounded border px-1.5 py-0.5 text-[11px] font-medium', secondaryBtn)}>
                          Applied
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenJobInExplorer(job.id)}
                      className="text-left text-xs font-semibold hover:underline"
                    >
                      {job.title} — <span className={mutedText}>{job.company}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenApplyModal(job)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs',
                        primaryBtn
                      )}
                    >
                      <Play className="h-3 w-3" />
                      Apply &amp; Tailor
                    </button>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn('rounded-lg border p-1.5', secondaryBtn)}
                      title="Open original job listing"
                      aria-label={`Open ${job.title} externally`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => onRemoveQueuedJob(job.id)}
                      className={cn('rounded-lg border p-1.5', secondaryBtn)}
                      title="Remove from queue"
                      aria-label={`Remove ${job.title} from queue`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

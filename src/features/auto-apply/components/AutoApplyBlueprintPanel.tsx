'use client';

import {
  ChevronDown,
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
    strongText,
    mutedText,
    borderSubtle,
  } = getThemeTokens(theme);

  return (
    <section className="space-y-4">
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 sm:px-5',
          cardSurface
        )}
      >
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={cn('text-sm font-semibold tracking-tight', strongText)}>
              Application Queue &amp; Saved Screening Answers
            </h3>
            <span
              className={cn(
                'rounded border px-2 py-0.5 text-[11px] font-medium',
                subSurface,
                mutedText
              )}
            >
              {isDesktopApp ? 'Electron session active' : 'Browser assisted mode'}
            </span>
          </div>
          <p className={cn('text-xs', mutedText)}>
            Maintain standard responses for{' '}
            <strong className={cn('font-semibold', strongText)}>
              {activeProfile.name}
            </strong>{' '}
            and launch tailored A4 applications step-by-step.
          </p>
        </div>

        <button
          type="button"
          onClick={onQueueTopChoices}
          className={cn(
            'civic-touch-target inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs transition-colors',
            primaryBtn
          )}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Queue Top 3 Matches</span>
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        {/* LEFT 7 COLS: QUEUED JOBS LEAD */}
        <div className={cn('overflow-hidden rounded-lg border lg:col-span-7', cardSurface)}>
          <div
            className={cn(
              'flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3.5 sm:px-5',
              borderSubtle
            )}
          >
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 shrink-0" aria-hidden="true" />
              <h4 className={cn('text-sm font-semibold', strongText)}>
                Queued Applications ({queuedJobs.length})
              </h4>
            </div>
            <span className={cn('text-xs', mutedText)}>
              Tailors A4 PDF before opening portal
            </span>
          </div>

          {queuedJobs.length === 0 ? (
            <div className="space-y-1.5 p-8 text-center">
              <p className={cn('text-sm font-semibold', strongText)}>
                No jobs in your queue yet
              </p>
              <p className={cn('text-xs', mutedText)}>
                Click &ldquo;Queue Top 3 Matches&rdquo; above or queue roles from Job Search.
              </p>
            </div>
          ) : (
            <div className={cn('divide-y', borderSubtle)}>
              {queuedJobs.map((job, idx) => (
                <div
                  key={`queue-${job.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn('font-mono text-[11px] font-semibold', mutedText)}>
                        #{idx + 1}
                      </span>
                      <BoardLogo source={job.source} theme={theme} size="sm" />
                      <span className={cn('font-mono text-[11px] font-medium tabular-nums', strongText)}>
                        {job.matchScore}% match
                      </span>
                      <span className={cn('text-[11px]', mutedText)}>
                        • Exp: {job.experienceRequired}
                      </span>
                      {job.status === 'applied' && (
                        <span
                          className={cn(
                            'rounded border px-1.5 py-0.5 text-[11px] font-medium',
                            secondaryBtn
                          )}
                        >
                          Applied
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenJobInExplorer(job.id)}
                      className={cn(
                        'block text-left text-xs font-semibold hover:underline',
                        strongText
                      )}
                    >
                      {job.title} — <span className={mutedText}>{job.company}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenApplyModal(job)}
                      className={cn(
                        'civic-touch-target inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs',
                        primaryBtn
                      )}
                    >
                      <Play className="h-3 w-3" aria-hidden="true" />
                      <span>Apply &amp; Tailor</span>
                    </button>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'civic-touch-target inline-flex items-center justify-center rounded-lg border p-2',
                        secondaryBtn
                      )}
                      title="Open original job listing"
                      aria-label={`Open ${job.title} externally`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                    <button
                      type="button"
                      onClick={() => onRemoveQueuedJob(job.id)}
                      className={cn(
                        'civic-touch-target inline-flex items-center justify-center rounded-lg border p-2',
                        secondaryBtn
                      )}
                      title="Remove from queue"
                      aria-label={`Remove ${job.title} from queue`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT 5 COLS: COLLAPSIBLE NATIVE <details> SCREENING ANSWERS */}
        <div className="lg:col-span-5">
          <details open className={cn('group overflow-hidden rounded-lg border', cardSurface)}>
            <summary
              className={cn(
                'civic-touch-target flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3.5 sm:px-5',
                strongText
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Saved Screening Answers</span>
                <span
                  className={cn(
                    'rounded border px-2 py-0.5 text-[11px] font-medium',
                    subSurface,
                    mutedText
                  )}
                >
                  Per User
                </span>
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 shrink-0 transition-transform group-open:rotate-180',
                  mutedText
                )}
                aria-hidden="true"
              />
            </summary>

            <div className={cn('space-y-3 border-t p-4 text-xs sm:p-5', borderSubtle)}>
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
                  className={cn(
                    'min-h-[38px] w-full rounded-lg border px-3 py-1.5 text-base focus:outline-none sm:text-xs',
                    inputSurface
                  )}
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
                  className={cn(
                    'min-h-[38px] w-full rounded-lg border px-3 py-1.5 text-base focus:outline-none sm:text-xs',
                    inputSurface
                  )}
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
                    onUpdateConfig({
                      ...config,
                      workAuthorization: e.target.value,
                    })
                  }
                  className={cn(
                    'min-h-[38px] w-full rounded-lg border px-3 py-1.5 text-base focus:outline-none sm:text-xs',
                    inputSurface
                  )}
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
                    onUpdateConfig({
                      ...config,
                      willingToRelocate: e.target.value,
                    })
                  }
                  className={cn(
                    'min-h-[38px] w-full rounded-lg border px-3 py-1.5 text-base focus:outline-none sm:text-xs',
                    inputSurface
                  )}
                />
              </label>

              <div className={cn('flex flex-wrap gap-4 border-t pt-3', borderSubtle)}>
                <label className="civic-touch-target inline-flex cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={config.autoTailorResume}
                    onChange={(e) =>
                      onUpdateConfig({
                        ...config,
                        autoTailorResume: e.target.checked,
                      })
                    }
                    className="h-4 w-4"
                  />
                  <span className="font-medium">Auto-Tailor A4</span>
                </label>

                <label className="civic-touch-target inline-flex cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={config.humanReviewBeforeSubmit}
                    onChange={(e) =>
                      onUpdateConfig({
                        ...config,
                        humanReviewBeforeSubmit: e.target.checked,
                      })
                    }
                    className="h-4 w-4"
                  />
                  <span className="font-medium">Confirm Submit</span>
                </label>
              </div>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}

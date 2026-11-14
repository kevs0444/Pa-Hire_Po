'use client';

import {
  Bot,
  CheckCircle2,
  Cpu,
  ExternalLink,
  FileCheck2,
  ListChecks,
  Monitor,
  Play,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { JobListing, MonochromeTheme, UserProfile } from '@/types/job';
import { BoardLogo } from '@/components/ui/BrandLogos';
import { AutoApplyConfig } from '@/features/auto-apply/types';
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
  const isDark = theme === 'dark';
  const cardSurface = isDark
    ? 'border-neutral-800 bg-neutral-950'
    : 'border-neutral-200 bg-white';
  const subSurface = isDark
    ? 'border-neutral-800 bg-black'
    : 'border-neutral-200 bg-neutral-50';
  const inputSurface = isDark
    ? 'border-neutral-800 bg-black text-white focus:border-white'
    : 'border-neutral-300 bg-white text-black focus:border-black';
  const primaryBtn = isDark
    ? 'bg-white text-black hover:bg-neutral-200'
    : 'bg-black text-white hover:bg-neutral-800';
  const secondaryBtn = isDark
    ? 'border-neutral-800 bg-black text-neutral-200 hover:border-white hover:text-white'
    : 'border-neutral-300 bg-white text-neutral-800 hover:border-black hover:text-black';
  const mutedText = isDark ? 'text-neutral-400' : 'text-neutral-600';

  const stages = [
    {
      step: 'Stage 1',
      icon: ShieldCheck,
      title: 'Smart Match & Experience Gate',
      detail:
        'Automatically excludes senior-warning (5+ yrs) roles and picks jobs matching your skills and target salary.',
      status: 'Active Now',
    },
    {
      step: 'Stage 2',
      icon: FileCheck2,
      title: 'Per-Job Dynamic A4 Resume Tailoring',
      detail:
        'Generates a job-specific 1-page A4 resume emphasizing matching SQL/Python/Power BI bullets for each queued role.',
      status: 'Active Now',
    },
    {
      step: 'Stage 3',
      icon: Monitor,
      title: 'Electron Desktop Session Bridge (Phase 2)',
      detail:
        'Uses electron/main.cjs BrowserView with your local signed-in JobStreet, LinkedIn, & Indeed cookies so cloud anti-bot checks never block you.',
      status: isDesktopApp ? 'Electron Host Ready' : 'Scaffolded in electron/',
    },
    {
      step: 'Stage 4',
      icon: CheckCircle2,
      title: 'Human-in-the-Loop Final Submit Gate',
      detail:
        'Auto-fills phone, expected salary, notice period, and tailored A4 PDF — then pauses right before Submit for your 1-click confirmation.',
      status: 'Safety Rule ON',
    },
  ];

  return (
    <section className={cn('space-y-5 rounded-3xl border p-5 sm:p-6', cardSurface)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <h2 className="text-base font-extrabold tracking-tight">
              Automated Application Co-Pilot &amp; Queue (Phase 1 Active / Phase 2 Electron Blueprint)
            </h2>
          </div>
          <p className={cn('text-xs max-w-3xl', mutedText)}>
            Prepare screening answers once for <strong>{activeProfile.name}</strong>, queue target jobs across LinkedIn, JobStreet, and Indeed, and run assisted step-by-step A4 applications without risking board account bans.
          </p>
        </div>

        <button
          type="button"
          onClick={onQueueTopChoices}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition',
            primaryBtn
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Queue Top 3 Applicable Choices
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        {/* LEFT: SAVED SCREENING ANSWERS */}
        <div className={cn('space-y-3 rounded-2xl border p-4 lg:col-span-5', subSurface)}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider">
              Saved Screening Answers (Pre-Fill Profile)
            </h3>
            <span className={cn('rounded border px-2 py-0.5 text-[10px] font-bold', secondaryBtn)}>
              Per User
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <label className="block space-y-1">
              <span className={cn('text-[11px] font-semibold', mutedText)}>
                Expected Salary
              </span>
              <input
                type="text"
                value={config.expectedSalary}
                onChange={(e) =>
                  onUpdateConfig({ ...config, expectedSalary: e.target.value })
                }
                className={cn('w-full rounded-xl border px-3 py-2 text-xs focus:outline-none', inputSurface)}
              />
            </label>

            <label className="block space-y-1">
              <span className={cn('text-[11px] font-semibold', mutedText)}>
                Notice Period / Availability
              </span>
              <input
                type="text"
                value={config.noticePeriod}
                onChange={(e) =>
                  onUpdateConfig({ ...config, noticePeriod: e.target.value })
                }
                className={cn('w-full rounded-xl border px-3 py-2 text-xs focus:outline-none', inputSurface)}
              />
            </label>

            <label className="block space-y-1">
              <span className={cn('text-[11px] font-semibold', mutedText)}>
                Work Authorization
              </span>
              <input
                type="text"
                value={config.workAuthorization}
                onChange={(e) =>
                  onUpdateConfig({ ...config, workAuthorization: e.target.value })
                }
                className={cn('w-full rounded-xl border px-3 py-2 text-xs focus:outline-none', inputSurface)}
              />
            </label>

            <label className="block space-y-1">
              <span className={cn('text-[11px] font-semibold', mutedText)}>
                Setup / Relocation Readiness
              </span>
              <input
                type="text"
                value={config.willingToRelocate}
                onChange={(e) =>
                  onUpdateConfig({ ...config, willingToRelocate: e.target.value })
                }
                className={cn('w-full rounded-xl border px-3 py-2 text-xs focus:outline-none', inputSurface)}
              />
            </label>

            <div className="grid gap-2 pt-1 sm:grid-cols-2">
              <label className={cn('flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 text-[11px]', cardSurface)}>
                <input
                  type="checkbox"
                  checked={config.autoTailorResume}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, autoTailorResume: e.target.checked })
                  }
                  className="h-3.5 w-3.5 accent-black dark:accent-white"
                />
                <span className="font-semibold">Auto-Tailor A4 Resume</span>
              </label>

              <label className={cn('flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 text-[11px]', cardSurface)}>
                <input
                  type="checkbox"
                  checked={config.humanReviewBeforeSubmit}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      humanReviewBeforeSubmit: e.target.checked,
                    })
                  }
                  className="h-3.5 w-3.5 accent-black dark:accent-white"
                />
                <span className="font-semibold">Confirm Before Submit</span>
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT: QUEUED JOBS + ASSISTED LAUNCH */}
        <div className={cn('space-y-3 rounded-2xl border p-4 lg:col-span-7', subSurface)}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider">
                Auto-Apply Queue ({queuedJobs.length})
              </h3>
            </div>
            <span className={cn('text-[11px]', mutedText)}>
              Tailors A4 PDF per job before opening the board application page
            </span>
          </div>

          {queuedJobs.length === 0 ? (
            <div className={cn('rounded-xl border border-dashed p-6 text-center space-y-2', cardSurface)}>
              <p className="text-xs font-bold">No jobs in your Auto-Apply Queue yet</p>
              <p className={cn('text-[11px]', mutedText)}>
                Click &ldquo;Queue Top 3 Applicable Choices&rdquo; above or use &ldquo;Add to Auto-Apply Queue&rdquo; inside Find Jobs.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {queuedJobs.map((job, idx) => (
                <div
                  key={`queue-${job.id}`}
                  className={cn(
                    'flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3',
                    cardSurface
                  )}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-extrabold', primaryBtn)}>
                        #{idx + 1}
                      </span>
                      <BoardLogo source={job.source} theme={theme} size="sm" />
                      <span className="text-[11px] font-bold">{job.matchScore}% Match</span>
                      <span className={cn('text-[10px] rounded border px-1.5 py-0.5', secondaryBtn)}>
                        Exp: {job.experienceRequired}
                      </span>
                      {job.status === 'applied' && (
                        <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold uppercase', primaryBtn)}>
                          Applied
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenJobInExplorer(job.id)}
                      className="text-left text-xs font-bold hover:underline"
                    >
                      {job.title} — <span className={mutedText}>{job.company}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenApplyModal(job)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold',
                        primaryBtn
                      )}
                    >
                      <Play className="h-3 w-3" />
                      Launch Assisted Apply
                    </button>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn('rounded-lg border p-1.5', secondaryBtn)}
                      title="Open original job listing"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => onRemoveQueuedJob(job.id)}
                      className={cn('rounded-lg border p-1.5', secondaryBtn)}
                      title="Remove from queue"
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

      {/* 4-STAGE ARCHITECTURE ROADMAP */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider">
            Electron Desktop Auto-Apply Architecture Plan
          </h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {stages.map((stage) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.step}
                className={cn('flex flex-col justify-between gap-2 rounded-2xl border p-3.5', subSurface)}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider">
                      <Icon className="h-3.5 w-3.5" />
                      {stage.step}
                    </span>
                    <span className={cn('rounded border px-1.5 py-0.5 text-[9px] font-bold', secondaryBtn)}>
                      {stage.status}
                    </span>
                  </div>
                  <div className="text-xs font-bold">{stage.title}</div>
                  <p className={cn('text-[11px] leading-relaxed', mutedText)}>
                    {stage.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

'use client';

import { useId } from 'react';
import { Briefcase, Download, X } from 'lucide-react';
import { MonochromeTheme } from '@/types/job';
import { InspectedUserPayload } from '@/features/admin/types';
import { BoardLogo } from '@/components/ui/BrandLogos';
import { useNativeDialog } from '@/hooks/useNativeDialog';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface AdminUserInspectDialogProps {
  theme: MonochromeTheme;
  inspectedUser: InspectedUserPayload | null;
  loadingInspect: boolean;
  inspectTab: 'profile' | 'resume' | 'jobs' | 'scans';
  onChangeInspectTab: (tab: 'profile' | 'resume' | 'jobs' | 'scans') => void;
  onClose: () => void;
}

export function AdminUserInspectDialog({
  theme,
  inspectedUser,
  loadingInspect,
  inspectTab,
  onChangeInspectTab,
  onClose,
}: AdminUserInspectDialogProps) {
  const tokens = getThemeTokens(theme);
  const titleId = useId();
  const dialogRef = useNativeDialog(
    Boolean(inspectedUser || loadingInspect),
    onClose
  );

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby={titleId}
      className="m-auto w-[min(96vw,64rem)] max-w-none rounded-xl border-0 bg-transparent p-0 backdrop:bg-slate-950/60"
    >
      <div
        className={cn(
          'flex max-h-[88vh] flex-col overflow-hidden rounded-xl border shadow-xl',
          tokens.cardSurface
        )}
      >
        <div className={cn('flex items-center justify-between border-b px-5 py-3.5', tokens.borderSubtle)}>
          <div>
            <h3 id={titleId} className="text-base font-bold">
              {loadingInspect
                ? 'Loading user record...'
                : `User Inspector — ${inspectedUser?.profile.name || ''}`}
            </h3>
            {inspectedUser && (
              <p className={cn('font-mono text-xs', tokens.mutedText)}>
                {inspectedUser.email} • {inspectedUser.role.toUpperCase()} •{' '}
                {inspectedUser.jobs.length} jobs • {inspectedUser.scanHistory.length} scans
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn('rounded-lg border p-1.5', tokens.secondaryBtn)}
            aria-label="Close inspector"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {inspectedUser && (
          <>
            <div className={cn('flex flex-wrap items-center justify-between gap-2 border-b px-5 py-2.5', tokens.subSurface)}>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'profile', label: 'Profile & Skills' },
                    { id: 'resume', label: 'Structured CV' },
                    {
                      id: 'jobs',
                      label: `Job Pipeline (${inspectedUser.jobs.length})`,
                    },
                    {
                      id: 'scans',
                      label: `Scan Logs (${inspectedUser.scanHistory.length})`,
                    },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onChangeInspectTab(t.id)}
                    className={cn(
                      'rounded-md border px-2.5 py-1 text-xs font-medium',
                      inspectTab === t.id ? tokens.primaryBtn : tokens.secondaryBtn
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {inspectedUser.resumeDownloadUrl && (
                <a
                  href={inspectedUser.resumeDownloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium',
                    tokens.primaryBtn
                  )}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download {inspectedUser.resumeFileName || 'Uploaded Resume'}
                </a>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {inspectTab === 'profile' && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className={cn('rounded-lg border p-3', tokens.subSurface)}>
                      <div className={tokens.mutedText}>Primary Role</div>
                      <div className="mt-0.5 font-semibold">
                        {inspectedUser.profile.primaryRole}
                      </div>
                    </div>
                    <div className={cn('rounded-lg border p-3', tokens.subSurface)}>
                      <div className={tokens.mutedText}>Location &amp; Setup</div>
                      <div className="mt-0.5 font-semibold">
                        {inspectedUser.profile.location} ({inspectedUser.profile.workType})
                      </div>
                    </div>
                    <div className={cn('rounded-lg border p-3', tokens.subSurface)}>
                      <div className={tokens.mutedText}>Target Compensation</div>
                      <div className="mt-0.5 font-semibold">
                        {inspectedUser.profile.salaryExpectation || 'Not set'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-semibold">
                      Skills ({inspectedUser.profile.skills.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {inspectedUser.profile.skills.map((skill) => (
                        <span
                          key={skill}
                          className={cn('rounded border px-2 py-0.5 font-medium', tokens.subSurface)}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {inspectedUser.profile.summary && (
                    <div className="space-y-1">
                      <div className="font-semibold">Profile Summary</div>
                      <p className={cn('rounded-lg border p-3 leading-relaxed', tokens.subSurface)}>
                        {inspectedUser.profile.summary}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {inspectTab === 'resume' && (
                <div className="space-y-4">
                  <div className={cn('rounded-lg border p-4 space-y-1', tokens.subSurface)}>
                    <div className="text-sm font-bold">
                      {inspectedUser.profile.structuredResume.fullName}
                    </div>
                    <div className={tokens.mutedText}>
                      {inspectedUser.profile.structuredResume.targetHeadline}
                    </div>
                    <div className="font-mono text-[11px]">
                      {inspectedUser.profile.structuredResume.email} •{' '}
                      {inspectedUser.profile.structuredResume.location}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-semibold">
                      Experience ({inspectedUser.profile.structuredResume.experience.length})
                    </div>
                    {inspectedUser.profile.structuredResume.experience.map((exp) => (
                      <div
                        key={exp.id}
                        className={cn('rounded-lg border p-3 space-y-1', tokens.subSurface)}
                      >
                        <div className="font-semibold">
                          {exp.role} — {exp.company}
                        </div>
                        <div className={tokens.mutedText}>
                          {exp.period} • {exp.location}
                        </div>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {exp.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {inspectedUser.tailoredResumes.length > 0 && (
                    <div className="space-y-2">
                      <div className="font-semibold">
                        Recent AI Tailored Snapshots ({inspectedUser.tailoredResumes.length})
                      </div>
                      <div className={cn('divide-y rounded-lg border', tokens.borderSubtle, tokens.subSurface)}>
                        {inspectedUser.tailoredResumes.map((snap) => (
                          <div
                            key={snap.id}
                            className="flex items-center justify-between px-3 py-2"
                          >
                            <span>
                              <strong>{snap.job_title || 'Custom Role'}</strong>{' '}
                              {snap.company ? `at ${snap.company}` : ''}
                            </span>
                            <span className="font-mono text-[11px]">
                              {snap.tailor_method} •{' '}
                              {new Date(snap.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {inspectTab === 'jobs' && (
                <div className="space-y-2">
                  {inspectedUser.jobs.length === 0 ? (
                    <div className={cn('rounded-lg border border-dashed p-8 text-center', tokens.mutedText)}>
                      <Briefcase className="mx-auto mb-2 h-6 w-6 opacity-60" />
                      No jobs saved or scanned by this user yet.
                    </div>
                  ) : (
                    <div className={cn('divide-y rounded-lg border', tokens.borderSubtle)}>
                      {inspectedUser.jobs.slice(0, 80).map((job) => (
                        <div
                          key={job.id}
                          className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"
                        >
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <BoardLogo source={job.source} theme={theme} size="sm" />
                              <a
                                href={job.url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold hover:underline"
                              >
                                {job.title}
                              </a>
                            </div>
                            <div className={tokens.mutedText}>
                              {job.company} • {job.location} • {job.postedAt}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            <span className={cn('rounded border px-2 py-0.5 uppercase', tokens.subSurface)}>
                              {job.status}
                            </span>
                            <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800">
                              {job.matchScore}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {inspectTab === 'scans' && (
                <div className="space-y-2">
                  {inspectedUser.scanHistory.length === 0 ? (
                    <div className={cn('rounded-lg border border-dashed p-8 text-center', tokens.mutedText)}>
                      No board scans logged yet.
                    </div>
                  ) : (
                    <div className={cn('divide-y rounded-lg border', tokens.borderSubtle)}>
                      {inspectedUser.scanHistory.map((scan) => (
                        <div
                          key={scan.id}
                          className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"
                        >
                          <div>
                            <div className="font-semibold">
                              {scan.searchedRoles.join(' • ')}
                            </div>
                            <div className={tokens.mutedText}>
                              {new Date(scan.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <div className="font-mono text-[11px]">
                            {scan.totalFound} found • +{scan.newAdded} new
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}

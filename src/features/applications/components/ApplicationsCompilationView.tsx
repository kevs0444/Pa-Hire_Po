'use client';

import { useMemo, useState } from 'react';
import {
  BookmarkCheck,
  Building2,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileText,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import type {
  ApplicationStage,
  JobListing,
  JobSource,
  JobStatus,
  MonochromeTheme,
  StructuredResume,
  TailoredResumeRecord,
  UserProfile,
} from '@/types/job';
import {
  ATS_FONT_PRESETS,
  DENSITY_PRESETS,
  PAGE_SIZE_PRESETS,
  ResumeSheetDocument,
} from '@/features/resume/components/A4ResumePreview';
import { BoardLogo } from '@/components/ui/BrandLogos';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

type CompilationSubView = 'applied' | 'saved' | 'hidden' | 'resumes';

interface ApplicationsCompilationViewProps {
  theme: MonochromeTheme;
  profile: UserProfile;
  jobs: JobListing[];
  resumeRecords: TailoredResumeRecord[];
  loadingResumes: boolean;
  onRefreshResumes: () => Promise<void>;
  onUpdateJobApplication: (
    jobId: string,
    patch: {
      status?: JobStatus;
      applicationStage?: ApplicationStage;
      applicationNotes?: string;
      tailoredResumeId?: string | null;
    }
  ) => void;
  onLogExternalApplication: (payload: {
    company: string;
    title: string;
    source: JobSource;
    url: string;
    notes: string;
    resume: StructuredResume;
  }) => Promise<void>;
  onUpdateResumeRecord: (
    id: string,
    patch: {
      isSent?: boolean;
      notes?: string;
      company?: string;
      jobTitle?: string;
    }
  ) => Promise<void>;
  onDeleteResumeRecord: (id: string) => Promise<void>;
  onOpenInResumeStudio: (resume: StructuredResume, job?: JobListing | null) => void;
  onOpenJobInExplorer: (jobId: string) => void;
}

const STAGE_OPTIONS: { value: ApplicationStage; label: string }[] = [
  { value: 'applied', label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer', label: '✓ Offer Received' },
  { value: 'rejected', label: 'Closed / Rejected' },
];

function getSourceMethodLabel(record: TailoredResumeRecord): string {
  if (record.tailorMethod === 'gemini-ai' || record.sourceType === 'ai-tailor') {
    return 'Gemini AI';
  }
  if (
    record.tailorMethod === 'smart-engine' ||
    record.sourceType === 'smart-engine'
  ) {
    return 'Smart Tailor';
  }
  return 'Manual Edit';
}

export function ApplicationsCompilationView({
  theme,
  profile,
  jobs,
  resumeRecords,
  loadingResumes,
  onRefreshResumes,
  onUpdateJobApplication,
  onLogExternalApplication,
  onUpdateResumeRecord,
  onDeleteResumeRecord,
  onOpenInResumeStudio,
  onOpenJobInExplorer,
}: ApplicationsCompilationViewProps) {
  const tokens = getThemeTokens(theme);
  const {
    isDark,
    cardSurface,
    subSurface,
    inputSurface,
    primaryBtn,
    secondaryBtn,
    selectedCard,
    mutedText,
    strongText,
    borderSubtle,
  } = tokens;

  const [subView, setSubView] = useState<CompilationSubView>('applied');
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | ApplicationStage>('all');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [showLogForm, setShowLogForm] = useState(false);
  const [logging, setLogging] = useState(false);
  const [logForm, setLogForm] = useState({
    company: '',
    title: profile.primaryRole || '',
    source: 'linkedin' as JobSource,
    url: '',
    notes: '',
  });

  const appliedJobs = useMemo(
    () =>
      jobs
        .filter((j) => j.status === 'applied')
        .sort(
          (a, b) =>
            new Date(
              b.appliedAt || b.statusUpdatedAt || b.discoveredAt || 0
            ).getTime() -
            new Date(
              a.appliedAt || a.statusUpdatedAt || a.discoveredAt || 0
            ).getTime()
        ),
    [jobs]
  );

  const savedJobs = useMemo(
    () =>
      jobs
        .filter((j) => j.status === 'saved')
        .sort(
          (a, b) =>
            new Date(
              b.savedAt || b.statusUpdatedAt || b.discoveredAt || 0
            ).getTime() -
            new Date(
              a.savedAt || a.statusUpdatedAt || a.discoveredAt || 0
            ).getTime()
        ),
    [jobs]
  );

  const hiddenJobs = useMemo(
    () =>
      jobs
        .filter((j) => j.status === 'hidden')
        .sort(
          (a, b) =>
            new Date(
              b.hiddenAt || b.statusUpdatedAt || b.discoveredAt || 0
            ).getTime() -
            new Date(
              a.hiddenAt || a.statusUpdatedAt || a.discoveredAt || 0
            ).getTime()
        ),
    [jobs]
  );

  const resumeById = useMemo(
    () => new Map(resumeRecords.map((r) => [r.id, r])),
    [resumeRecords]
  );

  const findLinkedResume = (job: JobListing): TailoredResumeRecord | null => {
    if (job.tailoredResumeId && resumeById.has(job.tailoredResumeId)) {
      return resumeById.get(job.tailoredResumeId) || null;
    }
    return (
      resumeRecords.find((r) => r.jobId === job.id) ||
      resumeRecords.find(
        (r) =>
          r.company &&
          r.company.toLowerCase() === job.company.toLowerCase() &&
          (!r.jobTitle ||
            r.jobTitle.toLowerCase().includes(job.title.toLowerCase()) ||
            job.title.toLowerCase().includes(r.jobTitle.toLowerCase()))
      ) ||
      null
    );
  };

  // Combine applied jobs + standalone sent resume snapshots not linked to an existing job
  const appliedJobIds = useMemo(
    () => new Set(appliedJobs.map((j) => j.id)),
    [appliedJobs]
  );
  const standaloneSentRecords = useMemo(
    () =>
      resumeRecords.filter(
        (r) => r.isSent && (!r.jobId || !appliedJobIds.has(r.jobId))
      ),
    [appliedJobIds, resumeRecords]
  );

  const filteredAppliedItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const jobEntries = appliedJobs
      .filter((job) => {
        if (
          stageFilter !== 'all' &&
          (job.applicationStage || 'applied') !== stageFilter
        ) {
          return false;
        }
        if (!q) return true;
        return `${job.company} ${job.title} ${job.applicationNotes || ''}`
          .toLowerCase()
          .includes(q);
      })
      .map((job) => ({
        key: `job:${job.id}`,
        kind: 'job' as const,
        job,
        record: findLinkedResume(job),
        company: job.company,
        title: job.title,
        stage: (job.applicationStage || 'applied') as ApplicationStage,
        dateIso: job.appliedAt || job.statusUpdatedAt || job.discoveredAt,
      }));

    const standaloneEntries = standaloneSentRecords
      .filter((rec) => {
        if (stageFilter !== 'all' && stageFilter !== 'applied') return false;
        if (!q) return true;
        return `${rec.company || ''} ${rec.jobTitle || ''} ${rec.notes}`
          .toLowerCase()
          .includes(q);
      })
      .map((rec) => ({
        key: `rec:${rec.id}`,
        kind: 'record' as const,
        job: null,
        record: rec,
        company: rec.company || 'Target Company',
        title: rec.jobTitle || rec.resumeData.targetHeadline || 'Custom Role',
        stage: 'applied' as ApplicationStage,
        dateIso: rec.sentAt || rec.createdAt,
      }));

    return [...jobEntries, ...standaloneEntries].sort(
      (a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime()
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedJobs, query, resumeRecords, stageFilter, standaloneSentRecords]);

  const filteredSavedJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return savedJobs;
    return savedJobs.filter((j) =>
      `${j.company} ${j.title} ${j.location}`.toLowerCase().includes(q)
    );
  }, [query, savedJobs]);

  const filteredHiddenJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return hiddenJobs;
    return hiddenJobs.filter((j) =>
      `${j.company} ${j.title} ${j.location}`.toLowerCase().includes(q)
    );
  }, [hiddenJobs, query]);

  const filteredResumeRecords = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return resumeRecords;
    return resumeRecords.filter((r) =>
      `${r.company || ''} ${r.jobTitle || ''} ${r.notes} ${r.resumeData.targetHeadline}`
        .toLowerCase()
        .includes(q)
    );
  }, [query, resumeRecords]);

  const interviewingOrOfferCount = useMemo(
    () =>
      appliedJobs.filter(
        (j) =>
          j.applicationStage === 'interviewing' ||
          j.applicationStage === 'offer'
      ).length,
    [appliedJobs]
  );

  const selectedApplied = useMemo(() => {
    if (filteredAppliedItems.length === 0) return null;
    return (
      filteredAppliedItems.find((x) => x.key === selectedKey) ||
      filteredAppliedItems[0]
    );
  }, [filteredAppliedItems, selectedKey]);

  const selectedResume = useMemo(() => {
    if (filteredResumeRecords.length === 0) return null;
    return (
      filteredResumeRecords.find((r) => `res:${r.id}` === selectedKey) ||
      filteredResumeRecords[0]
    );
  }, [filteredResumeRecords, selectedKey]);

  const activePreviewResume: StructuredResume | null =
    subView === 'applied'
      ? selectedApplied?.record?.resumeData ||
        (selectedApplied?.job ? profile.structuredResume : null)
      : subView === 'resumes'
        ? selectedResume?.resumeData || null
        : null;

  const fontKey = activePreviewResume?.fontFamily || 'calibri';
  const sizeKey = activePreviewResume?.pageSize || 'a4';
  const densityKey = activePreviewResume?.density || 'standard';
  const fontPreset = ATS_FONT_PRESETS[fontKey] || ATS_FONT_PRESETS.calibri;
  const sizePreset = PAGE_SIZE_PRESETS[sizeKey] || PAGE_SIZE_PRESETS.a4;
  const densityPreset = DENSITY_PRESETS[densityKey] || DENSITY_PRESETS.standard;

  const handleSubmitExternal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logForm.company.trim() || !logForm.title.trim()) return;
    setLogging(true);
    try {
      await onLogExternalApplication({
        company: logForm.company.trim(),
        title: logForm.title.trim(),
        source: logForm.source,
        url: logForm.url.trim(),
        notes: logForm.notes.trim(),
        resume: profile.structuredResume,
      });
      setLogForm({
        company: '',
        title: profile.primaryRole || '',
        source: 'linkedin',
        url: '',
        notes: '',
      });
      setShowLogForm(false);
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {activePreviewResume && (
        <style>{`@media print { @page { size: ${sizePreset.printPageSize}; margin: 8mm; } #a4-resume-sheet { font-family: ${fontPreset.fontFamily} !important; font-variant-ligatures: none !important; } }`}</style>
      )}

      {/* HEADER + KPI STRIP */}
      <section className={cn('no-print rounded-lg border p-5 space-y-4', cardSurface)}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              Applied Companies &amp; Edited Resume Compilation
            </h2>
            <p className={cn('text-xs', mutedText)}>
              Every company you applied to, your Saved &amp; Hidden jobs synced to Supabase, and the exact resume version sent for each role.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void onRefreshResumes()}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                secondaryBtn
              )}
            >
              <RotateCcw className={cn('h-3.5 w-3.5', loadingResumes && 'animate-spin')} />
              Sync Compilation
            </button>
            <button
              type="button"
              onClick={() => setShowLogForm((v) => !v)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors',
                primaryBtn
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              Log Company Application
            </button>
          </div>
        </div>

        {/* 5 Tabular KPI Tiles */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {[
            {
              label: 'Companies Applied',
              value: appliedJobs.length + standaloneSentRecords.length,
              view: 'applied' as CompilationSubView,
            },
            {
              label: 'Saved Jobs',
              value: savedJobs.length,
              view: 'saved' as CompilationSubView,
            },
            {
              label: 'Hidden Jobs',
              value: hiddenJobs.length,
              view: 'hidden' as CompilationSubView,
            },
            {
              label: 'Resume Versions',
              value: resumeRecords.length,
              view: 'resumes' as CompilationSubView,
            },
            {
              label: 'Interview / Offer',
              value: interviewingOrOfferCount,
              view: 'applied' as CompilationSubView,
            },
          ].map((kpi) => (
            <button
              key={kpi.label}
              type="button"
              onClick={() => setSubView(kpi.view)}
              className={cn(
                'rounded-lg border p-3 text-left transition-colors',
                subSurface,
                subView === kpi.view && 'border-[#0a66c2]'
              )}
            >
              <div className="font-mono text-xl font-semibold tabular-nums">
                {kpi.value}
              </div>
              <div className={cn('text-xs font-medium', mutedText)}>
                {kpi.label}
              </div>
            </button>
          ))}
        </div>

        {/* Log External Application Inline Form */}
        {showLogForm && (
          <form
            onSubmit={handleSubmitExternal}
            className={cn('grid gap-2.5 rounded-lg border p-4 sm:grid-cols-12', subSurface)}
          >
            <div className="sm:col-span-12 flex items-center justify-between">
              <span className="text-xs font-semibold">
                Log External Application (adds to Applied Companies + saves your current Resume snapshot)
              </span>
            </div>
            <input
              type="text"
              required
              value={logForm.company}
              onChange={(e) =>
                setLogForm({ ...logForm, company: e.target.value })
              }
              placeholder="Company name *"
              className={cn('sm:col-span-3 rounded-lg border px-3 py-1.5 text-xs focus:outline-none', inputSurface)}
            />
            <input
              type="text"
              required
              value={logForm.title}
              onChange={(e) =>
                setLogForm({ ...logForm, title: e.target.value })
              }
              placeholder="Role applied for *"
              className={cn('sm:col-span-3 rounded-lg border px-3 py-1.5 text-xs focus:outline-none', inputSurface)}
            />
            <select
              value={logForm.source}
              onChange={(e) =>
                setLogForm({ ...logForm, source: e.target.value as JobSource })
              }
              className={cn('sm:col-span-2 rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none', inputSurface)}
            >
              <option value="linkedin">LinkedIn</option>
              <option value="jobstreet">JobStreet</option>
              <option value="indeed">Indeed</option>
            </select>
            <input
              type="url"
              value={logForm.url}
              onChange={(e) => setLogForm({ ...logForm, url: e.target.value })}
              placeholder="Job URL (optional)"
              className={cn('sm:col-span-4 rounded-lg border px-3 py-1.5 text-xs focus:outline-none', inputSurface)}
            />
            <input
              type="text"
              value={logForm.notes}
              onChange={(e) =>
                setLogForm({ ...logForm, notes: e.target.value })
              }
              placeholder="Notes (e.g. Sent tailored A4 CV via recruiter email)"
              className={cn('sm:col-span-9 rounded-lg border px-3 py-1.5 text-xs focus:outline-none', inputSurface)}
            />
            <div className="sm:col-span-3 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowLogForm(false)}
                className={cn('rounded-lg border px-3 py-1.5 text-xs font-medium', secondaryBtn)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={logging}
                className={cn('rounded-lg px-4 py-1.5 text-xs disabled:opacity-50', primaryBtn)}
              >
                {logging ? 'Saving...' : 'Save Application'}
              </button>
            </div>
          </form>
        )}

        {/* Sub-View Switcher + Search Bar */}
        <div className={cn('flex flex-wrap items-center justify-between gap-2.5 border-t pt-3', borderSubtle)}>
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                {
                  id: 'applied',
                  label: `Applied Companies (${appliedJobs.length + standaloneSentRecords.length})`,
                },
                { id: 'resumes', label: `All Edited Resumes (${resumeRecords.length})` },
                { id: 'saved', label: `Saved (${savedJobs.length})` },
                { id: 'hidden', label: `Hidden (${hiddenJobs.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubView(tab.id)}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                  subView === tab.id ? primaryBtn : secondaryBtn
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {subView === 'applied' && (
              <select
                value={stageFilter}
                onChange={(e) =>
                  setStageFilter(e.target.value as 'all' | ApplicationStage)
                }
                aria-label="Filter by application stage"
                className={cn('rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none', inputSurface)}
              >
                <option value="all">All Stages</option>
                {STAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            <div className="relative">
              <Search className={cn('pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5', mutedText)} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search company, role, notes..."
                className={cn('w-52 rounded-lg border py-1.5 pl-8 pr-3 text-xs focus:outline-none', inputSurface)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* SUBVIEW 1: APPLIED COMPANIES & SENT RESUMES */}
      {subView === 'applied' && (
        <section className="grid items-start gap-5 lg:grid-cols-12">
          <div className="no-print space-y-2 lg:col-span-5">
            {filteredAppliedItems.length === 0 ? (
              <div className={cn('rounded-lg border border-dashed p-10 text-center space-y-2', cardSurface)}>
                <CheckCircle2 className={cn('mx-auto h-7 w-7', mutedText)} />
                <p className="text-sm font-semibold">No applied companies yet</p>
                <p className={cn('text-xs', mutedText)}>
                  Mark jobs as Applied in Find Jobs, save a tailored resume in Resume Studio, or click &ldquo;Log Company Application&rdquo; above.
                </p>
              </div>
            ) : (
              filteredAppliedItems.map((item) => {
                const isSelected = selectedApplied?.key === item.key;
                const stageLabel =
                  STAGE_OPTIONS.find((s) => s.value === item.stage)?.label ||
                  'Applied';
                return (
                  <article
                    key={item.key}
                    onClick={() => setSelectedKey(item.key)}
                    className={cn(
                      'cursor-pointer space-y-2 rounded-lg border p-3.5 transition-colors',
                      isSelected ? selectedCard : cardSurface
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {item.job ? (
                          <BoardLogo source={item.job.source} theme={theme} size="sm" />
                        ) : (
                          <span className={cn('rounded border px-2 py-0.5 text-[11px] font-medium', subSurface)}>
                            Direct / Logged
                          </span>
                        )}
                        <span
                          className={cn(
                            'rounded border px-2 py-0.5 text-[11px] font-semibold',
                            item.stage === 'offer'
                              ? isDark
                                ? 'border-emerald-700/70 bg-emerald-950/60 text-emerald-300'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              : item.stage === 'interviewing'
                                ? isDark
                                  ? 'border-blue-500/40 bg-blue-950/50 text-blue-300'
                                  : 'border-blue-200 bg-blue-50 text-[#0a66c2]'
                                : subSurface
                          )}
                        >
                          {stageLabel}
                        </span>
                      </div>
                      <span className={cn('font-mono text-[11px]', mutedText)}>
                        {new Date(item.dateIso).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h3 className={cn('text-[15px] font-semibold leading-snug', strongText)}>
                        {item.company}
                      </h3>
                      <p className={cn('text-xs font-medium', mutedText)}>
                        {item.title}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className={cn('inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px]', subSurface)}>
                        <FileText className="h-3 w-3" />
                        {item.record
                          ? `Saved CV (${getSourceMethodLabel(item.record)})`
                          : 'Base Profile CV'}
                      </span>
                      {item.job?.applicationNotes && (
                        <span className={cn('max-w-[200px] truncate text-[11px]', mutedText)}>
                          {item.job.applicationNotes}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <div className="lg:col-span-7">
            {selectedApplied ? (
              <div className="space-y-4">
                <div className={cn('no-print rounded-lg border p-5 space-y-4', cardSurface)}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <h3 className="text-base font-bold">
                          {selectedApplied.company}
                        </h3>
                      </div>
                      <p className={cn('mt-0.5 text-sm font-medium', mutedText)}>
                        {selectedApplied.title}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {selectedApplied.job && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenJobInExplorer(selectedApplied.job!.id)
                          }
                          className={cn('inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium', secondaryBtn)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Job
                        </button>
                      )}
                      {selectedApplied.job?.url && (
                        <a
                          href={selectedApplied.job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn('inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium', secondaryBtn)}
                        >
                          Listing
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {activePreviewResume && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              onOpenInResumeStudio(
                                activePreviewResume,
                                selectedApplied.job
                              )
                            }
                            className={cn('inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium', secondaryBtn)}
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Edit in Studio
                          </button>
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className={cn('inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs', primaryBtn)}
                          >
                            <Printer className="h-3.5 w-3.5" />
                            Print / PDF
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {selectedApplied.job && (
                    <div className={cn('grid gap-3 border-t pt-3 sm:grid-cols-12', borderSubtle)}>
                      <div className="sm:col-span-4">
                        <label className={cn('mb-1 block text-xs font-medium', mutedText)}>
                          Application Stage
                        </label>
                        <select
                          value={selectedApplied.job.applicationStage || 'applied'}
                          onChange={(e) =>
                            onUpdateJobApplication(selectedApplied.job!.id, {
                              applicationStage: e.target.value as ApplicationStage,
                            })
                          }
                          className={cn('w-full rounded-lg border px-2.5 py-1.5 text-xs font-medium focus:outline-none', inputSurface)}
                        >
                          {STAGE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-8">
                        <label className={cn('mb-1 block text-xs font-medium', mutedText)}>
                          Application Notes (saved automatically)
                        </label>
                        <input
                          type="text"
                          value={selectedApplied.job.applicationNotes || ''}
                          onChange={(e) =>
                            onUpdateJobApplication(selectedApplied.job!.id, {
                              applicationNotes: e.target.value,
                            })
                          }
                          placeholder="Recruiter contact, interview date, salary quoted..."
                          className={cn('w-full rounded-lg border px-3 py-1.5 text-xs focus:outline-none', inputSurface)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {activePreviewResume && (
                  <div className="overflow-x-auto pb-2">
                    <ResumeSheetDocument
                      sheetId="a4-resume-sheet"
                      variant="tailored"
                      resume={activePreviewResume}
                      compareReference={profile.structuredResume}
                      showSummary={Boolean(activePreviewResume.tailoredSummary)}
                      showHighlights={false}
                      isTailored={Boolean(
                        activePreviewResume.tailorMethod &&
                          activePreviewResume.tailorMethod !== 'base'
                      )}
                      editMode={false}
                      className={cn(
                        'mx-auto w-full bg-white text-black shadow-xl ring-1 ring-black/10',
                        sizePreset.sheetClass,
                        densityPreset.padClass,
                        densityPreset.textClass
                      )}
                      style={{
                        fontFamily: fontPreset.fontFamily,
                        fontVariantLigatures: 'none',
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className={cn('no-print rounded-lg border border-dashed p-12 text-center', cardSurface)}>
                <FileText className={cn('mx-auto h-7 w-7', mutedText)} />
                <p className="mt-2 text-sm font-semibold">
                  Select an applied company
                </p>
                <p className={cn('mt-1 text-xs', mutedText)}>
                  Inspect the company application stage, notes, and exact resume snapshot sent.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* SUBVIEW 2: ALL EDITED RESUME VERSIONS */}
      {subView === 'resumes' && (
        <section className="grid items-start gap-5 lg:grid-cols-12">
          <div className="no-print space-y-2 lg:col-span-5">
            {filteredResumeRecords.length === 0 ? (
              <div className={cn('rounded-lg border border-dashed p-10 text-center space-y-2', cardSurface)}>
                <FileText className={cn('mx-auto h-7 w-7', mutedText)} />
                <p className="text-sm font-semibold">
                  No saved resume versions yet
                </p>
                <p className={cn('text-xs', mutedText)}>
                  Tailor a resume with AI or click &ldquo;Save Version&rdquo; in Resume Studio to archive snapshots by company.
                </p>
              </div>
            ) : (
              filteredResumeRecords.map((rec) => {
                const isSelected = selectedResume?.id === rec.id;
                return (
                  <article
                    key={rec.id}
                    onClick={() => setSelectedKey(`res:${rec.id}`)}
                    className={cn(
                      'cursor-pointer space-y-2 rounded-lg border p-3.5 transition-colors',
                      isSelected ? selectedCard : cardSurface
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={cn('rounded border px-2 py-0.5 text-[11px] font-medium', subSurface)}>
                          {getSourceMethodLabel(rec)}
                        </span>
                        {rec.isSent && (
                          <span
                            className={cn(
                              'rounded border px-2 py-0.5 text-[11px] font-semibold',
                              isDark
                                ? 'border-emerald-700/70 bg-emerald-950/60 text-emerald-300'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            )}
                          >
                            ✓ Sent
                          </span>
                        )}
                      </div>
                      <span className={cn('font-mono text-[11px]', mutedText)}>
                        {new Date(rec.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h3 className={cn('text-[15px] font-semibold', strongText)}>
                        {rec.company || 'General Snapshot'}
                      </h3>
                      <p className={cn('text-xs font-medium', mutedText)}>
                        {rec.jobTitle || rec.resumeData.targetHeadline}
                      </p>
                    </div>

                    {rec.notes && (
                      <p className={cn('truncate text-xs', mutedText)}>
                        {rec.notes}
                      </p>
                    )}
                  </article>
                );
              })
            )}
          </div>

          <div className="lg:col-span-7">
            {selectedResume ? (
              <div className="space-y-4">
                <div className={cn('no-print flex flex-wrap items-center justify-between gap-2 rounded-lg border p-4', cardSurface)}>
                  <div>
                    <h3 className="text-sm font-bold">
                      {selectedResume.company || 'General Resume Version'} —{' '}
                      {selectedResume.jobTitle || selectedResume.resumeData.targetHeadline}
                    </h3>
                    <p className={cn('text-xs', mutedText)}>
                      Saved {new Date(selectedResume.createdAt).toLocaleString()} •{' '}
                      {getSourceMethodLabel(selectedResume)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        void onUpdateResumeRecord(selectedResume.id, {
                          isSent: !selectedResume.isSent,
                        })
                      }
                      className={cn('inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium', secondaryBtn)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {selectedResume.isSent ? 'Marked Sent' : 'Mark as Sent'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenInResumeStudio(selectedResume.resumeData, null)
                      }
                      className={cn('inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium', secondaryBtn)}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Load in Studio
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className={cn('inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs', primaryBtn)}
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print / PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDeleteResumeRecord(selectedResume.id)}
                      className={cn('rounded-lg border p-1.5', secondaryBtn)}
                      title="Delete snapshot"
                      aria-label="Delete resume snapshot"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto pb-2">
                  <ResumeSheetDocument
                    sheetId="a4-resume-sheet"
                    variant="tailored"
                    resume={selectedResume.resumeData}
                    compareReference={profile.structuredResume}
                    showSummary={Boolean(selectedResume.resumeData.tailoredSummary)}
                    showHighlights={false}
                    isTailored={Boolean(
                      selectedResume.resumeData.tailorMethod &&
                        selectedResume.resumeData.tailorMethod !== 'base'
                    )}
                    editMode={false}
                    className={cn(
                      'mx-auto w-full bg-white text-black shadow-xl ring-1 ring-black/10',
                      sizePreset.sheetClass,
                      densityPreset.padClass,
                      densityPreset.textClass
                    )}
                    style={{
                      fontFamily: fontPreset.fontFamily,
                      fontVariantLigatures: 'none',
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className={cn('no-print rounded-lg border border-dashed p-12 text-center', cardSurface)}>
                <FileText className={cn('mx-auto h-7 w-7', mutedText)} />
                <p className="mt-2 text-sm font-semibold">
                  Select a saved resume version
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* SUBVIEW 3: SAVED JOBS */}
      {subView === 'saved' && (
        <section className={cn('no-print rounded-lg border p-5 space-y-3', cardSurface)}>
          <h3 className="text-sm font-semibold">
            Saved Jobs ({filteredSavedJobs.length})
          </h3>
          {filteredSavedJobs.length === 0 ? (
            <p className={cn('text-xs', mutedText)}>
              No saved jobs yet. Bookmark any job in Find Jobs to keep it synced here.
            </p>
          ) : (
            <div className={cn('divide-y', borderSubtle)}>
              {filteredSavedJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <BoardLogo source={job.source} theme={theme} size="sm" />
                      <span className="font-mono text-xs font-semibold">
                        {job.matchScore}%
                      </span>
                    </div>
                    <p className="text-sm font-semibold">{job.title}</p>
                    <p className={cn('text-xs', mutedText)}>
                      {job.company} • {job.location}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenJobInExplorer(job.id)}
                      className={cn('inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium', secondaryBtn)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateJobApplication(job.id, { status: 'applied' })
                      }
                      className={cn('inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs', primaryBtn)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Mark Applied
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateJobApplication(job.id, { status: 'suggested' })
                      }
                      className={cn('inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium', secondaryBtn)}
                    >
                      <BookmarkCheck className="h-3.5 w-3.5" />
                      Unsave
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* SUBVIEW 4: HIDDEN JOBS (PERSISTED IN DB + RESTORABLE) */}
      {subView === 'hidden' && (
        <section className={cn('no-print rounded-lg border p-5 space-y-3', cardSurface)}>
          <div>
            <h3 className="text-sm font-semibold">
              Hidden Jobs ({filteredHiddenJobs.length})
            </h3>
            <p className={cn('text-xs', mutedText)}>
              Hidden listings stay saved in your database so they won&apos;t clutter Find Jobs again unless you restore them.
            </p>
          </div>
          {filteredHiddenJobs.length === 0 ? (
            <p className={cn('text-xs', mutedText)}>No hidden jobs.</p>
          ) : (
            <div className={cn('divide-y', borderSubtle)}>
              {filteredHiddenJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <BoardLogo source={job.source} theme={theme} size="sm" />
                      <span className={cn('text-xs', mutedText)}>
                        {job.hiddenAt
                          ? `Hidden ${new Date(job.hiddenAt).toLocaleDateString()}`
                          : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold">{job.title}</p>
                    <p className={cn('text-xs', mutedText)}>
                      {job.company} • {job.location}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateJobApplication(job.id, { status: 'suggested' })
                    }
                    className={cn('inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium', secondaryBtn)}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restore to Active
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

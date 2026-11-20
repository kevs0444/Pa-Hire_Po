'use client';

import { useMemo, useState } from 'react';
import {
  BookmarkCheck,
  Building2,
  CheckCircle2,
  ClipboardPaste,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  MapPin,
  Maximize2,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Wallet,
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
  PAGE_SIZE_PRESETS,
} from '@/features/resume/components/A4ResumePreview';
import { SubmittedResumeModal } from '@/features/applications/components/SubmittedResumeModal';
import { BoardLogo } from '@/components/ui/BrandLogos';
import { CopyUrlButton } from '@/components/ui/CopyUrlButton';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

type CompilationSubView = 'applied' | 'saved' | 'hidden' | 'resumes';
type ResumeAppliedFilter = 'all' | 'sent' | 'drafts';

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
      url?: string;
      location?: string;
      workType?: string;
      salary?: string | null;
    }
  ) => void;
  onLogExternalApplication: (payload: {
    company: string;
    title: string;
    source: JobSource;
    url: string;
    location?: string;
    workType?: string;
    salary?: string;
    stage?: ApplicationStage;
    appliedDate?: string;
    notes: string;
    resumeRecordId?: string;
    resume: StructuredResume;
  }) => Promise<void>;
  onUpdateResumeRecord: (
    id: string,
    patch: {
      isSent?: boolean;
      notes?: string;
      company?: string;
      jobTitle?: string;
      versionName?: string | null;
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

const WORK_SETUP_OPTIONS = ['Flexible', 'Remote', 'Hybrid', 'Onsite'];

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatSlugWords(slug: string): string {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase())
    .trim();
}

function inferJobInfoFromUrl(rawUrl: string): {
  source?: JobSource;
  company?: string;
  title?: string;
} {
  const trimmed = rawUrl.trim();
  if (!trimmed) return {};
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname;

    if (host.includes('linkedin.com')) {
      const viewMatch = path.match(/\/jobs\/view\/([a-z0-9-]+?)(?:-\d+)?\/?$/i);
      if (viewMatch?.[1]) {
        const atParts = viewMatch[1].split('-at-');
        if (atParts.length >= 2) {
          return {
            source: 'linkedin',
            title: formatSlugWords(atParts[0]),
            company: formatSlugWords(atParts.slice(1).join(' ')),
          };
        }
        return { source: 'linkedin', title: formatSlugWords(viewMatch[1]) };
      }
      return { source: 'linkedin' };
    }

    if (host.includes('jobstreet.')) {
      const slugMatch = path.match(/\/job\/([a-z0-9-]+?)(?:-\d+)?\/?$/i);
      return {
        source: 'jobstreet',
        title: slugMatch?.[1] && !/^\d+$/.test(slugMatch[1]) ? formatSlugWords(slugMatch[1]) : undefined,
      };
    }

    if (host.includes('indeed.')) {
      return { source: 'indeed' };
    }

    // Company career portal domain (e.g., careers.canva.com or jobs.gcash.com)
    const hostParts = host.replace(/^www\./, '').split('.');
    const filteredParts = hostParts.filter(
      (p) => !['careers', 'jobs', 'apply', 'boards', 'greenhouse', 'lever', 'workday', 'myworkdayjobs', 'ashbyhq', 'com', 'io', 'co', 'ph', 'sg', 'my', 'net', 'org'].includes(p)
    );
    if (filteredParts[0]) {
      return { company: formatSlugWords(filteredParts[0]) };
    }
  } catch {
    // Ignore invalid URL while typing
  }
  return {};
}

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
  if (record.sourceType === 'base' || record.tailorMethod === 'base') {
    return 'Base Profile CV';
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
    activeBorder,
  } = tokens;

  const [subView, setSubView] = useState<CompilationSubView>('applied');
  const [resumeFilter, setResumeFilter] = useState<ResumeAppliedFilter>('all');
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | ApplicationStage>('all');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [popoutModalData, setPopoutModalData] = useState<{
    company: string;
    jobTitle: string;
    methodLabel: string;
    submittedAt?: string | null;
    resume: StructuredResume;
  } | null>(null);
  const [showLogForm, setShowLogForm] = useState(false);
  const [logging, setLogging] = useState(false);
  const [logForm, setLogForm] = useState({
    company: '',
    title: profile.primaryRole || '',
    source: 'linkedin' as JobSource,
    url: '',
    location: profile.location || 'Remote',
    workType:
      profile.workType === 'remote'
        ? 'Remote'
        : profile.workType === 'hybrid'
          ? 'Hybrid'
          : profile.workType === 'onsite'
            ? 'Onsite'
            : 'Flexible',
    salary: profile.salaryExpectation || '',
    stage: 'applied' as ApplicationStage,
    appliedDate: getTodayDateString(),
    resumeRecordId: 'base',
    notes: '',
  });

  const applyUrlToLogForm = (nextUrl: string) => {
    const inferred = inferJobInfoFromUrl(nextUrl);
    setLogForm((prev) => ({
      ...prev,
      url: nextUrl,
      source: inferred.source ?? prev.source,
      company: prev.company.trim() ? prev.company : inferred.company || '',
      title:
        prev.title.trim() && prev.title !== profile.primaryRole
          ? prev.title
          : inferred.title || prev.title,
    }));
  };

  const handlePasteUrlIntoForm = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = (await navigator.clipboard.readText()).trim();
        if (text) {
          applyUrlToLogForm(text);
        }
      }
    } catch {
      // Clipboard permission denied — user can paste normally into the input
    }
  };

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
        return `${job.company} ${job.title} ${job.location} ${job.url} ${job.applicationNotes || ''}`
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
    return resumeRecords.filter((r) => {
      if (resumeFilter === 'sent' && !r.isSent) return false;
      if (resumeFilter === 'drafts' && r.isSent) return false;
      if (!q) return true;
      return `${r.versionName || ''} ${r.company || ''} ${r.jobTitle || ''} ${r.notes} ${r.resumeData.targetHeadline}`
        .toLowerCase()
        .includes(q);
    });
  }, [query, resumeFilter, resumeRecords]);

  const sentResumeCount = useMemo(
    () => resumeRecords.filter((r) => r.isSent).length,
    [resumeRecords]
  );

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

  const activeMethodLabel =
    subView === 'applied'
      ? selectedApplied?.record
        ? getSourceMethodLabel(selectedApplied.record)
        : 'Base Profile CV'
      : selectedResume
        ? getSourceMethodLabel(selectedResume)
        : 'Base Profile CV';

  const activeFontLabel =
    (ATS_FONT_PRESETS[activePreviewResume?.fontFamily || 'calibri'] ||
      ATS_FONT_PRESETS.calibri).shortLabel;
  const activeSizeLabel =
    (PAGE_SIZE_PRESETS[activePreviewResume?.pageSize || 'a4'] ||
      PAGE_SIZE_PRESETS.a4).shortLabel;

  const handleSubmitExternal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logForm.company.trim() || !logForm.title.trim()) return;
    setLogging(true);
    try {
      const selectedRecord =
        logForm.resumeRecordId !== 'base'
          ? resumeById.get(logForm.resumeRecordId)
          : undefined;
      await onLogExternalApplication({
        company: logForm.company.trim(),
        title: logForm.title.trim(),
        source: logForm.source,
        url: logForm.url.trim(),
        location: logForm.location.trim(),
        workType: logForm.workType,
        salary: logForm.salary.trim(),
        stage: logForm.stage,
        appliedDate: logForm.appliedDate,
        notes: logForm.notes.trim(),
        resumeRecordId:
          logForm.resumeRecordId !== 'base' ? logForm.resumeRecordId : undefined,
        resume: selectedRecord?.resumeData || profile.structuredResume,
      });
      setLogForm({
        company: '',
        title: profile.primaryRole || '',
        source: 'linkedin',
        url: '',
        location: profile.location || 'Remote',
        workType: 'Flexible',
        salary: profile.salaryExpectation || '',
        stage: 'applied',
        appliedDate: getTodayDateString(),
        resumeRecordId: 'base',
        notes: '',
      });
      setShowLogForm(false);
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* HEADER + KPI STRIP */}
      <section className={cn('no-print rounded-lg border p-5 space-y-4', cardSurface)}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              Job Tracking &amp; Resume Applied
            </h2>
            <p className={cn('text-xs', mutedText)}>
              Track every company you applied to, manage application stages, copy or open company job URLs, and inspect the exact resume applied for each role.
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
              Sync Tracking
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
              Add Job Application
            </button>
          </div>
        </div>

        {/* 5 Tabular KPI Ledger Strip */}
        <div
          className={cn(
            'grid grid-cols-2 divide-y overflow-hidden rounded-lg border sm:grid-cols-5 sm:divide-x sm:divide-y-0',
            borderSubtle,
            subSurface
          )}
        >
          {[
            {
              label: 'Applied Jobs',
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
              label: 'Resume Applied',
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
                'p-3 text-left transition-colors',
                subView === kpi.view
                  ? cn('border-b-2', activeBorder, isDark ? 'bg-zinc-800/70' : 'bg-white')
                  : isDark
                    ? 'hover:bg-zinc-800/40'
                    : 'hover:bg-white/70'
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

        {/* Add Job Application Form (Common Info + Company/Job URL Auto-Detect) */}
        {showLogForm && (
          <form
            onSubmit={handleSubmitExternal}
            className={cn('grid gap-3 rounded-lg border p-4 sm:grid-cols-12', subSurface)}
          >
            <div className="sm:col-span-12 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold">
                Add Job Application (save common company &amp; role details, copy/paste URL, and link the resume you applied with)
              </span>
            </div>

            <div className="sm:col-span-12 space-y-1">
              <label className={cn('block text-[11px] font-medium', mutedText)}>
                Company or Job Posting URL (paste to auto-detect platform, company &amp; role)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="url"
                  value={logForm.url}
                  onChange={(e) => applyUrlToLogForm(e.target.value)}
                  placeholder="https://www.linkedin.com/jobs/view/... or https://company.com/careers"
                  className={cn('min-w-0 flex-1 rounded-lg border px-3 py-1.5 text-xs focus:outline-none', inputSurface)}
                />
                <button
                  type="button"
                  onClick={() => void handlePasteUrlIntoForm()}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                    secondaryBtn
                  )}
                >
                  <ClipboardPaste className="h-3.5 w-3.5" />
                  Paste URL
                </button>
                <CopyUrlButton url={logForm.url} theme={theme} />
              </div>
            </div>

            <div className="sm:col-span-4 space-y-1">
              <label className={cn('block text-[11px] font-medium', mutedText)}>
                Company Name *
              </label>
              <input
                type="text"
                required
                value={logForm.company}
                onChange={(e) =>
                  setLogForm({ ...logForm, company: e.target.value })
                }
                placeholder="e.g. Canva, GCash, Accenture"
                className={cn('w-full rounded-lg border px-3 py-1.5 text-xs focus:outline-none', inputSurface)}
              />
            </div>

            <div className="sm:col-span-4 space-y-1">
              <label className={cn('block text-[11px] font-medium', mutedText)}>
                Job Title / Role Applied *
              </label>
              <input
                type="text"
                required
                value={logForm.title}
                onChange={(e) =>
                  setLogForm({ ...logForm, title: e.target.value })
                }
                placeholder="e.g. Data Analyst"
                className={cn('w-full rounded-lg border px-3 py-1.5 text-xs focus:outline-none', inputSurface)}
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className={cn('block text-[11px] font-medium', mutedText)}>
                Platform
              </label>
              <select
                value={logForm.source}
                onChange={(e) =>
                  setLogForm({ ...logForm, source: e.target.value as JobSource })
                }
                className={cn('w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none', inputSurface)}
              >
                <option value="linkedin">LinkedIn</option>
                <option value="jobstreet">JobStreet</option>
                <option value="indeed">Indeed</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className={cn('block text-[11px] font-medium', mutedText)}>
                Stage
              </label>
              <select
                value={logForm.stage}
                onChange={(e) =>
                  setLogForm({ ...logForm, stage: e.target.value as ApplicationStage })
                }
                className={cn('w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none', inputSurface)}
              >
                {STAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3 space-y-1">
              <label className={cn('block text-[11px] font-medium', mutedText)}>
                Location
              </label>
              <input
                type="text"
                value={logForm.location}
                onChange={(e) =>
                  setLogForm({ ...logForm, location: e.target.value })
                }
                placeholder="e.g. Taguig City / Remote"
                className={cn('w-full rounded-lg border px-3 py-1.5 text-xs focus:outline-none', inputSurface)}
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className={cn('block text-[11px] font-medium', mutedText)}>
                Work Setup
              </label>
              <select
                value={logForm.workType}
                onChange={(e) =>
                  setLogForm({ ...logForm, workType: e.target.value })
                }
                className={cn('w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none', inputSurface)}
              >
                {WORK_SETUP_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className={cn('block text-[11px] font-medium', mutedText)}>
                Salary / Offer (Optional)
              </label>
              <input
                type="text"
                value={logForm.salary}
                onChange={(e) =>
                  setLogForm({ ...logForm, salary: e.target.value })
                }
                placeholder="e.g. PHP 45k - 60k"
                className={cn('w-full rounded-lg border px-3 py-1.5 text-xs focus:outline-none', inputSurface)}
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className={cn('block text-[11px] font-medium', mutedText)}>
                Date Applied
              </label>
              <input
                type="date"
                value={logForm.appliedDate}
                onChange={(e) =>
                  setLogForm({ ...logForm, appliedDate: e.target.value })
                }
                className={cn('w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none', inputSurface)}
              />
            </div>

            <div className="sm:col-span-3 space-y-1">
              <label className={cn('block text-[11px] font-medium', mutedText)}>
                Resume Applied
              </label>
              <select
                value={logForm.resumeRecordId}
                onChange={(e) =>
                  setLogForm({ ...logForm, resumeRecordId: e.target.value })
                }
                className={cn('w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none', inputSurface)}
              >
                <option value="base">
                  Base Profile CV ({profile.structuredResume.targetHeadline || 'Master'})
                </option>
                {resumeRecords.map((rec) => (
                  <option key={rec.id} value={rec.id}>
                    {rec.versionName || rec.company || 'Saved Resume'} —{' '}
                    {rec.jobTitle || rec.resumeData.targetHeadline}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-9 space-y-1">
              <label className={cn('block text-[11px] font-medium', mutedText)}>
                Notes (Recruiter, Email, Portal Ref, Interview Details)
              </label>
              <input
                type="text"
                value={logForm.notes}
                onChange={(e) =>
                  setLogForm({ ...logForm, notes: e.target.value })
                }
                placeholder="e.g. Sent tailored A4 CV via recruiter email; follow up Friday"
                className={cn('w-full rounded-lg border px-3 py-1.5 text-xs focus:outline-none', inputSurface)}
              />
            </div>

            <div className="sm:col-span-3 flex items-end justify-end gap-2">
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
                  label: `Applied Jobs (${appliedJobs.length + standaloneSentRecords.length})`,
                },
                { id: 'resumes', label: `Resume Applied (${resumeRecords.length})` },
                { id: 'saved', label: `Saved Jobs (${savedJobs.length})` },
                { id: 'hidden', label: `Hidden Jobs (${hiddenJobs.length})` },
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

            {subView === 'resumes' && (
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: 'all', label: `All (${resumeRecords.length})` },
                    { id: 'sent', label: `✓ Applied (${sentResumeCount})` },
                    {
                      id: 'drafts',
                      label: `Saved (${Math.max(0, resumeRecords.length - sentResumeCount)})`,
                    },
                  ] as const
                ).map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setResumeFilter(pill.id)}
                    className={cn(
                      'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                      resumeFilter === pill.id ? primaryBtn : secondaryBtn
                    )}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className={cn('pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5', mutedText)} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search company, role, URL..."
                className={cn('w-52 rounded-lg border py-1.5 pl-8 pr-3 text-xs focus:outline-none', inputSurface)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* SUBVIEW 1: APPLIED JOBS */}
      {subView === 'applied' && (
        <section className="grid items-start gap-5 lg:grid-cols-12">
          <div className="no-print space-y-2 lg:col-span-5">
            {filteredAppliedItems.length === 0 ? (
              <div className={cn('rounded-lg border border-dashed p-10 text-center space-y-2', cardSurface)}>
                <CheckCircle2 className={cn('mx-auto h-7 w-7', mutedText)} />
                <p className="text-sm font-semibold">No tracked applications yet</p>
                <p className={cn('text-xs', mutedText)}>
                  Mark jobs as Applied in Find Jobs, save a tailored resume in Resume Studio, or click &ldquo;Add Job Application&rdquo; above.
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
                      <div className="flex flex-wrap items-center gap-2">
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
                      {item.job && (
                        <p className={cn('mt-0.5 text-[11px]', mutedText)}>
                          {item.job.location} • {item.job.workType}
                          {item.job.salary ? ` • ${item.job.salary}` : ''}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className={cn('inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px]', subSurface)}>
                        <FileText className="h-3 w-3" />
                        {item.record
                          ? getSourceMethodLabel(item.record)
                          : 'Base Profile CV'}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <CopyUrlButton url={item.job?.url} theme={theme} compact />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPopoutModalData({
                              company: item.company,
                              jobTitle: item.title,
                              methodLabel: item.record
                                ? getSourceMethodLabel(item.record)
                                : 'Base Profile CV',
                              submittedAt: item.dateIso,
                              resume:
                                item.record?.resumeData || profile.structuredResume,
                            });
                          }}
                          className={cn(
                            'civic-btn-motion inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium transition-colors',
                            secondaryBtn
                          )}
                        >
                          <Maximize2 className="h-3 w-3" />
                          Show Resume
                        </button>
                      </div>
                    </div>
                    {item.job?.applicationNotes && (
                      <p className={cn('truncate text-[11px]', mutedText)}>
                        Note: {item.job.applicationNotes}
                      </p>
                    )}
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
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <h3 className="text-base font-bold">
                          {selectedApplied.company}
                        </h3>
                      </div>
                      <p className={cn('text-sm font-medium', mutedText)}>
                        {selectedApplied.title}
                      </p>
                      <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-xs', mutedText)}>
                        {selectedApplied.job?.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {selectedApplied.job.location}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Applied {new Date(selectedApplied.dateIso).toLocaleDateString()}
                        </span>
                        {selectedApplied.job?.salary && (
                          <span className="inline-flex items-center gap-1 font-mono">
                            <Wallet className="h-3 w-3" />
                            {selectedApplied.job.salary}
                          </span>
                        )}
                      </div>
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
                      {selectedApplied.job?.url &&
                        selectedApplied.job.url !== '#' && (
                          <a
                            href={selectedApplied.job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn('civic-btn-motion inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium', secondaryBtn)}
                          >
                            Listing
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      <CopyUrlButton
                        url={selectedApplied.job?.url}
                        theme={theme}
                      />
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

                      <div className="sm:col-span-4">
                        <label className={cn('mb-1 block text-xs font-medium', mutedText)}>
                          Resume Applied
                        </label>
                        <select
                          value={selectedApplied.job.tailoredResumeId || ''}
                          onChange={(e) =>
                            onUpdateJobApplication(selectedApplied.job!.id, {
                              tailoredResumeId: e.target.value || null,
                            })
                          }
                          className={cn('w-full rounded-lg border px-2.5 py-1.5 text-xs font-medium focus:outline-none', inputSurface)}
                        >
                          <option value="">Base Profile CV</option>
                          {resumeRecords.map((rec) => (
                            <option key={rec.id} value={rec.id}>
                              {rec.versionName || rec.company || 'Snapshot'} —{' '}
                              {rec.jobTitle || rec.resumeData.targetHeadline}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-4">
                        <label className={cn('mb-1 block text-xs font-medium', mutedText)}>
                          Work Setup
                        </label>
                        <select
                          value={selectedApplied.job.workType || 'Flexible'}
                          onChange={(e) =>
                            onUpdateJobApplication(selectedApplied.job!.id, {
                              workType: e.target.value,
                            })
                          }
                          className={cn('w-full rounded-lg border px-2.5 py-1.5 text-xs font-medium focus:outline-none', inputSurface)}
                        >
                          {WORK_SETUP_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                          {!WORK_SETUP_OPTIONS.includes(selectedApplied.job.workType) && (
                            <option value={selectedApplied.job.workType}>
                              {selectedApplied.job.workType}
                            </option>
                          )}
                        </select>
                      </div>

                      <div className="sm:col-span-6">
                        <label className={cn('mb-1 block text-xs font-medium', mutedText)}>
                          Location
                        </label>
                        <input
                          type="text"
                          value={selectedApplied.job.location || ''}
                          onChange={(e) =>
                            onUpdateJobApplication(selectedApplied.job!.id, {
                              location: e.target.value,
                            })
                          }
                          placeholder="City, Country or Remote"
                          className={cn('w-full rounded-lg border px-3 py-1.5 text-xs focus:outline-none', inputSurface)}
                        />
                      </div>

                      <div className="sm:col-span-6">
                        <label className={cn('mb-1 block text-xs font-medium', mutedText)}>
                          Salary / Offer
                        </label>
                        <input
                          type="text"
                          value={selectedApplied.job.salary || ''}
                          onChange={(e) =>
                            onUpdateJobApplication(selectedApplied.job!.id, {
                              salary: e.target.value || null,
                            })
                          }
                          placeholder="e.g. PHP 45,000 - 60,000/mo"
                          className={cn('w-full rounded-lg border px-3 py-1.5 text-xs focus:outline-none', inputSurface)}
                        />
                      </div>

                      <div className="sm:col-span-12">
                        <label className={cn('mb-1 block text-xs font-medium', mutedText)}>
                          Company / Job Posting URL
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="url"
                            value={
                              selectedApplied.job.url === '#'
                                ? ''
                                : selectedApplied.job.url
                            }
                            onChange={(e) =>
                              onUpdateJobApplication(selectedApplied.job!.id, {
                                url: e.target.value.trim() || '#',
                              })
                            }
                            placeholder="https://company.com/careers or job posting URL"
                            className={cn('min-w-0 flex-1 rounded-lg border px-3 py-1.5 text-xs focus:outline-none', inputSurface)}
                          />
                          <CopyUrlButton
                            url={selectedApplied.job.url}
                            theme={theme}
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-12">
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

                  {activePreviewResume && (
                    <div className={cn('rounded-lg border p-4 space-y-2.5', subSurface)}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold">
                              Resume Applied Snapshot
                            </span>
                            <span className={cn('rounded border px-2 py-0.5 font-mono text-[11px]', cardSurface)}>
                              {activeMethodLabel}
                            </span>
                            <span className={cn('font-mono text-[11px]', mutedText)}>
                              {activeSizeLabel} • {activeFontLabel}
                            </span>
                          </div>
                          <p className={cn('text-xs', mutedText)}>
                            Headline: {activePreviewResume.targetHeadline}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onOpenInResumeStudio(
                                activePreviewResume,
                                selectedApplied.job
                              )
                            }
                            className={cn('civic-btn-motion inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium', secondaryBtn)}
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Edit in Studio
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPopoutModalData({
                                company: selectedApplied.company,
                                jobTitle: selectedApplied.title,
                                methodLabel: activeMethodLabel,
                                submittedAt: selectedApplied.dateIso,
                                resume: activePreviewResume,
                              })
                            }
                            className={cn('civic-btn-motion inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs', primaryBtn)}
                          >
                            <Maximize2 className="h-3.5 w-3.5" />
                            Show Resume
                          </button>
                        </div>
                      </div>

                      {activePreviewResume.tailorNotes &&
                        activePreviewResume.tailorNotes.length > 0 && (
                          <ul className={cn('list-disc space-y-0.5 pl-4 text-xs', mutedText)}>
                            {activePreviewResume.tailorNotes.slice(0, 3).map((note, idx) => (
                              <li key={idx}>{note}</li>
                            ))}
                          </ul>
                        )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={cn('no-print rounded-lg border border-dashed p-12 text-center', cardSurface)}>
                <FileText className={cn('mx-auto h-7 w-7', mutedText)} />
                <p className="mt-2 text-sm font-semibold">
                  Select a tracked application
                </p>
                <p className={cn('mt-1 text-xs', mutedText)}>
                  Inspect the company details, copy its URL, update stage &amp; notes, and open the exact resume applied.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* SUBVIEW 2: RESUME APPLIED (SUBMITTED & EDITED RESUMES) */}
      {subView === 'resumes' && (
        <section className="grid items-start gap-5 lg:grid-cols-12">
          <div className="no-print space-y-2 lg:col-span-5">
            {filteredResumeRecords.length === 0 ? (
              <div className={cn('rounded-lg border border-dashed p-10 text-center space-y-2', cardSurface)}>
                <FileText className={cn('mx-auto h-7 w-7', mutedText)} />
                <p className="text-sm font-semibold">
                  No matching resumes yet
                </p>
                <p className={cn('text-xs', mutedText)}>
                  Tailor a resume with AI or click &ldquo;Save Version&rdquo; in Resume Studio to track resumes applied by company.
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
                            ✓ Applied / Sent
                          </span>
                        )}
                      </div>
                      <span className={cn('font-mono text-[11px]', mutedText)}>
                        {new Date(rec.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h3 className={cn('text-[15px] font-semibold', strongText)}>
                        {rec.versionName || rec.resumeData?.versionName || rec.company || 'General Snapshot'}
                      </h3>
                      <p className={cn('text-xs font-medium', mutedText)}>
                        {rec.company ? `${rec.company} • ` : ''}
                        {rec.jobTitle || rec.resumeData.targetHeadline}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      {rec.notes ? (
                        <p className={cn('truncate text-xs', mutedText)}>
                          {rec.notes}
                        </p>
                      ) : (
                        <span className={cn('text-[11px]', mutedText)}>
                          Click Show Resume to view or print
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPopoutModalData({
                            company: rec.company || 'General Snapshot',
                            jobTitle:
                              rec.jobTitle || rec.resumeData.targetHeadline,
                            methodLabel: getSourceMethodLabel(rec),
                            submittedAt: rec.sentAt || rec.createdAt,
                            resume: rec.resumeData,
                          });
                        }}
                        className={cn(
                          'civic-btn-motion inline-flex shrink-0 items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium transition-colors',
                          secondaryBtn
                        )}
                      >
                        <Maximize2 className="h-3 w-3" />
                        Show Resume
                      </button>
                    </div>
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
                      {selectedResume.isSent ? 'Marked Applied' : 'Mark as Applied'}
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
                      onClick={() =>
                        setPopoutModalData({
                          company: selectedResume.company || 'General Snapshot',
                          jobTitle:
                            selectedResume.jobTitle ||
                            selectedResume.resumeData.targetHeadline,
                          methodLabel: getSourceMethodLabel(selectedResume),
                          submittedAt:
                            selectedResume.sentAt || selectedResume.createdAt,
                          resume: selectedResume.resumeData,
                        })
                      }
                      className={cn('civic-btn-motion inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs', primaryBtn)}
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                      Show Resume
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

                <div className={cn('no-print rounded-lg border p-4 space-y-2', cardSurface)}>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold">Headline:</span>
                    <span className={mutedText}>
                      {selectedResume.resumeData.targetHeadline}
                    </span>
                  </div>
                  {selectedResume.notes && (
                    <p className={cn('text-xs', mutedText)}>
                      Notes: {selectedResume.notes}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className={cn('no-print rounded-lg border border-dashed p-12 text-center', cardSurface)}>
                <FileText className={cn('mx-auto h-7 w-7', mutedText)} />
                <p className="mt-2 text-sm font-semibold">
                  Select a resume applied version
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
                    <CopyUrlButton url={job.url} theme={theme} />
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

      {/* POP-OUT SUBMITTED RESUME MODAL (<dialog>) */}
      <SubmittedResumeModal
        isOpen={Boolean(popoutModalData)}
        company={popoutModalData?.company || ''}
        jobTitle={popoutModalData?.jobTitle || ''}
        methodLabel={popoutModalData?.methodLabel || 'Base Profile CV'}
        submittedAt={popoutModalData?.submittedAt}
        resume={popoutModalData?.resume || null}
        baseResume={profile.structuredResume}
        theme={theme}
        onClose={() => setPopoutModalData(null)}
        onEditInStudio={(resume) =>
          onOpenInResumeStudio(
            resume,
            subView === 'applied' ? selectedApplied?.job : null
          )
        }
      />
    </div>
  );
}

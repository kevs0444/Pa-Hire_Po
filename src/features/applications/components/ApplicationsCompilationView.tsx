'use client';

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ArrowUpDown,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Maximize2,
  MoreVertical,
  Pin,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
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
import { formatJobDateLabel } from '@/features/jobs/lib/job-date-utils';
import { isJobSaved } from '@/features/jobs/lib/job-filters';
import { SubmittedResumeModal } from '@/features/applications/components/SubmittedResumeModal';
import { BoardLogo } from '@/components/ui/BrandLogos';
import { CopyUrlButton } from '@/components/ui/CopyUrlButton';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

export type CompilationSubView = 'applied' | 'saved' | 'hidden' | 'resumes';
type ResumeAppliedFilter = 'all' | 'sent' | 'drafts';

interface ApplicationsCompilationViewProps {
  theme: MonochromeTheme;
  profile: UserProfile;
  jobs: JobListing[];
  resumeRecords: TailoredResumeRecord[];
  loadingResumes: boolean;
  initialSubView?: CompilationSubView;
  unsavedAppliedJobIds?: string[];
  pinnedActivityIds?: string[];
  nowMs?: number | null;
  onRefreshResumes: () => Promise<void>;
  onToggleSaveJob?: (jobId: string) => void;
  onTogglePinActivity?: (pinKey: string) => void;
  onOpenApplyModal?: (job: JobListing) => void;
  onUpdateJobApplication: (
    jobId: string,
    patch: {
      status?: JobStatus;
      title?: string;
      company?: string;
      source?: JobSource;
      appliedAt?: string | null;
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
const ITEMS_PER_PAGE = 15;

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoToDateInput(iso?: string | null): string {
  if (!iso) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso.slice(0, 10);
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function formatAppliedDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getSourceBoardName(source: JobSource): string {
  if (source === 'jobstreet') return 'JobStreet';
  if (source === 'linkedin') return 'LinkedIn';
  return 'Indeed';
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
    const parsed = new URL(
      trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
    );
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
        title:
          slugMatch?.[1] && !/^\d+$/.test(slugMatch[1])
            ? formatSlugWords(slugMatch[1])
            : undefined,
      };
    }

    if (host.includes('indeed.')) {
      return { source: 'indeed' };
    }

    const hostParts = host.replace(/^www\./, '').split('.');
    const filteredParts = hostParts.filter(
      (p) =>
        ![
          'careers',
          'jobs',
          'apply',
          'boards',
          'greenhouse',
          'lever',
          'workday',
          'myworkdayjobs',
          'ashbyhq',
          'com',
          'io',
          'co',
          'ph',
          'sg',
          'my',
          'net',
          'org',
        ].includes(p)
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

interface CardOverflowMenuProps {
  label: string;
  tokens: ReturnType<typeof getThemeTokens>;
  children: ReactNode;
}

function CardOverflowMenu({ label, tokens, children }: CardOverflowMenuProps) {
  const popoverId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const popover = popoverRef.current;
    const trigger = triggerRef.current;
    if (!popover || !trigger) return;

    const handleBeforeToggle = (event: Event) => {
      const toggleEvent = event as ToggleEvent;
      if (toggleEvent.newState !== 'open') return;
      if (
        typeof CSS !== 'undefined' &&
        typeof CSS.supports === 'function' &&
        CSS.supports('position-area: block-end')
      ) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const width = Math.min(220, window.innerWidth - 24);
      const rightOffset = Math.max(12, window.innerWidth - rect.right);
      popover.style.position = 'fixed';
      popover.style.margin = '0';
      popover.style.top = `${Math.round(rect.bottom + 6)}px`;
      popover.style.right = `${Math.round(rightOffset)}px`;
      popover.style.left = 'auto';
      popover.style.width = `${width}px`;
    };

    popover.addEventListener('beforetoggle', handleBeforeToggle);
    return () => {
      popover.removeEventListener('beforetoggle', handleBeforeToggle);
    };
  }, []);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!(e.target instanceof Element)) return;
    if (!e.target.closest('button, a')) return;
    const el = popoverRef.current as (HTMLDivElement & {
      hidePopover?: () => void;
    }) | null;
    if (el && typeof el.hidePopover === 'function') {
      try {
        el.hidePopover();
      } catch {
        // Already closed
      }
    }
  };

  return (
    <div className="relative inline-flex shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-controls={popoverId}
        {...({ popoverTarget: popoverId } as Record<string, string>)}
        className={cn(
          'civic-touch-target inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
          tokens.mutedText,
          tokens.isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'
        )}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      <div
        id={popoverId}
        ref={popoverRef}
        onClick={handleContainerClick}
        {...({ popover: 'auto' } as Record<string, string>)}
        className={cn(
          'civic-popover-panel w-[min(86dvw,220px)] overflow-hidden rounded-xl border py-1.5 shadow-xl',
          tokens.cardSurface
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function ApplicationsCompilationView({
  theme,
  profile,
  jobs,
  resumeRecords,
  loadingResumes,
  initialSubView = 'applied',
  unsavedAppliedJobIds = [],
  pinnedActivityIds = [],
  nowMs = null,
  onRefreshResumes,
  onToggleSaveJob,
  onTogglePinActivity,
  onOpenApplyModal,
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
    mutedText,
    strongText,
    borderSubtle,
  } = tokens;

  const [subView, setSubView] = useState<CompilationSubView>(initialSubView);
  const [resumeFilter, setResumeFilter] = useState<ResumeAppliedFilter>('all');
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | ApplicationStage>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [pinAnnouncement, setPinAnnouncement] = useState('');
  const [appliedPage, setAppliedPage] = useState(1);
  const [expandedEditKey, setExpandedEditKey] = useState<string | null>(null);
  const [expandedCardKeys, setExpandedCardKeys] = useState<
    Record<string, boolean>
  >({});
  const [editingResumeId, setEditingResumeId] = useState<string | null>(null);
  const [savingResumeId, setSavingResumeId] = useState<string | null>(null);
  const [resumeDraft, setResumeDraft] = useState<{
    versionName: string;
    company: string;
    jobTitle: string;
    notes: string;
    isSent: boolean;
  } | null>(null);

  const toggleCardExpanded = (cardKey: string) =>
    setExpandedCardKeys((prev) => ({
      ...prev,
      [cardKey]: !prev[cardKey],
    }));

  const startEditingResume = (rec: TailoredResumeRecord) => {
    if (editingResumeId === rec.id) {
      setEditingResumeId(null);
      setResumeDraft(null);
      return;
    }
    setEditingResumeId(rec.id);
    setResumeDraft({
      versionName:
        rec.versionName ||
        rec.resumeData?.versionName ||
        rec.company ||
        'General Snapshot',
      company: rec.company || '',
      jobTitle: rec.jobTitle || rec.resumeData?.targetHeadline || '',
      notes: rec.notes || '',
      isSent: Boolean(rec.isSent),
    });
  };

  const handleSaveResumeDraft = async (recId: string) => {
    if (!resumeDraft) return;
    setSavingResumeId(recId);
    try {
      await onUpdateResumeRecord(recId, {
        versionName: resumeDraft.versionName.trim() || null,
        company: resumeDraft.company.trim(),
        jobTitle: resumeDraft.jobTitle.trim(),
        notes: resumeDraft.notes,
        isSent: resumeDraft.isSent,
      });
      setEditingResumeId(null);
      setResumeDraft(null);
    } finally {
      setSavingResumeId(null);
    }
  };
  const [popoutModalData, setPopoutModalData] = useState<{
    company: string;
    jobTitle: string;
    methodLabel: string;
    submittedAt?: string | null;
    resume: StructuredResume;
    job?: JobListing | null;
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

  const unsavedAppliedSet = useMemo(
    () => new Set(unsavedAppliedJobIds),
    [unsavedAppliedJobIds]
  );

  const pinnedOrderMap = useMemo(
    () => new Map(pinnedActivityIds.map((key, idx) => [key, idx])),
    [pinnedActivityIds]
  );

  const handlePinToggle = (pinKey: string, label: string) => {
    const currentlyPinned = pinnedOrderMap.has(pinKey);
    onTogglePinActivity?.(pinKey);
    setPinAnnouncement(
      currentlyPinned ? `Unpinned ${label}` : `Pinned ${label} to top`
    );
  };

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
        .filter((j) => isJobSaved(j, unsavedAppliedSet))
        .sort(
          (a, b) =>
            new Date(
              b.savedAt || b.appliedAt || b.statusUpdatedAt || b.discoveredAt || 0
            ).getTime() -
            new Date(
              a.savedAt || a.appliedAt || a.statusUpdatedAt || a.discoveredAt || 0
            ).getTime()
        ),
    [jobs, unsavedAppliedSet]
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

    const merged = [...jobEntries, ...standaloneEntries];
    const filtered = pinnedOnly
      ? merged.filter((item) => pinnedOrderMap.has(item.key))
      : merged;

    return filtered.sort((a, b) => {
      const aRank = pinnedOrderMap.get(a.key) ?? Number.MAX_SAFE_INTEGER;
      const bRank = pinnedOrderMap.get(b.key) ?? Number.MAX_SAFE_INTEGER;
      if (aRank !== bRank) return aRank - bRank;
      const diff = new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime();
      return sortOrder === 'newest' ? diff : -diff;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedJobs, pinnedOnly, pinnedOrderMap, query, resumeRecords, sortOrder, stageFilter, standaloneSentRecords]);

  const filteredSavedJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = savedJobs.filter((j) => {
      if (pinnedOnly && !pinnedOrderMap.has(`job:${j.id}`)) return false;
      if (!q) return true;
      return `${j.company} ${j.title} ${j.location}`.toLowerCase().includes(q);
    });
    const ordered = sortOrder === 'newest' ? list : [...list].reverse();
    return [...ordered].sort((a, b) => {
      const aRank = pinnedOrderMap.get(`job:${a.id}`) ?? Number.MAX_SAFE_INTEGER;
      const bRank = pinnedOrderMap.get(`job:${b.id}`) ?? Number.MAX_SAFE_INTEGER;
      return aRank - bRank;
    });
  }, [pinnedOnly, pinnedOrderMap, query, savedJobs, sortOrder]);

  const filteredHiddenJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return hiddenJobs;
    return hiddenJobs.filter((j) =>
      `${j.company} ${j.title} ${j.location}`.toLowerCase().includes(q)
    );
  }, [hiddenJobs, query]);

  const filteredResumeRecords = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = resumeRecords.filter((r) => {
      if (pinnedOnly && !pinnedOrderMap.has(`rec:${r.id}`)) return false;
      if (resumeFilter === 'sent' && !r.isSent) return false;
      if (resumeFilter === 'drafts' && r.isSent) return false;
      if (!q) return true;
      return `${r.versionName || ''} ${r.company || ''} ${r.jobTitle || ''} ${r.notes} ${r.resumeData.targetHeadline}`
        .toLowerCase()
        .includes(q);
    });
    const ordered = sortOrder === 'newest' ? list : [...list].reverse();
    return [...ordered].sort((a, b) => {
      const aRank = pinnedOrderMap.get(`rec:${a.id}`) ?? Number.MAX_SAFE_INTEGER;
      const bRank = pinnedOrderMap.get(`rec:${b.id}`) ?? Number.MAX_SAFE_INTEGER;
      return aRank - bRank;
    });
  }, [pinnedOnly, pinnedOrderMap, query, resumeFilter, resumeRecords, sortOrder]);

  const pinnedCountInSubView = useMemo(() => {
    if (subView === 'saved') {
      return savedJobs.filter((j) => pinnedOrderMap.has(`job:${j.id}`)).length;
    }
    if (subView === 'applied') {
      return (
        appliedJobs.filter((j) => pinnedOrderMap.has(`job:${j.id}`)).length +
        standaloneSentRecords.filter((r) => pinnedOrderMap.has(`rec:${r.id}`)).length
      );
    }
    if (subView === 'resumes') {
      return resumeRecords.filter((r) => pinnedOrderMap.has(`rec:${r.id}`)).length;
    }
    return 0;
  }, [appliedJobs, pinnedOrderMap, resumeRecords, savedJobs, standaloneSentRecords, subView]);

  const totalAppliedCount = appliedJobs.length + standaloneSentRecords.length;
  const interviewingOrOfferCount = useMemo(
    () =>
      appliedJobs.filter(
        (j) =>
          j.applicationStage === 'interviewing' ||
          j.applicationStage === 'offer'
      ).length,
    [appliedJobs]
  );
  const sentResumeCount = useMemo(
    () => resumeRecords.filter((r) => r.isSent).length,
    [resumeRecords]
  );

  const totalAppliedPages = Math.max(
    1,
    Math.ceil(filteredAppliedItems.length / ITEMS_PER_PAGE)
  );
  const currentAppliedPage = Math.min(appliedPage, totalAppliedPages);
  const paginatedAppliedItems = filteredAppliedItems.slice(
    (currentAppliedPage - 1) * ITEMS_PER_PAGE,
    currentAppliedPage * ITEMS_PER_PAGE
  );

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

  const overflowItemClass = cn(
    'civic-touch-target flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium transition-colors',
    isDark
      ? 'text-zinc-200 hover:bg-zinc-800/80 hover:text-white'
      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
  );

  const renderPinnedBadge = () => (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-semibold',
        tokens.badgeAccent
      )}
    >
      <Pin className="h-3 w-3 fill-current" aria-hidden="true" />
      <span>Pinned</span>
    </span>
  );

  const renderPinButton = (
    pinKey: string,
    isPinned: boolean,
    title: string
  ) => (
    <button
      type="button"
      aria-pressed={isPinned}
      onClick={() => handlePinToggle(pinKey, title)}
      className={cn(
        'civic-touch-target inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
        isPinned ? tokens.badgeAccent : secondaryBtn
      )}
    >
      <Pin
        className={cn('h-3.5 w-3.5', isPinned && 'fill-current')}
        aria-hidden="true"
      />
      <span>Pin</span>
      <span className="sr-only"> {title}</span>
    </button>
  );

  const renderExpandButton = (
    cardKey: string,
    isExpanded: boolean,
    labelTarget: string
  ) => (
    <button
      type="button"
      aria-expanded={isExpanded}
      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for ${labelTarget}`}
      onClick={() => toggleCardExpanded(cardKey)}
      className={cn(
        'civic-touch-target inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
        secondaryBtn
      )}
    >
      {isExpanded ? (
        <>
          <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Collapse</span>
        </>
      ) : (
        <>
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Expand</span>
        </>
      )}
    </button>
  );

  const renderCompactNotesBox = (
    rawNotes: string | null | undefined,
    isExpanded: boolean,
    label = 'Notes:'
  ) => {
    const notes = (rawNotes || '').trim();
    if (!notes) return null;

    return (
      <div
        className={cn(
          'mt-2.5 rounded-lg border px-3 py-2 text-xs',
          subSurface
        )}
      >
        <div
          className={cn(
            'leading-relaxed',
            isExpanded
              ? 'max-h-60 overflow-y-auto whitespace-pre-line pr-1'
              : 'line-clamp-2'
          )}
        >
          <strong className={strongText}>{label}</strong>{' '}
          <span className={mutedText}>{notes}</span>
        </div>
      </div>
    );
  };

  const renderJobEditor = (job: JobListing) => (
    <div
      className={cn(
        'mt-4 grid gap-3 rounded-lg border p-3.5 sm:grid-cols-12',
        subSurface
      )}
    >
      <div className="sm:col-span-6 space-y-1">
        <label className={cn('block text-[11px] font-medium', mutedText)}>
          Job Title
        </label>
        <input
          type="text"
          value={job.title}
          onChange={(e) =>
            onUpdateJobApplication(job.id, {
              title: e.target.value,
            })
          }
          placeholder="e.g. Data Analyst"
          className={cn(
            'min-h-[36px] w-full rounded-lg border px-2.5 py-1 text-base focus:outline-none sm:text-xs',
            inputSurface
          )}
        />
      </div>

      <div className="sm:col-span-6 space-y-1">
        <label className={cn('block text-[11px] font-medium', mutedText)}>
          Company Name
        </label>
        <input
          type="text"
          value={job.company}
          onChange={(e) =>
            onUpdateJobApplication(job.id, {
              company: e.target.value,
            })
          }
          placeholder="e.g. Medicare Plus"
          className={cn(
            'min-h-[36px] w-full rounded-lg border px-2.5 py-1 text-base focus:outline-none sm:text-xs',
            inputSurface
          )}
        />
      </div>

      <div className="sm:col-span-4 space-y-1">
        <label className={cn('block text-[11px] font-medium', mutedText)}>
          Platform
        </label>
        <select
          value={job.source}
          onChange={(e) =>
            onUpdateJobApplication(job.id, {
              source: e.target.value as JobSource,
            })
          }
          className={cn(
            'min-h-[36px] w-full rounded-lg border px-2 py-1 text-xs focus:outline-none',
            inputSurface
          )}
        >
          <option value="linkedin">LinkedIn</option>
          <option value="jobstreet">JobStreet</option>
          <option value="indeed">Indeed</option>
        </select>
      </div>

      {job.status === 'applied' && (
        <>
          <div className="sm:col-span-4 space-y-1">
            <label className={cn('block text-[11px] font-medium', mutedText)}>
              Stage
            </label>
            <select
              value={job.applicationStage || 'applied'}
              onChange={(e) =>
                onUpdateJobApplication(job.id, {
                  applicationStage: e.target.value as ApplicationStage,
                })
              }
              className={cn(
                'min-h-[36px] w-full rounded-lg border px-2 py-1 text-xs focus:outline-none',
                inputSurface
              )}
            >
              {STAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4 space-y-1">
            <label className={cn('block text-[11px] font-medium', mutedText)}>
              Date Applied
            </label>
            <input
              type="date"
              value={isoToDateInput(
                job.appliedAt || job.statusUpdatedAt || job.discoveredAt
              )}
              onChange={(e) => {
                if (!e.target.value) return;
                onUpdateJobApplication(job.id, {
                  appliedAt: `${e.target.value}T12:00:00.000Z`,
                });
              }}
              className={cn(
                'min-h-[36px] w-full rounded-lg border px-2.5 py-1 text-base focus:outline-none sm:text-xs',
                inputSurface
              )}
            />
          </div>
        </>
      )}

      <div className="sm:col-span-6 space-y-1">
        <label className={cn('block text-[11px] font-medium', mutedText)}>
          Location
        </label>
        <input
          type="text"
          value={job.location}
          onChange={(e) =>
            onUpdateJobApplication(job.id, {
              location: e.target.value,
            })
          }
          className={cn(
            'min-h-[36px] w-full rounded-lg border px-2.5 py-1 text-base focus:outline-none sm:text-xs',
            inputSurface
          )}
        />
      </div>

      <div className="sm:col-span-3 space-y-1">
        <label className={cn('block text-[11px] font-medium', mutedText)}>
          Work Setup
        </label>
        <select
          value={job.workType || 'Flexible'}
          onChange={(e) =>
            onUpdateJobApplication(job.id, {
              workType: e.target.value,
            })
          }
          className={cn(
            'min-h-[36px] w-full rounded-lg border px-2 py-1 text-xs focus:outline-none',
            inputSurface
          )}
        >
          {WORK_SETUP_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
          {job.workType && !WORK_SETUP_OPTIONS.includes(job.workType) && (
            <option value={job.workType}>{job.workType}</option>
          )}
        </select>
      </div>

      <div className="sm:col-span-3 space-y-1">
        <label className={cn('block text-[11px] font-medium', mutedText)}>
          Salary / Offer
        </label>
        <input
          type="text"
          value={job.salary || ''}
          onChange={(e) =>
            onUpdateJobApplication(job.id, {
              salary: e.target.value || null,
            })
          }
          placeholder="e.g. ₱50k/mo"
          className={cn(
            'min-h-[36px] w-full rounded-lg border px-2.5 py-1 text-base focus:outline-none sm:text-xs',
            inputSurface
          )}
        />
      </div>

      <div className="sm:col-span-6 space-y-1">
        <label className={cn('block text-[11px] font-medium', mutedText)}>
          Resume Version Applied
        </label>
        <select
          value={job.tailoredResumeId || 'base'}
          onChange={(e) =>
            onUpdateJobApplication(job.id, {
              tailoredResumeId: e.target.value === 'base' ? null : e.target.value,
            })
          }
          className={cn(
            'min-h-[36px] w-full rounded-lg border px-2 py-1 text-xs focus:outline-none',
            inputSurface
          )}
        >
          <option value="base">Base Profile CV</option>
          {resumeRecords.map((rec) => (
            <option key={rec.id} value={rec.id}>
              {rec.versionName || rec.company || 'Saved Resume'} —{' '}
              {rec.jobTitle || rec.resumeData.targetHeadline}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-6 space-y-1">
        <label className={cn('block text-[11px] font-medium', mutedText)}>
          Company / Job Posting URL
        </label>
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={job.url === '#' ? '' : job.url}
            onChange={(e) =>
              onUpdateJobApplication(job.id, {
                url: e.target.value.trim() || '#',
              })
            }
            placeholder="https://..."
            className={cn(
              'min-h-[36px] min-w-0 flex-1 rounded-lg border px-2.5 py-1 text-base focus:outline-none sm:text-xs',
              inputSurface
            )}
          />
          <CopyUrlButton url={job.url} theme={theme} compact />
        </div>
      </div>

      <div className="sm:col-span-12 space-y-1">
        <label className={cn('block text-[11px] font-medium', mutedText)}>
          Notes (saved automatically)
        </label>
        <textarea
          rows={4}
          value={job.applicationNotes || ''}
          onChange={(e) =>
            onUpdateJobApplication(job.id, {
              applicationNotes: e.target.value,
            })
          }
          placeholder="Recruiter contact, interview date, salary quoted, key notes..."
          className={cn(
            'w-full resize-y rounded-lg border px-3 py-2 text-base leading-relaxed focus:outline-none sm:text-xs',
            inputSurface
          )}
        />
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-[920px] space-y-5 pb-10">
      <div role="status" aria-live="polite" className="sr-only">
        {pinAnnouncement}
      </div>
      {/* ACTIVITY HEADER + CLEAN JOBSTREET UNDERLINE TABS (Pics 1 & 2) */}
      <div className="no-print space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            className={cn(
              'font-display text-2xl font-bold tracking-tight',
              strongText
            )}
          >
            Activity
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void onRefreshResumes()}
              className={cn(
                'civic-touch-target inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                secondaryBtn
              )}
            >
              <RotateCcw
                className={cn('h-3.5 w-3.5', loadingResumes && 'animate-spin')}
              />
              <span>Sync</span>
            </button>
            <button
              type="button"
              onClick={() => setShowLogForm((v) => !v)}
              className={cn(
                'civic-touch-target inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs transition-colors',
                primaryBtn
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Job Application</span>
            </button>
          </div>
        </div>

        {/* Clean Underline Tab Bar */}
        <nav
          aria-label="Activity sections"
          className={cn(
            'no-scrollbar flex flex-nowrap items-center gap-5 overflow-x-auto border-b',
            borderSubtle
          )}
        >
          {(
            [
              {
                key: 'saved',
                label: 'Saved',
                icon: Bookmark,
                count: savedJobs.length,
              },
              {
                key: 'applied',
                label: 'Applied',
                icon: CheckCircle2,
                count: totalAppliedCount,
              },
              {
                key: 'resumes',
                label: 'Resume Applied',
                icon: FileText,
                count: resumeRecords.length,
              },
              {
                key: 'hidden',
                label: 'Hidden',
                icon: EyeOff,
                count: hiddenJobs.length,
              },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = subView === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setSubView(tab.key);
                  setAppliedPage(1);
                }}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'civic-touch-target inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 pb-2.5 pt-1 text-sm transition-colors',
                  active
                    ? isDark
                      ? 'border-zinc-100 font-semibold text-zinc-50'
                      : 'border-[#0a66c2] font-semibold text-[#0a66c2]'
                    : cn(
                        'border-transparent font-medium',
                        mutedText,
                        isDark ? 'hover:text-zinc-200' : 'hover:text-slate-900'
                      )
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="font-mono text-xs tabular-nums opacity-75">
                    ({tab.count})
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Compact Civic Pipeline Summary & Filter Strip */}
        <section
          className={cn(
            'flex flex-col gap-3 rounded-xl border p-3.5 sm:flex-row sm:items-center sm:justify-between',
            subSurface
          )}
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span>
              <strong className={cn('font-mono tabular-nums', strongText)}>
                {savedJobs.length}
              </strong>{' '}
              <span className={mutedText}>Saved</span>
            </span>
            <span>
              <strong className={cn('font-mono tabular-nums', strongText)}>
                {totalAppliedCount}
              </strong>{' '}
              <span className={mutedText}>Applied</span>
            </span>
            <span>
              <strong className={cn('font-mono tabular-nums', strongText)}>
                {interviewingOrOfferCount}
              </strong>{' '}
              <span className={mutedText}>Interview / Offer</span>
            </span>
            <span>
              <strong className={cn('font-mono tabular-nums', strongText)}>
                {sentResumeCount}
              </strong>{' '}
              <span className={mutedText}>Resumes Sent</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-48 sm:flex-none">
              <Search
                className={cn(
                  'pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5',
                  mutedText
                )}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setAppliedPage(1);
                }}
                placeholder="Search title, company..."
                className={cn(
                  'min-h-[38px] w-full rounded-lg border py-1.5 pl-8 pr-3 text-base focus:outline-none sm:text-xs',
                  inputSurface
                )}
              />
            </div>

            {subView === 'applied' && (
              <select
                value={stageFilter}
                onChange={(e) => {
                  setStageFilter(e.target.value as 'all' | ApplicationStage);
                  setAppliedPage(1);
                }}
                aria-label="Filter by application stage"
                className={cn(
                  'min-h-[38px] rounded-lg border px-2.5 py-1.5 text-xs font-medium focus:outline-none',
                  inputSurface
                )}
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
              <select
                value={resumeFilter}
                onChange={(e) =>
                  setResumeFilter(e.target.value as ResumeAppliedFilter)
                }
                aria-label="Filter saved resumes"
                className={cn(
                  'min-h-[38px] rounded-lg border px-2.5 py-1.5 text-xs font-medium focus:outline-none',
                  inputSurface
                )}
              >
                <option value="all">All Versions ({resumeRecords.length})</option>
                <option value="sent">✓ Applied ({sentResumeCount})</option>
                <option value="drafts">
                  Saved Drafts ({resumeRecords.length - sentResumeCount})
                </option>
              </select>
            )}

            {subView !== 'hidden' && (
              <button
                type="button"
                aria-pressed={pinnedOnly}
                onClick={() => {
                  setPinnedOnly((v) => !v);
                  setAppliedPage(1);
                }}
                className={cn(
                  'civic-touch-target inline-flex h-[38px] items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors',
                  pinnedOnly ? primaryBtn : secondaryBtn
                )}
              >
                <Pin
                  className={cn('h-3.5 w-3.5', pinnedOnly && 'fill-current')}
                  aria-hidden="true"
                />
                <span>Pinned</span>
                <span className="font-mono text-[11px] tabular-nums opacity-80">
                  ({pinnedCountInSubView})
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))
              }
              title={
                sortOrder === 'newest'
                  ? 'Sorted newest first — click to reverse'
                  : 'Sorted oldest first — click to reverse'
              }
              className={cn(
                'civic-touch-target inline-flex h-[38px] items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors',
                secondaryBtn
              )}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
              </span>
            </button>
          </div>
        </section>

        {/* Add Job Application Form (URL Auto-Detect + Resume Snapshot Link) */}
        {showLogForm && (
          <form
            onSubmit={handleSubmitExternal}
            className={cn(
              'grid gap-3 rounded-xl border p-4 sm:grid-cols-12',
              cardSurface
            )}
          >
            <div className="sm:col-span-12 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold">
                Add Job Application (paste URL to auto-detect platform, company &amp; role)
              </span>
            </div>

            <div className="sm:col-span-12 space-y-1">
              <label className={cn('block text-[11px] font-medium', mutedText)}>
                Company or Job Posting URL
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="url"
                  value={logForm.url}
                  onChange={(e) => applyUrlToLogForm(e.target.value)}
                  placeholder="https://www.linkedin.com/jobs/view/... or https://company.com/careers"
                  className={cn(
                    'min-h-[40px] min-w-0 flex-1 rounded-lg border px-3 py-1.5 text-base focus:outline-none sm:text-xs',
                    inputSurface
                  )}
                />
                <button
                  type="button"
                  onClick={() => void handlePasteUrlIntoForm()}
                  className={cn(
                    'civic-touch-target inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
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
                className={cn(
                  'min-h-[38px] w-full rounded-lg border px-3 py-1.5 text-base focus:outline-none sm:text-xs',
                  inputSurface
                )}
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
                className={cn(
                  'min-h-[38px] w-full rounded-lg border px-3 py-1.5 text-base focus:outline-none sm:text-xs',
                  inputSurface
                )}
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
                className={cn(
                  'min-h-[38px] w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none',
                  inputSurface
                )}
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
                  setLogForm({
                    ...logForm,
                    stage: e.target.value as ApplicationStage,
                  })
                }
                className={cn(
                  'min-h-[38px] w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none',
                  inputSurface
                )}
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
                className={cn(
                  'min-h-[38px] w-full rounded-lg border px-3 py-1.5 text-base focus:outline-none sm:text-xs',
                  inputSurface
                )}
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
                className={cn(
                  'min-h-[38px] w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none',
                  inputSurface
                )}
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
                Salary / Offer
              </label>
              <input
                type="text"
                value={logForm.salary}
                onChange={(e) =>
                  setLogForm({ ...logForm, salary: e.target.value })
                }
                placeholder="e.g. ₱45k - ₱60k"
                className={cn(
                  'min-h-[38px] w-full rounded-lg border px-3 py-1.5 text-base focus:outline-none sm:text-xs',
                  inputSurface
                )}
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
                className={cn(
                  'min-h-[38px] w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none',
                  inputSurface
                )}
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
                className={cn(
                  'min-h-[38px] w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none',
                  inputSurface
                )}
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
                className={cn(
                  'min-h-[38px] w-full rounded-lg border px-3 py-1.5 text-base focus:outline-none sm:text-xs',
                  inputSurface
                )}
              />
            </div>

            <div className="sm:col-span-3 flex items-end justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLogForm(false)}
                className={cn(
                  'civic-touch-target rounded-lg border px-3 py-1.5 text-xs font-medium',
                  secondaryBtn
                )}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={logging}
                className={cn(
                  'civic-touch-target rounded-lg px-4 py-1.5 text-xs disabled:opacity-50',
                  primaryBtn
                )}
              >
                {logging ? 'Saving...' : 'Save Application'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* SUBVIEW 1: SAVED JOBS (Pic 1 Clean Single-Column Layout + Auto-Saved Applied Jobs) */}
      {subView === 'saved' && (
        <section className="no-print space-y-3">
          <p className={cn('text-xs font-medium', mutedText)}>
            {filteredSavedJobs.length}{' '}
            {filteredSavedJobs.length === 1 ? 'job' : 'jobs'}
          </p>

          {filteredSavedJobs.length === 0 ? (
            <div
              className={cn(
                'space-y-2 rounded-xl border border-dashed p-10 text-center',
                cardSurface
              )}
            >
              <Bookmark className={cn('mx-auto h-7 w-7', mutedText)} />
              <p className="text-sm font-semibold">
                {pinnedOnly ? 'No pinned saved jobs yet' : 'No saved jobs yet'}
              </p>
              <p className={cn('text-xs', mutedText)}>
                {pinnedOnly
                  ? 'Click Pin on any saved job card to keep top roles at the top of this list.'
                  : 'Bookmark any listing or apply to a job and it will appear here automatically.'}
              </p>
              {pinnedOnly && (
                <button
                  type="button"
                  onClick={() => setPinnedOnly(false)}
                  className={cn(
                    'civic-touch-target inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium',
                    secondaryBtn
                  )}
                >
                  Show all saved jobs
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSavedJobs.map((job) => {
                const savedKey = `saved:${job.id}`;
                const pinKey = `job:${job.id}`;
                const isPinned = pinnedOrderMap.has(pinKey);
                const isEditingSaved = expandedEditKey === savedKey;
                const isSavedExpanded = Boolean(expandedCardKeys[savedKey]);
                const linkedRecord = findLinkedResume(job);
                const resumeForJob =
                  linkedRecord?.resumeData || profile.structuredResume;
                const snippet = job.description
                  ? job.description.replace(/\s+/g, ' ').trim()
                  : '';

                return (
                  <article
                    key={job.id}
                    className={cn(
                      'rounded-xl border p-4 transition-colors sm:p-5',
                      cardSurface,
                      isPinned &&
                        (isDark
                          ? 'border-l-[3px] border-l-zinc-200'
                          : 'border-l-[3px] border-l-[#0a66c2]')
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenJobInExplorer(job.id)}
                            className={cn(
                              'text-left font-display text-base font-bold leading-snug underline underline-offset-4 hover:opacity-80',
                              strongText
                            )}
                          >
                            {job.title}
                          </button>
                          {isPinned && renderPinnedBadge()}
                        </div>
                        <p className={cn('text-sm font-medium', mutedText)}>
                          {job.company}
                        </p>
                      </div>

                      <CardOverflowMenu
                        label={`More actions for ${job.title}`}
                        tokens={tokens}
                      >
                        <>
                          {onTogglePinActivity && (
                            <button
                              type="button"
                              onClick={() => handlePinToggle(pinKey, job.title)}
                              className={overflowItemClass}
                            >
                              <Pin className="h-3.5 w-3.5" />
                              <span>{isPinned ? 'Unpin from top' : 'Pin to top'}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedEditKey((prev) =>
                                prev === savedKey ? null : savedKey
                              )
                            }
                            className={overflowItemClass}
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>
                              {isEditingSaved ? 'Close editor' : 'Edit details & notes'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenJobInExplorer(job.id)}
                            className={overflowItemClass}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Open in Explorer</span>
                          </button>
                          {job.url && job.url !== '#' && (
                            <a
                              href={job.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={overflowItemClass}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>Open Original</span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (onToggleSaveJob) {
                                onToggleSaveJob(job.id);
                              } else {
                                onUpdateJobApplication(job.id, {
                                  status: 'suggested',
                                });
                              }
                            }}
                            className={overflowItemClass}
                          >
                            <Bookmark className="h-3.5 w-3.5" />
                            <span>Remove from Saved</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateJobApplication(job.id, {
                                status: 'hidden',
                              })
                            }
                            className={overflowItemClass}
                          >
                            <EyeOff className="h-3.5 w-3.5" />
                            <span>Hide job</span>
                          </button>
                        </>
                      </CardOverflowMenu>
                    </div>

                    <div className={cn('mt-2.5 space-y-0.5 text-xs', mutedText)}>
                      <p>Posted {formatJobDateLabel(job, nowMs ?? undefined)}</p>
                      <p>
                        {job.location}
                        {job.workType ? ` (${job.workType})` : ''}
                      </p>
                      {job.salary && (
                        <p className={cn('font-mono font-medium', strongText)}>
                          {job.salary}
                        </p>
                      )}
                    </div>

                    {snippet && !isEditingSaved && (
                      <p
                        className={cn(
                          'mt-2.5 text-xs leading-relaxed',
                          isSavedExpanded
                            ? 'max-h-60 overflow-y-auto whitespace-pre-line pr-1'
                            : 'line-clamp-2',
                          mutedText
                        )}
                      >
                        {isSavedExpanded ? job.description : snippet}
                      </p>
                    )}

                    {isSavedExpanded && !isEditingSaved && (
                      <div className={cn('mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]', mutedText)}>
                        <span className={cn('rounded border px-2 py-0.5 font-medium', subSurface)}>
                          {getSourceBoardName(job.source)}
                        </span>
                        <span className={cn('rounded border px-2 py-0.5 font-mono', subSurface)}>
                          {job.matchScore}% match
                        </span>
                        {job.matchedSkills.slice(0, 4).map((skill) => (
                          <span
                            key={`${savedKey}-${skill}`}
                            className={cn('rounded border px-2 py-0.5', subSurface)}
                          >
                            ✓ {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {!isEditingSaved &&
                      renderCompactNotesBox(job.applicationNotes, isSavedExpanded)}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {job.status === 'applied' ? (
                        <>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold',
                              tokens.badgeSuccess
                            )}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Applied on {getSourceBoardName(job.source)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setPopoutModalData({
                                company: job.company,
                                jobTitle: job.title,
                                methodLabel: linkedRecord
                                  ? getSourceMethodLabel(linkedRecord)
                                  : 'Base Profile CV',
                                submittedAt: job.appliedAt || job.statusUpdatedAt,
                                resume: resumeForJob,
                                job,
                              })
                            }
                            className={cn(
                              'civic-touch-target inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
                              secondaryBtn
                            )}
                          >
                            <Maximize2 className="h-3.5 w-3.5" />
                            <span>Show Resume</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenApplyModal) {
                              onOpenApplyModal(job);
                            } else {
                              onOpenJobInExplorer(job.id);
                            }
                          }}
                          className={cn(
                            'civic-touch-target inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs transition-colors',
                            primaryBtn
                          )}
                        >
                          <span>Apply &amp; Tailor</span>
                        </button>
                      )}

                      {onTogglePinActivity && renderPinButton(pinKey, isPinned, job.title)}

                      {renderExpandButton(savedKey, isSavedExpanded, job.title)}

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedEditKey((prev) =>
                            prev === savedKey ? null : savedKey
                          )
                        }
                        className={cn(
                          'civic-touch-target inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                          isEditingSaved ? primaryBtn : secondaryBtn
                        )}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>{isEditingSaved ? 'Done Editing' : 'Edit Details'}</span>
                      </button>

                      <CopyUrlButton url={job.url} theme={theme} />
                    </div>

                    {isEditingSaved && renderJobEditor(job)}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SUBVIEW 2: APPLIED JOBS (Pic 2 Clean Single-Column Layout + Inline Edit & Show Resume) */}
      {subView === 'applied' && (
        <section className="no-print space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className={cn('text-xs font-medium', mutedText)}>
              {filteredAppliedItems.length}{' '}
              {filteredAppliedItems.length === 1 ? 'job' : 'jobs'}
            </p>
            {totalAppliedPages > 1 && (
              <span className={cn('font-mono text-xs tabular-nums', mutedText)}>
                Page {currentAppliedPage} of {totalAppliedPages}
              </span>
            )}
          </div>

          {filteredAppliedItems.length === 0 ? (
            <div
              className={cn(
                'space-y-2 rounded-xl border border-dashed p-10 text-center',
                cardSurface
              )}
            >
              <CheckCircle2 className={cn('mx-auto h-7 w-7', mutedText)} />
              <p className="text-sm font-semibold">
                {pinnedOnly ? 'No pinned applied jobs yet' : 'No applied jobs tracked yet'}
              </p>
              <p className={cn('text-xs', mutedText)}>
                {pinnedOnly
                  ? 'Click Pin on any applied job to keep top applications at the top of this list.'
                  : 'Apply via Resume Studio, mark a job Applied, or click “Add Job Application” above.'}
              </p>
              {pinnedOnly && (
                <button
                  type="button"
                  onClick={() => setPinnedOnly(false)}
                  className={cn(
                    'civic-touch-target inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium',
                    secondaryBtn
                  )}
                >
                  Show all applied jobs
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedAppliedItems.map((item) => {
                const job = item.job;
                const isPinned = pinnedOrderMap.has(item.key);
                const isEditing = expandedEditKey === item.key;
                const isAppliedExpanded = Boolean(expandedCardKeys[item.key]);
                const previewResume =
                  item.record?.resumeData ||
                  (job ? profile.structuredResume : null);
                const methodLabel = item.record
                  ? getSourceMethodLabel(item.record)
                  : 'Base Profile CV';
                const boardName = job
                  ? getSourceBoardName(job.source)
                  : 'Resume Studio';
                const savedFlag = job
                  ? isJobSaved(job, unsavedAppliedSet)
                  : false;
                const notesText = job?.applicationNotes || item.record?.notes || '';

                return (
                  <article
                    key={item.key}
                    className={cn(
                      'rounded-xl border p-4 transition-colors sm:p-5',
                      cardSurface,
                      isPinned &&
                        (isDark
                          ? 'border-l-[3px] border-l-zinc-200'
                          : 'border-l-[3px] border-l-[#0a66c2]')
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {job ? (
                            <button
                              type="button"
                              onClick={() => onOpenJobInExplorer(job.id)}
                              className={cn(
                                'text-left font-display text-base font-bold leading-snug underline underline-offset-4 hover:opacity-80',
                                strongText
                              )}
                            >
                              {item.title}
                            </button>
                          ) : (
                            <h3
                              className={cn(
                                'font-display text-base font-bold leading-snug',
                                strongText
                              )}
                            >
                              {item.title}
                            </h3>
                          )}
                          {isPinned && renderPinnedBadge()}
                        </div>
                        <p className={cn('text-sm font-medium', mutedText)}>
                          {item.company}
                        </p>
                      </div>

                      <CardOverflowMenu
                        label={`More actions for ${item.title}`}
                        tokens={tokens}
                      >
                        <>
                          {onTogglePinActivity && (
                            <button
                              type="button"
                              onClick={() => handlePinToggle(item.key, item.title)}
                              className={overflowItemClass}
                            >
                              <Pin className="h-3.5 w-3.5" />
                              <span>{isPinned ? 'Unpin from top' : 'Pin to top'}</span>
                            </button>
                          )}
                          {job && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedEditKey((prev) =>
                                    prev === item.key ? null : item.key
                                  )
                                }
                                className={overflowItemClass}
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                                <span>
                                  {isEditing ? 'Close editor' : 'Edit details & notes'}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenJobInExplorer(job.id)}
                                className={overflowItemClass}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Open in Explorer</span>
                              </button>
                              {job.url && job.url !== '#' && (
                                <a
                                  href={job.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={overflowItemClass}
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  <span>Open Original</span>
                                </a>
                              )}
                              {onToggleSaveJob && (
                                <button
                                  type="button"
                                  onClick={() => onToggleSaveJob(job.id)}
                                  className={overflowItemClass}
                                >
                                  <Bookmark className="h-3.5 w-3.5" />
                                  <span>
                                    {savedFlag
                                      ? 'Remove from Saved'
                                      : 'Save to Saved jobs'}
                                  </span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateJobApplication(job.id, {
                                    status: 'hidden',
                                  })
                                }
                                className={overflowItemClass}
                              >
                                <EyeOff className="h-3.5 w-3.5" />
                                <span>Move to Hidden</span>
                              </button>
                            </>
                          )}
                          {previewResume && (
                            <button
                              type="button"
                              onClick={() => onOpenInResumeStudio(previewResume, job)}
                              className={overflowItemClass}
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span>Open in Resume Studio</span>
                            </button>
                          )}
                        </>
                      </CardOverflowMenu>
                    </div>

                    {/* Location & Salary */}
                    {job && (
                      <div className={cn('mt-2 space-y-0.5 text-xs', mutedText)}>
                        <p>
                          {job.location}
                          {job.workType ? ` (${job.workType})` : ''}
                        </p>
                        {job.salary && (
                          <p className={cn('font-mono font-medium', strongText)}>
                            {job.salary}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Pic 2 Emerald Applied Line + Stage Selector */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <p
                          className={cn(
                            'inline-flex items-center gap-1.5 text-xs font-semibold',
                            isDark ? 'text-emerald-300' : 'text-[#057642]'
                          )}
                        >
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>Applied on {boardName}</span>
                        </p>
                        <p className={cn('pl-5 text-xs', mutedText)}>
                          {formatAppliedDate(item.dateIso)}
                          {savedFlag ? ' • Auto-saved' : ''}
                        </p>
                      </div>

                      {job && (
                        <select
                          value={item.stage}
                          onChange={(e) =>
                            onUpdateJobApplication(job.id, {
                              applicationStage: e.target.value as ApplicationStage,
                            })
                          }
                          aria-label={`Application stage for ${item.title}`}
                          className={cn(
                            'min-h-[36px] rounded-lg border px-2.5 py-1 text-xs font-semibold focus:outline-none',
                            inputSurface
                          )}
                        >
                          {STAGE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {!isEditing && renderCompactNotesBox(notesText, isAppliedExpanded)}

                    {isAppliedExpanded && !isEditing && (
                      <div
                        className={cn(
                          'mt-2.5 space-y-2 rounded-lg border p-3 text-xs',
                          subSurface
                        )}
                      >
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>
                            <strong className={strongText}>Resume:</strong>{' '}
                            <span className={mutedText}>
                              {item.record?.versionName || methodLabel}
                            </span>
                          </span>
                          {job?.matchScore !== undefined && (
                            <span className={cn('font-mono', mutedText)}>
                              {job.matchScore}% match
                            </span>
                          )}
                          {job?.url && job.url !== '#' && (
                            <a
                              href={job.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                'inline-flex items-center gap-1 underline-offset-2 hover:underline',
                                isDark ? 'text-zinc-200' : 'text-[#0a66c2]'
                              )}
                            >
                              <ExternalLink className="h-3 w-3" aria-hidden="true" />
                              <span className="max-w-[260px] truncate">{job.url}</span>
                            </a>
                          )}
                        </div>
                        {job?.description && (
                          <div
                            className={cn(
                              'max-h-48 overflow-y-auto whitespace-pre-line border-t pt-2 leading-relaxed pr-1',
                              borderSubtle,
                              mutedText
                            )}
                          >
                            {job.description}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-3.5 flex flex-wrap items-center gap-2">
                      {previewResume && (
                        <button
                          type="button"
                          onClick={() =>
                            setPopoutModalData({
                              company: item.company,
                              jobTitle: item.title,
                              methodLabel,
                              submittedAt: item.dateIso,
                              resume: previewResume,
                              job,
                            })
                          }
                          className={cn(
                            'civic-touch-target inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
                            secondaryBtn
                          )}
                        >
                          <Maximize2 className="h-3.5 w-3.5" />
                          <span>Show Resume</span>
                        </button>
                      )}

                      {onTogglePinActivity &&
                        renderPinButton(item.key, isPinned, item.title)}

                      {renderExpandButton(item.key, isAppliedExpanded, item.title)}

                      {job && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedEditKey((prev) =>
                              prev === item.key ? null : item.key
                            )
                          }
                          className={cn(
                            'civic-touch-target inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                            isEditing ? primaryBtn : secondaryBtn
                          )}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>{isEditing ? 'Done Editing' : 'Edit Details'}</span>
                        </button>
                      )}

                      {job && <CopyUrlButton url={job.url} theme={theme} />}
                    </div>

                    {/* Inline Expandable Full-Detail Application Editor */}
                    {job && isEditing && renderJobEditor(job)}
                  </article>
                );
              })}
            </div>
          )}

          {/* Clean Numbered Pagination (Pic 1 Footer) */}
          {totalAppliedPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-2">
              {Array.from({ length: totalAppliedPages }, (_, idx) => idx + 1).map(
                (pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setAppliedPage(pageNum)}
                    className={cn(
                      'civic-touch-target inline-flex h-9 min-w-[36px] items-center justify-center rounded-lg border px-2.5 font-mono text-xs font-semibold tabular-nums transition-colors',
                      pageNum === currentAppliedPage
                        ? primaryBtn
                        : secondaryBtn
                    )}
                  >
                    {pageNum}
                  </button>
                )
              )}
            </div>
          )}
        </section>
      )}

      {/* SUBVIEW 3: RESUME APPLIED (CLEAN SINGLE-COLUMN) */}
      {subView === 'resumes' && (
        <section className="no-print space-y-3">
          <p className={cn('text-xs font-medium', mutedText)}>
            {filteredResumeRecords.length}{' '}
            {filteredResumeRecords.length === 1 ? 'resume' : 'resumes'}
          </p>

          {filteredResumeRecords.length === 0 ? (
            <div
              className={cn(
                'space-y-2 rounded-xl border border-dashed p-10 text-center',
                cardSurface
              )}
            >
              <FileText className={cn('mx-auto h-7 w-7', mutedText)} />
              <p className="text-sm font-semibold">
                {pinnedOnly ? 'No pinned resume snapshots yet' : 'No matching resumes yet'}
              </p>
              <p className={cn('text-xs', mutedText)}>
                {pinnedOnly
                  ? 'Click Pin on any resume snapshot to keep priority versions at the top.'
                  : 'Tailor a resume with AI or click “Save Version” in Resume Studio to track resumes applied by company.'}
              </p>
              {pinnedOnly && (
                <button
                  type="button"
                  onClick={() => setPinnedOnly(false)}
                  className={cn(
                    'civic-touch-target inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium',
                    secondaryBtn
                  )}
                >
                  Show all resumes
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredResumeRecords.map((rec) => {
                const resumeKey = `resume:${rec.id}`;
                const pinKey = `rec:${rec.id}`;
                const isPinned = pinnedOrderMap.has(pinKey);
                const isResumeExpanded = Boolean(expandedCardKeys[resumeKey]);
                const isEditingResume = editingResumeId === rec.id && resumeDraft !== null;
                const displayTitle =
                  rec.versionName ||
                  rec.resumeData?.versionName ||
                  rec.company ||
                  'General Snapshot';

                return (
                  <article
                    key={rec.id}
                    className={cn(
                      'space-y-2.5 rounded-xl border p-4 sm:p-5',
                      cardSurface,
                      isPinned &&
                        (isDark
                          ? 'border-l-[3px] border-l-zinc-200'
                          : 'border-l-[3px] border-l-[#0a66c2]')
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={cn(
                              'rounded border px-2 py-0.5 text-[11px] font-medium',
                              subSurface
                            )}
                          >
                            {getSourceMethodLabel(rec)}
                          </span>
                          {rec.isSent && (
                            <span
                              className={cn(
                                'rounded border px-2 py-0.5 text-[11px] font-semibold',
                                tokens.badgeSuccess
                              )}
                            >
                              ✓ Applied / Sent
                            </span>
                          )}
                          {isPinned && renderPinnedBadge()}
                        </div>
                        <h3 className={cn('font-display text-base font-bold', strongText)}>
                          {displayTitle}
                        </h3>
                        <p className={cn('text-xs font-medium', mutedText)}>
                          {rec.company ? `${rec.company} • ` : ''}
                          {rec.jobTitle || rec.resumeData.targetHeadline}
                        </p>
                      </div>

                      <span className={cn('font-mono text-xs', mutedText)}>
                        {formatAppliedDate(rec.sentAt || rec.createdAt)}
                      </span>
                    </div>

                    {!isEditingResume &&
                      renderCompactNotesBox(rec.notes, isResumeExpanded)}

                    {isResumeExpanded && !isEditingResume && (
                      <div
                        className={cn(
                          'space-y-2 rounded-lg border p-3 text-xs',
                          subSurface
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={cn('font-mono text-[11px]', mutedText)}>
                            {rec.resumeData?.pageSize?.toUpperCase() || 'A4'} •{' '}
                            {rec.resumeData?.fontFamily || 'Calibri'} •{' '}
                            {rec.resumeData?.textAlign === 'justify' ? 'Justified' : 'Left'}
                          </span>
                          {rec.resumeData?.targetHeadline && (
                            <span className={cn('text-[11px] font-medium', strongText)}>
                              {rec.resumeData.targetHeadline}
                            </span>
                          )}
                        </div>
                        {rec.resumeData?.tailoredSummary && (
                          <p
                            className={cn(
                              'max-h-40 overflow-y-auto whitespace-pre-line border-t pt-2 leading-relaxed pr-1',
                              borderSubtle,
                              mutedText
                            )}
                          >
                            {rec.resumeData.tailoredSummary}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setPopoutModalData({
                            company: rec.company || 'General Snapshot',
                            jobTitle:
                              rec.jobTitle || rec.resumeData.targetHeadline,
                            methodLabel: getSourceMethodLabel(rec),
                            submittedAt: rec.sentAt || rec.createdAt,
                            resume: rec.resumeData,
                          })
                        }
                        className={cn(
                          'civic-touch-target inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs',
                          primaryBtn
                        )}
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                        <span>Show Resume</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenInResumeStudio(rec.resumeData, null)}
                        className={cn(
                          'civic-touch-target inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium',
                          secondaryBtn
                        )}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Load in Studio</span>
                      </button>

                      {onTogglePinActivity &&
                        renderPinButton(pinKey, isPinned, displayTitle)}

                      {renderExpandButton(resumeKey, isResumeExpanded, displayTitle)}

                      <button
                        type="button"
                        onClick={() => startEditingResume(rec)}
                        className={cn(
                          'civic-touch-target inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                          isEditingResume ? primaryBtn : secondaryBtn
                        )}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>{isEditingResume ? 'Editing' : 'Edit Details'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void onUpdateResumeRecord(rec.id, {
                            isSent: !rec.isSent,
                          })
                        }
                        className={cn(
                          'civic-touch-target inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium',
                          secondaryBtn
                        )}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{rec.isSent ? 'Marked Applied' : 'Mark Applied'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => void onDeleteResumeRecord(rec.id)}
                        className={cn(
                          'civic-touch-target ml-auto inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium',
                          secondaryBtn
                        )}
                        aria-label={`Delete ${displayTitle}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {isEditingResume && resumeDraft && (
                      <div
                        className={cn(
                          'mt-3 grid gap-3 rounded-lg border p-3.5 sm:grid-cols-12',
                          subSurface
                        )}
                      >
                        <div className="sm:col-span-6 space-y-1">
                          <label className={cn('block text-[11px] font-medium', mutedText)}>
                            Version Name
                          </label>
                          <input
                            type="text"
                            value={resumeDraft.versionName}
                            onChange={(e) =>
                              setResumeDraft((prev) =>
                                prev ? { ...prev, versionName: e.target.value } : prev
                              )
                            }
                            placeholder="e.g. Medicare Plus — Data Analyst"
                            className={cn(
                              'min-h-[38px] w-full rounded-lg border px-2.5 py-1 text-base focus:outline-none sm:text-xs',
                              inputSurface
                            )}
                          />
                        </div>

                        <div className="sm:col-span-3 space-y-1">
                          <label className={cn('block text-[11px] font-medium', mutedText)}>
                            Company
                          </label>
                          <input
                            type="text"
                            value={resumeDraft.company}
                            onChange={(e) =>
                              setResumeDraft((prev) =>
                                prev ? { ...prev, company: e.target.value } : prev
                              )
                            }
                            placeholder="e.g. Medicare Plus"
                            className={cn(
                              'min-h-[38px] w-full rounded-lg border px-2.5 py-1 text-base focus:outline-none sm:text-xs',
                              inputSurface
                            )}
                          />
                        </div>

                        <div className="sm:col-span-3 space-y-1">
                          <label className={cn('block text-[11px] font-medium', mutedText)}>
                            Job Title
                          </label>
                          <input
                            type="text"
                            value={resumeDraft.jobTitle}
                            onChange={(e) =>
                              setResumeDraft((prev) =>
                                prev ? { ...prev, jobTitle: e.target.value } : prev
                              )
                            }
                            placeholder="e.g. Data Analyst"
                            className={cn(
                              'min-h-[38px] w-full rounded-lg border px-2.5 py-1 text-base focus:outline-none sm:text-xs',
                              inputSurface
                            )}
                          />
                        </div>

                        <div className="sm:col-span-12 space-y-1">
                          <label className={cn('block text-[11px] font-medium', mutedText)}>
                            Notes
                          </label>
                          <textarea
                            rows={4}
                            value={resumeDraft.notes}
                            onChange={(e) =>
                              setResumeDraft((prev) =>
                                prev ? { ...prev, notes: e.target.value } : prev
                              )
                            }
                            placeholder="Add job description summary, portal reference, or tailoring notes..."
                            className={cn(
                              'w-full resize-y rounded-lg border px-3 py-2 text-base leading-relaxed focus:outline-none sm:text-xs',
                              inputSurface
                            )}
                          />
                        </div>

                        <div className="sm:col-span-12 flex flex-wrap items-center justify-between gap-2 pt-1">
                          <label className="civic-touch-target inline-flex cursor-pointer items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={resumeDraft.isSent}
                              onChange={(e) =>
                                setResumeDraft((prev) =>
                                  prev ? { ...prev, isSent: e.target.checked } : prev
                                )
                              }
                              className="h-4 w-4"
                            />
                            <span className="font-medium">Applied / Sent</span>
                          </label>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingResumeId(null);
                                setResumeDraft(null);
                              }}
                              className={cn(
                                'civic-touch-target inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium',
                                secondaryBtn
                              )}
                            >
                              <X className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Cancel</span>
                            </button>
                            <button
                              type="button"
                              disabled={savingResumeId === rec.id}
                              onClick={() => void handleSaveResumeDraft(rec.id)}
                              className={cn(
                                'civic-touch-target inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium disabled:opacity-50',
                                primaryBtn
                              )}
                            >
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>
                                {savingResumeId === rec.id ? 'Saving...' : 'Save Changes'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SUBVIEW 4: HIDDEN JOBS */}
      {subView === 'hidden' && (
        <section className="no-print space-y-3">
          <div>
            <h3 className="text-sm font-semibold">
              Hidden Jobs ({filteredHiddenJobs.length})
            </h3>
            <p className={cn('text-xs', mutedText)}>
              Hidden listings stay saved in your database so they won&apos;t clutter Job Search again unless you restore them.
            </p>
          </div>
          {filteredHiddenJobs.length === 0 ? (
            <div className={cn('rounded-xl border border-dashed p-8 text-center', cardSurface)}>
              <p className={cn('text-xs', mutedText)}>No hidden jobs.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHiddenJobs.map((job) => {
                const hiddenKey = `hidden:${job.id}`;
                const isHiddenExpanded = Boolean(expandedCardKeys[hiddenKey]);
                const hiddenSnippet = job.description
                  ? job.description.replace(/\s+/g, ' ').trim()
                  : '';

                return (
                  <article
                    key={job.id}
                    className={cn(
                      'space-y-2.5 rounded-xl border p-4 sm:p-5',
                      cardSurface
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <BoardLogo source={job.source} theme={theme} size="sm" />
                          <span className={cn('text-xs', mutedText)}>
                            {job.hiddenAt
                              ? `Hidden ${formatAppliedDate(job.hiddenAt)}`
                              : 'Hidden'}
                          </span>
                        </div>
                        <p className={cn('font-display text-base font-bold leading-snug', strongText)}>
                          {job.title}
                        </p>
                        <p className={cn('text-xs font-medium', mutedText)}>
                          {job.company} • {job.location}
                          {job.workType ? ` (${job.workType})` : ''}
                        </p>
                        {job.salary && (
                          <p className={cn('font-mono text-xs font-medium', strongText)}>
                            {job.salary}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {renderExpandButton(hiddenKey, isHiddenExpanded, job.title)}
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateJobApplication(job.id, { status: 'suggested' })
                          }
                          className={cn(
                            'civic-touch-target inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium',
                            secondaryBtn
                          )}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Restore to Active</span>
                        </button>
                      </div>
                    </div>

                    {hiddenSnippet && (
                      <p
                        className={cn(
                          'text-xs leading-relaxed',
                          isHiddenExpanded
                            ? 'max-h-48 overflow-y-auto whitespace-pre-line pr-1'
                            : 'line-clamp-2',
                          mutedText
                        )}
                      >
                        {isHiddenExpanded ? job.description : hiddenSnippet}
                      </p>
                    )}

                    {renderCompactNotesBox(job.applicationNotes, isHiddenExpanded)}
                  </article>
                );
              })}
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
          onOpenInResumeStudio(resume, popoutModalData?.job ?? null)
        }
      />
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Award,
  BarChart3,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  Plus,
  RefreshCw,
  Target,
} from 'lucide-react';
import {
  AutoApplyConfig,
  JobListing,
  JobSource,
  MonochromeTheme,
  ScanSourceMeta,
  UserProfile,
} from '@/types/job';
import { BoardLogo } from '@/components/ui/BrandLogos';
import { AutoApplyBlueprintPanel } from '@/features/auto-apply/components/AutoApplyBlueprintPanel';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface JobAnalyticsViewProps {
  jobs: JobListing[];
  boardMeta: ScanSourceMeta[];
  activeProfile: UserProfile;
  theme: MonochromeTheme;
  queuedJobIds: string[];
  autoApplyConfig: AutoApplyConfig;
  isDesktopApp: boolean;
  scanning: boolean;
  onTriggerScan: () => void;
  onUpdateAutoApplyConfig: (next: AutoApplyConfig) => void;
  onToggleQueueJob: (jobId: string) => void;
  onQueueTopChoices: () => void;
  onSelectBoardFilter: (board: JobSource) => void;
  onOpenJobInExplorer: (jobId: string) => void;
  onOpenApplyModal: (job: JobListing) => void;
  onAddSkillToProfile: (skill: string) => void;
}

type AnalyticsTab = 'overview' | 'skills' | 'queue';
type SkillFilter = 'all' | 'missing' | 'matched';

const BOARD_LABELS: Record<JobSource, string> = {
  jobstreet: 'JobStreet',
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
};

const BOARDS_ORDER: JobSource[] = ['jobstreet', 'linkedin', 'indeed'];
const ROLE_PREVIEW_LIMIT = 6;

export function JobAnalyticsView({
  jobs,
  boardMeta,
  activeProfile,
  theme,
  queuedJobIds,
  autoApplyConfig,
  isDesktopApp,
  scanning,
  onTriggerScan,
  onUpdateAutoApplyConfig,
  onToggleQueueJob,
  onQueueTopChoices,
  onSelectBoardFilter,
  onOpenJobInExplorer,
  onOpenApplyModal,
  onAddSkillToProfile,
}: JobAnalyticsViewProps) {
  const tokens = getThemeTokens(theme);
  const {
    isDark,
    cardSurface,
    primaryBtn,
    secondaryBtn,
    strongText,
    mutedText,
    barTrack,
    barFill,
    borderSubtle,
    badgeSuccess,
  } = tokens;

  const [activePanel, setActivePanel] = useState<AnalyticsTab>('overview');
  const [skillFilter, setSkillFilter] = useState<SkillFilter>('all');
  const [showAllRoles, setShowAllRoles] = useState(false);

  const panelsWrapperRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<AnalyticsTab, HTMLButtonElement | null>>({
    overview: null,
    skills: null,
    queue: null,
  });

  useEffect(() => {
    const wrapper = panelsWrapperRef.current;
    if (!wrapper) return;
    const handleBeforeMatch = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const panelEl = target?.closest<HTMLElement>('[data-analytics-panel]');
      const key = panelEl?.dataset.analyticsPanel as AnalyticsTab | undefined;
      if (key === 'overview' || key === 'skills' || key === 'queue') {
        setActivePanel(key);
      }
    };
    wrapper.addEventListener('beforematch', handleBeforeMatch);
    return () => wrapper.removeEventListener('beforematch', handleBeforeMatch);
  }, []);

  const stats = useMemo(() => {
    const activeJobs = jobs.filter((j) => j.status !== 'hidden');
    const totalActive = activeJobs.length;
    const totalAll = jobs.length;

    const avgMatch =
      totalActive > 0
        ? Math.round(
            activeJobs.reduce((sum, j) => sum + j.matchScore, 0) / totalActive
          )
        : 0;

    const fitCount = activeJobs.filter((j) => j.experienceFit === 'fit').length;
    const stretchCount = activeJobs.filter(
      (j) => j.experienceFit === 'stretch'
    ).length;
    const seniorCount = activeJobs.filter(
      (j) => j.experienceFit === 'senior-warning'
    ).length;

    const savedCount = jobs.filter((j) => j.status === 'saved').length;
    const appliedCount = jobs.filter((j) => j.status === 'applied').length;
    const hiddenCount = jobs.filter((j) => j.status === 'hidden').length;

    const byBoard = BOARDS_ORDER.map((source) => {
      const boardJobs = activeJobs.filter((j) => j.source === source);
      const liveJobs = boardJobs.filter((j) => !j.isFallback);
      const metaEntries = boardMeta.filter((m) => m.source === source);
      const latestMeta = metaEntries[0];

      const boardAvg =
        boardJobs.length > 0
          ? Math.round(
              boardJobs.reduce((sum, j) => sum + j.matchScore, 0) /
                boardJobs.length
            )
          : 0;
      const topJob =
        [...boardJobs].sort((a, b) => b.matchScore - a.matchScore)[0] || null;
      const sharePct =
        totalActive > 0 ? Math.round((boardJobs.length / totalActive) * 100) : 0;

      return {
        source,
        label: BOARD_LABELS[source],
        count: boardJobs.length,
        liveCount: liveJobs.length,
        sharePct,
        avgMatch: boardAvg,
        topJob,
        status:
          latestMeta?.status || (liveJobs.length > 0 ? 'live' : 'ready'),
      };
    });

    const workTypeMap = new Map<string, number>();
    for (const j of activeJobs) {
      const wt = (j.workType || 'Unspecified').toLowerCase();
      const label = wt.includes('remote')
        ? 'Remote'
        : wt.includes('hybrid')
          ? 'Hybrid'
          : wt.includes('onsite') || wt.includes('on-site')
            ? 'Onsite'
            : 'Not Specified';
      workTypeMap.set(label, (workTypeMap.get(label) || 0) + 1);
    }

    const workTypes = ['Remote', 'Hybrid', 'Onsite', 'Not Specified'].map(
      (label) => {
        const count = workTypeMap.get(label) || 0;
        const pct =
          totalActive > 0 ? Math.round((count / totalActive) * 100) : 0;
        return { label, count, pct };
      }
    );

    const roleGroups = new Map<
      string,
      { count: number; totalMatch: number; fitCount: number }
    >();
    for (const j of activeJobs) {
      const role = j.searchedRole || 'General';
      const entry = roleGroups.get(role) || {
        count: 0,
        totalMatch: 0,
        fitCount: 0,
      };
      entry.count += 1;
      entry.totalMatch += j.matchScore;
      if (j.experienceFit === 'fit') entry.fitCount += 1;
      roleGroups.set(role, entry);
    }
    const roleDemand = Array.from(roleGroups.entries())
      .map(([role, data]) => ({
        role,
        count: data.count,
        avgMatch: Math.round(data.totalMatch / data.count),
        fitCount: data.fitCount,
        pct: totalActive > 0 ? Math.round((data.count / totalActive) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const profileSkillsLower = new Set(
      activeProfile.skills.map((s) => s.toLowerCase().trim())
    );
    const skillCounts = new Map<string, number>();
    for (const j of activeJobs) {
      const uniqueForJob = new Set([...j.matchedSkills, ...j.missingSkills]);
      for (const skill of uniqueForJob) {
        skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
      }
    }
    const topSkills = Array.from(skillCounts.entries())
      .map(([skill, count]) => ({
        skill,
        count,
        pct: totalActive > 0 ? Math.round((count / totalActive) * 100) : 0,
        inProfile: profileSkillsLower.has(skill.toLowerCase().trim()),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    const queuedJobs = queuedJobIds
      .map((id) => jobs.find((j) => j.id === id))
      .filter((j): j is JobListing => Boolean(j));

    return {
      totalAll,
      totalActive,
      avgMatch,
      fitCount,
      stretchCount,
      seniorCount,
      savedCount,
      appliedCount,
      hiddenCount,
      byBoard,
      workTypes,
      roleDemand,
      topSkills,
      queuedJobs,
    };
  }, [activeProfile.skills, boardMeta, jobs, queuedJobIds]);

  const workSetupColors: Record<string, string> = {
    Remote: isDark ? 'bg-emerald-400' : 'bg-[#057642]',
    Hybrid: isDark ? 'bg-zinc-200' : 'bg-[#0a66c2]',
    Onsite: isDark ? 'bg-zinc-500' : 'bg-slate-600',
    'Not Specified': isDark ? 'bg-zinc-700' : 'bg-slate-300',
  };

  const missingSkills = useMemo(
    () => stats.topSkills.filter((item) => !item.inProfile),
    [stats.topSkills]
  );
  const matchedSkills = useMemo(
    () => stats.topSkills.filter((item) => item.inProfile),
    [stats.topSkills]
  );

  const visibleRoles = showAllRoles
    ? stats.roleDemand
    : stats.roleDemand.slice(0, ROLE_PREVIEW_LIMIT);

  const expRows = [
    {
      label: 'Fits Your Level (Entry / 0–2 yrs)',
      count: stats.fitCount,
      pct:
        stats.totalActive > 0
          ? Math.round((stats.fitCount / stats.totalActive) * 100)
          : 0,
    },
    {
      label: 'Slight Stretch (3–4 yrs)',
      count: stats.stretchCount,
      pct:
        stats.totalActive > 0
          ? Math.round((stats.stretchCount / stats.totalActive) * 100)
          : 0,
    },
    {
      label: 'Senior Warning (5+ yrs)',
      count: stats.seniorCount,
      pct:
        stats.totalActive > 0
          ? Math.round((stats.seniorCount / stats.totalActive) * 100)
          : 0,
    },
  ];

  const funnelScaleMax = Math.max(stats.totalAll, stats.totalActive, 1);
  const funnelRows = [
    { label: 'Total Found', count: stats.totalActive },
    { label: 'Applicable Exp', count: stats.fitCount },
    { label: 'Queued', count: stats.queuedJobs.length },
    { label: 'Saved', count: stats.savedCount },
    { label: 'Applied', count: stats.appliedCount },
    { label: 'Hidden', count: stats.hiddenCount },
  ].map((row) => ({
    ...row,
    pct: Math.round((row.count / funnelScaleMax) * 100),
  }));

  const tabItems: { key: AnalyticsTab; label: string; badge: string }[] = [
    { key: 'overview', label: 'Overview', badge: `${stats.totalActive}` },
    {
      key: 'skills',
      label: 'Skill Gaps',
      badge:
        missingSkills.length > 0
          ? `${missingSkills.length} missing`
          : `${stats.topSkills.length}`,
    },
    {
      key: 'queue',
      label: 'Apply Queue',
      badge: `${stats.queuedJobs.length}`,
    },
  ];

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    const keys: AnalyticsTab[] = ['overview', 'skills', 'queue'];
    let nextIdx = -1;
    if (e.key === 'ArrowRight') nextIdx = (idx + 1) % keys.length;
    else if (e.key === 'ArrowLeft')
      nextIdx = (idx - 1 + keys.length) % keys.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = keys.length - 1;

    if (nextIdx >= 0) {
      e.preventDefault();
      const nextKey = keys[nextIdx];
      setActivePanel(nextKey);
      tabRefs.current[nextKey]?.focus();
    }
  };

  return (
    <div className="analytics-bento-container no-print space-y-5 pb-6">
      {/* COMPACT HEADER + UNIFIED 4-KPI RIBBON */}
      <section className={cn('overflow-hidden rounded-lg border', cardSurface)}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <h2
                className={cn(
                  'font-display text-lg font-bold tracking-tight',
                  strongText
                )}
              >
                Job Market Analytics
              </h2>
            </div>
            <p className={cn('text-xs', mutedText)}>
              <strong className={cn('font-semibold', strongText)}>
                {activeProfile.name}
              </strong>{' '}
              • {activeProfile.primaryRole} • LinkedIn, JobStreet &amp; Indeed
            </p>
          </div>

          <button
            type="button"
            disabled={scanning}
            onClick={onTriggerScan}
            className={cn(
              'civic-touch-target inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs transition-colors disabled:opacity-60',
              primaryBtn
            )}
          >
            <RefreshCw
              className={cn('h-3.5 w-3.5', scanning && 'animate-spin')}
              aria-hidden="true"
            />
            <span>{scanning ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        <div
          className={cn(
            'grid divide-y border-t sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-y-0',
            borderSubtle
          )}
        >
          <div className="space-y-1 p-4">
            <div className={cn('flex items-center gap-1.5 text-xs font-medium', mutedText)}>
              <Layers className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Total Active Jobs</span>
            </div>
            <div className={cn('font-mono text-2xl font-semibold tabular-nums', strongText)}>
              {stats.totalActive}
            </div>
            <p className={cn('text-xs', mutedText)}>
              Live listings across 3 boards
            </p>
          </div>

          <div className="space-y-1 p-4">
            <div className={cn('flex items-center gap-1.5 text-xs font-medium', mutedText)}>
              <Award className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Applicable Exp Fit</span>
            </div>
            <div className={cn('font-mono text-2xl font-semibold tabular-nums', strongText)}>
              {stats.fitCount}
            </div>
            <p className={cn('text-xs', mutedText)}>
              {stats.totalActive > 0
                ? `${Math.round((stats.fitCount / stats.totalActive) * 100)}% fit ${activeProfile.experienceLevel} level`
                : 'Run a scan to analyze fit'}
            </p>
          </div>

          <div className="space-y-1 p-4">
            <div className={cn('flex items-center gap-1.5 text-xs font-medium', mutedText)}>
              <Target className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Average Match Score</span>
            </div>
            <div className={cn('font-mono text-2xl font-semibold tabular-nums', strongText)}>
              {stats.avgMatch}%
            </div>
            <p className={cn('text-xs', mutedText)}>
              Weighted by role, skills &amp; exp
            </p>
          </div>

          <div className="space-y-1 p-4">
            <div className={cn('flex items-center gap-1.5 text-xs font-medium', mutedText)}>
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Pipeline Actions</span>
            </div>
            <div className={cn('font-mono text-2xl font-semibold tabular-nums', strongText)}>
              {stats.appliedCount + stats.savedCount + stats.queuedJobs.length}
            </div>
            <p className={cn('text-xs', mutedText)}>
              {stats.appliedCount} applied • {stats.savedCount} saved •{' '}
              {stats.queuedJobs.length} queued
            </p>
          </div>
        </div>
      </section>

      {/* SINGLE-ROW ACCESSIBLE UNDERLINE TABLIST */}
      <div
        role="tablist"
        aria-label="Job market analytics views"
        className={cn(
          'no-scrollbar flex flex-nowrap items-center gap-6 overflow-x-auto border-b',
          borderSubtle
        )}
      >
        {tabItems.map((tab, idx) => {
          const isSelected = activePanel === tab.key;
          return (
            <button
              key={tab.key}
              ref={(el) => {
                tabRefs.current[tab.key] = el;
              }}
              id={`analytics-tab-${tab.key}`}
              type="button"
              role="tab"
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setActivePanel(tab.key)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
              className={cn(
                'analytics-tab civic-touch-target inline-flex shrink-0 items-center gap-2 whitespace-nowrap pb-3 pt-1 text-sm transition-colors focus-visible:outline-none',
                isSelected
                  ? isDark
                    ? 'font-semibold text-zinc-50'
                    : 'font-semibold text-[#0a66c2]'
                  : cn(
                      'font-medium',
                      mutedText,
                      isDark ? 'hover:text-zinc-200' : 'hover:text-slate-900'
                    )
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 font-mono text-[11px] tabular-nums',
                  tab.key === 'skills' && missingSkills.length > 0
                    ? isDark
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'bg-[#0a66c2]/10 text-[#0a66c2]'
                    : isDark
                      ? 'bg-zinc-800/80 text-zinc-300'
                      : 'bg-slate-200/70 text-slate-700'
                )}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB PANELS (No padding/border/gap directly on [role="tabpanel"] for hidden="until-found") */}
      <div ref={panelsWrapperRef}>
        {/* PANEL 1: OVERVIEW */}
        <div
          role="tabpanel"
          aria-labelledby="analytics-tab-overview"
          data-analytics-panel="overview"
          tabIndex={activePanel === 'overview' ? 0 : undefined}
          hidden={
            activePanel !== 'overview'
              ? ('until-found' as unknown as boolean)
              : undefined
          }
        >
          <div className="grid gap-5 lg:grid-cols-12">
            {/* LEFT 8 COLS: BOARDS + ROLE DEMAND */}
            <div className="space-y-5 lg:col-span-8">
              <section className={cn('overflow-hidden rounded-lg border', cardSurface)}>
                <div
                  className={cn(
                    'flex flex-wrap items-baseline justify-between gap-2 border-b px-4 py-3.5 sm:px-5',
                    borderSubtle
                  )}
                >
                  <h3 className={cn('text-sm font-semibold', strongText)}>
                    Jobs by Board
                  </h3>
                  <span className={cn('text-xs', mutedText)}>
                    Click a job or jump straight to filtered listings
                  </span>
                </div>

                <div
                  className={cn(
                    'analytics-board-grid grid divide-y md:divide-x md:divide-y-0',
                    borderSubtle
                  )}
                >
                  {stats.byBoard.map((board) => (
                    <div
                      key={board.source}
                      className="analytics-board-card gap-3 p-4 sm:p-5"
                    >
                      {/* Subgrid Row 1: Logo & Live Pill */}
                      <div className="flex items-center justify-between gap-2">
                        <BoardLogo source={board.source} theme={theme} size="md" />
                        <span
                          className={cn(
                            'rounded border px-2 py-0.5 font-mono text-[11px] font-medium',
                            secondaryBtn
                          )}
                        >
                          {board.liveCount > 0 ? `${board.liveCount} live` : board.status}
                        </span>
                      </div>

                      {/* Subgrid Row 2: Big Count + Avg Match + Progress Bar */}
                      <div className="space-y-2.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <div>
                            <div className={cn('font-mono text-3xl font-semibold tabular-nums', strongText)}>
                              {board.count}
                            </div>
                            <div className={cn('text-xs font-medium', mutedText)}>
                              {board.sharePct}% share
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={cn('font-mono text-base font-semibold tabular-nums', strongText)}>
                              {board.avgMatch}%
                            </div>
                            <div className={cn('text-[11px]', mutedText)}>
                              avg match
                            </div>
                          </div>
                        </div>
                        <div className={cn('h-1.5 w-full overflow-hidden rounded-full', barTrack)}>
                          <div
                            className={cn('h-full rounded-full transition-all', barFill)}
                            style={{ width: `${board.sharePct}%` }}
                          />
                        </div>
                      </div>

                      {/* Subgrid Row 3: Top Match Preview */}
                      <div className={cn('min-w-0 border-t pt-3', borderSubtle)}>
                        {board.topJob ? (
                          <button
                            type="button"
                            onClick={() => onOpenJobInExplorer(board.topJob!.id)}
                            className="w-full text-left transition-opacity hover:opacity-80"
                          >
                            <div className={cn('font-mono text-[11px] font-medium tabular-nums', mutedText)}>
                              Top match ({board.topJob.matchScore}%)
                            </div>
                            <div className={cn('mt-0.5 line-clamp-1 text-xs font-semibold', strongText)}>
                              {board.topJob.title}
                            </div>
                            <div className={cn('line-clamp-1 text-[11px]', mutedText)}>
                              {board.topJob.company} • Exp: {board.topJob.experienceRequired}
                            </div>
                          </button>
                        ) : (
                          <p className={cn('text-xs', mutedText)}>
                            No jobs loaded yet for {board.label}.
                          </p>
                        )}
                      </div>

                      {/* Subgrid Row 4: Action Button */}
                      <div>
                        <button
                          type="button"
                          onClick={() => onSelectBoardFilter(board.source)}
                          className={cn(
                            'civic-touch-target inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                            secondaryBtn
                          )}
                        >
                          <span>View {board.label} Jobs</span>
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ROLE DEMAND (Flat hairline rows, no trapped inner scrollbar) */}
              <section className={cn('overflow-hidden rounded-lg border', cardSurface)}>
                <div
                  className={cn(
                    'flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3.5 sm:px-5',
                    borderSubtle
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <h3 className={cn('text-sm font-semibold', strongText)}>
                      Role Demand
                    </h3>
                  </div>
                  <span className={cn('font-mono text-xs tabular-nums', mutedText)}>
                    {stats.roleDemand.length} tracked roles
                  </span>
                </div>

                {stats.roleDemand.length === 0 ? (
                  <p className={cn('p-5 text-xs', mutedText)}>
                    Run a scan to see role demand counts.
                  </p>
                ) : (
                  <>
                    <div className={cn('divide-y', borderSubtle)}>
                      {visibleRoles.map((item) => (
                        <div key={item.role} className="space-y-1.5 px-4 py-3 sm:px-5">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className={cn('font-semibold', strongText)}>
                              {item.role}
                            </span>
                            <span className={cn('font-mono text-[11px] tabular-nums', mutedText)}>
                              <strong className={strongText}>{item.count}</strong> jobs • Avg{' '}
                              {item.avgMatch}% • {item.fitCount} entry fit
                            </span>
                          </div>
                          <div className={cn('h-1.5 w-full overflow-hidden rounded-full', barTrack)}>
                            <div
                              className={cn('h-full rounded-full transition-all', barFill)}
                              style={{ width: `${item.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {stats.roleDemand.length > ROLE_PREVIEW_LIMIT && (
                      <div className={cn('border-t px-4 py-2.5 sm:px-5', borderSubtle)}>
                        <button
                          type="button"
                          onClick={() => setShowAllRoles((prev) => !prev)}
                          className={cn(
                            'civic-touch-target inline-flex items-center gap-1.5 text-xs font-semibold underline-offset-2 hover:underline',
                            isDark ? 'text-zinc-200' : 'text-[#0a66c2]'
                          )}
                        >
                          {showAllRoles ? (
                            <>
                              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Show top {ROLE_PREVIEW_LIMIT} roles</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Show all {stats.roleDemand.length} roles</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>

            {/* RIGHT 4 COLS: PIPELINE FUNNEL + EXPERIENCE & WORK SETUP */}
            <div className="space-y-5 lg:col-span-4">
              <section className={cn('overflow-hidden rounded-lg border', cardSurface)}>
                <div className={cn('border-b px-4 py-3.5 sm:px-5', borderSubtle)}>
                  <h3 className={cn('text-sm font-semibold', strongText)}>
                    Application Funnel
                  </h3>
                </div>

                <div className={cn('divide-y', borderSubtle)}>
                  {funnelRows.map((step) => (
                    <div key={step.label} className="space-y-1.5 px-4 py-3 sm:px-5">
                      <div className="flex items-center justify-between text-xs">
                        <span className={cn('font-medium', mutedText)}>{step.label}</span>
                        <span className={cn('font-mono font-semibold tabular-nums', strongText)}>
                          {step.count}
                        </span>
                      </div>
                      <div className={cn('h-1.5 w-full overflow-hidden rounded-full', barTrack)}>
                        <div
                          className={cn('h-full rounded-full transition-all', barFill)}
                          style={{ width: `${step.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className={cn('overflow-hidden rounded-lg border', cardSurface)}>
                <div className={cn('flex items-center gap-2 border-b px-4 py-3.5 sm:px-5', borderSubtle)}>
                  <Award className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <h3 className={cn('text-sm font-semibold', strongText)}>
                    Experience &amp; Work Setup
                  </h3>
                </div>

                <div className="space-y-3 p-4 sm:p-5">
                  {expRows.map((row) => (
                    <div key={row.label} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className={cn('font-medium', mutedText)}>{row.label}</span>
                        <span className={cn('shrink-0 font-mono font-semibold tabular-nums', strongText)}>
                          {row.count} ({row.pct}%)
                        </span>
                      </div>
                      <div className={cn('h-1.5 w-full overflow-hidden rounded-full', barTrack)}>
                        <div
                          className={cn('h-full rounded-full transition-all', barFill)}
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className={cn('space-y-3 border-t p-4 sm:p-5', borderSubtle)}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={cn('font-semibold', strongText)}>
                      Work Setup Split
                    </span>
                    <span className={cn('font-mono text-[11px] tabular-nums', mutedText)}>
                      {stats.totalActive} total
                    </span>
                  </div>

                  {/* Single Horizontal Segmented Bar */}
                  <div className={cn('flex h-2.5 w-full overflow-hidden rounded-full', barTrack)}>
                    {stats.workTypes.map((wt) =>
                      wt.pct > 0 ? (
                        <div
                          key={wt.label}
                          title={`${wt.label}: ${wt.count} (${wt.pct}%)`}
                          className={cn('h-full transition-all', workSetupColors[wt.label])}
                          style={{ width: `${wt.pct}%` }}
                        />
                      ) : null
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1 text-xs">
                    {stats.workTypes.map((wt) => (
                      <div key={wt.label} className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 truncate">
                          <span
                            className={cn(
                              'h-2 w-2 shrink-0 rounded-full',
                              workSetupColors[wt.label]
                            )}
                            aria-hidden="true"
                          />
                          <span className={cn('truncate', mutedText)}>{wt.label}</span>
                        </span>
                        <span className={cn('font-mono font-semibold tabular-nums', strongText)}>
                          {wt.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* PANEL 2: SKILL GAPS */}
        <div
          role="tabpanel"
          aria-labelledby="analytics-tab-skills"
          data-analytics-panel="skills"
          tabIndex={activePanel === 'skills' ? 0 : undefined}
          hidden={
            activePanel !== 'skills'
              ? ('until-found' as unknown as boolean)
              : undefined
          }
        >
          <section className={cn('overflow-hidden rounded-lg border', cardSurface)}>
            <div
              className={cn(
                'flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-5',
                borderSubtle
              )}
            >
              <div className="space-y-0.5">
                <h3 className={cn('text-sm font-semibold', strongText)}>
                  Top Requested Skills vs {activeProfile.name}&apos;s Profile
                </h3>
                <p className={cn('text-xs', mutedText)}>
                  Add missing skills you already possess to rescore active listings immediately.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { key: 'all', label: `All (${stats.topSkills.length})` },
                    { key: 'missing', label: `Missing (${missingSkills.length})` },
                    { key: 'matched', label: `Matched (${matchedSkills.length})` },
                  ] as const
                ).map((item) => {
                  const active = skillFilter === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setSkillFilter(item.key)}
                      className={cn(
                        'civic-touch-target rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                        active ? primaryBtn : secondaryBtn
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {stats.topSkills.length === 0 ? (
              <p className={cn('p-6 text-xs', mutedText)}>
                Scan jobs first to analyze requested skills across JobStreet, LinkedIn, and Indeed.
              </p>
            ) : (
              <div>
                {(skillFilter === 'all' || skillFilter === 'missing') && (
                  <div>
                    <div className={cn('border-b px-4 py-2.5 text-xs font-semibold sm:px-5', borderSubtle, strongText)}>
                      Missing From Profile ({missingSkills.length})
                    </div>
                    {missingSkills.length === 0 ? (
                      <p className={cn('px-4 py-4 text-xs sm:px-5', mutedText)}>
                        ✓ You already match all top {stats.topSkills.length} requested skills.
                      </p>
                    ) : (
                      <div className={cn('divide-y', borderSubtle)}>
                        {missingSkills.map((item) => (
                          <div
                            key={item.skill}
                            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
                          >
                            <div className="min-w-0 flex-1 space-y-1.5">
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <span className={cn('font-semibold', strongText)}>
                                  {item.skill}
                                </span>
                                <span className={cn('font-mono text-[11px] tabular-nums', mutedText)}>
                                  {item.count} jobs ({item.pct}%)
                                </span>
                              </div>
                              <div className={cn('h-1.5 w-full overflow-hidden rounded-full', barTrack)}>
                                <div
                                  className={cn('h-full rounded-full transition-all', barFill)}
                                  style={{ width: `${item.pct}%` }}
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => onAddSkillToProfile(item.skill)}
                              className={cn(
                                'civic-touch-target inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                                primaryBtn
                              )}
                            >
                              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Add</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(skillFilter === 'all' || skillFilter === 'matched') && (
                  <div className={cn(skillFilter === 'all' && 'border-t', borderSubtle)}>
                    <div className={cn('border-b px-4 py-2.5 text-xs font-semibold sm:px-5', borderSubtle, strongText)}>
                      Matched Skills ({matchedSkills.length})
                    </div>
                    {matchedSkills.length === 0 ? (
                      <p className={cn('px-4 py-4 text-xs sm:px-5', mutedText)}>
                        None of the top requested skills match your profile yet.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2 p-4 sm:p-5">
                        {matchedSkills.map((item) => (
                          <span
                            key={item.skill}
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium',
                              badgeSuccess
                            )}
                          >
                            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span>{item.skill}</span>
                            <span className="font-mono text-[11px] tabular-nums opacity-80">
                              {item.count} ({item.pct}%)
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* PANEL 3: APPLY QUEUE */}
        <div
          role="tabpanel"
          aria-labelledby="analytics-tab-queue"
          data-analytics-panel="queue"
          tabIndex={activePanel === 'queue' ? 0 : undefined}
          hidden={
            activePanel !== 'queue'
              ? ('until-found' as unknown as boolean)
              : undefined
          }
        >
          <AutoApplyBlueprintPanel
            queuedJobs={stats.queuedJobs}
            activeProfile={activeProfile}
            config={autoApplyConfig}
            theme={theme}
            isDesktopApp={isDesktopApp}
            onUpdateConfig={onUpdateAutoApplyConfig}
            onQueueTopChoices={onQueueTopChoices}
            onRemoveQueuedJob={onToggleQueueJob}
            onOpenApplyModal={onOpenApplyModal}
            onOpenJobInExplorer={onOpenJobInExplorer}
          />
        </div>
      </div>
    </div>
  );
}

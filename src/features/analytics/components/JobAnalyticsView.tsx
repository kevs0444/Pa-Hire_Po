'use client';

import { useMemo } from 'react';
import {
  ArrowRight,
  Award,
  BarChart3,
  Briefcase,
  CheckCircle2,
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

const BOARD_LABELS: Record<JobSource, string> = {
  jobstreet: 'JobStreet',
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
};

const BOARDS_ORDER: JobSource[] = ['jobstreet', 'linkedin', 'indeed'];

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
  const {
    isDark,
    cardSurface,
    subSurface,
    primaryBtn,
    secondaryBtn,
    mutedText,
    barTrack,
    barFill,
    borderSubtle,
  } = getThemeTokens(theme);

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
      const fallbackJobs = boardJobs.filter((j) => j.isFallback);
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
        fallbackCount: fallbackJobs.length,
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

  const funnelRows = [
    { label: 'Total Found', count: stats.totalActive },
    { label: 'Applicable Exp', count: stats.fitCount },
    { label: 'Queued', count: stats.queuedJobs.length },
    { label: 'Saved', count: stats.savedCount },
    { label: 'Applied', count: stats.appliedCount },
    { label: 'Hidden', count: stats.hiddenCount },
  ];

  return (
    <div className="no-print space-y-5">
      {/* HEADER BAR */}
      <section className={cn('flex flex-wrap items-center justify-between gap-4 rounded-lg border p-5', cardSurface)}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <h2 className="text-lg font-semibold tracking-tight">
              Job Market &amp; Board Analytics
            </h2>
          </div>
          <p className={cn('text-xs', mutedText)}>
            Real-time job breakdown across JobStreet, LinkedIn, and Indeed for{' '}
            <strong className="font-semibold">{activeProfile.name}</strong> ({activeProfile.primaryRole}).
          </p>
        </div>

        <button
          type="button"
          disabled={scanning}
          onClick={onTriggerScan}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs transition-colors disabled:opacity-60',
            primaryBtn
          )}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', scanning && 'animate-spin')} />
          {scanning ? 'Refreshing Boards...' : 'Refresh Board Counts'}
        </button>
      </section>

      {/* SECTION 1: TOP SUMMARY KPIS (Unified Telemetry Strip) */}
      <section
        className={cn(
          'grid divide-y overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-y-0',
          borderSubtle,
          cardSurface
        )}
      >
        <div className="space-y-1 p-4">
          <div className={cn('flex items-center gap-1.5 text-xs font-medium', mutedText)}>
            <Layers className="h-3.5 w-3.5" />
            Total Active Jobs
          </div>
          <div className="font-mono text-2xl font-semibold tracking-tight tabular-nums">
            {stats.totalActive}
          </div>
          <p className={cn('text-xs', mutedText)}>
            Across JobStreet, LinkedIn &amp; Indeed
          </p>
        </div>

        <div className="space-y-1 p-4">
          <div className={cn('flex items-center gap-1.5 text-xs font-medium', mutedText)}>
            <Award className="h-3.5 w-3.5" />
            Applicable Exp Fit
          </div>
          <div className="font-mono text-2xl font-semibold tracking-tight tabular-nums">
            {stats.fitCount}
          </div>
          <p className={cn('text-xs', mutedText)}>
            {stats.totalActive > 0
              ? `${Math.round((stats.fitCount / stats.totalActive) * 100)}% match ${activeProfile.experienceLevel} level`
              : 'Run a scan to analyze fit'}
          </p>
        </div>

        <div className="space-y-1 p-4">
          <div className={cn('flex items-center gap-1.5 text-xs font-medium', mutedText)}>
            <Target className="h-3.5 w-3.5" />
            Average Match Score
          </div>
          <div className="font-mono text-2xl font-semibold tracking-tight tabular-nums">
            {stats.avgMatch}%
          </div>
          <p className={cn('text-xs', mutedText)}>
            Weighted by title, skills &amp; experience
          </p>
        </div>

        <div className="space-y-1 p-4">
          <div className={cn('flex items-center gap-1.5 text-xs font-medium', mutedText)}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            Pipeline Actions
          </div>
          <div className="font-mono text-2xl font-semibold tracking-tight tabular-nums">
            {stats.appliedCount + stats.savedCount + stats.queuedJobs.length}
          </div>
          <p className={cn('text-xs', mutedText)}>
            {stats.appliedCount} applied • {stats.savedCount} saved • {stats.queuedJobs.length} queued
          </p>
        </div>
      </section>

      {/* SECTION 2: JOBS PER BOARD (Hairline-Divided Board Breakdown) */}
      <section className={cn('overflow-hidden rounded-lg border', cardSurface)}>
        <div className={cn('flex flex-wrap items-baseline justify-between gap-2 border-b px-5 py-3.5', borderSubtle)}>
          <h3 className="text-sm font-semibold">Jobs Available Per Job Board</h3>
          <span className={cn('text-xs', mutedText)}>
            Jump straight to filtered listings
          </span>
        </div>

        <div className={cn('grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0', borderSubtle)}>
          {stats.byBoard.map((board) => (
            <div
              key={board.source}
              className="flex flex-col justify-between gap-4 p-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <BoardLogo source={board.source} theme={theme} size="md" />
                  <span className={cn('rounded border px-2 py-0.5 font-mono text-[11px] font-medium', secondaryBtn)}>
                    {board.liveCount > 0 ? `${board.liveCount} live` : board.status}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="font-mono text-3xl font-semibold tabular-nums">
                      {board.count}
                    </div>
                    <div className={cn('text-xs font-medium', mutedText)}>
                      jobs on {board.label} ({board.sharePct}% share)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-base font-semibold tabular-nums">
                      {board.avgMatch}%
                    </div>
                    <div className={cn('text-[11px]', mutedText)}>avg match</div>
                  </div>
                </div>

                <div className={cn('h-2 w-full overflow-hidden rounded-full', barTrack)}>
                  <div
                    className={cn('h-full rounded-full transition-all', barFill)}
                    style={{ width: `${board.sharePct}%` }}
                  />
                </div>

                {board.topJob ? (
                  <button
                    type="button"
                    onClick={() => onOpenJobInExplorer(board.topJob!.id)}
                    className={cn(
                      'w-full border-t pt-3 text-left transition-opacity hover:opacity-80',
                      borderSubtle
                    )}
                  >
                    <div className={cn('font-mono text-[11px] font-medium tabular-nums', mutedText)}>
                      Top match ({board.topJob.matchScore}%)
                    </div>
                    <div className="mt-0.5 line-clamp-1 text-xs font-semibold">
                      {board.topJob.title}
                    </div>
                    <div className={cn('line-clamp-1 text-[11px]', mutedText)}>
                      {board.topJob.company} • Exp: {board.topJob.experienceRequired}
                    </div>
                  </button>
                ) : (
                  <div className={cn('border-t pt-3 text-xs', borderSubtle, mutedText)}>
                    No jobs loaded yet for {board.label}.
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onSelectBoardFilter(board.source)}
                className={cn(
                  'inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                  secondaryBtn
                )}
              >
                View {board.label} Jobs
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: EXPERIENCE NEEDED & WORK SETUP + PIPELINE FUNNEL */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className={cn('space-y-4 rounded-lg border p-5', cardSurface)}>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <h3 className="text-sm font-semibold">Experience Level Breakdown</h3>
          </div>

          <div className="space-y-3">
            {expRows.map((row) => (
              <div key={row.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{row.label}</span>
                  <span className="font-mono font-semibold tabular-nums">
                    {row.count} ({row.pct}%)
                  </span>
                </div>
                <div className={cn('h-2 w-full overflow-hidden rounded-full', barTrack)}>
                  <div
                    className={cn('h-full rounded-full transition-all', barFill)}
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className={cn('border-t pt-3', borderSubtle)}>
            <div className={cn('mb-2 text-xs font-medium', mutedText)}>
              Work Setup Distribution
            </div>
            <div
              className={cn(
                'grid grid-cols-2 divide-y overflow-hidden rounded-lg border sm:grid-cols-4 sm:divide-x sm:divide-y-0',
                borderSubtle,
                subSurface
              )}
            >
              {stats.workTypes.map((wt) => (
                <div key={wt.label} className="p-2.5">
                  <div className="font-mono text-lg font-semibold tabular-nums">{wt.count}</div>
                  <div className={cn('text-[11px] font-medium', mutedText)}>
                    {wt.label} ({wt.pct}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={cn('space-y-4 rounded-lg border p-5', cardSurface)}>
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <h3 className="text-sm font-semibold">Role Demand &amp; Application Funnel</h3>
          </div>

          <div
            className={cn(
              'max-h-[190px] divide-y overflow-y-auto rounded-lg border',
              borderSubtle,
              subSurface
            )}
          >
            {stats.roleDemand.length === 0 ? (
              <p className={cn('p-3 text-xs', mutedText)}>
                Run a scan to see role demand counts.
              </p>
            ) : (
              stats.roleDemand.map((item) => (
                <div key={item.role} className="space-y-1 p-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-semibold">{item.role}</span>
                    <span className="shrink-0 font-mono text-[11px] font-medium tabular-nums">
                      {item.count} jobs • Avg {item.avgMatch}% ({item.fitCount} entry fit)
                    </span>
                  </div>
                  <div className={cn('h-1.5 w-full overflow-hidden rounded-full', barTrack)}>
                    <div
                      className={cn('h-full rounded-full', barFill)}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={cn('border-t pt-3', borderSubtle)}>
            <div className={cn('mb-2 text-xs font-medium', mutedText)}>
              Application Funnel
            </div>
            <div
              className={cn(
                'grid grid-cols-3 divide-x divide-y overflow-hidden rounded-lg border sm:grid-cols-6 sm:divide-y-0',
                borderSubtle,
                subSurface
              )}
            >
              {funnelRows.map((step) => (
                <div key={step.label} className="p-2 text-center">
                  <div className="font-mono text-base font-semibold tabular-nums">{step.count}</div>
                  <div className={cn('text-[11px] font-medium leading-tight', mutedText)}>
                    {step.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: TOP REQUESTED SKILLS VS YOUR PROFILE */}
      <section className={cn('overflow-hidden rounded-lg border', cardSurface)}>
        <div className={cn('flex flex-wrap items-baseline justify-between gap-2 border-b px-5 py-3.5', borderSubtle)}>
          <h3 className="text-sm font-semibold">
            Top 12 Most Requested Skills vs {activeProfile.name}&apos;s Profile
          </h3>
          <span className={cn('text-xs', mutedText)}>
            Add missing skills you already possess to rescore jobs immediately
          </span>
        </div>

        {stats.topSkills.length === 0 ? (
          <p className={cn('p-5 text-xs', mutedText)}>
            Scan jobs first to analyze requested skills across JobStreet, LinkedIn, and Indeed.
          </p>
        ) : (
          <div className={cn('grid divide-y sm:grid-cols-2 sm:divide-x lg:grid-cols-3', borderSubtle)}>
            {stats.topSkills.map((item) => (
              <div
                key={item.skill}
                className={cn(
                  'flex items-center justify-between gap-3 p-3.5 transition-colors',
                  isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-slate-50/75'
                )}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold">{item.skill}</span>
                    <span className={cn('font-mono text-[11px] font-medium tabular-nums', mutedText)}>
                      {item.count} ({item.pct}%)
                    </span>
                  </div>
                  <div className={cn('h-1.5 w-full overflow-hidden rounded-full', barTrack)}>
                    <div
                      className={cn('h-full rounded-full', barFill)}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>

                {item.inProfile ? (
                  <span
                    className={cn(
                      'shrink-0 rounded border px-2 py-1 text-[11px] font-medium',
                      secondaryBtn
                    )}
                  >
                    ✓ Matched
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onAddSkillToProfile(item.skill)}
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px]',
                      primaryBtn
                    )}
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 5: AUTO-APPLY QUEUE & SCREENING ANSWERS */}
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
  );
}

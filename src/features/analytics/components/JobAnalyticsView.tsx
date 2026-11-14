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
  Sparkles,
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
  const isDark = theme === 'dark';
  const cardSurface = isDark
    ? 'border-neutral-800 bg-neutral-950'
    : 'border-neutral-200 bg-white';
  const subSurface = isDark
    ? 'border-neutral-800 bg-black'
    : 'border-neutral-200 bg-neutral-50';
  const primaryBtn = isDark
    ? 'bg-white text-black hover:bg-neutral-200'
    : 'bg-black text-white hover:bg-neutral-800';
  const secondaryBtn = isDark
    ? 'border-neutral-800 bg-black text-neutral-200 hover:border-white hover:text-white'
    : 'border-neutral-300 bg-white text-neutral-800 hover:border-black hover:text-black';
  const mutedText = isDark ? 'text-neutral-400' : 'text-neutral-600';
  const barTrack = isDark ? 'bg-neutral-900' : 'bg-neutral-200';
  const barFill = isDark ? 'bg-white' : 'bg-black';

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

    // Work type breakdown
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

    // Role demand breakdown
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

    // Top requested skills across all active jobs
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
    { label: 'Auto-Apply Queued', count: stats.queuedJobs.length },
    { label: 'Saved', count: stats.savedCount },
    { label: 'Applied', count: stats.appliedCount },
    { label: 'Hidden', count: stats.hiddenCount },
  ];

  return (
    <div className="no-print space-y-5">
      {/* HEADER BAR */}
      <section className={cn('flex flex-wrap items-center justify-between gap-4 rounded-3xl border p-5', cardSurface)}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <h2 className="text-lg font-extrabold tracking-tight">
              Job Market &amp; Board Analytics
            </h2>
          </div>
          <p className={cn('text-xs', mutedText)}>
            Real-time job count breakdown across JobStreet, LinkedIn, and Indeed for{' '}
            <strong>{activeProfile.name}</strong> ({activeProfile.primaryRole}).
          </p>
        </div>

        <button
          type="button"
          disabled={scanning}
          onClick={onTriggerScan}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition disabled:opacity-60',
            primaryBtn
          )}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', scanning && 'animate-spin')} />
          {scanning ? 'Refreshing Boards...' : 'Refresh All Board Counts'}
        </button>
      </section>

      {/* SECTION 1: TOP SUMMARY KPIS */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={cn('rounded-2xl border p-4 space-y-1', cardSurface)}>
          <div className={cn('flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider', mutedText)}>
            <Layers className="h-3.5 w-3.5" />
            Total Active Jobs
          </div>
          <div className="text-3xl font-black tabular-nums">{stats.totalActive}</div>
          <p className={cn('text-[11px]', mutedText)}>
            Across JobStreet, LinkedIn &amp; Indeed
          </p>
        </div>

        <div className={cn('rounded-2xl border p-4 space-y-1', cardSurface)}>
          <div className={cn('flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider', mutedText)}>
            <Award className="h-3.5 w-3.5" />
            Applicable Exp Fit
          </div>
          <div className="text-3xl font-black tabular-nums">{stats.fitCount}</div>
          <p className={cn('text-[11px]', mutedText)}>
            {stats.totalActive > 0
              ? `${Math.round((stats.fitCount / stats.totalActive) * 100)}% of active listings match ${activeProfile.experienceLevel} level`
              : 'Run a scan to analyze fit'}
          </p>
        </div>

        <div className={cn('rounded-2xl border p-4 space-y-1', cardSurface)}>
          <div className={cn('flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider', mutedText)}>
            <Target className="h-3.5 w-3.5" />
            Average Match Score
          </div>
          <div className="text-3xl font-black tabular-nums">{stats.avgMatch}%</div>
          <p className={cn('text-[11px]', mutedText)}>
            Weighted by title, skills &amp; experience
          </p>
        </div>

        <div className={cn('rounded-2xl border p-4 space-y-1', cardSurface)}>
          <div className={cn('flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider', mutedText)}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            Pipeline Actions
          </div>
          <div className="text-3xl font-black tabular-nums">
            {stats.appliedCount + stats.savedCount + stats.queuedJobs.length}
          </div>
          <p className={cn('text-[11px]', mutedText)}>
            {stats.appliedCount} applied • {stats.savedCount} saved • {stats.queuedJobs.length} queued
          </p>
        </div>
      </section>

      {/* SECTION 2: JOBS PER BOARD (JOBSTREET / LINKEDIN / INDEED) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold uppercase tracking-wider">
            Jobs Available Per Job Board
          </h3>
          <span className={cn('text-xs', mutedText)}>
            Click any board to jump straight to its filtered listings
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.byBoard.map((board) => (
            <div
              key={board.source}
              className={cn(
                'flex flex-col justify-between gap-4 rounded-3xl border p-5',
                cardSurface
              )}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <BoardLogo source={board.source} theme={theme} size="md" />
                  <span className={cn('rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase', secondaryBtn)}>
                    {board.liveCount > 0 ? `${board.liveCount} Live` : board.status}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-4xl font-black tabular-nums">
                      {board.count}
                    </div>
                    <div className={cn('text-xs font-semibold', mutedText)}>
                      jobs on {board.label} ({board.sharePct}% share)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold tabular-nums">
                      {board.avgMatch}%
                    </div>
                    <div className={cn('text-[10px]', mutedText)}>avg match</div>
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
                      'w-full rounded-xl border p-3 text-left transition hover:opacity-85',
                      subSurface
                    )}
                  >
                    <div className={cn('text-[10px] font-bold uppercase tracking-wider', mutedText)}>
                      Top Match on {board.label} ({board.topJob.matchScore}%)
                    </div>
                    <div className="line-clamp-1 text-xs font-bold mt-0.5">
                      {board.topJob.title}
                    </div>
                    <div className={cn('line-clamp-1 text-[11px]', mutedText)}>
                      {board.topJob.company} • Exp: {board.topJob.experienceRequired}
                    </div>
                  </button>
                ) : (
                  <div className={cn('rounded-xl border border-dashed p-3 text-xs', subSurface, mutedText)}>
                    No jobs loaded yet for {board.label}.
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onSelectBoardFilter(board.source)}
                className={cn(
                  'inline-flex w-full items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition',
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
        {/* Experience Breakdown */}
        <div className={cn('space-y-4 rounded-3xl border p-5', cardSurface)}>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider">
              Experience Level Breakdown
            </h3>
          </div>

          <div className="space-y-3">
            {expRows.map((row) => (
              <div key={row.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">{row.label}</span>
                  <span className="font-extrabold tabular-nums">
                    {row.count} ({row.pct}%)
                  </span>
                </div>
                <div className={cn('h-2.5 w-full overflow-hidden rounded-full', barTrack)}>
                  <div
                    className={cn('h-full rounded-full transition-all', barFill)}
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-neutral-800/30 pt-3">
            <div className={cn('mb-2 text-[11px] font-bold uppercase tracking-wider', mutedText)}>
              Work Setup Distribution
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stats.workTypes.map((wt) => (
                <div key={wt.label} className={cn('rounded-xl border p-2.5', subSurface)}>
                  <div className="text-lg font-black tabular-nums">{wt.count}</div>
                  <div className={cn('text-[11px] font-semibold', mutedText)}>
                    {wt.label} ({wt.pct}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Role Demand + Application Pipeline Funnel */}
        <div className={cn('space-y-4 rounded-3xl border p-5', cardSurface)}>
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider">
              Role Demand &amp; Application Funnel
            </h3>
          </div>

          <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
            {stats.roleDemand.length === 0 ? (
              <p className={cn('text-xs', mutedText)}>
                Run a scan to see role demand counts.
              </p>
            ) : (
              stats.roleDemand.map((item) => (
                <div key={item.role} className={cn('rounded-xl border p-2.5 space-y-1', subSurface)}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold">{item.role}</span>
                    <span className="font-bold tabular-nums">
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

          <div className="border-t border-neutral-800/30 pt-3">
            <div className={cn('mb-2 text-[11px] font-bold uppercase tracking-wider', mutedText)}>
              Your Application Funnel
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {funnelRows.map((step) => (
                <div key={step.label} className={cn('rounded-xl border p-2 text-center', subSurface)}>
                  <div className="text-base font-black tabular-nums">{step.count}</div>
                  <div className={cn('text-[10px] font-semibold leading-tight', mutedText)}>
                    {step.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: TOP REQUESTED SKILLS VS YOUR PROFILE */}
      <section className={cn('space-y-4 rounded-3xl border p-5', cardSurface)}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider">
              Top 12 Most Requested Skills vs {activeProfile.name}&apos;s Resume
            </h3>
          </div>
          <span className={cn('text-xs', mutedText)}>
            Click &ldquo;+ Add Skill&rdquo; if you already know a missing market skill to rescore jobs instantly
          </span>
        </div>

        {stats.topSkills.length === 0 ? (
          <p className={cn('text-xs', mutedText)}>
            Scan jobs first to analyze requested skills across JobStreet, LinkedIn, and Indeed.
          </p>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {stats.topSkills.map((item) => (
              <div
                key={item.skill}
                className={cn(
                  'flex items-center justify-between gap-2 rounded-xl border p-3',
                  subSurface
                )}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-bold">{item.skill}</span>
                    <span className={cn('text-[11px] font-extrabold tabular-nums', mutedText)}>
                      {item.count} jobs ({item.pct}%)
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
                      'shrink-0 rounded-lg border px-2 py-1 text-[10px] font-bold',
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
                      'inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold',
                      primaryBtn
                    )}
                  >
                    <Plus className="h-3 w-3" />
                    Add Skill
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 5: AUTO-APPLY QUEUE & ARCHITECTURE BLUEPRINT */}
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

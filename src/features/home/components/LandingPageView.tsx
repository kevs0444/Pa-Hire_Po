'use client';

import Image from 'next/image';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  CheckCircle2,
  Download,
  FileText,
  Laptop,
  Settings,
  UserCircle2,
} from 'lucide-react';
import { JobSource, MonochromeTheme, UserProfile } from '@/types/job';
import { BoardLogo } from '@/components/ui/BrandLogos';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface LandingPageViewProps {
  theme: MonochromeTheme;
  onChangeTheme: (theme: MonochromeTheme) => void;
  activeProfile: UserProfile;
  totalJobsCount: number;
  applicableJobsCount: number;
  queuedCount: number;
  isDesktopApp: boolean;
  onNavigateTab: (
    tab: 'jobs' | 'applications' | 'analytics' | 'profile' | 'resume'
  ) => void;
  onSelectBoardAndLaunch: (board: JobSource) => void;
  onOpenSettingsSection: (section: 'personal' | 'salary' | 'roles' | 'desktop') => void;
}

const BOARD_SUMMARIES: {
  source: JobSource;
  coverage: string;
}[] = [
  {
    source: 'jobstreet',
    coverage: 'SEEK v5 API across PH, MY, SG, and ID with salary & seniority parsing.',
  },
  {
    source: 'linkedin',
    coverage: 'Guest search + job posting enrichment for regional and remote roles.',
  },
  {
    source: 'indeed',
    coverage: 'Regional Indeed listings synchronized into your local match score index.',
  },
];

export function LandingPageView({
  theme,
  activeProfile,
  totalJobsCount,
  applicableJobsCount,
  queuedCount,
  isDesktopApp,
  onNavigateTab,
  onSelectBoardAndLaunch,
  onOpenSettingsSection,
}: LandingPageViewProps) {
  const tokens = getThemeTokens(theme);

  return (
    <div className="no-print space-y-5 pb-8">
      {/* WORKSPACE OVERVIEW */}
      <section className={cn('rounded-lg border p-6', tokens.cardSurface)}>
        <div className="grid items-start gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border bg-white',
                  tokens.borderSubtle
                )}
              >
                <Image
                  src="/pa-hire-po-logo.jpg"
                  alt="Pa-Hire Po Logo"
                  fill
                  sizes="44px"
                  className="object-cover"
                  priority
                />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                  Pa-Hire Po Workspace
                </h2>
                <p className={cn('text-xs sm:text-sm', tokens.mutedText)}>
                  Active profile: <span className={cn('font-semibold', tokens.strongText)}>{activeProfile.name}</span> • {activeProfile.primaryRole} • {activeProfile.location}
                </p>
              </div>
            </div>

            <p className={cn('max-w-2xl text-sm leading-relaxed', tokens.mutedText)}>
              Search live postings across LinkedIn, JobStreet, and Indeed in a single two-column explorer, check experience and skill alignment against your profile, and tailor your dynamic resume (A4 default) with AI before submitting.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => onNavigateTab('jobs')}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs transition-colors',
                  tokens.primaryBtn
                )}
              >
                <Briefcase className="h-4 w-4" />
                Open Job Explorer
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('resume')}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition-colors',
                  tokens.secondaryBtn
                )}
              >
                <FileText className="h-4 w-4" />
                <span>Resume Studio</span>
                <span className="rounded border border-current/25 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase leading-none">
                  AI
                </span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('applications')}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition-colors',
                  tokens.secondaryBtn
                )}
              >
                <CheckCircle2 className="h-4 w-4" />
                Applied &amp; Resumes
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('profile')}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition-colors',
                  tokens.secondaryBtn
                )}
              >
                <UserCircle2 className="h-4 w-4" />
                Edit Profile
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('analytics')}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition-colors',
                  tokens.secondaryBtn
                )}
              >
                <BarChart3 className="h-4 w-4" />
                Market Analytics
              </button>
            </div>
          </div>

          {/* 3 Live Workspace Counters (Hairline Ledger Strip) */}
          <div
            className={cn(
              'grid grid-cols-3 divide-x overflow-hidden rounded-lg border lg:col-span-4',
              tokens.borderSubtle,
              tokens.subSurface
            )}
          >
            <button
              type="button"
              onClick={() => onNavigateTab('jobs')}
              className={cn(
                'p-4 text-left transition-colors',
                tokens.isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-white/75'
              )}
            >
              <div className="font-mono text-2xl font-semibold tabular-nums">
                {totalJobsCount}
              </div>
              <div className={cn('mt-0.5 text-xs font-medium', tokens.mutedText)}>
                Active Jobs
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('analytics')}
              className={cn(
                'p-4 text-left transition-colors',
                tokens.isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-white/75'
              )}
            >
              <div className="font-mono text-2xl font-semibold tabular-nums">
                {applicableJobsCount}
              </div>
              <div className={cn('mt-0.5 text-xs font-medium', tokens.mutedText)}>
                Level Fit
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('analytics')}
              className={cn(
                'p-4 text-left transition-colors',
                tokens.isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-white/75'
              )}
            >
              <div className="font-mono text-2xl font-semibold tabular-nums">
                {queuedCount}
              </div>
              <div className={cn('mt-0.5 text-xs font-medium', tokens.mutedText)}>
                In Queue
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* DIRECT BOARD LAUNCHERS (Unified Hairline Strip) */}
      <section className={cn('overflow-hidden rounded-lg border', tokens.cardSurface)}>
        <div className={cn('flex flex-wrap items-baseline justify-between gap-2 border-b px-5 py-3.5', tokens.borderSubtle)}>
          <h3 className="text-sm font-semibold">Connected Job Boards</h3>
          <span className={cn('text-xs', tokens.mutedText)}>
            Select a board to open filtered search results
          </span>
        </div>

        <div className={cn('grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0', tokens.borderSubtle)}>
          {BOARD_SUMMARIES.map((board) => (
            <button
              key={board.source}
              type="button"
              onClick={() => onSelectBoardAndLaunch(board.source)}
              className={cn(
                'flex flex-col justify-between gap-3 p-5 text-left transition-colors',
                tokens.isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-slate-50/75'
              )}
            >
              <div className="space-y-2">
                <BoardLogo source={board.source} theme={theme} size="md" />
                <p className={cn('text-xs leading-relaxed', tokens.mutedText)}>
                  {board.coverage}
                </p>
              </div>
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-semibold',
                  tokens.isDark ? 'text-zinc-200' : 'text-[#0a66c2]'
                )}
              >
                Browse listings <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* DESKTOP APP & SETTINGS SIDEPANEL CALLOUT */}
      <section className={cn('rounded-lg border p-5', tokens.cardSurface)}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Laptop className="h-4 w-4" />
              <h3 className="text-sm font-semibold">
                {isDesktopApp
                  ? 'Running in Pa-Hire Po Desktop App'
                  : 'Download the Pa-Hire Po Desktop App'}
              </h3>
            </div>
            <p className={cn('max-w-2xl text-xs leading-relaxed', tokens.mutedText)}>
              {isDesktopApp
                ? 'Your saved jobs, hidden filters, target roles, salary, and edited resumes sync automatically with your cloud workspace.'
                : 'Install Pa-Hire Po on your desktop for a dedicated taskbar window with automatic cloud sync for your jobs, target roles, salary preferences, and edited resumes.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenSettingsSection('roles')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                tokens.secondaryBtn
              )}
            >
              <Settings className="h-3.5 w-3.5" />
              Target Roles &amp; Salary
            </button>

            <button
              type="button"
              onClick={() => onOpenSettingsSection('desktop')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs transition-colors',
                tokens.primaryBtn
              )}
            >
              <Download className="h-3.5 w-3.5" />
              {isDesktopApp ? 'Desktop Setup Info' : 'Download & Setup App'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

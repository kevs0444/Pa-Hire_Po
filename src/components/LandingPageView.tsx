'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Check,
  Copy,
  FileText,
  Laptop,
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
  onNavigateTab: (tab: 'jobs' | 'analytics' | 'profile' | 'resume') => void;
  onSelectBoardAndLaunch: (board: JobSource) => void;
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

const DESKTOP_COMMANDS = [
  {
    id: 'exe-launcher',
    label: 'Taskbar / Desktop Launcher',
    cmd: '.\\Pa-Hire-Po.exe',
    note: 'Standalone Windows .exe with Pa-Hire Po mascot icon. Double-click or right-click to pin to your taskbar.',
  },
  {
    id: 'oneclick',
    label: '1-Click Local Desktop',
    cmd: 'npm run desktop:open',
    note: 'Starts the local server and opens the Electron desktop shell.',
  },
  {
    id: 'live',
    label: 'Live Hosted Desktop',
    cmd: 'npm run desktop:live',
    note: 'Connects Electron directly to the deployed Vercel app.',
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
}: LandingPageViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const tokens = getThemeTokens(theme);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
    } catch {
      // Clipboard blocked in non-HTTPS or sandboxed view
    }
  };

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

          {/* 3 Live Workspace Counters */}
          <div className={cn('grid grid-cols-3 gap-2.5 rounded-lg border p-4 lg:col-span-4', tokens.subSurface)}>
            <button
              type="button"
              onClick={() => onNavigateTab('jobs')}
              className={cn(
                'rounded-lg border p-3 text-left transition-colors',
                tokens.cardSurface
              )}
            >
              <div className="font-mono text-2xl font-semibold tabular-nums">
                {totalJobsCount}
              </div>
              <div className={cn('text-xs font-medium', tokens.mutedText)}>
                Active Jobs
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('analytics')}
              className={cn(
                'rounded-lg border p-3 text-left transition-colors',
                tokens.cardSurface
              )}
            >
              <div className="font-mono text-2xl font-semibold tabular-nums">
                {applicableJobsCount}
              </div>
              <div className={cn('text-xs font-medium', tokens.mutedText)}>
                Level Fit
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('analytics')}
              className={cn(
                'rounded-lg border p-3 text-left transition-colors',
                tokens.cardSurface
              )}
            >
              <div className="font-mono text-2xl font-semibold tabular-nums">
                {queuedCount}
              </div>
              <div className={cn('text-xs font-medium', tokens.mutedText)}>
                In Queue
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* DIRECT BOARD LAUNCHERS */}
      <section className={cn('rounded-lg border p-5 space-y-3', tokens.cardSurface)}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold">Connected Job Boards</h3>
          <span className={cn('text-xs', tokens.mutedText)}>
            Select a board to open filtered search results
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {BOARD_SUMMARIES.map((board) => (
            <button
              key={board.source}
              type="button"
              onClick={() => onSelectBoardAndLaunch(board.source)}
              className={cn(
                'flex flex-col justify-between gap-3 rounded-lg border p-4 text-left transition-colors',
                tokens.subSurface,
                tokens.isDark ? 'hover:border-slate-600' : 'hover:border-slate-400'
              )}
            >
              <div className="space-y-1.5">
                <BoardLogo source={board.source} theme={theme} size="md" />
                <p className={cn('text-xs leading-relaxed', tokens.mutedText)}>
                  {board.coverage}
                </p>
              </div>
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-semibold',
                  tokens.isDark ? 'text-zinc-200 hover:text-white' : 'text-[#0a66c2]'
                )}
              >
                Browse listings <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* DESKTOP CLI REFERENCE */}
      <section className={cn('rounded-lg border p-5 space-y-3', tokens.cardSurface)}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Laptop className="h-4 w-4" />
            <h3 className="text-sm font-semibold">Desktop Wrapper Commands</h3>
          </div>
          <span className={cn('text-xs font-medium', tokens.mutedText)}>
            {isDesktopApp ? 'Running inside Electron' : 'Viewing in Web Browser'}
          </span>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {DESKTOP_COMMANDS.map((item) => {
            const copied = copiedId === item.id;
            return (
              <div
                key={item.id}
                className={cn(
                  'flex flex-col justify-between gap-2.5 rounded-lg border p-3.5',
                  tokens.subSurface
                )}
              >
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold">{item.label}</div>
                  <div
                    className={cn(
                      'flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 font-mono text-xs',
                      tokens.cardSurface
                    )}
                  >
                    <code className="truncate">{item.cmd}</code>
                    <button
                      type="button"
                      onClick={() => void handleCopy(item.id, item.cmd)}
                      className={cn(
                        'inline-flex shrink-0 items-center gap-1 rounded border px-2 py-0.5 font-sans text-[11px] font-medium',
                        tokens.secondaryBtn
                      )}
                      title="Copy command"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <p className={cn('text-xs', tokens.mutedText)}>{item.note}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

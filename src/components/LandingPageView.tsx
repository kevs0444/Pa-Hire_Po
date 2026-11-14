'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  Award,
  BarChart3,
  Bot,
  Briefcase,
  Check,
  Copy,
  FileText,
  Flame,
  Laptop,
  Layers,
  Moon,
  RefreshCw,
  Rocket,
  Sparkles,
  Sun,
  Terminal,
  Trophy,
  UserCircle2,
  Wand2,
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

const FEATURE_PILLARS = [
  {
    icon: Layers,
    badge: '3-Board Engine',
    title: 'Live LinkedIn, JobStreet & Indeed Scraper',
    desc: 'Queries LinkedIn Guest API, JobStreet v5 SEEK API (PH/MY/SG/ID), and Indeed concurrently with automatic deduplication.',
  },
  {
    icon: Trophy,
    badge: '5s Auto-Refresh',
    title: 'Experience Extractor & Top 3 Choices',
    desc: 'Parses years of experience from every job, ranks your Top 3 Applicable Choices, and rotates adjacent Pivot roles every 5 seconds.',
  },
  {
    icon: Wand2,
    badge: 'Gemini 2.5 + Local',
    title: '2-Step Apply & A4 HTML Resume Studio',
    desc: 'Click Apply on any job to tailor your 1-page 210x297mm A4 resume on the spot and save a crisp PDF before submitting.',
  },
  {
    icon: UserCircle2,
    badge: '2-Way Sync',
    title: 'LinkedIn-Style Profile & Career Vault',
    desc: 'Edit experience, projects, certifications, education, and skills inline — every change updates your A4 resume and job scores instantly.',
  },
  {
    icon: BarChart3,
    badge: 'Market Intel',
    title: 'Job Board & Skill Gap Analytics',
    desc: 'Track job volume across JobStreet, LinkedIn, and Indeed, spot missing top market skills, and add known skills in 1 click.',
  },
  {
    icon: Bot,
    badge: 'Web + Electron',
    title: 'Desktop Co-Pilot & Auto-Apply Queue',
    desc: 'Save screening answers per user, queue your Top 3 matches, and run safely inside Chrome or the native Electron Desktop App.',
  },
];

const DESKTOP_COMMANDS = [
  {
    id: 'oneclick',
    label: 'Option 1 — 1-Click Local Desktop Window (Auto-starts server + Electron)',
    cmd: 'npm run desktop:open',
    note: 'Windows tip: you can also double-click open-desktop.bat in the project folder.',
  },
  {
    id: 'live',
    label: 'Option 2 — Open Desktop App Connected to Live Vercel Deployment',
    cmd: 'npm run desktop:live',
    note: 'Connects Electron directly to https://pa-hire-po.vercel.app without starting a local Next.js server.',
  },
  {
    id: 'twoterm',
    label: 'Option 3 — Manual 2-Terminal Developer Launch (First-time setup included)',
    cmd: 'npm run desktop:install && npm run desktop',
    note: 'Make sure npm run dev is running in another terminal on http://localhost:3000.',
  },
];

export function LandingPageView({
  theme,
  onChangeTheme,
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
    <div className="no-print space-y-6 pb-8">
      {/* HERO SECTION */}
      <section
        className={cn(
          'relative overflow-hidden rounded-3xl border p-6 sm:p-8 lg:p-10',
          tokens.cardSurface
        )}
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="relative grid items-center gap-8 lg:grid-cols-12">
          {/* Left Hero Copy */}
          <div className="space-y-5 lg:col-span-7">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider',
                  tokens.orangeBadge
                )}
              >
                <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                Web App + Electron Desktop Studio
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold',
                  tokens.secondaryBtn
                )}
              >
                <Laptop className="h-3.5 w-3.5 text-orange-500" />
                {isDesktopApp ? 'Running Inside Desktop App' : 'Browser & Desktop Ready'}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-orange-500/70 bg-white shadow-lg shadow-orange-500/20">
                  <Image
                    src="/pa-hire-po-logo.jpg"
                    alt="Pa-Hire Po Official Logo"
                    fill
                    sizes="64px"
                    className="object-cover"
                    priority
                  />
                </div>
                <div>
                  <div className="text-3xl font-black tracking-tight sm:text-4xl">
                    Pa-Hire <span className="text-orange-500">Po</span>
                  </div>
                  <p className={cn('text-xs font-semibold sm:text-sm', tokens.mutedText)}>
                    Your Friendly Multi-Board Job Finder &amp; A4 Resume Tailor
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                Find Better Roles.{' '}
                <span className="text-orange-500">Tailor Your A4 Resume</span>{' '}
                Before Every Click.
              </h2>
              <p className={cn('max-w-2xl text-sm leading-relaxed sm:text-base', tokens.mutedText)}>
                Pa-Hire Po combines a JobStreet-style 2-column explorer, a LinkedIn-inspired editable profile, live 5-second scraping across LinkedIn, JobStreet, and Indeed, and instant 1-page A4 resume tailoring — built in crisp Black, White, and Orange for both Web and Desktop.
              </p>
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigateTab('jobs')}
                className={cn(
                  'inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-extrabold transition',
                  tokens.primaryBtn
                )}
              >
                <Briefcase className="h-4 w-4" />
                Launch Job Finder Studio
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('resume')}
                className={cn(
                  'inline-flex items-center gap-2 rounded-2xl px-5 py-3.5 text-sm transition',
                  tokens.contrastBtn
                )}
              >
                <FileText className="h-4 w-4" />
                Open A4 Resume Studio
              </button>

              <a
                href="#desktop-app-guide"
                className={cn(
                  'inline-flex items-center gap-2 rounded-2xl border px-4 py-3.5 text-sm font-bold transition',
                  tokens.secondaryBtn
                )}
              >
                <Terminal className="h-4 w-4 text-orange-500" />
                How to Open Desktop App
              </a>
            </div>

            {/* Interactive 3-Color Theme Variant Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className={cn('text-xs font-bold uppercase tracking-wider', tokens.mutedText)}>
                3-Color Studio Mode:
              </span>
              <div className={cn('inline-flex rounded-xl border p-1', tokens.navTrack)}>
                {(
                  [
                    { id: 'dark', label: 'Black (Dark)', icon: Moon },
                    { id: 'light', label: 'White (Light)', icon: Sun },
                    { id: 'orange', label: 'Orange Studio', icon: Flame },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  const active = theme === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onChangeTheme(item.id)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition',
                        active ? tokens.primaryBtn : tokens.mutedText
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Live Workspace Snapshot */}
          <div className="lg:col-span-5">
            <div className={cn('space-y-4 rounded-3xl border p-5', tokens.subSurface)}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-orange-500" />
                  <span className="text-xs font-extrabold uppercase tracking-wider">
                    Live Workspace Snapshot
                  </span>
                </div>
                <span
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-[10px] font-bold',
                    tokens.orangeBadge
                  )}
                >
                  Active Profile Ready
                </span>
              </div>

              <div className={cn('rounded-2xl border p-3.5 space-y-1', tokens.cardSurface)}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-extrabold">{activeProfile.name}</span>
                  <span className="text-xs font-bold text-orange-500">
                    {activeProfile.experienceLevel.toUpperCase()}
                  </span>
                </div>
                <p className={cn('text-xs', tokens.mutedText)}>
                  Target: {activeProfile.primaryRole} • {activeProfile.location}
                </p>
              </div>

              {/* 3 KPI Tiles */}
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => onNavigateTab('jobs')}
                  className={cn(
                    'rounded-2xl border p-3 text-left transition hover:border-orange-500',
                    tokens.cardSurface
                  )}
                >
                  <div className="text-2xl font-black tabular-nums text-orange-500">
                    {totalJobsCount}
                  </div>
                  <div className={cn('text-[11px] font-semibold', tokens.mutedText)}>
                    Discovered Jobs
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('analytics')}
                  className={cn(
                    'rounded-2xl border p-3 text-left transition hover:border-orange-500',
                    tokens.cardSurface
                  )}
                >
                  <div className="text-2xl font-black tabular-nums">
                    {applicableJobsCount}
                  </div>
                  <div className={cn('text-[11px] font-semibold', tokens.mutedText)}>
                    Exp-Applicable
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('analytics')}
                  className={cn(
                    'rounded-2xl border p-3 text-left transition hover:border-orange-500',
                    tokens.cardSurface
                  )}
                >
                  <div className="text-2xl font-black tabular-nums">
                    {queuedCount}
                  </div>
                  <div className={cn('text-[11px] font-semibold', tokens.mutedText)}>
                    Queued Roles
                  </div>
                </button>
              </div>

              {/* Quick Board Launchers */}
              <div className="space-y-2">
                <div className={cn('text-[11px] font-bold uppercase tracking-wider', tokens.mutedText)}>
                  Jump Directly to a Job Board:
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['jobstreet', 'linkedin', 'indeed'] as JobSource[]).map((board) => (
                    <button
                      key={board}
                      type="button"
                      onClick={() => onSelectBoardAndLaunch(board)}
                      className={cn(
                        'flex items-center justify-center rounded-xl border py-2.5 px-2 transition',
                        tokens.secondaryBtn
                      )}
                    >
                      <BoardLogo source={board} theme={theme} size="sm" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6-PILLAR FEATURE SHOWCASE */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-orange-500" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider">
              Everything Built Into Pa-Hire Po
            </h3>
          </div>
          <span className={cn('text-xs', tokens.mutedText)}>
            Click any workflow card below to open that studio immediately
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {FEATURE_PILLARS.map((feat, idx) => {
            const Icon = feat.icon;
            const targetTab: 'jobs' | 'analytics' | 'profile' | 'resume' =
              idx === 2
                ? 'resume'
                : idx === 3
                  ? 'profile'
                  : idx >= 4
                    ? 'analytics'
                    : 'jobs';
            return (
              <button
                key={feat.title}
                type="button"
                onClick={() => onNavigateTab(targetTab)}
                className={cn(
                  'group flex flex-col justify-between gap-3 rounded-2xl border p-5 text-left transition hover:border-orange-500',
                  tokens.cardSurface
                )}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-xl border',
                        tokens.orangeBadge
                      )}
                    >
                      <Icon className="h-4 w-4 text-orange-500" />
                    </div>
                    <span
                      className={cn(
                        'rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                        tokens.orangeBadge
                      )}
                    >
                      {feat.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold group-hover:text-orange-500 transition">
                    {feat.title}
                  </h4>
                  <p className={cn('text-xs leading-relaxed', tokens.mutedText)}>
                    {feat.desc}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-500">
                  Open Studio <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* DESKTOP APP GUIDE SECTION */}
      <section
        id="desktop-app-guide"
        className={cn('space-y-4 rounded-3xl border p-6', tokens.cardSurface)}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Laptop className="h-5 w-5 text-orange-500" />
              <h3 className="text-base font-extrabold tracking-tight">
                How to Open the Electron Desktop App
              </h3>
            </div>
            <p className={cn('max-w-3xl text-xs leading-relaxed', tokens.mutedText)}>
              Pa-Hire Po runs identically in Chrome/Edge and inside a native desktop window via{' '}
              <code className="font-mono text-orange-500">electron/main.cjs</code>. Pick any launch option below on your Windows PC:
            </p>
          </div>

          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold',
              isDesktopApp ? tokens.primaryBtn : tokens.orangeBadge
            )}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {isDesktopApp ? 'Currently Inside Electron Desktop' : 'Currently Viewing in Web Browser'}
          </span>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {DESKTOP_COMMANDS.map((item) => {
            const copied = copiedId === item.id;
            return (
              <div
                key={item.id}
                className={cn('flex flex-col justify-between gap-3 rounded-2xl border p-4', tokens.subSurface)}
              >
                <div className="space-y-2">
                  <div className="text-xs font-extrabold">{item.label}</div>
                  <div
                    className={cn(
                      'flex items-center justify-between gap-2 rounded-xl border px-3 py-2 font-mono text-xs',
                      tokens.cardSurface
                    )}
                  >
                    <code className="truncate text-orange-500">{item.cmd}</code>
                    <button
                      type="button"
                      onClick={() => void handleCopy(item.id, item.cmd)}
                      className={cn(
                        'inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-sans font-bold',
                        tokens.secondaryBtn
                      )}
                      title="Copy command"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 text-orange-500" />
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
                <p className={cn('text-[11px] leading-relaxed', tokens.mutedText)}>
                  {item.note}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

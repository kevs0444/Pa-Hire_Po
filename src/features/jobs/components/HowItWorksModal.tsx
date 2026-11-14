'use client';

import {
  Award,
  Briefcase,
  Cpu,
  Layers,
  RefreshCw,
  Wand2,
  X,
} from 'lucide-react';
import { MonochromeTheme } from '@/types/job';
import { BoardLogo } from '@/components/ui/BrandLogos';
import { cn } from '@/lib/utils';

interface HowItWorksModalProps {
  isOpen: boolean;
  theme: MonochromeTheme;
  onClose: () => void;
}

export function HowItWorksModal({
  isOpen,
  theme,
  onClose,
}: HowItWorksModalProps) {
  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const modalSurface = isDark
    ? 'border-neutral-800 bg-black text-white'
    : 'border-neutral-200 bg-white text-black';
  const cardSurface = isDark
    ? 'border-neutral-800 bg-neutral-950'
    : 'border-neutral-200 bg-neutral-50';
  const mutedText = isDark ? 'text-neutral-400' : 'text-neutral-600';
  const primaryBtn = isDark
    ? 'bg-white text-black hover:bg-neutral-200'
    : 'bg-black text-white hover:bg-neutral-800';

  const steps = [
    {
      icon: Layers,
      title: '1. Live Multi-Board Scraping (LinkedIn, JobStreet & Indeed)',
      desc: 'When you run a search manually or on the 5-second Live Auto-Refresh, the server queries all three job boards in parallel: LinkedIn Guest Search + ts-jobspy, JobStreet v5 SEEK API (PH/MY/SG/ID), and Indeed via ts-jobspy. If any board rate-limits, it safely generates direct search shortcuts instead of crashing.',
    },
    {
      icon: RefreshCw,
      title: '2. 5-Second Live Auto-Refresh + Role Rotation',
      desc: 'When 5s Auto-Refresh is enabled, PleaseHireMe waits 5 seconds after each completed scan, rotates across your chosen role options + Dynamic Role Pivots, deduplicates listings, and merges new finds without disturbing the job you are currently reading.',
    },
    {
      icon: Award,
      title: '3. Experience Needed Extraction & Resume Scoring (0–100%)',
      desc: 'Every job posting is parsed for years of experience or seniority (e.g., Fresh Grad / Entry Level, 1–2 yrs, 3+ yrs, Senior). It compares the job title, description, work setup, and required skills against your LinkedIn Profile & Career Journey to compute a 0–100% score.',
    },
    {
      icon: Briefcase,
      title: '4. Top 3 Choices Spotlight',
      desc: 'PleaseHireMe filters out direct link fallbacks and senior-level mismatches that exceed your selected experience level, then ranks your Top 3 Most Applicable Jobs right at the top of the screen.',
    },
    {
      icon: Wand2,
      title: '5. Step-by-Step A4 Resume Tailoring Before You Apply',
      desc: 'Clicking "Apply for This Job" asks if you want to tailor your A4 Resume for that exact listing. Using either your Gemini API key or the built-in Smart Career Journey Tailor, it promotes your most relevant internships/projects (like LEAP AURA, XGBoost forecasting, or Denso Ten VBA automation), lets you save the 1-page A4 PDF, and marks the job Applied.',
    },
  ];

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div
        className={cn(
          'flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border shadow-2xl',
          modalSurface
        )}
      >
        <div
          className={cn(
            'flex items-center justify-between border-b px-6 py-4',
            isDark ? 'border-neutral-800' : 'border-neutral-200'
          )}
        >
          <div className="flex items-center gap-2.5">
            <Cpu className="h-5 w-5" />
            <div>
              <h2 className="text-base font-bold">
                How PleaseHireMe Finds &amp; Ranks Jobs
              </h2>
              <p className={cn('text-xs', mutedText)}>
                Transparent breakdown of the scraping, scoring, Top 3 choices, and A4 tailoring pipeline
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={cn(
              'rounded-xl border p-2',
              isDark ? 'border-neutral-800 hover:border-white' : 'border-neutral-300 hover:border-black'
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-6">
          <div className="flex flex-wrap items-center gap-4 pb-2">
            <BoardLogo source="linkedin" theme={theme} size="md" />
            <BoardLogo source="jobstreet" theme={theme} size="md" />
            <BoardLogo source="indeed" theme={theme} size="md" />
          </div>

          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className={cn('rounded-2xl border p-4 space-y-1.5', cardSurface)}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{s.title}</span>
                </div>
                <p className={cn('text-xs leading-relaxed', mutedText)}>
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>

        <div
          className={cn(
            'flex justify-end border-t px-6 py-3.5',
            isDark ? 'border-neutral-800' : 'border-neutral-200'
          )}
        >
          <button
            type="button"
            onClick={onClose}
            className={cn('rounded-xl px-4 py-2 text-xs font-bold', primaryBtn)}
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}

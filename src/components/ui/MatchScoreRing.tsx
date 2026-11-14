'use client';

import { MonochromeTheme } from '@/types/job';
import { cn } from '@/lib/utils';

interface MatchScoreRingProps {
  score: number;
  size?: number;
  theme?: MonochromeTheme;
}

export function MatchScoreRing({
  score,
  size = 56,
  theme = 'light',
}: MatchScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const strokeWidth = 4.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const isDark = theme === 'dark';

  const ringColor =
    clamped >= 75
      ? isDark
        ? 'text-emerald-400'
        : 'text-[#057642]'
      : clamped >= 55
        ? isDark
          ? 'text-blue-400'
          : 'text-[#0a66c2]'
        : isDark
          ? 'text-slate-500'
          : 'text-slate-400';

  const trackColor = isDark ? 'text-slate-800' : 'text-slate-200';
  const labelColor = isDark ? 'text-slate-100' : 'text-slate-900';

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      title={`${clamped}% resume match`}
      aria-label={`${clamped}% resume match`}
    >
      <svg className="-rotate-90" width={size} height={size} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={trackColor}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn('transition-all duration-300', ringColor)}
        />
      </svg>
      <span className={cn('absolute font-mono text-xs font-semibold tabular-nums', labelColor)}>
        {clamped}%
      </span>
    </div>
  );
}

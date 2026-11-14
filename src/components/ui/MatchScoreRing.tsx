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
  theme = 'dark',
}: MatchScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const strokeWidth = 4.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const isDark = theme === 'dark';

  const ringColor = isDark
    ? clamped >= 75
      ? 'text-white'
      : clamped >= 55
        ? 'text-neutral-400'
        : 'text-neutral-600'
    : clamped >= 75
      ? 'text-black'
      : clamped >= 55
        ? 'text-neutral-600'
        : 'text-neutral-400';

  const trackColor = isDark ? 'text-neutral-800' : 'text-neutral-200';
  const labelColor = isDark ? 'text-white' : 'text-black';

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      title={`${clamped}% resume match`}
    >
      <svg className="-rotate-90" width={size} height={size}>
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
          className={cn('transition-all duration-500', ringColor)}
        />
      </svg>
      <span className={cn('absolute text-xs font-bold tabular-nums', labelColor)}>
        {clamped}%
      </span>
    </div>
  );
}

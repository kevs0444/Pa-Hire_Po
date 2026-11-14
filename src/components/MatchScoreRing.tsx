'use client';

import { cn } from '@/lib/utils';

interface MatchScoreRingProps {
  score: number;
  size?: number;
}

export function MatchScoreRing({ score, size = 58 }: MatchScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const colorClass =
    clamped >= 78
      ? 'text-emerald-400'
      : clamped >= 58
        ? 'text-amber-400'
        : 'text-slate-400';

  const textClass =
    clamped >= 78
      ? 'text-emerald-300'
      : clamped >= 58
        ? 'text-amber-300'
        : 'text-slate-300';

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
          className="text-slate-800"
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
          className={cn('transition-all duration-500', colorClass)}
        />
      </svg>
      <span className={cn('absolute text-xs font-bold tabular-nums', textClass)}>
        {clamped}%
      </span>
    </div>
  );
}

'use client';

import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: number;
  thickness?: number;
  isDark?: boolean;
  label?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 18,
  thickness = 2.5,
  isDark = false,
  label = 'Loading',
  className,
}: LoadingSpinnerProps) {
  const style = {
    '--size': `${size}px`,
    '--thickness': `${thickness}px`,
    '--spinner-color': isDark ? '#60a5fa' : '#0a66c2',
    '--track-color': isDark ? '#1e293b' : '#cbd5e1',
  } as CSSProperties;

  return (
    <progress
      aria-label={label}
      className={cn('loading-spinner', className)}
      style={style}
    />
  );
}

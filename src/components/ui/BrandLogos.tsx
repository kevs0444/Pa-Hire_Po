'use client';

import { JobSource, MonochromeTheme } from '@/types/job';
import { cn } from '@/lib/utils';

interface BoardLogoProps {
  source: JobSource;
  theme?: MonochromeTheme;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function BoardLogo({
  source,
  theme = 'dark',
  size = 'sm',
  showLabel = true,
}: BoardLogoProps) {
  const isDark = theme === 'dark';

  const iconBoxSize =
    size === 'lg' ? 'h-7 w-7' : size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  const textSize =
    size === 'lg' ? 'text-sm' : size === 'md' ? 'text-xs' : 'text-[11px]';

  if (source === 'linkedin') {
    return (
      <span className="inline-flex items-center gap-1.5 font-bold">
        <svg
          viewBox="0 0 24 24"
          className={cn(iconBoxSize, 'shrink-0')}
          aria-hidden="true"
        >
          <rect
            width="24"
            height="24"
            rx="5"
            fill={isDark ? '#FFFFFF' : '#0A66C2'}
          />
          <path
            d="M7.1 9.8H4.6V19h2.5V9.8zM5.85 5.4a1.45 1.45 0 1 0 0 2.9 1.45 1.45 0 0 0 0-2.9zM19.4 13.7c0-2.7-1.4-4-3.4-4-1.5 0-2.3.8-2.7 1.4V9.8h-2.4V19h2.5v-4.9c0-1.3.3-2.5 1.9-2.5 1.5 0 1.6 1.4 1.6 2.6V19h2.5v-5.3z"
            fill={isDark ? '#000000' : '#FFFFFF'}
          />
        </svg>
        {showLabel && <span className={textSize}>LinkedIn</span>}
      </span>
    );
  }

  if (source === 'jobstreet') {
    return (
      <span className="inline-flex items-center gap-1.5 font-bold">
        <svg
          viewBox="0 0 24 24"
          className={cn(iconBoxSize, 'shrink-0')}
          aria-hidden="true"
        >
          <rect
            width="24"
            height="24"
            rx="5"
            fill={isDark ? '#FFFFFF' : '#111111'}
          />
          {/* JobStreet / SEEK signature ribbon + target mark */}
          <path
            d="M6.2 15.8c2.1-3.9 5.3-6.6 10.6-7.6l-2.3 3.7c-2.6.5-4.7 2-6.2 4.3l-2.1-.4z"
            fill={isDark ? '#000000' : '#FFFFFF'}
          />
          <circle
            cx="15.8"
            cy="7.3"
            r="2.1"
            fill={isDark ? '#000000' : '#FFFFFF'}
          />
          <path
            d="M11.2 17.4c1.6-2 3.8-3.2 6.8-3.5l-1.5 3.1c-1.8.2-3.4.9-4.6 2l-.7-1.6z"
            fill={isDark ? '#000000' : '#FFFFFF'}
          />
        </svg>
        {showLabel && <span className={textSize}>JobStreet</span>}
      </span>
    );
  }

  // Indeed
  return (
    <span className="inline-flex items-center gap-1.5 font-bold">
      <svg
        viewBox="0 0 24 24"
        className={cn(iconBoxSize, 'shrink-0')}
        aria-hidden="true"
      >
        <rect
          width="24"
          height="24"
          rx="5"
          fill={isDark ? '#FFFFFF' : '#003A9B'}
        />
        {/* Indeed signature curved i + floating dot */}
        <path
          d="M7.3 9.7c2.3-3.1 6.7-3.9 9.7-1.8"
          stroke={isDark ? '#000000' : '#FFFFFF'}
          strokeWidth="2.1"
          strokeLinecap="round"
          fill="none"
        />
        <circle
          cx="12.6"
          cy="10.2"
          r="1.5"
          fill={isDark ? '#000000' : '#FFFFFF'}
        />
        <rect
          x="11.3"
          y="12.7"
          width="2.6"
          height="6.4"
          rx="1.2"
          fill={isDark ? '#000000' : '#FFFFFF'}
        />
      </svg>
      {showLabel && <span className={textSize}>Indeed</span>}
    </span>
  );
}

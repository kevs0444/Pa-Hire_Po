'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import type { MonochromeTheme } from '@/types/job';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface CopyUrlButtonProps {
  url?: string | null;
  theme: MonochromeTheme;
  label?: string;
  copiedLabel?: string;
  compact?: boolean;
  className?: string;
}

export function CopyUrlButton({
  url,
  theme,
  label = 'Copy URL',
  copiedLabel = 'Copied',
  compact = false,
  className,
}: CopyUrlButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { secondaryBtn, badgeSuccess } = getThemeTokens(theme);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const cleanUrl = (url || '').trim();
  if (!cleanUrl || cleanUrl === '#') {
    return null;
  }

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    let success = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(cleanUrl);
        success = true;
      }
    } catch {
      success = false;
    }

    if (!success && typeof document !== 'undefined') {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = cleanUrl;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        document.body.appendChild(textarea);
        textarea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        success = false;
      }
    }

    if (success) {
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setCopied(false);
      }, 1800);
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => void handleCopy(e)}
      title={`Copy URL: ${cleanUrl}`}
      aria-label={`Copy URL for ${cleanUrl}`}
      className={cn(
        'civic-btn-motion inline-flex shrink-0 items-center transition-colors',
        compact
          ? 'gap-1 rounded border px-2 py-0.5 text-[11px] font-medium'
          : 'gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium',
        copied ? badgeSuccess : secondaryBtn,
        className
      )}
    >
      {copied ? (
        <Check
          key="copied-icon"
          className={cn(
            'civic-confirm-pop shrink-0',
            compact ? 'h-3 w-3' : 'h-3.5 w-3.5'
          )}
        />
      ) : (
        <Link2 className={cn('shrink-0', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      )}
      <span>{copied ? copiedLabel : label}</span>
    </button>
  );
}

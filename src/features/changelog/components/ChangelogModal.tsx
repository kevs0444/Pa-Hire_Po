'use client';

import { useId } from 'react';
import { Bell, X } from 'lucide-react';
import type { MonochromeTheme } from '@/types/job';
import {
  ChangelogTag,
  USER_CHANGELOG_RELEASES,
} from '@/features/changelog/data/changelog-data';
import { useNativeDialog } from '@/hooks/useNativeDialog';
import { getThemeTokens, ThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface ChangelogModalProps {
  isOpen: boolean;
  theme: MonochromeTheme;
  onClose: () => void;
}

function getTagTone(tag: ChangelogTag, tokens: ThemeTokens): string {
  if (tag === 'New') return tokens.badgeAccent;
  if (tag === 'Fixed') return tokens.badgeSuccess;
  return tokens.badgeNeutral;
}

export function ChangelogModal({
  isOpen,
  theme,
  onClose,
}: ChangelogModalProps) {
  const dialogRef = useNativeDialog(isOpen, onClose);
  const titleId = useId();
  const tokens = getThemeTokens(theme);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      {...({ closedby: 'any' } as Record<string, string>)}
      className={cn(
        'no-print m-auto w-[calc(100%-1.5rem)] max-w-2xl rounded-xl border p-0 shadow-xl',
        tokens.cardSurface
      )}
    >
      <div className="flex max-h-[88vh] flex-col overflow-hidden">
        <div
          className={cn(
            'flex items-center justify-between gap-3 border-b px-6 py-4',
            tokens.borderSubtle
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Bell className="h-4 w-4 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-bold tracking-tight">
                What is New in Pa-Hire Po
              </h2>
              <p className={cn('text-xs', tokens.mutedText)}>
                Release history from launch (v1.0.0) to today (v1.0.3)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className={cn(
              'civic-btn-motion shrink-0 rounded-lg border p-2 transition-colors',
              tokens.secondaryBtn
            )}
            aria-label="Close changelog"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          {USER_CHANGELOG_RELEASES.map((release, idx) => (
            <details
              key={release.version}
              open={idx === 0}
              className={cn(
                'rounded-lg border p-4',
                tokens.borderSubtle,
                tokens.subSurface
              )}
            >
              <summary className="cursor-pointer select-none">
                <span className="inline-flex flex-wrap items-center gap-2 align-middle">
                  <span
                    className={cn(
                      'rounded border px-2 py-0.5 font-mono text-xs font-semibold',
                      tokens.cardSurface
                    )}
                  >
                    {release.version}
                  </span>
                  {idx === 0 && (
                    <span
                      className={cn(
                        'rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold',
                        tokens.badgeSuccess
                      )}
                    >
                      ✓ Latest
                    </span>
                  )}
                  <span className={cn('font-mono text-xs', tokens.mutedText)}>
                    {release.date}
                  </span>
                </span>
                <div className="mt-1.5 text-sm font-bold leading-snug">
                  {release.headline}
                </div>
              </summary>

              <div className={cn('mt-3 divide-y border-t pt-2', tokens.borderSubtle)}>
                {release.items.map((item) => (
                  <div
                    key={item.title}
                    className="space-y-1 py-2.5 first:pt-1 last:pb-0"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'rounded border px-1.5 py-0.5 text-[11px] font-semibold',
                          getTagTone(item.tag, tokens)
                        )}
                      >
                        {item.tag}
                      </span>
                      <span className="text-xs font-semibold">{item.title}</span>
                    </div>
                    <p className={cn('text-xs leading-relaxed', tokens.mutedText)}>
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>

        <div
          className={cn(
            'flex items-center justify-between gap-3 border-t px-6 py-3',
            tokens.borderSubtle
          )}
        >
          <span className={cn('font-mono text-[11px]', tokens.mutedText)}>
            v1.0.0 → v1.0.3
          </span>
          <button
            type="button"
            autoFocus
            onClick={() => dialogRef.current?.close()}
            className={cn(
              'civic-btn-motion rounded-lg px-4 py-2 text-xs',
              tokens.primaryBtn
            )}
          >
            Got It
          </button>
        </div>
      </div>
    </dialog>
  );
}

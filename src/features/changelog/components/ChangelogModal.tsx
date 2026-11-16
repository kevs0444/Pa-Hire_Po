'use client';

import { useId } from 'react';
import { Bell, X } from 'lucide-react';
import type { MonochromeTheme } from '@/types/job';
import {
  ChangelogTag,
  USER_CHANGELOG_RELEASES,
} from '@/features/changelog/data/changelog-data';
import { useNativeDialog } from '@/hooks/useNativeDialog';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface ChangelogModalProps {
  isOpen: boolean;
  theme: MonochromeTheme;
  onClose: () => void;
}

function getTagTone(tag: ChangelogTag, isDark: boolean): string {
  if (tag === 'New') {
    return isDark
      ? 'border-blue-500/40 bg-blue-950/60 text-blue-300'
      : 'border-blue-200 bg-blue-50 text-[#0a66c2]';
  }
  if (tag === 'Fixed') {
    return isDark
      ? 'border-emerald-700/70 bg-emerald-950/60 text-emerald-300'
      : 'border-emerald-200 bg-emerald-50 text-emerald-800';
  }
  return isDark
    ? 'border-slate-700 bg-slate-800 text-slate-200'
    : 'border-slate-200 bg-slate-100 text-slate-700';
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
          <div className="flex items-center gap-2.5">
            <Bell className="h-4 w-4" />
            <div>
              <h2 id={titleId} className="text-base font-bold tracking-tight">
                What is New in Pa-Hire Po
              </h2>
              <p className={cn('text-xs', tokens.mutedText)}>
                Recent feature updates and improvements for your job search
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className={cn(
              'civic-btn-motion rounded-lg border p-2 transition-colors',
              tokens.secondaryBtn
            )}
            aria-label="Close changelog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {USER_CHANGELOG_RELEASES.map((release) => (
            <section
              key={release.version}
              className={cn(
                'rounded-lg border p-4 space-y-3',
                tokens.subSurface
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded border px-2 py-0.5 font-mono text-xs font-semibold',
                      tokens.cardSurface
                    )}
                  >
                    {release.version}
                  </span>
                  <h3 className="text-sm font-bold">{release.headline}</h3>
                </div>
                <span className={cn('font-mono text-xs', tokens.mutedText)}>
                  {release.date}
                </span>
              </div>

              <div className={cn('divide-y', tokens.borderSubtle)}>
                {release.items.map((item) => (
                  <div
                    key={item.title}
                    className="space-y-1 py-2.5 first:pt-1 last:pb-0"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'rounded border px-1.5 py-0.5 text-[11px] font-semibold',
                          getTagTone(item.tag, tokens.isDark)
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
            </section>
          ))}
        </div>

        <div
          className={cn(
            'flex justify-end border-t px-6 py-3',
            tokens.borderSubtle
          )}
        >
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

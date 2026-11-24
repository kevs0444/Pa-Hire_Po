'use client';

import { useEffect, useId, useRef } from 'react';
import { Heart, MapPin, Play, Plus, Trash2, X } from 'lucide-react';
import {
  COUNTRY_CONFIGS,
  MonochromeTheme,
  SavedJobSearch,
} from '@/types/job';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface SavedSearchesDialogProps {
  isOpen: boolean;
  theme: MonochromeTheme;
  savedSearches: SavedJobSearch[];
  currentQueryLabel: string;
  onClose: () => void;
  onSaveCurrentSearch: () => void;
  onRunSearch: (saved: SavedJobSearch) => void;
  onDeleteSearch: (id: string) => void;
}

export function SavedSearchesDialog({
  isOpen,
  theme,
  savedSearches,
  currentQueryLabel,
  onClose,
  onSaveCurrentSearch,
  onRunSearch,
  onDeleteSearch,
}: SavedSearchesDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tokens = getThemeTokens(theme);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.returnValue = '';
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      {...({ closedby: 'any' } as Record<string, string>)}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
      className="no-print m-auto w-[min(94dvw,520px)] rounded-xl border-0 bg-transparent p-0 shadow-2xl"
    >
      <div
        className={cn(
          'flex max-h-[85dvh] flex-col overflow-hidden rounded-xl border',
          tokens.cardSurface
        )}
      >
        <div
          className={cn(
            'flex items-center justify-between gap-3 border-b px-5 py-4',
            tokens.borderSubtle
          )}
        >
          <div className="flex items-center gap-2">
            <Heart className={cn('h-4 w-4', tokens.isDark ? 'text-zinc-200' : 'text-[#0a66c2]')} />
            <h2 id={titleId} className={cn('font-display text-base font-bold', tokens.strongText)}>
              Saved searches
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close saved searches"
            className={cn(
              'civic-touch-target rounded-lg p-1.5 transition-colors',
              tokens.mutedText,
              tokens.isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          <div
            className={cn(
              'flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3',
              tokens.subSurface
            )}
          >
            <div className="min-w-0 flex-1">
              <p className={cn('text-xs font-semibold', tokens.strongText)}>
                Current search query
              </p>
              <p className={cn('truncate text-xs', tokens.mutedText)}>
                {currentQueryLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={onSaveCurrentSearch}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors',
                tokens.primaryBtn
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Save current</span>
            </button>
          </div>

          {savedSearches.length === 0 ? (
            <div
              className={cn(
                'rounded-lg border border-dashed p-8 text-center text-xs',
                tokens.borderSubtle,
                tokens.mutedText
              )}
            >
              No saved searches yet. Save your current search above or click{' '}
              <strong className={tokens.strongText}>Save search</strong> under the search bar.
            </div>
          ) : (
            <div className={cn('divide-y rounded-lg border', tokens.borderSubtle)}>
              {savedSearches.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate text-sm font-semibold', tokens.strongText)}>
                      {item.label}
                    </p>
                    <p className={cn('mt-0.5 flex items-center gap-1.5 text-xs', tokens.mutedText)}>
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {item.location || COUNTRY_CONFIGS[item.country]?.label || item.country}
                      </span>
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onRunSearch(item);
                        onClose();
                      }}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs transition-colors',
                        tokens.primaryBtn
                      )}
                    >
                      <Play className="h-3 w-3" />
                      <span>Run</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSearch(item.id)}
                      aria-label={`Delete saved search ${item.label}`}
                      className={cn(
                        'inline-flex items-center justify-center rounded-lg border p-1.5 transition-colors',
                        tokens.secondaryBtn
                      )}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}

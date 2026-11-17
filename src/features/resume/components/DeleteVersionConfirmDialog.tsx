'use client';

import { useId, useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import type { MonochromeTheme } from '@/types/job';
import { useNativeDialog } from '@/hooks/useNativeDialog';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

export interface DeleteVersionConfirmDialogProps {
  isOpen: boolean;
  versionName: string;
  versionDetails?: string;
  theme: MonochromeTheme;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export function DeleteVersionConfirmDialog({
  isOpen,
  versionName,
  versionDetails,
  theme,
  onClose,
  onConfirm,
}: DeleteVersionConfirmDialogProps) {
  const dialogRef = useNativeDialog(isOpen, onClose);
  const titleId = useId();
  const descId = useId();
  const tokens = getThemeTokens(theme);
  const isDark = tokens.isDark;
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      dialogRef.current?.close();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descId}
      {...({ closedby: 'any' } as Record<string, string>)}
      className={cn(
        'm-auto w-[min(92vw,440px)] rounded-xl border p-0 shadow-2xl backdrop:bg-black/40',
        tokens.cardSurface
      )}
    >
      <div className="flex flex-col p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              'flex items-center gap-2.5',
              isDark ? 'text-red-400' : 'text-red-600'
            )}
          >
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
                isDark
                  ? 'border-red-900/60 bg-red-950/40'
                  : 'border-red-200 bg-red-50'
              )}
            >
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
            <h2 id={titleId} className={cn('text-sm font-bold', tokens.strongText)}>
              Delete Resume Version
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              dialogRef.current?.close();
              onClose();
            }}
            className={cn(
              'rounded-lg border p-1.5 transition-colors',
              tokens.secondaryBtn
            )}
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div id={descId} className={cn('space-y-2 text-xs', tokens.mutedText)}>
          <p>
            Are you sure you want to permanently delete this resume version?
          </p>
          <div
            className={cn(
              'rounded-lg border px-3 py-2 font-mono text-[11px]',
              tokens.subSurface
            )}
          >
            <div className={cn('truncate font-semibold', tokens.strongText)}>
              {versionName || 'Untitled Version'}
            </div>
            {versionDetails && (
              <div className={cn('mt-0.5 truncate', tokens.mutedText)}>
                {versionDetails}
              </div>
            )}
          </div>
          <p
            className={cn(
              'text-[11px] font-medium',
              isDark ? 'text-amber-300' : 'text-amber-800'
            )}
          >
            This action cannot be undone and will remove this snapshot from your version history.
          </p>
        </div>

        {/* Actions */}
        <div
          className={cn(
            'flex items-center justify-end gap-2 border-t pt-3',
            tokens.borderSubtle
          )}
        >
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => {
              dialogRef.current?.close();
              onClose();
            }}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
              tokens.secondaryBtn
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50',
              isDark
                ? 'bg-red-700 hover:bg-red-600'
                : 'bg-red-600 hover:bg-red-700'
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isDeleting ? 'Deleting...' : 'Delete Version'}
          </button>
        </div>
      </div>
    </dialog>
  );
}

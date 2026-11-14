'use client';

import { useEffect, useId, useRef } from 'react';
import { Award, Briefcase, Layers, RefreshCw, FileText, X } from 'lucide-react';
import { MonochromeTheme } from '@/types/job';
import { BoardLogo } from '@/components/ui/BrandLogos';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface HowItWorksModalProps {
  isOpen: boolean;
  theme: MonochromeTheme;
  onClose: () => void;
}

export function HowItWorksModal({
  isOpen,
  theme,
  onClose,
}: HowItWorksModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const tokens = getThemeTokens(theme);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleNativeClose = () => {
      dialog.returnValue = '';
      onClose();
    };
    dialog.addEventListener('close', handleNativeClose);

    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const outside = (e: PointerEvent) => {
        const r = dialog.getBoundingClientRect();
        return (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        );
      };
      let pressedOutside = false;
      const onPointerDown = (e: PointerEvent) => {
        pressedOutside = outside(e);
      };
      const onPointerUp = (e: PointerEvent) => {
        if (pressedOutside && outside(e)) {
          dialog.close();
        }
      };
      dialog.addEventListener('pointerdown', onPointerDown);
      dialog.addEventListener('pointerup', onPointerUp);
      return () => {
        dialog.removeEventListener('close', handleNativeClose);
        dialog.removeEventListener('pointerdown', onPointerDown);
        dialog.removeEventListener('pointerup', onPointerUp);
      };
    }

    return () => {
      dialog.removeEventListener('close', handleNativeClose);
    };
  }, [onClose]);

  const steps = [
    {
      icon: Layers,
      title: '1. Live Multi-Board Scraping (LinkedIn, JobStreet & Indeed)',
      desc: 'Queries all three boards in parallel: LinkedIn Guest Search + ts-jobspy, JobStreet v5 SEEK API (PH/MY/SG/ID), and Indeed via ts-jobspy. If any board rate-limits, direct search links are generated safely.',
    },
    {
      icon: RefreshCw,
      title: '2. Auto-Refresh & Role Rotation',
      desc: 'When auto-refresh is enabled, Pa-Hire Po waits for the interval to complete, rotates across your target roles and Pivot roles, deduplicates listings, and merges updates without interrupting your reading.',
    },
    {
      icon: Award,
      title: '3. Experience Extraction & Match Scoring (0–100%)',
      desc: 'Parses years of experience from each posting and compares title alignment, required skills, work setup, and resume text against your profile.',
    },
    {
      icon: Briefcase,
      title: '4. Recommended Top 3 Matches',
      desc: 'Filters out direct link fallbacks and senior-level mismatches exceeding your experience level, then highlights your top 3 matches at the top of Find Jobs.',
    },
    {
      icon: FileText,
      title: '5. Pre-Application Resume Studio (AI)',
      desc: 'Clicking Apply offers an instant step to tailor your dynamic resume (A4 default, or Letter/Legal/Dynamic Fit) using your personal Gemini API key with Smart Career Journey fallback, ready to print or save as PDF.',
    },
  ];

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      {...({ closedby: 'any' } as Record<string, string>)}
      className={cn(
        'no-print m-auto w-[calc(100%-1.5rem)] max-w-3xl rounded-xl border p-0 shadow-xl',
        tokens.cardSurface
      )}
    >
      <div className="flex max-h-[90vh] flex-col overflow-hidden">
        <div
          className={cn(
            'flex items-center justify-between border-b px-6 py-4',
            tokens.borderSubtle
          )}
        >
          <div>
            <h2 id={titleId} className="text-base font-semibold">
              How Pa-Hire Po Finds &amp; Ranks Jobs
            </h2>
            <p className={cn('text-xs', tokens.mutedText)}>
              Overview of the scraping, scoring, and A4 tailoring workflow
            </p>
          </div>

          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className={cn('rounded-lg border p-2 transition-colors', tokens.secondaryBtn)}
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className={cn('flex flex-wrap items-center gap-4 border-b pb-3', tokens.borderSubtle)}>
            <BoardLogo source="linkedin" theme={theme} size="md" />
            <BoardLogo source="jobstreet" theme={theme} size="md" />
            <BoardLogo source="indeed" theme={theme} size="md" />
          </div>

          <div className={cn('divide-y', tokens.borderSubtle)}>
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="space-y-1 py-3.5">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{s.title}</span>
                  </div>
                  <p className={cn('text-xs leading-relaxed', tokens.mutedText)}>
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
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
            className={cn('rounded-lg px-4 py-2 text-xs', tokens.primaryBtn)}
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}

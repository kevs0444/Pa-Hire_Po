'use client';

import { useId } from 'react';
import { FileText, Printer, X } from 'lucide-react';
import type { MonochromeTheme, StructuredResume } from '@/types/job';
import {
  ATS_FONT_PRESETS,
  DENSITY_PRESETS,
  PAGE_SIZE_PRESETS,
  ResumeSheetDocument,
} from '@/features/resume/components/A4ResumePreview';
import { useNativeDialog } from '@/hooks/useNativeDialog';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

export interface SubmittedResumeModalProps {
  isOpen: boolean;
  company: string;
  jobTitle: string;
  methodLabel: string;
  submittedAt?: string | null;
  resume: StructuredResume | null;
  baseResume: StructuredResume;
  theme: MonochromeTheme;
  onClose: () => void;
  onEditInStudio: (resume: StructuredResume) => void;
}

export function SubmittedResumeModal({
  isOpen,
  company,
  jobTitle,
  methodLabel,
  submittedAt,
  resume,
  baseResume,
  theme,
  onClose,
  onEditInStudio,
}: SubmittedResumeModalProps) {
  const dialogRef = useNativeDialog(isOpen, onClose);
  const titleId = useId();
  const tokens = getThemeTokens(theme);

  const fontKey = resume?.fontFamily || 'calibri';
  const sizeKey = resume?.pageSize || 'a4';
  const densityKey = resume?.density || 'standard';
  const fontPreset = ATS_FONT_PRESETS[fontKey] || ATS_FONT_PRESETS.calibri;
  const sizePreset = PAGE_SIZE_PRESETS[sizeKey] || PAGE_SIZE_PRESETS.a4;
  const densityPreset = DENSITY_PRESETS[densityKey] || DENSITY_PRESETS.standard;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      {...({ closedby: 'any' } as Record<string, string>)}
      className={cn(
        'm-auto w-[min(94vw,980px)] max-w-[94vw] rounded-xl border p-0 shadow-2xl print:max-w-none print:border-0 print:shadow-none',
        tokens.cardSurface
      )}
    >
      {resume && (
        <div className="flex max-h-[92vh] flex-col overflow-hidden print:max-h-none print:overflow-visible">
          <style>{`@media print { @page { size: ${sizePreset.printPageSize}; margin: 8mm; } #a4-resume-sheet { font-family: ${fontPreset.fontFamily} !important; font-variant-ligatures: none !important; } }`}</style>

          {/* Modal Header */}
          <div
            className={cn(
              'no-print flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5',
              tokens.borderSubtle
            )}
          >
            <div className="min-w-0 space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id={titleId} className="truncate text-sm font-bold">
                  {company} — {jobTitle}
                </h2>
                <span
                  className={cn(
                    'rounded border px-2 py-0.5 font-mono text-[11px] font-medium',
                    tokens.subSurface
                  )}
                >
                  {methodLabel}
                </span>
              </div>
              <p className={cn('text-xs', tokens.mutedText)}>
                Resume submitted for this application
                {submittedAt
                  ? ` • ${new Date(submittedAt).toLocaleString()}`
                  : ''}{' '}
                • {sizePreset.shortLabel} ({fontPreset.shortLabel})
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  dialogRef.current?.close();
                  onEditInStudio(resume);
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                  tokens.secondaryBtn
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                Edit in Studio
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors',
                  tokens.primaryBtn
                )}
              >
                <Printer className="h-3.5 w-3.5" />
                Print / Save PDF
              </button>

              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className={cn(
                  'rounded-lg border p-1.5 transition-colors',
                  tokens.secondaryBtn
                )}
                aria-label="Close resume preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Resume Sheet Body */}
          <div
            className={cn(
              'flex-1 overflow-y-auto p-4 sm:p-6 print:overflow-visible print:p-0',
              tokens.subSurface
            )}
          >
            <ResumeSheetDocument
              sheetId="a4-resume-sheet"
              variant="tailored"
              resume={resume}
              compareReference={baseResume}
              showSummary={Boolean(resume.tailoredSummary)}
              showHighlights={false}
              isTailored={Boolean(
                resume.tailorMethod && resume.tailorMethod !== 'base'
              )}
              editMode={false}
              className={cn(
                'mx-auto w-full bg-white text-black shadow-xl ring-1 ring-black/10',
                sizePreset.sheetClass,
                densityPreset.padClass,
                densityPreset.textClass
              )}
              style={{
                fontFamily: fontPreset.fontFamily,
                fontVariantLigatures: 'none',
              }}
            />
          </div>
        </div>
      )}
    </dialog>
  );
}

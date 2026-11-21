'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AlertTriangle, FileText, Minimize2, Printer, X } from 'lucide-react';
import type { MonochromeTheme, StructuredResume } from '@/types/job';
import {
  ATS_FONT_PRESETS,
  DENSITY_PRESETS,
  PAGE_SIZE_PRESETS,
  ResumeSheetDocument,
} from '@/features/resume/components/A4ResumePreview';
import {
  buildResumePrintStyles,
  computePrintLayoutSummary,
  resolveFitOnePage,
} from '@/features/resume/lib/resume-print';
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
  const sheetBodyRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [fitOverride, setFitOverride] = useState<{
    resumeRef: StructuredResume | null;
    value: boolean;
  } | null>(null);

  const fontKey = resume?.fontFamily || 'calibri';
  const sizeKey = resume?.pageSize || 'a4';
  const densityKey = resume?.density || 'standard';
  const fontPreset = ATS_FONT_PRESETS[fontKey] || ATS_FONT_PRESETS.calibri;
  const sizePreset = PAGE_SIZE_PRESETS[sizeKey] || PAGE_SIZE_PRESETS.a4;
  const densityPreset = DENSITY_PRESETS[densityKey] || DENSITY_PRESETS.standard;

  const defaultFitOnePage = resume ? resolveFitOnePage(resume) : true;
  const fitOnePage =
    fitOverride && fitOverride.resumeRef === resume
      ? fitOverride.value
      : defaultFitOnePage;

  useEffect(() => {
    if (!isOpen || !resume || typeof ResizeObserver === 'undefined') return;
    const container = sheetBodyRef.current;
    if (!container) return;
    const contentEl = container.querySelector<HTMLElement>(
      '[data-resume-content="true"]'
    );
    if (!contentEl) return;

    const obs = new ResizeObserver(() => {
      setContentHeight(contentEl.offsetHeight);
    });
    obs.observe(contentEl);
    return () => obs.disconnect();
  }, [isOpen, resume, sizeKey, densityKey, fontKey]);

  const printSummary = useMemo(
    () =>
      computePrintLayoutSummary({
        pageSize: sizeKey,
        density: densityKey,
        contentHeightPx: contentHeight,
        fitOnePage,
      }),
    [sizeKey, densityKey, contentHeight, fitOnePage]
  );

  const dynamicPrintCss = useMemo(
    () =>
      buildResumePrintStyles({
        pageSize: sizeKey,
        density: densityKey,
        fontFamily: fontPreset.fontFamily,
        fitScale: printSummary.fitScale,
      }),
    [sizeKey, densityKey, fontPreset.fontFamily, printSummary.fitScale]
  );

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
          <style>{dynamicPrintCss}</style>

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
                {sizeKey !== 'auto' && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums',
                      printSummary.outputPages > 1
                        ? tokens.isDark
                          ? 'border-amber-700/70 bg-amber-950/60 text-amber-200'
                          : 'border-amber-300 bg-amber-50 text-amber-900'
                        : printSummary.isScaledToFit
                          ? tokens.badgeAccent
                          : tokens.badgeSuccess
                    )}
                  >
                    {printSummary.outputPages > 1 ? (
                      <>
                        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                        <span>{printSummary.outputPages} Pages</span>
                      </>
                    ) : printSummary.isScaledToFit ? (
                      <span>✓ 1 Page (Fit {printSummary.fitPercent}%)</span>
                    ) : (
                      <span>✓ 1 Page</span>
                    )}
                  </span>
                )}
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
              {sizeKey !== 'auto' && (
                <button
                  type="button"
                  aria-pressed={fitOnePage}
                  onClick={() =>
                    setFitOverride({
                      resumeRef: resume,
                      value: !fitOnePage,
                    })
                  }
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                    fitOnePage
                      ? cn('border-transparent', tokens.primaryBtn)
                      : tokens.secondaryBtn
                  )}
                >
                  <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Fit 1 Page
                </button>
              )}

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
            ref={sheetBodyRef}
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

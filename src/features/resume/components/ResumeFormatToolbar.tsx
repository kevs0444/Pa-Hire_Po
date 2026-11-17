'use client';

import { useEffect, useRef } from 'react';
import {
  AlignJustify,
  AlignLeft,
  Bold,
  Bot,
  Check,
  Code,
  Edit3,
  History,
  Italic,
  KeyRound,
  Printer,
  RotateCcw,
  Save,
  Upload,
  UserCheck,
  ZoomIn,
} from 'lucide-react';
import type {
  JobListing,
  MonochromeTheme,
  ResumeDensity,
  ResumeFontFamily,
  ResumePageSize,
  StructuredResume,
  UserProfile,
} from '@/types/job';
import {
  ATS_FONT_PRESETS,
  DENSITY_PRESETS,
  PAGE_SIZE_PRESETS,
} from './A4ResumePreview';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

export type ResumeZoomLevel = 'fit' | '75' | '90' | '100' | '110';

export interface ResumeFormatToolbarProps {
  profile: UserProfile;
  activeResume: StructuredResume;
  activeTailorJob: JobListing | null;
  theme: MonochromeTheme;
  editMode: boolean;
  versionCount: number;
  zoomLevel: ResumeZoomLevel;
  tailoring: boolean;
  geminiApiKey: string;
  personalApiConfigured?: boolean;
  statusMessage?: string | null;
  onToggleEditMode: () => void;
  onSetZoomLevel: (zoom: ResumeZoomLevel) => void;
  onUpdateResume: (next: StructuredResume) => void;
  onOpenVersionsDrawer: () => void;
  onOpenUploadDialog?: () => void;
  onOpenSaveSnapshotBar: () => void;
  onApplyToProfile?: () => void;
  onTailorResume: (targetJob: JobListing | null, targetRole?: string) => void;
  onResetResume: () => void;
  onPrint: () => void;
  onToggleKeyInput: () => void;
  onWrapSelection?: (prefix: string, suffix: string) => void;
}

export function ResumeFormatToolbar({
  profile,
  activeResume,
  activeTailorJob,
  theme,
  editMode,
  versionCount,
  zoomLevel,
  tailoring,
  geminiApiKey,
  personalApiConfigured = false,
  statusMessage = null,
  onToggleEditMode,
  onSetZoomLevel,
  onUpdateResume,
  onOpenVersionsDrawer,
  onOpenUploadDialog,
  onOpenSaveSnapshotBar,
  onApplyToProfile,
  onTailorResume,
  onResetResume,
  onPrint,
  onToggleKeyInput,
  onWrapSelection,
}: ResumeFormatToolbarProps) {
  const tokens = getThemeTokens(theme);
  const isDark = tokens.isDark;
  const toolbarRef = useRef<HTMLDivElement>(null);

  const pageSize: ResumePageSize = activeResume.pageSize || 'a4';
  const density: ResumeDensity = activeResume.density || 'standard';
  const fontFamilyKey: ResumeFontFamily = activeResume.fontFamily || 'calibri';
  const textAlign: 'left' | 'justify' = activeResume.textAlign || 'left';
  const sizePreset = PAGE_SIZE_PRESETS[pageSize] || PAGE_SIZE_PRESETS.a4;
  const isTailored = Boolean(
    activeResume.tailorMethod && activeResume.tailorMethod !== 'base'
  );
  const aiReady = personalApiConfigured || Boolean(geminiApiKey.trim());

  const roleChoices = Array.from(
    new Set([
      profile.primaryRole,
      ...(profile.preferredRoles || []),
      ...(profile.customRoles || []),
    ])
  ).filter(Boolean);

  const selectedRole =
    activeResume.tailoredForJobTitle ||
    profile.primaryRole ||
    roleChoices[0] ||
    'Data Analyst';

  // Roving-tabindex keyboard fallback where native HTML `focusgroup` is unsupported
  useEffect(() => {
    const bar = toolbarRef.current;
    if (!bar || 'focusGroup' in HTMLElement.prototype) return;

    const getItems = () =>
      Array.from(
        bar.querySelectorAll<HTMLElement>('button, select')
      );

    const items = getItems();
    if (items.length === 0) return;

    const currentActive = items.find((el) => el.tabIndex === 0) || items[0];
    items.forEach((el) => {
      el.tabIndex = el === currentActive ? 0 : -1;
    });

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const currentItems = getItems();
      if (!currentItems.includes(target)) return;
      currentItems.forEach((el) => {
        el.tabIndex = el === target ? 0 : -1;
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentItems = getItems();
      const idx = currentItems.indexOf(document.activeElement as HTMLElement);
      if (idx === -1) return;

      const isRtl = getComputedStyle(bar).direction === 'rtl';
      let nextIdx: number | null = null;

      if (e.key === 'ArrowRight') {
        nextIdx = (idx + (isRtl ? -1 : 1) + currentItems.length) % currentItems.length;
      } else if (e.key === 'ArrowLeft') {
        nextIdx = (idx + (isRtl ? 1 : -1) + currentItems.length) % currentItems.length;
      } else if (e.key === 'Home') {
        nextIdx = 0;
      } else if (e.key === 'End') {
        nextIdx = currentItems.length - 1;
      }

      if (nextIdx !== null) {
        e.preventDefault();
        const nextEl = currentItems[nextIdx];
        currentItems.forEach((el) => {
          el.tabIndex = el === nextEl ? 0 : -1;
        });
        nextEl.focus();
      }
    };

    bar.addEventListener('focusin', handleFocusIn);
    bar.addEventListener('keydown', handleKeyDown);
    return () => {
      bar.removeEventListener('focusin', handleFocusIn);
      bar.removeEventListener('keydown', handleKeyDown);
    };
  }, [editMode, isTailored]);

  const headerBtnClass =
    'inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2';

  const groupWellClass = cn(
    'flex items-center gap-0.5 rounded-lg border p-0.5',
    tokens.subSurface
  );

  const formatBtnClass = cn(
    'inline-flex min-h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
    editMode
      ? cn(
          tokens.strongText,
          isDark ? 'hover:bg-zinc-700/80' : 'hover:bg-white hover:shadow-xs'
        )
      : cn(tokens.mutedText, 'opacity-55 cursor-not-allowed')
  );

  const alignBtnClass = (active: boolean) =>
    cn(
      'inline-flex min-h-7 items-center gap-1 rounded-md px-2.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
      active
        ? isDark
          ? 'bg-zinc-100 text-zinc-950 shadow-xs'
          : 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-300/80'
        : cn(
            tokens.mutedText,
            isDark ? 'hover:bg-zinc-700/60 hover:text-zinc-100' : 'hover:bg-white/70 hover:text-slate-900'
          )
    );

  const selectClass = cn(
    'h-8 rounded-lg border px-2.5 text-xs font-medium focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2',
    tokens.inputSurface
  );

  const optionClass = isDark
    ? 'bg-[#18181b] text-zinc-100'
    : 'bg-white text-slate-900';

  return (
    <div className="no-print space-y-1.5">
      <div
        className={cn(
          'rounded-lg border divide-y',
          tokens.cardSurface,
          tokens.borderSubtle
        )}
      >
        {/* Row 1: Civic Header, Document Status & Primary Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2.5">
          {/* Left branding & status pills */}
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <h2
              className={cn(
                'font-display text-sm sm:text-base font-bold tracking-tight',
                tokens.strongText
              )}
            >
              Resume Studio
            </h2>
            <span
              className={cn(
                'rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase leading-none',
                tokens.badgeAccent
              )}
            >
              AI
            </span>
            <span
              className={cn(
                'rounded border px-2 py-0.5 text-[11px] font-medium',
                activeResume.tailorMethod === 'gemini-ai'
                  ? tokens.badgeSuccess
                  : activeResume.tailorMethod === 'smart-engine'
                    ? tokens.badgeAccent
                    : tokens.badgeNeutral
              )}
            >
              {activeResume.versionName ? (
                <span className="max-w-[180px] truncate inline-block align-bottom">
                  {activeResume.versionName}
                </span>
              ) : activeResume.tailorMethod === 'gemini-ai' ? (
                'Personal Gemini AI'
              ) : activeResume.tailorMethod === 'smart-engine' ? (
                'Auto-Tailored'
              ) : (
                `Base ${sizePreset.shortLabel} CV`
              )}
            </span>

            <span
              className={cn(
                'rounded border px-2 py-0.5 font-mono text-[11px]',
                tokens.subSurface,
                tokens.mutedText
              )}
            >
              {sizePreset.shortLabel} •{' '}
              {ATS_FONT_PRESETS[fontFamilyKey]?.shortLabel || 'Calibri'} •{' '}
              {textAlign === 'justify' ? 'Justified' : 'Left Align'}
            </span>
          </div>

          {/* Right primary document action buttons (Uniform Civic Styling) */}
          <div className="flex flex-wrap items-center gap-1.5">
            {aiReady ? (
              <button
                type="button"
                onClick={onToggleKeyInput}
                className={cn(headerBtnClass, tokens.badgeSuccess)}
                title="Personal Gemini API key from .env is active"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{geminiApiKey ? 'Custom AI Key' : 'Personal AI Active'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onToggleKeyInput}
                className={cn(headerBtnClass, tokens.secondaryBtn)}
                title="Optional Gemini API Key override"
              >
                <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Gemini API</span>
              </button>
            )}

            {onOpenUploadDialog && (
              <button
                type="button"
                onClick={onOpenUploadDialog}
                className={cn(headerBtnClass, tokens.secondaryBtn)}
                title="Upload an existing PDF or Word (.docx) resume to extract and edit"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Import PDF / Word</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenVersionsDrawer}
              className={cn(headerBtnClass, tokens.secondaryBtn)}
              title="Browse, switch, rename, or delete saved resume versions"
            >
              <History className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Versions</span>
              <span
                className={cn(
                  'rounded-full border px-1.5 py-0.5 font-mono text-[10px] font-medium leading-none tabular-nums',
                  tokens.badgeNeutral
                )}
              >
                {versionCount}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenSaveSnapshotBar}
              className={cn(headerBtnClass, tokens.secondaryBtn)}
              title="Save current state as a new named version"
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Save Version</span>
            </button>

            <button
              type="button"
              aria-pressed={editMode}
              onClick={onToggleEditMode}
              className={cn(
                headerBtnClass,
                editMode ? tokens.primaryBtn : tokens.secondaryBtn,
                editMode && 'border-transparent'
              )}
              title={
                editMode
                  ? 'Finish inline editing'
                  : 'Edit all resume sections directly in-sheet'
              }
            >
              {editMode ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Done Editing</span>
                </>
              ) : (
                <>
                  <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Edit Resume</span>
                </>
              )}
            </button>

            {onApplyToProfile && (
              <button
                type="button"
                onClick={onApplyToProfile}
                className={cn(headerBtnClass, tokens.secondaryBtn)}
                title="Promote these edits to your master user profile"
              >
                <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Apply to Profile</span>
              </button>
            )}

            {isTailored && (
              <button
                type="button"
                onClick={onResetResume}
                className={cn(headerBtnClass, tokens.secondaryBtn)}
                title="Reset to base master profile"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reset</span>
              </button>
            )}

            <button
              type="button"
              onClick={onPrint}
              className={cn(headerBtnClass, 'border-transparent', tokens.primaryBtn)}
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Print / Save PDF ({sizePreset.shortLabel})</span>
            </button>
          </div>
        </div>

        {/* Row 2: Accessible Formatting & Page Layout Toolbar */}
        <div
          ref={toolbarRef}
          role="toolbar"
          aria-label="Resume Studio Formatting and Layout Tools"
          aria-controls="a4-resume-sheet"
          {...({ focusgroup: 'toolbar wrap' } as Record<string, string>)}
          className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2"
        >
          {/* Left Formatting Cluster */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Group 1: Text Styling */}
            <div role="group" aria-label="Text Formatting" className={groupWellClass}>
              <button
                type="button"
                aria-disabled={!editMode}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onWrapSelection?.('**', '**')}
                aria-label="Bold selected text"
                title={
                  editMode
                    ? 'Bold (**text**)'
                    : 'Enter Edit Resume mode to apply Bold (**text**)'
                }
                className={formatBtnClass}
              >
                <Bold className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-disabled={!editMode}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onWrapSelection?.('*', '*')}
                aria-label="Italicize selected text"
                title={
                  editMode
                    ? 'Italic (*text*)'
                    : 'Enter Edit Resume mode to apply Italic (*text*)'
                }
                className={formatBtnClass}
              >
                <Italic className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-disabled={!editMode}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onWrapSelection?.('`', '`')}
                aria-label="Wrap as tool or code tag"
                title={
                  editMode
                    ? 'Tool / Tech Tag (`tool`)'
                    : 'Enter Edit Resume mode to apply Tool Tag (`tool`)'
                }
                className={formatBtnClass}
              >
                <Code className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            <span
              role="separator"
              aria-orientation="vertical"
              className={cn('h-5 border-l', tokens.borderSubtle)}
            />

            {/* Group 2: Text Alignment */}
            <div role="group" aria-label="Text Alignment" className={groupWellClass}>
              <button
                type="button"
                onClick={() =>
                  onUpdateResume({
                    ...activeResume,
                    textAlign: 'left',
                  })
                }
                aria-pressed={textAlign === 'left'}
                aria-label="Align Left"
                title="Align Left (Standard ATS with ragged right)"
                className={alignBtnClass(textAlign === 'left')}
              >
                <AlignLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Left</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onUpdateResume({
                    ...activeResume,
                    textAlign: 'justify',
                  })
                }
                aria-pressed={textAlign === 'justify'}
                aria-label="Justify text"
                title="Justify (Flush margins for balanced typography)"
                className={alignBtnClass(textAlign === 'justify')}
              >
                <AlignJustify className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Justify</span>
              </button>
            </div>

            <span
              role="separator"
              aria-orientation="vertical"
              className={cn('h-5 border-l', tokens.borderSubtle)}
            />

            {/* Group 3: Typography & Page Presets */}
            <div
              role="group"
              aria-label="Typography and Page Presets"
              className="flex flex-wrap items-center gap-1.5"
            >
              <select
                value={fontFamilyKey}
                onChange={(e) =>
                  onUpdateResume({
                    ...activeResume,
                    fontFamily: e.target.value as ResumeFontFamily,
                  })
                }
                aria-label="ATS Resume Font Family"
                className={selectClass}
              >
                {(Object.keys(ATS_FONT_PRESETS) as ResumeFontFamily[]).map((key) => (
                  <option key={key} value={key} className={optionClass}>
                    Font: {ATS_FONT_PRESETS[key].shortLabel}
                  </option>
                ))}
              </select>

              <select
                value={pageSize}
                onChange={(e) =>
                  onUpdateResume({
                    ...activeResume,
                    pageSize: e.target.value as ResumePageSize,
                  })
                }
                aria-label="Resume Page Size"
                className={selectClass}
              >
                {(Object.keys(PAGE_SIZE_PRESETS) as ResumePageSize[]).map((key) => (
                  <option key={key} value={key} className={optionClass}>
                    Size: {PAGE_SIZE_PRESETS[key].shortLabel}
                  </option>
                ))}
              </select>

              <select
                value={density}
                onChange={(e) =>
                  onUpdateResume({
                    ...activeResume,
                    density: e.target.value as ResumeDensity,
                  })
                }
                aria-label="Resume Spacing Density"
                className={selectClass}
              >
                {(Object.keys(DENSITY_PRESETS) as ResumeDensity[]).map((key) => (
                  <option key={key} value={key} className={optionClass}>
                    Density: {DENSITY_PRESETS[key].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Cluster: Screen Zoom & AI Tailor */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div
              role="group"
              aria-label="Screen Zoom and Fit"
              className={cn(
                'flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs',
                tokens.inputSurface
              )}
            >
              <ZoomIn
                className={cn('h-3.5 w-3.5 shrink-0', tokens.mutedText)}
                aria-hidden="true"
              />
              <span className={cn('text-[11px] font-medium', tokens.mutedText)}>
                Zoom:
              </span>
              <select
                value={zoomLevel}
                onChange={(e) => onSetZoomLevel(e.target.value as ResumeZoomLevel)}
                aria-label="Resume Viewport Zoom"
                className={cn(
                  'bg-transparent text-xs font-semibold focus:outline-none cursor-pointer',
                  tokens.strongText
                )}
              >
                <option value="fit" className={optionClass}>
                  Fit Screen (Auto)
                </option>
                <option value="75" className={optionClass}>
                  75% (Compact)
                </option>
                <option value="90" className={optionClass}>
                  90% (Readable)
                </option>
                <option value="100" className={optionClass}>
                  100% (Actual A4)
                </option>
                <option value="110" className={optionClass}>
                  110% (Large)
                </option>
              </select>
            </div>

            <button
              type="button"
              aria-disabled={tailoring}
              onClick={() => {
                if (!tailoring) {
                  onTailorResume(activeTailorJob, selectedRole);
                }
              }}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
                tokens.contrastBtn,
                tailoring && 'opacity-55 cursor-not-allowed'
              )}
            >
              <Bot className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{tailoring ? 'Tailoring...' : 'AI Tailor'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Region & Contextual Formatting Feedback */}
      <p
        role="status"
        aria-live="polite"
        className={statusMessage ? cn('text-xs font-medium px-1', tokens.mutedText) : 'sr-only'}
      >
        {statusMessage || ''}
      </p>
    </div>
  );
}

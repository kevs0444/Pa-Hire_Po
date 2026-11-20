'use client';

import {
  CSSProperties,
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ChevronDown,
  ChevronUp,
  Columns2,
  Eye,
  Plus,
  Trash2,
} from 'lucide-react';
import type {
  JobListing,
  MonochromeTheme,
  ResumeDensity,
  ResumeFontFamily,
  ResumePageSize,
  ResumeSkillCategory,
  StructuredResume,
  TailoredResumeRecord,
  UserProfile,
} from '@/types/job';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';
import {
  ResumeFormatToolbar,
  ResumeZoomLevel,
} from './ResumeFormatToolbar';
import {
  ResumeLinksEditor,
  ValidatedUrlInput,
} from './ResumeLinksEditor';
import { ResumeVersionsDrawer } from './ResumeVersionsDrawer';
import {
  ResumeUploadDialog,
  type ResumeUploadConfirmOptions,
} from './ResumeUploadDialog';
import {
  applyHeaderLinksToResume,
  getEffectiveHeaderLinks,
  inferLinkKind,
  normalizeHttpUrl,
  resolveEmailHref,
  resolveResumeHeaderLink,
  shiftCertificationUrlsOnDelete,
} from '@/features/resume/lib/resume-links';
import type { ParsedResumePayload } from '@/features/resume/lib/resume-parser';

export interface A4ResumePreviewProps {
  profile: UserProfile;
  activeResume: StructuredResume;
  activeTailorJob: JobListing | null;
  theme: MonochromeTheme;
  geminiApiKey: string;
  personalApiConfigured?: boolean;
  tailoring: boolean;
  resumeRecords?: TailoredResumeRecord[];
  onUpdateGeminiKey: (key: string) => void;
  onTailorResume: (targetJob: JobListing | null, targetRole?: string) => void;
  onUpdateResume: (next: StructuredResume) => void;
  onResetResume: () => void;
  onApplyToProfile?: (resume: StructuredResume) => void;
  onSelectResumeVersion?: (resume: StructuredResume) => void;
  onUpdateResumeRecord?: (
    id: string,
    patch: {
      versionName?: string | null;
      company?: string;
      jobTitle?: string;
      notes?: string;
    }
  ) => Promise<void>;
  onDeleteResumeRecord?: (id: string) => Promise<void>;
  onSaveSnapshot?: (params: {
    company: string | null;
    jobTitle: string;
    jobId: string | null;
    versionName?: string;
    resume: StructuredResume;
    isSent: boolean;
    notes: string;
    syncToProfile?: boolean;
  }) => Promise<void> | void;
  onImportResume?: (
    parsed: ParsedResumePayload,
    options: ResumeUploadConfirmOptions
  ) => Promise<void> | void;
}

export const ATS_FONT_PRESETS: Record<
  ResumeFontFamily,
  {
    label: string;
    dropdownLabel: string;
    shortLabel: string;
    category: string;
    fontFamily: string;
    atsNote: string;
  }
> = {
  calibri: {
    label: 'Calibri ★ Best for ATS (#1 Default)',
    dropdownLabel: 'Font: Calibri ★ Best for ATS (#1 Default)',
    shortLabel: 'Calibri',
    category: 'Best for ATS',
    fontFamily: "Calibri, 'Segoe UI', Carlito, sans-serif",
    atsNote:
      '★ Best for ATS (#1 Modern & AI Standard): Highest OCR & token accuracy in Workday, Greenhouse, Lever & Taleo',
  },
  helvetica: {
    label: 'Helvetica (#2 Best for Tech & Engineering ATS)',
    dropdownLabel: 'Font: Helvetica (#2 Tech & Eng ATS)',
    shortLabel: 'Helvetica',
    category: 'Tech ATS Sans',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    atsNote:
      'Crisp geometric parsing in PDFBox, Textkernel & engineering hiring portals',
  },
  arial: {
    label: 'Arial (#3 Universal Legacy ATS Safe)',
    dropdownLabel: 'Font: Arial (#3 Universal Legacy ATS)',
    shortLabel: 'Arial',
    category: 'Legacy Safe Sans',
    fontFamily: "Arial, 'Liberation Sans', sans-serif",
    atsNote:
      'Zero-failure character recognition across all older corporate ATS parsers',
  },
  garamond: {
    label: 'Garamond (#4 Researcher & Compact 1-Page ATS)',
    dropdownLabel: 'Font: Garamond (#4 Researcher 1-Page)',
    shortLabel: 'Garamond',
    category: 'Research Serif',
    fontFamily: "Garamond, 'EB Garamond', 'Times New Roman', serif",
    atsNote:
      'High text density to fit extensive publications & technical CVs cleanly onto 1 page',
  },
  georgia: {
    label: 'Georgia (#5 High-Contrast Screen & ATS Serif)',
    dropdownLabel: 'Font: Georgia (#5 Screen & ATS Serif)',
    shortLabel: 'Georgia',
    category: 'Editorial Serif',
    fontFamily: "Georgia, Cambria, 'Times New Roman', serif",
    atsNote:
      'High legibility on both recruiter screens and ATS document scanners',
  },
  cambria: {
    label: 'Cambria (#6 Executive & Word ATS Serif)',
    dropdownLabel: 'Font: Cambria (#6 Executive Word ATS)',
    shortLabel: 'Cambria',
    category: 'Office ATS Serif',
    fontFamily: "Cambria, Georgia, 'Times New Roman', serif",
    atsNote:
      'Designed by Microsoft for crisp Word-to-PDF rendering and clear proportions',
  },
  times: {
    label: 'Times New Roman (#7 Classic Academic & Gov ATS)',
    dropdownLabel: 'Font: Times New Roman (#7 Classic Academic)',
    shortLabel: 'Times New Roman',
    category: 'Classic Standard',
    fontFamily: "'Times New Roman', Times, Georgia, serif",
    atsNote:
      'Traditional academic, legal, and government CV standard supported everywhere',
  },
};

export const PAGE_SIZE_PRESETS: Record<
  ResumePageSize,
  {
    label: string;
    shortLabel: string;
    sheetClass: string;
    printPageSize: string;
    dimensionsLabel: string;
  }
> = {
  a4: {
    label: 'A4 (Default • 210 × 297 mm)',
    shortLabel: 'A4',
    sheetClass: 'max-w-[794px] min-h-[1040px] h-auto',
    printPageSize: 'A4 portrait',
    dimensionsLabel: '210 × 297 mm',
  },
  letter: {
    label: 'US Letter (8.5 × 11 in)',
    shortLabel: 'Letter',
    sheetClass: 'max-w-[816px] min-h-[1056px] h-auto',
    printPageSize: 'letter portrait',
    dimensionsLabel: '8.5 × 11 in',
  },
  legal: {
    label: 'US Legal (8.5 × 14 in)',
    shortLabel: 'Legal',
    sheetClass: 'max-w-[816px] min-h-[1344px] h-auto',
    printPageSize: 'legal portrait',
    dimensionsLabel: '8.5 × 14 in',
  },
  auto: {
    label: 'Dynamic (Auto Fit Content)',
    shortLabel: 'Dynamic',
    sheetClass: 'max-w-[794px] min-h-0 h-auto',
    printPageSize: 'A4 portrait',
    dimensionsLabel: 'Fluid height',
  },
};

export const DENSITY_PRESETS: Record<
  ResumeDensity,
  { label: string; textClass: string; padClass: string }
> = {
  compact: {
    label: 'Compact',
    textClass: 'text-[10.2px] leading-[1.28]',
    padClass: 'px-6 py-5',
  },
  standard: {
    label: 'Standard',
    textClass: 'text-[11px] leading-[1.35]',
    padClass: 'px-7 py-6',
  },
  comfortable: {
    label: 'Comfortable',
    textClass: 'text-[11.5px] leading-[1.42]',
    padClass: 'px-8 py-7',
  },
};

function renderFormattedLine(text: string, highlightKeywords = false) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong
          key={idx}
          className={cn(
            'font-semibold text-black',
            highlightKeywords &&
              'rounded bg-emerald-100/85 px-0.5 print:bg-transparent print:px-0'
          )}
        >
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className="italic text-neutral-800">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className="rounded bg-neutral-100 px-1 font-mono text-[0.92em] text-neutral-900"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={idx}>{part}</Fragment>;
  });
}

type EditableFieldFocusHandler = (
  element: HTMLInputElement | HTMLTextAreaElement,
  applyValue: (nextValue: string) => void
) => void;

interface ResumeSheetDocumentProps {
  sheetId?: string;
  variant: 'tailored' | 'base';
  resume: StructuredResume;
  compareReference: StructuredResume;
  showSummary: boolean;
  showHighlights: boolean;
  isTailored: boolean;
  editMode: boolean;
  className?: string;
  style?: CSSProperties;
  onUpdateResume?: (next: StructuredResume) => void;
  onFocusEditableField?: EditableFieldFocusHandler;
}

export function ResumeSheetDocument({
  sheetId,
  variant,
  resume,
  compareReference,
  showSummary,
  showHighlights,
  isTailored,
  editMode,
  className,
  style,
  onUpdateResume,
  onFocusEditableField,
}: ResumeSheetDocumentProps) {
  const resumeRef = useRef(resume);
  useEffect(() => {
    resumeRef.current = resume;
  }, [resume]);

  const highlightActive = isTailored && showHighlights;
  const isTailoredVariant = variant === 'tailored';
  const canEdit = isTailoredVariant && editMode && Boolean(onUpdateResume);
  const isJustified = resume.textAlign === 'justify';
  const textAlignClass = isJustified
    ? 'text-justify [hyphens:none] [word-break:normal] [overflow-wrap:break-word] [text-justify:inter-word] [text-wrap:pretty] [text-align-last:left]'
    : 'text-left [hyphens:none]';

  const sheetInputClass =
    'rounded border border-neutral-300 bg-white px-1.5 py-0.5 text-neutral-900 placeholder:text-neutral-400 focus:border-[#0a66c2] focus:outline-none';
  const sectionAddBtnClass =
    'no-print inline-flex items-center gap-1 rounded border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-[9.5px] font-semibold text-neutral-900 transition-colors hover:bg-neutral-200';
  const bulletAddBtnClass =
    'no-print mt-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9.5px] font-semibold text-[#0a66c2] transition-colors hover:bg-blue-50 hover:text-[#004182]';

  const registerFocus = (
    el: HTMLInputElement | HTMLTextAreaElement,
    updater: (latest: StructuredResume, nextValue: string) => StructuredResume
  ) => {
    if (!onFocusEditableField || !onUpdateResume) return;
    onFocusEditableField(el, (nextValue: string) => {
      onUpdateResume(updater(resumeRef.current, nextValue));
    });
  };

  const refSets = useMemo(() => {
    const expBullets = new Set(
      compareReference.experience.flatMap((e) =>
        e.bullets.map((b) => b.trim())
      )
    );
    const projBullets = new Set(
      compareReference.projects.flatMap((p) =>
        p.bullets.map((b) => b.trim())
      )
    );
    const skillMap = new Map(
      compareReference.skillCategories.map((c) => [
        c.category.trim().toLowerCase(),
        c.items.trim(),
      ])
    );
    const expOrder = new Map(
      compareReference.experience.map((e, i) => [
        e.id || e.role.trim().toLowerCase(),
        i,
      ])
    );
    const projOrder = new Map(
      compareReference.projects.map((p, i) => [
        p.id || p.name.trim().toLowerCase(),
        i,
      ])
    );
    return { expBullets, projBullets, skillMap, expOrder, projOrder };
  }, [compareReference]);

  const headlineChanged =
    highlightActive &&
    resume.targetHeadline.trim() !== compareReference.targetHeadline.trim();

  const summaryChanged =
    highlightActive &&
    Boolean(
      resume.tailoredSummary &&
        resume.tailoredSummary.trim() !==
          (compareReference.tailoredSummary || '').trim()
    );

  const changedBoxClass = isTailoredVariant
    ? 'rounded-r border-l-2 border-[#057642] bg-emerald-50/75 pl-1.5 py-0.5 print:rounded-none print:border-none print:bg-transparent print:p-0'
    : 'rounded-r border-l-2 border-amber-500 bg-amber-50/80 pl-1.5 py-0.5';

  return (
    <div
      id={sheetId}
      className={className}
      style={{ ...style, colorScheme: 'only light' }}
    >
      {/* HEADER / CONTACT INFO */}
      <header className="text-center">
        {canEdit && onUpdateResume ? (
          <div className="space-y-1.5 rounded-lg border border-dashed border-neutral-300 bg-neutral-50/70 p-2 print:border-none print:bg-transparent print:p-0">
            <input
              type="text"
              value={resume.fullName}
              onFocus={(e) =>
                registerFocus(e.currentTarget, (latest, val) => ({
                  ...latest,
                  fullName: val,
                }))
              }
              onChange={(e) =>
                onUpdateResume({ ...resume, fullName: e.target.value })
              }
              placeholder="Full Name"
              className="w-full border-b border-neutral-300 bg-white px-2 py-1 text-center text-xl font-extrabold tracking-tight text-black uppercase placeholder:text-neutral-400 focus:border-[#0a66c2] focus:outline-none"
            />
            <input
              type="text"
              value={resume.targetHeadline}
              onFocus={(e) =>
                registerFocus(e.currentTarget, (latest, val) => ({
                  ...latest,
                  targetHeadline: val,
                }))
              }
              onChange={(e) =>
                onUpdateResume({ ...resume, targetHeadline: e.target.value })
              }
              placeholder="Professional Headline (e.g. Lead BI Analyst | SQL, Python, Power BI)"
              className="w-full border-b border-neutral-200 bg-white px-2 py-0.5 text-center text-[11px] font-semibold text-neutral-800 placeholder:text-neutral-400 focus:border-[#0a66c2] focus:outline-none"
            />

            <div className="grid grid-cols-1 gap-1 text-[10px] sm:grid-cols-3">
              <input
                type="email"
                value={resume.email}
                onFocus={(e) =>
                  registerFocus(e.currentTarget, (latest, val) => ({
                    ...latest,
                    email: val,
                  }))
                }
                onChange={(e) =>
                  onUpdateResume({ ...resume, email: e.target.value })
                }
                placeholder="Email address"
                className={sheetInputClass}
              />
              <input
                type="text"
                value={resume.phones.join(' | ')}
                onChange={(e) =>
                  onUpdateResume({
                    ...resume,
                    phones: e.target.value.split('|').map((p) => p.trim()).filter(Boolean),
                  })
                }
                placeholder="Phone (separate with |)"
                className={sheetInputClass}
              />
              <input
                type="text"
                value={resume.location}
                onFocus={(e) =>
                  registerFocus(e.currentTarget, (latest, val) => ({
                    ...latest,
                    location: val,
                  }))
                }
                onChange={(e) =>
                  onUpdateResume({ ...resume, location: e.target.value })
                }
                placeholder="City, Country"
                className={sheetInputClass}
              />
            </div>

            <ResumeLinksEditor
              resume={resume}
              theme="light"
              variant="sheet"
              onChangeResume={onUpdateResume}
              onFocusLinkLabel={(linkId, element) =>
                registerFocus(element, (latest, val) => {
                  const currentLinks = getEffectiveHeaderLinks(latest);
                  const updatedLinks = currentLinks.map((lnk, idx) =>
                    (lnk.id || `hdr-${idx}`) === linkId
                      ? { ...lnk, label: val }
                      : lnk
                  );
                  return applyHeaderLinksToResume(
                    latest,
                    updatedLinks,
                    Boolean(latest.hideHeaderLinks)
                  );
                })
              }
            />
          </div>
        ) : (
          <>
            <h1 className="text-[22px] font-extrabold tracking-tight text-black uppercase">
              {resume.fullName}
            </h1>

            {resume.targetHeadline && (
              <p
                className={cn(
                  'mt-0.5 inline-flex flex-wrap items-center justify-center gap-1.5 text-[10.5px] font-semibold tracking-wide text-neutral-700',
                  headlineChanged &&
                    (isTailoredVariant
                      ? 'rounded bg-emerald-50 px-2 py-0.5 text-emerald-950 ring-1 ring-emerald-300 print:bg-transparent print:p-0 print:text-neutral-700 print:ring-0'
                      : 'rounded bg-amber-50 px-2 py-0.5 text-amber-950 ring-1 ring-amber-300')
                )}
              >
                <span>{resume.targetHeadline}</span>
                {headlineChanged && isTailoredVariant && (
                  <span className="no-print rounded bg-emerald-700 px-1 py-0 text-[8.5px] font-bold uppercase text-white">
                    AI Headline
                  </span>
                )}
              </p>
            )}

            <p className="mt-1 text-[10px] text-neutral-800">
              {(() => {
                const emailHref = resolveEmailHref(resume.email);
                return emailHref ? (
                  <a href={emailHref} className="hover:underline">
                    {resume.email}
                  </a>
                ) : (
                  resume.email
                );
              })()}
              {resume.phones.length > 0 && ` | ${resume.phones.join(' | ')}`}
              {resume.location && ` | ${resume.location}`}
            </p>

            {(() => {
              const headerLinkItems = getEffectiveHeaderLinks(resume)
                .map((item, idx) => {
                  const kind = inferLinkKind(item.platform, item.kind);
                  return {
                    key: item.id || `hdr-${idx}`,
                    prefix: item.platform.trim(),
                    ...resolveResumeHeaderLink(kind, item.label, item.url),
                  };
                })
                .filter((item) => Boolean(item.displayLabel || item.href));

              if (headerLinkItems.length === 0) return null;

              return (
                <p className="mt-0.5 text-[10px] text-neutral-800">
                  {headerLinkItems.map((item, idx) => (
                    <Fragment key={item.key}>
                      {idx > 0 && ' | '}
                      {item.prefix ? `${item.prefix}: ` : ''}
                      {item.href ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-neutral-400 underline-offset-2"
                        >
                          {item.displayLabel || item.href}
                        </a>
                      ) : (
                        <span className="underline decoration-neutral-400 underline-offset-2">
                          {item.displayLabel}
                        </span>
                      )}
                    </Fragment>
                  ))}
                </p>
              );
            })()}
          </>
        )}
      </header>

      {/* OPTIONAL TAILORED SUMMARY */}
      {(showSummary || canEdit) && (resume.tailoredSummary || canEdit) && (
        <section
          className={cn(
            'mt-2.5 border-l-2 px-2.5 py-1.5 text-[10.5px] text-neutral-900',
            summaryChanged && isTailoredVariant
              ? 'border-[#057642] bg-emerald-50/75 print:border-black print:bg-neutral-50'
              : 'border-black bg-neutral-50'
          )}
        >
          {summaryChanged && isTailoredVariant && (
            <div className="no-print mb-0.5 inline-flex items-center gap-1 rounded bg-emerald-700 px-1.5 py-0 text-[8.5px] font-bold uppercase text-white">
              ✓ AI Tailored Summary
            </div>
          )}
          {canEdit && onUpdateResume ? (
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-800">
                Summary / Executive Overview:
              </div>
              <textarea
                rows={3}
                value={resume.tailoredSummary || ''}
                onFocus={(e) =>
                  registerFocus(e.currentTarget, (latest, val) => ({
                    ...latest,
                    tailoredSummary: val,
                  }))
                }
                onChange={(e) =>
                  onUpdateResume({
                    ...resume,
                    tailoredSummary: e.target.value,
                  })
                }
                placeholder="Write a concise professional summary tailored to the target role..."
                className={cn(
                  'w-full p-1.5 text-[10.5px]',
                  sheetInputClass,
                  textAlignClass
                )}
              />
            </div>
          ) : (
            <p className={textAlignClass}>
              {renderFormattedLine(
                resume.tailoredSummary || '',
                highlightActive && isTailoredVariant
              )}
            </p>
          )}
        </section>
      )}

      {/* EXPERIENCE SECTION */}
      <section className="mt-3">
        <div className="flex items-center justify-between border-b-[1.5px] border-black pb-0.5">
          <h2 className="text-[11px] font-bold tracking-wider text-black uppercase">
            Experience
          </h2>
          {canEdit && onUpdateResume && (
            <button
              type="button"
              onClick={() => {
                const newExpItem = {
                  id: `exp-${Date.now()}`,
                  role: 'Job Title',
                  company: 'Company Name',
                  location: 'Location',
                  period: 'Year — Present',
                  bullets: ['Accomplishment or responsibility statement with measurable impact.'],
                };
                onUpdateResume({
                  ...resume,
                  experience: [newExpItem, ...resume.experience],
                });
              }}
              className={sectionAddBtnClass}
            >
              <Plus className="h-3 w-3" />
              Add Experience Entry
            </button>
          )}
        </div>

        <div className="mt-1.5 space-y-2.5">
          {resume.experience.map((exp, expIdx) => {
            const expKey = exp.id || exp.role.trim().toLowerCase();
            const origIdx = refSets.expOrder.get(expKey);
            const reordered =
              highlightActive &&
              isTailoredVariant &&
              origIdx !== undefined &&
              origIdx !== expIdx;

            return (
              <div
                key={exp.id || `${exp.role}-${expIdx}`}
                className={cn(
                  canEdit &&
                    'rounded border border-dashed border-neutral-300 bg-neutral-50/50 p-2 print:border-none print:bg-transparent print:p-0'
                )}
              >
                {canEdit && onUpdateResume ? (
                  <div className="space-y-1.5">
                    {/* Item control bar */}
                    <div className="flex items-center justify-between gap-1 border-b border-neutral-200 pb-1 text-[10px] text-neutral-600">
                      <span className="font-semibold text-neutral-800">
                        Position #{expIdx + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={expIdx === 0}
                          onClick={() => {
                            if (expIdx === 0) return;
                            const next = [...resume.experience];
                            const temp = next[expIdx - 1];
                            next[expIdx - 1] = next[expIdx];
                            next[expIdx] = temp;
                            onUpdateResume({ ...resume, experience: next });
                          }}
                          className="rounded p-0.5 text-neutral-700 hover:bg-neutral-200 disabled:opacity-30"
                          title="Move up"
                          aria-label="Move experience entry up"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={expIdx === resume.experience.length - 1}
                          onClick={() => {
                            if (expIdx === resume.experience.length - 1) return;
                            const next = [...resume.experience];
                            const temp = next[expIdx + 1];
                            next[expIdx + 1] = next[expIdx];
                            next[expIdx] = temp;
                            onUpdateResume({ ...resume, experience: next });
                          }}
                          className="rounded p-0.5 text-neutral-700 hover:bg-neutral-200 disabled:opacity-30"
                          title="Move down"
                          aria-label="Move experience entry down"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = resume.experience.filter((_, idx) => idx !== expIdx);
                            onUpdateResume({ ...resume, experience: next });
                          }}
                          className="rounded p-0.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                          title="Delete experience entry"
                          aria-label="Delete experience entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-1 text-[10.5px] sm:grid-cols-2">
                      <input
                        type="text"
                        value={exp.role}
                        onFocus={(e) =>
                          registerFocus(e.currentTarget, (latest, val) => {
                            const next = [...latest.experience];
                            if (!next[expIdx]) return latest;
                            next[expIdx] = { ...next[expIdx], role: val };
                            return { ...latest, experience: next };
                          })
                        }
                        onChange={(e) => {
                          const next = [...resume.experience];
                          next[expIdx] = { ...next[expIdx], role: e.target.value };
                          onUpdateResume({ ...resume, experience: next });
                        }}
                        placeholder="Job Title / Role"
                        className={cn(sheetInputClass, 'font-bold')}
                      />
                      <input
                        type="text"
                        value={exp.period}
                        onFocus={(e) =>
                          registerFocus(e.currentTarget, (latest, val) => {
                            const next = [...latest.experience];
                            if (!next[expIdx]) return latest;
                            next[expIdx] = { ...next[expIdx], period: val };
                            return { ...latest, experience: next };
                          })
                        }
                        onChange={(e) => {
                          const next = [...resume.experience];
                          next[expIdx] = { ...next[expIdx], period: e.target.value };
                          onUpdateResume({ ...resume, experience: next });
                        }}
                        placeholder="Employment Period (e.g. 2023 — Present)"
                        className={sheetInputClass}
                      />
                      <input
                        type="text"
                        value={exp.company}
                        onFocus={(e) =>
                          registerFocus(e.currentTarget, (latest, val) => {
                            const next = [...latest.experience];
                            if (!next[expIdx]) return latest;
                            next[expIdx] = { ...next[expIdx], company: val };
                            return { ...latest, experience: next };
                          })
                        }
                        onChange={(e) => {
                          const next = [...resume.experience];
                          next[expIdx] = { ...next[expIdx], company: e.target.value };
                          onUpdateResume({ ...resume, experience: next });
                        }}
                        placeholder="Company Name"
                        className={sheetInputClass}
                      />
                      <input
                        type="text"
                        value={exp.location}
                        onFocus={(e) =>
                          registerFocus(e.currentTarget, (latest, val) => {
                            const next = [...latest.experience];
                            if (!next[expIdx]) return latest;
                            next[expIdx] = { ...next[expIdx], location: val };
                            return { ...latest, experience: next };
                          })
                        }
                        onChange={(e) => {
                          const next = [...resume.experience];
                          next[expIdx] = { ...next[expIdx], location: e.target.value };
                          onUpdateResume({ ...resume, experience: next });
                        }}
                        placeholder="Location (e.g. Taguig City / Remote)"
                        className={sheetInputClass}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="inline-flex flex-wrap items-center gap-1.5 font-bold text-black">
                        <span>{exp.role}</span>
                        {reordered && (
                          <span className="no-print rounded border border-blue-300 bg-blue-50 px-1.5 py-0 text-[8.5px] font-semibold text-[#0a66c2]">
                            ↑ Reordered by AI
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 font-semibold text-neutral-900">
                        {exp.period}
                      </span>
                    </div>
                    <p className="italic text-neutral-800">
                      {exp.company}
                      {exp.location ? ` | ${exp.location}` : ''}
                    </p>
                  </>
                )}

                {/* Bullets */}
                <ul className="mt-1 list-disc space-y-1 pl-4 text-neutral-900">
                  {exp.bullets.map((bullet, bIdx) => {
                    const isBulletDiff =
                      highlightActive && !refSets.expBullets.has(bullet.trim());
                    return (
                      <li
                        key={bIdx}
                        className={cn(isBulletDiff && changedBoxClass, textAlignClass)}
                      >
                        {canEdit && onUpdateResume ? (
                          <div className="flex items-start gap-1">
                            <textarea
                              rows={2}
                              value={bullet}
                              onFocus={(e) =>
                                registerFocus(e.currentTarget, (latest, val) => {
                                  const nextExp = [...latest.experience];
                                  if (!nextExp[expIdx]) return latest;
                                  const nextBullets = [...nextExp[expIdx].bullets];
                                  nextBullets[bIdx] = val;
                                  nextExp[expIdx] = {
                                    ...nextExp[expIdx],
                                    bullets: nextBullets,
                                  };
                                  return { ...latest, experience: nextExp };
                                })
                              }
                              onChange={(e) => {
                                const nextExp = [...resume.experience];
                                const nextBullets = [...nextExp[expIdx].bullets];
                                nextBullets[bIdx] = e.target.value;
                                nextExp[expIdx] = {
                                  ...nextExp[expIdx],
                                  bullets: nextBullets,
                                };
                                onUpdateResume({
                                  ...resume,
                                  experience: nextExp,
                                });
                              }}
                              className={cn(
                                'flex-1 text-[10px]',
                                sheetInputClass,
                                textAlignClass
                              )}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const nextExp = [...resume.experience];
                                nextExp[expIdx].bullets = nextExp[expIdx].bullets.filter(
                                  (_, idx) => idx !== bIdx
                                );
                                onUpdateResume({ ...resume, experience: nextExp });
                              }}
                              className="no-print rounded p-0.5 text-neutral-600 hover:bg-red-50 hover:text-red-700"
                              title="Delete bullet"
                              aria-label="Delete experience bullet"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          renderFormattedLine(
                            bullet,
                            highlightActive && isTailoredVariant
                          )
                        )}
                      </li>
                    );
                  })}
                </ul>

                {canEdit && onUpdateResume && (
                  <button
                    type="button"
                    onClick={() => {
                      const nextExp = [...resume.experience];
                      nextExp[expIdx].bullets.push('New key accomplishment or contribution.');
                      onUpdateResume({ ...resume, experience: nextExp });
                    }}
                    className={bulletAddBtnClass}
                  >
                    <Plus className="h-3 w-3" />
                    Add Bullet Point
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* PROJECTS SECTION */}
      {(resume.projects.length > 0 || canEdit) && (
        <section className="mt-3">
          <div className="flex items-center justify-between border-b-[1.5px] border-black pb-0.5">
            <h2 className="text-[11px] font-bold tracking-wider text-black uppercase">
              Projects
            </h2>
            {canEdit && onUpdateResume && (
              <button
                type="button"
                onClick={() => {
                  const newProj = {
                    id: `proj-${Date.now()}`,
                    name: 'Project Name',
                    subtitle: 'Key Technologies / Description',
                    period: 'Year',
                    bullets: ['Project outcome, architecture, or metrics achieved.'],
                  };
                  onUpdateResume({
                    ...resume,
                    projects: [newProj, ...resume.projects],
                  });
                }}
                className={sectionAddBtnClass}
              >
                <Plus className="h-3 w-3" />
                Add Project Entry
              </button>
            )}
          </div>

          <div className="mt-1.5 space-y-2">
            {resume.projects.map((proj, pIdx) => {
              const projKey = proj.id || proj.name.trim().toLowerCase();
              const origIdx = refSets.projOrder.get(projKey);
              const reordered =
                highlightActive &&
                isTailoredVariant &&
                origIdx !== undefined &&
                origIdx !== pIdx;
              const droppedInTailor =
                highlightActive &&
                !isTailoredVariant &&
                !refSets.projOrder.has(projKey);

              return (
                <div
                  key={proj.id || `${proj.name}-${pIdx}`}
                  className={cn(
                    droppedInTailor && changedBoxClass,
                    canEdit &&
                      'rounded border border-dashed border-neutral-300 bg-neutral-50/50 p-2 print:border-none print:bg-transparent print:p-0'
                  )}
                >
                  {canEdit && onUpdateResume ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1 border-b border-neutral-200 pb-1 text-[10px] text-neutral-600">
                        <span className="font-semibold text-neutral-800">
                          Project #{pIdx + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={pIdx === 0}
                            onClick={() => {
                              if (pIdx === 0) return;
                              const next = [...resume.projects];
                              const temp = next[pIdx - 1];
                              next[pIdx - 1] = next[pIdx];
                              next[pIdx] = temp;
                              onUpdateResume({ ...resume, projects: next });
                            }}
                            className="rounded p-0.5 text-neutral-700 hover:bg-neutral-200 disabled:opacity-30"
                            title="Move up"
                            aria-label="Move project up"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={pIdx === resume.projects.length - 1}
                            onClick={() => {
                              if (pIdx === resume.projects.length - 1) return;
                              const next = [...resume.projects];
                              const temp = next[pIdx + 1];
                              next[pIdx + 1] = next[pIdx];
                              next[pIdx] = temp;
                              onUpdateResume({ ...resume, projects: next });
                            }}
                            className="rounded p-0.5 text-neutral-700 hover:bg-neutral-200 disabled:opacity-30"
                            title="Move down"
                            aria-label="Move project down"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const next = resume.projects.filter((_, idx) => idx !== pIdx);
                              onUpdateResume({ ...resume, projects: next });
                            }}
                            className="rounded p-0.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                            title="Delete project"
                            aria-label="Delete project"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-1 text-[10.5px] sm:grid-cols-3">
                        <input
                          type="text"
                          value={proj.name}
                          onFocus={(e) =>
                            registerFocus(e.currentTarget, (latest, val) => {
                              const next = [...latest.projects];
                              if (!next[pIdx]) return latest;
                              next[pIdx] = { ...next[pIdx], name: val };
                              return { ...latest, projects: next };
                            })
                          }
                          onChange={(e) => {
                            const next = [...resume.projects];
                            next[pIdx] = { ...next[pIdx], name: e.target.value };
                            onUpdateResume({ ...resume, projects: next });
                          }}
                          placeholder="Project Name"
                          className={cn(sheetInputClass, 'sm:col-span-2 font-bold')}
                        />
                        <input
                          type="text"
                          value={proj.period}
                          onFocus={(e) =>
                            registerFocus(e.currentTarget, (latest, val) => {
                              const next = [...latest.projects];
                              if (!next[pIdx]) return latest;
                              next[pIdx] = { ...next[pIdx], period: val };
                              return { ...latest, projects: next };
                            })
                          }
                          onChange={(e) => {
                            const next = [...resume.projects];
                            next[pIdx] = { ...next[pIdx], period: e.target.value };
                            onUpdateResume({ ...resume, projects: next });
                          }}
                          placeholder="Year / Period"
                          className={sheetInputClass}
                        />
                      </div>
                      <input
                        type="text"
                        value={proj.subtitle}
                        onFocus={(e) =>
                          registerFocus(e.currentTarget, (latest, val) => {
                            const next = [...latest.projects];
                            if (!next[pIdx]) return latest;
                            next[pIdx] = { ...next[pIdx], subtitle: val };
                            return { ...latest, projects: next };
                          })
                        }
                        onChange={(e) => {
                          const next = [...resume.projects];
                          next[pIdx] = { ...next[pIdx], subtitle: e.target.value };
                          onUpdateResume({ ...resume, projects: next });
                        }}
                        placeholder="Subtitle / Technologies Used (e.g. Next.js, Python, PostgreSQL)"
                        className={cn(sheetInputClass, 'w-full text-[10px] italic')}
                      />
                      <ValidatedUrlInput
                        label={`Project link for ${proj.name || `Project #${pIdx + 1}`}`}
                        value={proj.url || ''}
                        placeholder="Project URL (optional — e.g. https://github.com/user/repo)"
                        variant="sheet"
                        theme="light"
                        onChange={(nextUrl) => {
                          const next = [...resume.projects];
                          next[pIdx] = { ...next[pIdx], url: nextUrl };
                          onUpdateResume({ ...resume, projects: next });
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="inline-flex flex-wrap items-center gap-1.5 font-bold text-black">
                          {(() => {
                            const projHref = normalizeHttpUrl(proj.url, 'portfolio');
                            return projHref ? (
                              <a
                                href={projHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline decoration-neutral-400 underline-offset-2"
                              >
                                {proj.name}
                              </a>
                            ) : (
                              <span>{proj.name}</span>
                            );
                          })()}
                          {reordered && (
                            <span className="no-print rounded border border-blue-300 bg-blue-50 px-1.5 py-0 text-[8.5px] font-semibold text-[#0a66c2]">
                              ↑ Reordered by AI
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 font-semibold text-neutral-900">
                          {proj.period}
                        </span>
                      </div>
                      {proj.subtitle && (
                        <p className="italic text-neutral-800">{proj.subtitle}</p>
                      )}
                    </>
                  )}

                  <ul className="mt-1 list-disc space-y-1 pl-4 text-neutral-900">
                    {proj.bullets.map((bullet, idx) => {
                      const isBulletDiff =
                        highlightActive && !refSets.projBullets.has(bullet.trim());
                      return (
                        <li
                          key={idx}
                          className={cn(isBulletDiff && changedBoxClass, textAlignClass)}
                        >
                          {canEdit && onUpdateResume ? (
                            <div className="flex items-start gap-1">
                              <textarea
                                rows={2}
                                value={bullet}
                                onFocus={(e) =>
                                  registerFocus(e.currentTarget, (latest, val) => {
                                    const nextProj = [...latest.projects];
                                    if (!nextProj[pIdx]) return latest;
                                    const nextBullets = [...nextProj[pIdx].bullets];
                                    nextBullets[idx] = val;
                                    nextProj[pIdx] = {
                                      ...nextProj[pIdx],
                                      bullets: nextBullets,
                                    };
                                    return { ...latest, projects: nextProj };
                                  })
                                }
                                onChange={(e) => {
                                  const nextProj = [...resume.projects];
                                  const nextBullets = [...nextProj[pIdx].bullets];
                                  nextBullets[idx] = e.target.value;
                                  nextProj[pIdx] = {
                                    ...nextProj[pIdx],
                                    bullets: nextBullets,
                                  };
                                  onUpdateResume({
                                    ...resume,
                                    projects: nextProj,
                                  });
                                }}
                                className={cn(
                                  'flex-1 text-[10px]',
                                  sheetInputClass,
                                  textAlignClass
                                )}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const nextProj = [...resume.projects];
                                  nextProj[pIdx].bullets = nextProj[pIdx].bullets.filter(
                                    (_, bIdx) => bIdx !== idx
                                  );
                                  onUpdateResume({ ...resume, projects: nextProj });
                                }}
                                className="no-print rounded p-0.5 text-neutral-600 hover:bg-red-50 hover:text-red-700"
                                title="Delete bullet"
                                aria-label="Delete project bullet"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            renderFormattedLine(
                              bullet,
                              highlightActive && isTailoredVariant
                            )
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  {canEdit && onUpdateResume && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextProj = [...resume.projects];
                        nextProj[pIdx].bullets.push('Project architecture or key metric.');
                        onUpdateResume({ ...resume, projects: nextProj });
                      }}
                      className={bulletAddBtnClass}
                    >
                      <Plus className="h-3 w-3" />
                      Add Project Bullet
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TECHNICAL SKILLS SECTION */}
      {(resume.skillCategories.length > 0 || canEdit) && (
        <section className="mt-3">
          <div className="flex items-center justify-between border-b-[1.5px] border-black pb-0.5">
            <h2 className="text-[11px] font-bold tracking-wider text-black uppercase">
              Technical Skills
            </h2>
            {canEdit && onUpdateResume && (
              <button
                type="button"
                onClick={() => {
                  const newCat: ResumeSkillCategory = {
                    category: 'Tools & Platforms',
                    items: 'Tool 1, Tool 2, Tool 3',
                  };
                  onUpdateResume({
                    ...resume,
                    skillCategories: [...resume.skillCategories, newCat],
                  });
                }}
                className={sectionAddBtnClass}
              >
                <Plus className="h-3 w-3" />
                Add Skill Category
              </button>
            )}
          </div>

          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-neutral-900">
            {resume.skillCategories.map((cat, idx) => {
              const refItems = refSets.skillMap.get(
                cat.category.trim().toLowerCase()
              );
              const skillDiff =
                highlightActive &&
                (refItems === undefined || refItems !== cat.items.trim());

              return (
                <li
                  key={idx}
                  className={cn(skillDiff && changedBoxClass, textAlignClass)}
                >
                  {canEdit && onUpdateResume ? (
                    <div className="flex items-center gap-1 text-[10px]">
                      <input
                        type="text"
                        value={cat.category}
                        onFocus={(e) =>
                          registerFocus(e.currentTarget, (latest, val) => {
                            const nextCats = [...latest.skillCategories];
                            if (!nextCats[idx]) return latest;
                            nextCats[idx] = { ...nextCats[idx], category: val };
                            return { ...latest, skillCategories: nextCats };
                          })
                        }
                        onChange={(e) => {
                          const nextCats = [...resume.skillCategories];
                          nextCats[idx] = { ...nextCats[idx], category: e.target.value };
                          onUpdateResume({ ...resume, skillCategories: nextCats });
                        }}
                        placeholder="Category Name"
                        className={cn(sheetInputClass, 'w-32 font-bold')}
                      />
                      <input
                        type="text"
                        value={cat.items}
                        onFocus={(e) =>
                          registerFocus(e.currentTarget, (latest, val) => {
                            const nextCats = [...latest.skillCategories];
                            if (!nextCats[idx]) return latest;
                            nextCats[idx] = { ...nextCats[idx], items: val };
                            return { ...latest, skillCategories: nextCats };
                          })
                        }
                        onChange={(e) => {
                          const nextCats = [...resume.skillCategories];
                          nextCats[idx] = { ...nextCats[idx], items: e.target.value };
                          onUpdateResume({ ...resume, skillCategories: nextCats });
                        }}
                        placeholder="Comma-separated items (e.g. Python, SQL, Tableau)"
                        className={cn(sheetInputClass, 'flex-1')}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nextCats = resume.skillCategories.filter((_, cIdx) => cIdx !== idx);
                          onUpdateResume({ ...resume, skillCategories: nextCats });
                        }}
                        className="no-print rounded p-0.5 text-neutral-600 hover:bg-red-50 hover:text-red-700"
                        title="Delete category"
                        aria-label="Delete skill category"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <strong className="font-bold text-black">
                        {cat.category}:{' '}
                      </strong>
                      <span>{cat.items}</span>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* CERTIFICATIONS SECTION */}
      {(resume.certifications.length > 0 || canEdit) && (
        <section className="mt-3">
          <div className="flex items-center justify-between border-b-[1.5px] border-black pb-0.5">
            <h2 className="text-[11px] font-bold tracking-wider text-black uppercase">
              Certifications
            </h2>
            {canEdit && onUpdateResume && (
              <button
                type="button"
                onClick={() => {
                  onUpdateResume({
                    ...resume,
                    certifications: [...resume.certifications, 'New Certification Name (Issuing Organization)'],
                  });
                }}
                className={sectionAddBtnClass}
              >
                <Plus className="h-3 w-3" />
                Add Certification
              </button>
            )}
          </div>

          <ul className="mt-1.5 grid list-disc grid-cols-1 gap-x-6 gap-y-1 pl-4 text-neutral-900 sm:grid-cols-2">
            {resume.certifications.map((cert, idx) => {
              const certUrl = resume.certificationUrls?.[idx] || '';
              const certHref = normalizeHttpUrl(certUrl, 'portfolio');
              return (
                <li key={idx} className={textAlignClass}>
                  {canEdit && onUpdateResume ? (
                    <div className="space-y-1 text-[10px]">
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={cert}
                          onFocus={(e) =>
                            registerFocus(e.currentTarget, (latest, val) => {
                              const next = [...latest.certifications];
                              next[idx] = val;
                              return { ...latest, certifications: next };
                            })
                          }
                          onChange={(e) => {
                            const next = [...resume.certifications];
                            next[idx] = e.target.value;
                            onUpdateResume({ ...resume, certifications: next });
                          }}
                          className={cn(sheetInputClass, 'flex-1')}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = resume.certifications.filter(
                              (_, cIdx) => cIdx !== idx
                            );
                            const nextUrls = shiftCertificationUrlsOnDelete(
                              resume.certificationUrls,
                              idx
                            );
                            onUpdateResume({
                              ...resume,
                              certifications: next,
                              certificationUrls: nextUrls,
                            });
                          }}
                          className="no-print rounded p-0.5 text-neutral-600 hover:bg-red-50 hover:text-red-700"
                          title="Delete certification"
                          aria-label="Delete certification"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <ValidatedUrlInput
                        label={`Credential URL for ${cert || `Certification #${idx + 1}`}`}
                        value={certUrl}
                        placeholder="Credential URL (optional — https://...)"
                        variant="sheet"
                        theme="light"
                        onChange={(nextUrl) => {
                          const nextUrls = { ...(resume.certificationUrls || {}) };
                          if (nextUrl.trim()) nextUrls[idx] = nextUrl;
                          else delete nextUrls[idx];
                          onUpdateResume({
                            ...resume,
                            certificationUrls: nextUrls,
                          });
                        }}
                      />
                    </div>
                  ) : certHref ? (
                    <a
                      href={certHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-neutral-400 underline-offset-2"
                    >
                      {cert}
                    </a>
                  ) : (
                    <span>{cert}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* EDUCATION SECTION */}
      {(resume.education.length > 0 || canEdit) && (
        <section className="mt-3">
          <div className="flex items-center justify-between border-b-[1.5px] border-black pb-0.5">
            <h2 className="text-[11px] font-bold tracking-wider text-black uppercase">
              Education
            </h2>
            {canEdit && onUpdateResume && (
              <button
                type="button"
                onClick={() => {
                  const newEdu = {
                    degree: 'Bachelor of Science in Information Technology',
                    school: 'University Name',
                    period: 'Year — Year',
                    honors: '',
                  };
                  onUpdateResume({
                    ...resume,
                    education: [...resume.education, newEdu],
                  });
                }}
                className={sectionAddBtnClass}
              >
                <Plus className="h-3 w-3" />
                Add Education Entry
              </button>
            )}
          </div>

          <div className="mt-1.5 space-y-1.5">
            {resume.education.map((edu, idx) => (
              <div
                key={idx}
                className={cn(
                  canEdit &&
                    'rounded border border-dashed border-neutral-300 bg-neutral-50/50 p-2 print:border-none print:bg-transparent print:p-0'
                )}
              >
                {canEdit && onUpdateResume ? (
                  <div className="space-y-1 text-[10px]">
                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                      <input
                        type="text"
                        value={edu.degree}
                        onFocus={(e) =>
                          registerFocus(e.currentTarget, (latest, val) => {
                            const next = [...latest.education];
                            if (!next[idx]) return latest;
                            next[idx] = { ...next[idx], degree: val };
                            return { ...latest, education: next };
                          })
                        }
                        onChange={(e) => {
                          const next = [...resume.education];
                          next[idx] = { ...next[idx], degree: e.target.value };
                          onUpdateResume({ ...resume, education: next });
                        }}
                        placeholder="Degree / Program"
                        className={cn(sheetInputClass, 'font-bold')}
                      />
                      <input
                        type="text"
                        value={edu.period}
                        onFocus={(e) =>
                          registerFocus(e.currentTarget, (latest, val) => {
                            const next = [...latest.education];
                            if (!next[idx]) return latest;
                            next[idx] = { ...next[idx], period: val };
                            return { ...latest, education: next };
                          })
                        }
                        onChange={(e) => {
                          const next = [...resume.education];
                          next[idx] = { ...next[idx], period: e.target.value };
                          onUpdateResume({ ...resume, education: next });
                        }}
                        placeholder="Graduation Period (e.g. 2019 — 2023)"
                        className={sheetInputClass}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={edu.school}
                        onFocus={(e) =>
                          registerFocus(e.currentTarget, (latest, val) => {
                            const next = [...latest.education];
                            if (!next[idx]) return latest;
                            next[idx] = { ...next[idx], school: val };
                            return { ...latest, education: next };
                          })
                        }
                        onChange={(e) => {
                          const next = [...resume.education];
                          next[idx] = { ...next[idx], school: e.target.value };
                          onUpdateResume({ ...resume, education: next });
                        }}
                        placeholder="School / University"
                        className={cn(sheetInputClass, 'flex-1')}
                      />
                      <input
                        type="text"
                        value={edu.honors}
                        onFocus={(e) =>
                          registerFocus(e.currentTarget, (latest, val) => {
                            const next = [...latest.education];
                            if (!next[idx]) return latest;
                            next[idx] = { ...next[idx], honors: val };
                            return { ...latest, education: next };
                          })
                        }
                        onChange={(e) => {
                          const next = [...resume.education];
                          next[idx] = { ...next[idx], honors: e.target.value };
                          onUpdateResume({ ...resume, education: next });
                        }}
                        placeholder="Honors / Awards"
                        className={cn(sheetInputClass, 'w-36')}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = resume.education.filter((_, eIdx) => eIdx !== idx);
                          onUpdateResume({ ...resume, education: next });
                        }}
                        className="no-print rounded p-0.5 text-neutral-600 hover:bg-red-50 hover:text-red-700"
                        title="Delete education"
                        aria-label="Delete education entry"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-bold text-black">{edu.degree}</span>
                      <span className="shrink-0 font-semibold text-neutral-900">
                        {edu.period}
                      </span>
                    </div>
                    <p className="text-neutral-900">
                      {edu.school}
                      {edu.honors ? ` (${edu.honors})` : ''}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export function A4ResumePreview({
  profile,
  activeResume,
  activeTailorJob,
  theme,
  geminiApiKey,
  personalApiConfigured = false,
  tailoring,
  resumeRecords = [],
  onUpdateGeminiKey,
  onTailorResume,
  onUpdateResume,
  onResetResume,
  onApplyToProfile,
  onSelectResumeVersion,
  onUpdateResumeRecord,
  onDeleteResumeRecord,
  onSaveSnapshot,
  onImportResume,
}: A4ResumePreviewProps) {
  const [editMode, setEditMode] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [isVersionsDrawerOpen, setIsVersionsDrawerOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [showSaveSnapshotBar, setShowSaveSnapshotBar] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<ResumeZoomLevel>('fit');

  // Quick Snapshot bar state
  const [snapshotCompany, setSnapshotCompany] = useState(
    activeTailorJob?.company || activeResume.tailoredForCompany || ''
  );
  const [snapshotRole, setSnapshotRole] = useState(
    activeTailorJob?.title || activeResume.tailoredForJobTitle || profile.primaryRole
  );
  const [snapshotVersionName, setSnapshotVersionName] = useState(
    activeResume.versionName || ''
  );
  const [snapshotSent, setSnapshotSent] = useState(Boolean(activeTailorJob));
  const [snapshotSyncToProfile, setSnapshotSyncToProfile] = useState(true);
  const [snapshotNotes, setSnapshotNotes] = useState('');
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [snapshotSavedMsg, setSnapshotSavedMsg] = useState<string | null>(null);

  const [showSummary, setShowSummary] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [highlightChanges, setHighlightChanges] = useState(true);
  const [toolbarStatusMsg, setToolbarStatusMsg] = useState<string | null>(null);

  // Track active editable input/textarea for live Bold/Italic/Code wrapping
  const activeEditorRef = useRef<{
    element: HTMLInputElement | HTMLTextAreaElement;
    applyValue: (nextValue: string) => void;
  } | null>(null);

  const handleFocusEditableField: EditableFieldFocusHandler = (
    element,
    applyValue
  ) => {
    activeEditorRef.current = { element, applyValue };
  };

  const handleWrapSelection = (prefix: string, suffix: string) => {
    if (!editMode) {
      setToolbarStatusMsg(
        'Enable Edit Resume mode, then click inside a field to apply formatting.'
      );
      return;
    }

    const active = activeEditorRef.current;
    if (!active || !document.contains(active.element)) {
      setToolbarStatusMsg(
        'Click inside a resume text field or bullet first to apply formatting.'
      );
      return;
    }

    const { element, applyValue } = active;
    const value = element.value;
    const start = element.selectionStart ?? value.length;
    const end = element.selectionEnd ?? value.length;
    const selected = value.slice(start, end);

    let nextValue: string;
    let nextStart: number;
    let nextEnd: number;

    if (
      selected.length > prefix.length + suffix.length &&
      selected.startsWith(prefix) &&
      selected.endsWith(suffix)
    ) {
      const unwrapped = selected.slice(prefix.length, selected.length - suffix.length);
      nextValue = value.slice(0, start) + unwrapped + value.slice(end);
      nextStart = start;
      nextEnd = start + unwrapped.length;
    } else if (selected.length > 0) {
      nextValue = value.slice(0, start) + prefix + selected + suffix + value.slice(end);
      nextStart = start + prefix.length;
      nextEnd = nextStart + selected.length;
    } else {
      const placeholder = 'text';
      nextValue = value.slice(0, start) + prefix + placeholder + suffix + value.slice(end);
      nextStart = start + prefix.length;
      nextEnd = nextStart + placeholder.length;
    }

    applyValue(nextValue);
    setToolbarStatusMsg(
      prefix === '**'
        ? 'Applied bold formatting.'
        : prefix === '*'
          ? 'Applied italic formatting.'
          : 'Applied tool tag formatting.'
    );

    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(nextStart, nextEnd);
    });
  };

  const tokens = getThemeTokens(theme);
  const isDark = tokens.isDark;
  const baseResume = profile.structuredResume;

  // Fast local draft state: instant 0ms keystroke feedback while debouncing parent/localStorage/DB sync
  const [draftOverride, setDraftOverride] = useState<{
    anchorProp: StructuredResume;
    flushingProp: StructuredResume | null;
    draft: StructuredResume;
  } | null>(null);

  const draftResume =
    draftOverride &&
    (draftOverride.anchorProp === activeResume ||
      draftOverride.flushingProp === activeResume)
      ? draftOverride.draft
      : activeResume;

  const latestDraftRef = useRef<StructuredResume>(draftResume);
  const onUpdateResumeRef = useRef(onUpdateResume);
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onUpdateResumeRef.current = onUpdateResume;
    latestDraftRef.current = draftResume;
  }, [onUpdateResume, draftResume]);

  const flushDraftResume = (overrideNext?: StructuredResume) => {
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    const target = overrideNext ?? latestDraftRef.current;
    if (target && target !== activeResume) {
      onUpdateResumeRef.current(target);
    }
    setDraftOverride(null);
  };

  const handleLocalResumeChange = (next: StructuredResume) => {
    latestDraftRef.current = next;
    setDraftOverride((prev) => ({
      anchorProp:
        prev && prev.anchorProp === activeResume
          ? prev.anchorProp
          : activeResume,
      flushingProp: prev?.flushingProp ?? null,
      draft: next,
    }));

    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
    }
    commitTimerRef.current = setTimeout(() => {
      commitTimerRef.current = null;
      const committed = latestDraftRef.current;
      setDraftOverride((curr) =>
        curr ? { ...curr, flushingProp: committed } : null
      );
      onUpdateResumeRef.current(committed);
      setDraftOverride((curr) =>
        curr && curr.draft === committed ? null : curr
      );
    }, 320);
  };

  useEffect(() => {
    return () => {
      if (commitTimerRef.current) {
        clearTimeout(commitTimerRef.current);
        commitTimerRef.current = null;
        if (latestDraftRef.current) {
          onUpdateResumeRef.current(latestDraftRef.current);
        }
      }
    };
  }, []);

  const isTailored = Boolean(
    draftResume.tailorMethod && draftResume.tailorMethod !== 'base'
  );

  const pageSize: ResumePageSize = draftResume.pageSize || 'a4';
  const density: ResumeDensity = draftResume.density || 'standard';
  const fontFamilyKey: ResumeFontFamily = draftResume.fontFamily || 'calibri';
  const sizePreset = PAGE_SIZE_PRESETS[pageSize] || PAGE_SIZE_PRESETS.a4;
  const densityPreset = DENSITY_PRESETS[density] || DENSITY_PRESETS.standard;
  const fontPreset =
    ATS_FONT_PRESETS[fontFamilyKey] || ATS_FONT_PRESETS.calibri;

  const sheetNaturalWidth =
    pageSize === 'letter' || pageSize === 'legal' ? 816 : 794;

  // Responsive container & actual sheet height measuring via ResizeObserver
  const containerRef = useRef<HTMLDivElement>(null);
  const tailoredMeasureRef = useRef<HTMLDivElement>(null);
  const baseMeasureRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [tailoredHeight, setTailoredHeight] = useState<number>(0);
  const [baseHeight, setBaseHeight] = useState<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.clientWidth);

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const observers: ResizeObserver[] = [];

    if (tailoredMeasureRef.current) {
      setTailoredHeight(tailoredMeasureRef.current.offsetHeight);
      const obs = new ResizeObserver(() => {
        if (tailoredMeasureRef.current) {
          setTailoredHeight(tailoredMeasureRef.current.offsetHeight);
        }
      });
      obs.observe(tailoredMeasureRef.current);
      observers.push(obs);
    }

    if (baseMeasureRef.current) {
      setBaseHeight(baseMeasureRef.current.offsetHeight);
      const obs = new ResizeObserver(() => {
        if (baseMeasureRef.current) {
          setBaseHeight(baseMeasureRef.current.offsetHeight);
        }
      });
      obs.observe(baseMeasureRef.current);
      observers.push(obs);
    }

    return () => {
      observers.forEach((o) => o.disconnect());
    };
  }, [editMode, showSummary, compareMode]);

  // Compute scale based on zoom preset or auto-fit container (including 2-column compare)
  const computedScale = useMemo(() => {
    if (zoomLevel === '75') return 0.75;
    if (zoomLevel === '90') return 0.9;
    if (zoomLevel === '100') return 1.0;
    if (zoomLevel === '110') return 1.1;

    const isTwoColCompare = compareMode && isTailored && containerWidth >= 1200;
    const columnWidth = isTwoColCompare
      ? (containerWidth - 20) / 2
      : containerWidth;
    const availableWidth = Math.max(260, columnWidth - 8);
    if (availableWidth < sheetNaturalWidth) {
      return Math.max(0.38, Math.min(1.0, availableWidth / sheetNaturalWidth));
    }
    return 1.0;
  }, [zoomLevel, containerWidth, compareMode, isTailored, sheetNaturalWidth]);

  const diffSummary = useMemo(() => {
    if (!isTailored) {
      return {
        headlineUpdated: false,
        summaryAdded: false,
        bulletsModified: 0,
        skillsUpdated: 0,
        reorderedCount: 0,
      };
    }

    const baseExpBullets = new Set(
      baseResume.experience.flatMap((e) => e.bullets.map((b) => b.trim()))
    );
    const baseProjBullets = new Set(
      baseResume.projects.flatMap((p) => p.bullets.map((b) => b.trim()))
    );
    const baseSkillMap = new Map(
      baseResume.skillCategories.map((c) => [
        c.category.trim().toLowerCase(),
        c.items.trim(),
      ])
    );
    const baseExpOrder = new Map(
      baseResume.experience.map((e, i) => [
        e.id || e.role.trim().toLowerCase(),
        i,
      ])
    );
    const baseProjOrder = new Map(
      baseResume.projects.map((p, i) => [
        p.id || p.name.trim().toLowerCase(),
        i,
      ])
    );

    let bulletsModified = 0;
    let reorderedCount = 0;

    draftResume.experience.forEach((exp, idx) => {
      const orig = baseExpOrder.get(exp.id || exp.role.trim().toLowerCase());
      if (orig !== undefined && orig !== idx) reorderedCount++;
      exp.bullets.forEach((b) => {
        if (!baseExpBullets.has(b.trim())) bulletsModified++;
      });
    });

    draftResume.projects.forEach((proj, idx) => {
      const orig = baseProjOrder.get(proj.id || proj.name.trim().toLowerCase());
      if (orig !== undefined && orig !== idx) reorderedCount++;
      proj.bullets.forEach((b) => {
        if (!baseProjBullets.has(b.trim())) bulletsModified++;
      });
    });

    let skillsUpdated = 0;
    draftResume.skillCategories.forEach((c) => {
      const orig = baseSkillMap.get(c.category.trim().toLowerCase());
      if (orig === undefined || orig !== c.items.trim()) skillsUpdated++;
    });

    const headlineUpdated =
      draftResume.targetHeadline.trim() !== baseResume.targetHeadline.trim();
    const summaryAdded = Boolean(
      draftResume.tailoredSummary &&
        draftResume.tailoredSummary.trim() !==
          (baseResume.tailoredSummary || '').trim()
    );

    return {
      headlineUpdated,
      summaryAdded,
      bulletsModified,
      skillsUpdated,
      reorderedCount,
    };
  }, [draftResume, baseResume, isTailored]);

  const handlePrint = () => {
    flushDraftResume();
    window.print();
  };

  const sheetClassName = cn(
    'w-full bg-white text-black shadow-xl ring-1 ring-black/10 transition-all print:shadow-none! print:ring-0! print:border-0! print:m-0! print:p-0! print:max-w-none! print:min-h-0! print:bg-white!',
    sizePreset.sheetClass,
    densityPreset.padClass,
    densityPreset.textClass
  );
  const sheetStyle: CSSProperties = {
    fontFamily: fontPreset.fontFamily,
    fontVariantLigatures: 'none',
  };

  return (
    <div className="flex flex-col gap-3 print:block! print:gap-0! print:m-0! print:p-0! print:bg-white!">
      <style>{`@media print { @page { size: ${sizePreset.printPageSize}; margin: 8mm; } html, body { background: #ffffff !important; } #a4-resume-sheet { font-family: ${fontPreset.fontFamily} !important; font-variant-ligatures: none !important; transform: none !important; margin: 0 !important; background: #ffffff !important; box-shadow: none !important; border: none !important; padding: 0 !important; } }`}</style>

      {/* Modern Accessible Toolbar (Word & Docs Formatting Style) */}
      <ResumeFormatToolbar
        profile={profile}
        activeResume={draftResume}
        activeTailorJob={activeTailorJob}
        theme={theme}
        editMode={editMode}
        versionCount={resumeRecords.length}
        zoomLevel={zoomLevel}
        tailoring={tailoring}
        geminiApiKey={geminiApiKey}
        personalApiConfigured={personalApiConfigured}
        statusMessage={toolbarStatusMsg}
        onToggleEditMode={() => {
          setEditMode((prev) => {
            const next = !prev;
            if (!next) {
              flushDraftResume();
            }
            setToolbarStatusMsg(
              next
                ? 'Edit Mode active — click any field in the sheet to edit or format text.'
                : null
            );
            return next;
          });
        }}
        onSetZoomLevel={setZoomLevel}
        onUpdateResume={(next) => {
          if (next.fontFamily && next.fontFamily !== draftResume.fontFamily) {
            const nextPreset = ATS_FONT_PRESETS[next.fontFamily];
            if (nextPreset) {
              setToolbarStatusMsg(
                `Font set to ${nextPreset.shortLabel} — ${nextPreset.atsNote}`
              );
            }
          }
          flushDraftResume(next);
        }}
        onOpenVersionsDrawer={() => {
          flushDraftResume();
          setIsVersionsDrawerOpen(true);
        }}
        onOpenUploadDialog={
          onImportResume ? () => setIsUploadDialogOpen(true) : undefined
        }
        onOpenSaveSnapshotBar={() => {
          setSnapshotCompany(
            activeTailorJob?.company ||
              draftResume.tailoredForCompany ||
              ''
          );
          setSnapshotRole(
            activeTailorJob?.title ||
              draftResume.tailoredForJobTitle ||
              profile.primaryRole
          );
          setSnapshotVersionName(
            draftResume.versionName ||
              `${activeTailorJob?.company || draftResume.tailoredForCompany || 'Draft'} - ${
                activeTailorJob?.title || draftResume.tailoredForJobTitle || 'Resume'
              }`
          );
          setShowSaveSnapshotBar((v) => !v);
        }}
        onApplyToProfile={
          onApplyToProfile
            ? () => {
                flushDraftResume();
                onApplyToProfile(draftResume);
              }
            : undefined
        }
        onTailorResume={(job, role) => {
          flushDraftResume();
          onTailorResume(job, role);
        }}
        onResetResume={() => {
          if (commitTimerRef.current) {
            clearTimeout(commitTimerRef.current);
            commitTimerRef.current = null;
          }
          setDraftOverride(null);
          setCompareMode(false);
          onResetResume();
        }}
        onPrint={handlePrint}
        onToggleKeyInput={() => setShowKeyInput((v) => !v)}
        onWrapSelection={handleWrapSelection}
      />

      {/* Optional Gemini Key Input Drawer */}
      {showKeyInput && (
        <div
          className={cn(
            'no-print flex flex-wrap items-center gap-2 rounded-lg border p-2.5 text-xs',
            tokens.cardSurface,
            tokens.borderSubtle
          )}
        >
          <input
            type="password"
            value={geminiApiKey}
            onChange={(e) => onUpdateGeminiKey(e.target.value)}
            placeholder={
              personalApiConfigured
                ? 'Optional browser override key — leave blank to use your personal .env GEMINI_API_KEY'
                : 'Optional Gemini API Key — leave blank to use built-in Smart Tailor'
            }
            className={cn(
              'flex-1 rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none',
              tokens.inputSurface
            )}
          />
          <span className={cn('text-[11px]', tokens.mutedText)}>
            {personalApiConfigured
              ? 'Server .env personal key (gemini-3.1-flash-lite) runs by default.'
              : 'Stored locally in your browser.'}
          </span>
        </div>
      )}

      {/* Save Version Quick Form Bar */}
      {showSaveSnapshotBar && onSaveSnapshot && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const companyVal = snapshotCompany.trim() || null;
            const roleVal =
              snapshotRole.trim() || profile.primaryRole || 'General Resume';
            setSavingSnapshot(true);
            setSnapshotSavedMsg(null);
            try {
              const customName =
                snapshotVersionName.trim() ||
                (companyVal ? `${companyVal} — ${roleVal}` : `General — ${roleVal}`);
              flushDraftResume();
              await onSaveSnapshot({
                company: companyVal,
                jobTitle: roleVal,
                jobId: activeTailorJob?.id || null,
                versionName: customName,
                resume: {
                  ...draftResume,
                  versionName: customName,
                  tailoredForCompany: companyVal,
                  tailoredForJobTitle: roleVal,
                },
                isSent: snapshotSent,
                notes: snapshotNotes.trim(),
                syncToProfile: snapshotSyncToProfile,
              });
              setSnapshotSavedMsg(
                snapshotSyncToProfile
                  ? `Saved version "${customName}" & synced to My Profile`
                  : `Saved version: "${customName}"`
              );
              setSnapshotNotes('');
              setShowSaveSnapshotBar(false);
            } finally {
              setSavingSnapshot(false);
            }
          }}
          className={cn(
            'no-print grid gap-2 rounded-lg border p-3 sm:grid-cols-12',
            tokens.subSurface,
            tokens.borderSubtle
          )}
        >
          <div className="sm:col-span-12 flex items-center justify-between">
            <span className={cn('text-xs font-bold', tokens.strongText)}>
              Save New Resume Version:
            </span>
            <button
              type="button"
              onClick={() => setShowSaveSnapshotBar(false)}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                tokens.secondaryBtn
              )}
            >
              Cancel
            </button>
          </div>
          <input
            type="text"
            value={snapshotVersionName}
            onChange={(e) => setSnapshotVersionName(e.target.value)}
            placeholder="Version name (optional)"
            className={cn(
              'sm:col-span-3 rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none font-medium',
              tokens.inputSurface
            )}
          />
          <input
            type="text"
            value={snapshotCompany}
            onChange={(e) => setSnapshotCompany(e.target.value)}
            placeholder="Company (optional — blank for general CV)"
            className={cn(
              'sm:col-span-3 rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none',
              tokens.inputSurface
            )}
          />
          <input
            type="text"
            value={snapshotRole}
            onChange={(e) => setSnapshotRole(e.target.value)}
            placeholder="Target role (optional)"
            className={cn(
              'sm:col-span-3 rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none',
              tokens.inputSurface
            )}
          />
          <input
            type="text"
            value={snapshotNotes}
            onChange={(e) => setSnapshotNotes(e.target.value)}
            placeholder="Optional note"
            className={cn(
              'sm:col-span-3 rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none',
              tokens.inputSurface
            )}
          />
          <div className="sm:col-span-10 flex flex-wrap items-center gap-4 text-xs pt-0.5">
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={snapshotSyncToProfile}
                onChange={(e) => setSnapshotSyncToProfile(e.target.checked)}
                className="h-3.5 w-3.5"
              />
              <span>Sync to My Profile &amp; Base CV</span>
            </label>
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={snapshotSent}
                onChange={(e) => setSnapshotSent(e.target.checked)}
                className="h-3.5 w-3.5"
              />
              <span>Mark Sent</span>
            </label>
          </div>
          <button
            type="submit"
            disabled={savingSnapshot}
            className={cn(
              'sm:col-span-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
              tokens.primaryBtn
            )}
          >
            {savingSnapshot ? 'Saving...' : 'Save Version'}
          </button>
        </form>
      )}

      {snapshotSavedMsg && (
        <p
          className={cn(
            'no-print text-xs font-medium',
            isDark ? 'text-emerald-300' : 'text-emerald-800'
          )}
        >
          ✓ {snapshotSavedMsg}
        </p>
      )}

      {/* AI Tailoring Changes Bar & Side-by-Side Controls */}
      {isTailored && (
        <div
          className={cn(
            'no-print flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2.5 text-xs',
            tokens.cardSurface,
            tokens.borderSubtle
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded border px-2 py-0.5 font-mono text-[11px] tabular-nums',
                tokens.subSurface,
                tokens.mutedText
              )}
            >
              {diffSummary.summaryAdded ? '+Summary • ' : ''}
              {diffSummary.headlineUpdated ? 'Headline • ' : ''}
              {diffSummary.bulletsModified} rewritten bullets •{' '}
              {diffSummary.skillsUpdated} skills updated
              {diffSummary.reorderedCount > 0
                ? ` • ${diffSummary.reorderedCount} reordered`
                : ''}
            </span>

            <button
              type="button"
              aria-pressed={highlightChanges}
              onClick={() => setHighlightChanges((v) => !v)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                highlightChanges
                  ? cn('border-transparent', tokens.primaryBtn)
                  : tokens.secondaryBtn
              )}
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {highlightChanges ? '✓ Highlights ON' : 'Highlight AI Changes'}
              </span>
            </button>

            <button
              type="button"
              aria-pressed={compareMode}
              onClick={() => setCompareMode((v) => !v)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                compareMode
                  ? cn('border-transparent', tokens.primaryBtn)
                  : tokens.secondaryBtn
              )}
            >
              <Columns2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {compareMode ? '✓ Side-by-Side Active' : 'Side-by-Side Compare'}
              </span>
            </button>
          </div>

          <label
            className={cn(
              'inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium',
              tokens.strongText
            )}
          >
            <input
              type="checkbox"
              checked={showSummary}
              onChange={(e) => setShowSummary(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            <span>Show Tailored Summary</span>
          </label>
        </div>
      )}

      {/* RESPONSIVE RESUME SHEET CONTAINER */}
      <div
        ref={containerRef}
        className={cn(
          'print-only-container rounded-lg border p-3 sm:p-5 overflow-x-auto print:rounded-none! print:border-0! print:bg-white! print:p-0! print:m-0! print:shadow-none! print:overflow-visible!',
          compareMode && isTailored
            ? 'grid grid-cols-1 items-start gap-5 xl:grid-cols-2 print:block'
            : 'block',
          tokens.subSurface,
          tokens.borderSubtle
        )}
      >
        {/* Base Profile Sheet in Compare Mode */}
        {compareMode && isTailored && (
          <div className="no-print flex min-w-0 flex-col gap-2.5 w-full">
            <div
              className={cn(
                'flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs',
                tokens.cardSurface,
                tokens.borderSubtle
              )}
            >
              <span className={cn('font-semibold', tokens.strongText)}>
                Before • Base Profile Master
              </span>
              {highlightChanges && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium',
                    isDark
                      ? 'border-amber-700/70 bg-amber-950/60 text-amber-200'
                      : 'border-amber-300 bg-amber-50 text-amber-900'
                  )}
                >
                  Amber = modified/trimmed by AI
                </span>
              )}
            </div>

            <div className="w-full overflow-x-auto pb-2">
              <div
                className="resume-sheet-containment relative mx-auto shrink-0"
                style={{
                  width: `${Math.round(sheetNaturalWidth * computedScale)}px`,
                  height: baseHeight
                    ? `${Math.ceil(baseHeight * computedScale)}px`
                    : undefined,
                }}
              >
                <div
                  ref={baseMeasureRef}
                  style={{
                    width: `${sheetNaturalWidth}px`,
                    transform:
                      computedScale !== 1 ? `scale(${computedScale})` : undefined,
                    transformOrigin: 'top left',
                    transition: 'transform 0.15s ease-out',
                  }}
                >
                  <ResumeSheetDocument
                    variant="base"
                    resume={baseResume}
                    compareReference={draftResume}
                    showSummary={showSummary}
                    showHighlights={highlightChanges}
                    isTailored={isTailored}
                    editMode={false}
                    className={sheetClassName}
                    style={sheetStyle}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Tailored / Editable Resume Sheet */}
        <div
          className={cn(
            compareMode && isTailored
              ? 'flex min-w-0 flex-col gap-2.5 w-full print:block'
              : 'w-full print:block'
          )}
        >
          {compareMode && isTailored && (
            <div
              className={cn(
                'no-print flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs',
                tokens.cardSurface,
                tokens.borderSubtle
              )}
            >
              <span className={cn('font-semibold', tokens.strongText)}>
                After • AI Tailored Resume (Print Active)
              </span>
              {highlightChanges && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium',
                    tokens.badgeSuccess
                  )}
                >
                  ✓ Green = AI rewritten, reordered, or bolded
                </span>
              )}
            </div>
          )}

          {/* Scaled Sheet Wrapper for Responsive Mobile / Auto-Fit */}
          <div className="w-full overflow-x-auto pb-1 print:overflow-visible print:pb-0">
            <div
              className="resume-sheet-containment relative mx-auto shrink-0 print:h-auto! print:w-full!"
              style={{
                width: `${Math.round(sheetNaturalWidth * computedScale)}px`,
                height: tailoredHeight
                  ? `${Math.ceil(tailoredHeight * computedScale)}px`
                  : undefined,
              }}
            >
              <div
                ref={tailoredMeasureRef}
                className="print:w-full! print:transform-none!"
                style={{
                  width: `${sheetNaturalWidth}px`,
                  transform:
                    computedScale !== 1 ? `scale(${computedScale})` : undefined,
                  transformOrigin: 'top left',
                  transition: 'transform 0.15s ease-out',
                }}
              >
                <ResumeSheetDocument
                  sheetId="a4-resume-sheet"
                  variant="tailored"
                  resume={draftResume}
                  compareReference={baseResume}
                  showSummary={showSummary}
                  showHighlights={highlightChanges}
                  isTailored={isTailored}
                  editMode={editMode}
                  className={sheetClassName}
                  style={sheetStyle}
                  onUpdateResume={handleLocalResumeChange}
                  onFocusEditableField={handleFocusEditableField}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resume Versions Drawer Dialog */}
      <ResumeVersionsDrawer
        isOpen={isVersionsDrawerOpen}
        resumeRecords={resumeRecords}
        activeResume={draftResume}
        activeTailorJob={activeTailorJob}
        theme={theme}
        onClose={() => setIsVersionsDrawerOpen(false)}
        onSelectVersion={(selected) => {
          setDraftOverride(null);
          if (onSelectResumeVersion) {
            onSelectResumeVersion(selected);
          } else {
            onUpdateResume(selected);
          }
        }}
        onUpdateResumeRecord={
          onUpdateResumeRecord || (async () => {})
        }
        onDeleteResumeRecord={
          onDeleteResumeRecord || (async () => {})
        }
        onSaveSnapshot={onSaveSnapshot || (async () => {})}
      />

      {/* Resume Import / Upload Dialog */}
      {onImportResume && (
        <ResumeUploadDialog
          isOpen={isUploadDialogOpen}
          theme={theme}
          primaryRole={profile.primaryRole}
          geminiApiKey={geminiApiKey}
          onClose={() => setIsUploadDialogOpen(false)}
          onConfirmImport={async (parsed, options) => {
            await onImportResume(parsed, options);
            setEditMode(true);
            setToolbarStatusMsg(
              `Imported "${parsed.fileName || 'resume'}" — now editing in Resume Studio.`
            );
          }}
        />
      )}
    </div>
  );
}

'use client';

import { CSSProperties, Fragment, useMemo, useState } from 'react';
import {
  Check,
  Columns2,
  Edit3,
  Eye,
  KeyRound,
  Printer,
  RotateCcw,
} from 'lucide-react';
import {
  JobListing,
  MonochromeTheme,
  ResumeDensity,
  ResumeFontFamily,
  ResumePageSize,
  StructuredResume,
  UserProfile,
} from '@/types/job';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface A4ResumePreviewProps {
  profile: UserProfile;
  activeResume: StructuredResume;
  activeTailorJob: JobListing | null;
  theme: MonochromeTheme;
  geminiApiKey: string;
  personalApiConfigured?: boolean;
  tailoring: boolean;
  onUpdateGeminiKey: (key: string) => void;
  onTailorResume: (targetJob: JobListing | null, targetRole?: string) => void;
  onUpdateResume: (next: StructuredResume) => void;
  onResetResume: () => void;
}

const ATS_FONT_PRESETS: Record<
  ResumeFontFamily,
  {
    label: string;
    shortLabel: string;
    category: string;
    fontFamily: string;
    atsNote: string;
  }
> = {
  calibri: {
    label: 'Calibri (#1 AI ATS Standard • Default)',
    shortLabel: 'Calibri',
    category: 'Modern ATS Sans',
    fontFamily: "Calibri, 'Segoe UI', Carlito, sans-serif",
    atsNote: 'Best all-rounder for AI parsers & data/tech toolkits',
  },
  helvetica: {
    label: 'Helvetica (#2 Tech & Engineering)',
    shortLabel: 'Helvetica',
    category: 'Tech Sans',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    atsNote: 'Crisp geometric mapping in PDFBox & Textkernel',
  },
  garamond: {
    label: 'Garamond (#3 Researcher & Academic)',
    shortLabel: 'Garamond',
    category: 'Research Serif',
    fontFamily: "Garamond, 'EB Garamond', 'Times New Roman', serif",
    atsNote: 'High text density for research, publications & quant CVs',
  },
  arial: {
    label: 'Arial (#4 Universal Legacy ATS)',
    shortLabel: 'Arial',
    category: 'Legacy Safe Sans',
    fontFamily: "Arial, 'Liberation Sans', sans-serif",
    atsNote: 'Zero-failure character recognition on all legacy ATS',
  },
  georgia: {
    label: 'Georgia (#5 High-Contrast Research Serif)',
    shortLabel: 'Georgia',
    category: 'Editorial Serif',
    fontFamily: "Georgia, Cambria, 'Times New Roman', serif",
    atsNote: 'High legibility on both recruiter screens and print',
  },
};

const PAGE_SIZE_PRESETS: Record<
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

const DENSITY_PRESETS: Record<
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
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
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
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={idx} className="rounded bg-neutral-100 px-1 font-mono text-[0.92em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={idx}>{part}</Fragment>;
  });
}

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
}

function ResumeSheetDocument({
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
}: ResumeSheetDocumentProps) {
  const highlightActive = isTailored && showHighlights;
  const isTailoredVariant = variant === 'tailored';
  const canEdit = isTailoredVariant && editMode && Boolean(onUpdateResume);

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
    <div id={sheetId} className={className} style={style}>
      {/* Header */}
      <header className="text-center">
        {canEdit && onUpdateResume ? (
          <input
            type="text"
            value={resume.fullName}
            onChange={(e) =>
              onUpdateResume({ ...resume, fullName: e.target.value })
            }
            className="w-full border-b border-neutral-300 text-center text-2xl font-extrabold tracking-tight uppercase focus:outline-none"
          />
        ) : (
          <h1 className="text-[22px] font-extrabold tracking-tight text-black uppercase">
            {resume.fullName}
          </h1>
        )}

        {canEdit && onUpdateResume ? (
          <input
            type="text"
            value={resume.targetHeadline}
            onChange={(e) =>
              onUpdateResume({
                ...resume,
                targetHeadline: e.target.value,
              })
            }
            className="mt-0.5 w-full border-b border-neutral-200 text-center text-[11px] font-semibold text-neutral-700 focus:outline-none"
          />
        ) : (
          resume.targetHeadline && (
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
          )
        )}

        <p className="mt-1 text-[10px] text-neutral-800">
          {resume.email}
          {resume.phones.length > 0 && ` | ${resume.phones.join(' | ')}`}
          {resume.location && ` | ${resume.location}`}
        </p>

        <p className="mt-0.5 text-[10px] text-neutral-800">
          {resume.linkedin && (
            <>
              LinkedIn:{' '}
              <span className="underline decoration-neutral-400 underline-offset-2">
                {resume.linkedin}
              </span>
            </>
          )}
          {resume.github && (
            <>
              {' '}
              | GitHub:{' '}
              <a
                href={`https://github.com/${resume.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-neutral-400 underline-offset-2"
              >
                {resume.github}
              </a>
            </>
          )}
          {resume.portfolio && (
            <>
              {' '}
              | Portfolio:{' '}
              <a
                href={
                  resume.portfolio.startsWith('http')
                    ? resume.portfolio
                    : `https://${resume.portfolio}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-neutral-400 underline-offset-2"
              >
                {resume.portfolio}
              </a>
            </>
          )}
        </p>
      </header>

      {/* Optional Tailored Summary */}
      {showSummary && resume.tailoredSummary && (
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
            <textarea
              rows={2}
              value={resume.tailoredSummary}
              onChange={(e) =>
                onUpdateResume({
                  ...resume,
                  tailoredSummary: e.target.value,
                })
              }
              className="w-full resize-none bg-transparent text-[10.5px] focus:outline-none"
            />
          ) : (
            <p>{renderFormattedLine(resume.tailoredSummary, highlightActive && isTailoredVariant)}</p>
          )}
        </section>
      )}

      {/* EXPERIENCE */}
      <section className="mt-3">
        <h2 className="border-b-[1.5px] border-black pb-0.5 text-[11px] font-bold tracking-wider text-black uppercase">
          Experience
        </h2>

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
              <div key={exp.id || `${exp.role}-${expIdx}`}>
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
                <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-neutral-900">
                  {exp.bullets.map((bullet, bIdx) => {
                    const isBulletDiff =
                      highlightActive && !refSets.expBullets.has(bullet.trim());
                    return (
                      <li
                        key={bIdx}
                        className={cn(isBulletDiff && changedBoxClass)}
                      >
                        {canEdit && onUpdateResume ? (
                          <textarea
                            rows={2}
                            value={bullet}
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
                            className="w-full rounded border border-neutral-300 px-1.5 py-0.5 text-[10px] focus:outline-none"
                          />
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
              </div>
            );
          })}
        </div>
      </section>

      {/* PROJECTS */}
      {resume.projects.length > 0 && (
        <section className="mt-3">
          <h2 className="border-b-[1.5px] border-black pb-0.5 text-[11px] font-bold tracking-wider text-black uppercase">
            Projects
          </h2>
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
                  className={cn(droppedInTailor && changedBoxClass)}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="inline-flex flex-wrap items-center gap-1.5 font-bold text-black">
                      <span>{proj.name}</span>
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
                  <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-neutral-900">
                    {proj.bullets.map((bullet, idx) => {
                      const isBulletDiff =
                        highlightActive &&
                        !refSets.projBullets.has(bullet.trim());
                      return (
                        <li
                          key={idx}
                          className={cn(isBulletDiff && changedBoxClass)}
                        >
                          {renderFormattedLine(
                            bullet,
                            highlightActive && isTailoredVariant
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TECHNICAL SKILLS */}
      {resume.skillCategories.length > 0 && (
        <section className="mt-3">
          <h2 className="border-b-[1.5px] border-black pb-0.5 text-[11px] font-bold tracking-wider text-black uppercase">
            Technical Skills
          </h2>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-neutral-900">
            {resume.skillCategories.map((cat, idx) => {
              const refItems = refSets.skillMap.get(
                cat.category.trim().toLowerCase()
              );
              const skillDiff =
                highlightActive &&
                (refItems === undefined || refItems !== cat.items.trim());

              return (
                <li
                  key={cat.category}
                  className={cn(skillDiff && changedBoxClass)}
                >
                  <strong className="font-bold text-black">
                    {cat.category}:{' '}
                  </strong>
                  {canEdit && onUpdateResume ? (
                    <input
                      type="text"
                      value={cat.items}
                      onChange={(e) => {
                        const nextCats = [...resume.skillCategories];
                        nextCats[idx] = {
                          ...nextCats[idx],
                          items: e.target.value,
                        };
                        onUpdateResume({
                          ...resume,
                          skillCategories: nextCats,
                        });
                      }}
                      className="w-full rounded border border-neutral-300 px-1 py-0.5 text-[10px]"
                    />
                  ) : (
                    <span>{cat.items}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* CERTIFICATIONS */}
      {resume.certifications.length > 0 && (
        <section className="mt-3">
          <h2 className="border-b-[1.5px] border-black pb-0.5 text-[11px] font-bold tracking-wider text-black uppercase">
            Certifications
          </h2>
          <ul className="mt-1.5 grid list-disc grid-cols-1 gap-x-6 gap-y-0.5 pl-4 text-neutral-900 sm:grid-cols-2">
            {resume.certifications.map((cert, idx) => (
              <li key={idx}>{cert}</li>
            ))}
          </ul>
        </section>
      )}

      {/* EDUCATION */}
      {resume.education.length > 0 && (
        <section className="mt-3">
          <h2 className="border-b-[1.5px] border-black pb-0.5 text-[11px] font-bold tracking-wider text-black uppercase">
            Education
          </h2>
          <div className="mt-1.5 space-y-1">
            {resume.education.map((edu, idx) => (
              <div key={idx}>
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
  personalApiConfigured = true,
  tailoring,
  onUpdateGeminiKey,
  onTailorResume,
  onUpdateResume,
  onResetResume,
}: A4ResumePreviewProps) {
  const [editMode, setEditMode] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [highlightChanges, setHighlightChanges] = useState(true);
  const [selectedRoleForFix, setSelectedRoleForFix] = useState(
    profile.primaryRole || 'Data Analyst'
  );

  const tokens = getThemeTokens(theme);
  const isDark = tokens.isDark;
  const surfaceClass = tokens.cardSurface;
  const buttonOutlineClass = tokens.secondaryBtn;

  const baseResume = profile.structuredResume;
  const isTailored = Boolean(
    activeResume.tailorMethod && activeResume.tailorMethod !== 'base'
  );

  const pageSize: ResumePageSize = activeResume.pageSize || 'a4';
  const density: ResumeDensity = activeResume.density || 'standard';
  const fontFamilyKey: ResumeFontFamily = activeResume.fontFamily || 'calibri';
  const sizePreset = PAGE_SIZE_PRESETS[pageSize] || PAGE_SIZE_PRESETS.a4;
  const densityPreset = DENSITY_PRESETS[density] || DENSITY_PRESETS.standard;
  const fontPreset =
    ATS_FONT_PRESETS[fontFamilyKey] || ATS_FONT_PRESETS.calibri;
  const aiReady = personalApiConfigured || Boolean(geminiApiKey.trim());

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

    activeResume.experience.forEach((exp, idx) => {
      const orig = baseExpOrder.get(exp.id || exp.role.trim().toLowerCase());
      if (orig !== undefined && orig !== idx) reorderedCount++;
      exp.bullets.forEach((b) => {
        if (!baseExpBullets.has(b.trim())) bulletsModified++;
      });
    });

    activeResume.projects.forEach((proj, idx) => {
      const orig = baseProjOrder.get(proj.id || proj.name.trim().toLowerCase());
      if (orig !== undefined && orig !== idx) reorderedCount++;
      proj.bullets.forEach((b) => {
        if (!baseProjBullets.has(b.trim())) bulletsModified++;
      });
    });

    let skillsUpdated = 0;
    activeResume.skillCategories.forEach((c) => {
      const orig = baseSkillMap.get(c.category.trim().toLowerCase());
      if (orig === undefined || orig !== c.items.trim()) skillsUpdated++;
    });

    const headlineUpdated =
      activeResume.targetHeadline.trim() !== baseResume.targetHeadline.trim();
    const summaryAdded = Boolean(
      activeResume.tailoredSummary &&
        activeResume.tailoredSummary.trim() !==
          (baseResume.tailoredSummary || '').trim()
    );

    return {
      headlineUpdated,
      summaryAdded,
      bulletsModified,
      skillsUpdated,
      reorderedCount,
    };
  }, [activeResume, baseResume, isTailored]);

  const roleChoices = Array.from(
    new Set([
      profile.primaryRole,
      ...(profile.preferredRoles || []),
      ...(profile.customRoles || []),
    ])
  ).filter(Boolean);

  const handlePrint = () => {
    window.print();
  };

  const sheetClassName = cn(
    'w-full bg-white text-black shadow-xl ring-1 ring-black/10 transition-all',
    sizePreset.sheetClass,
    densityPreset.padClass,
    densityPreset.textClass
  );
  const sheetStyle: CSSProperties = {
    fontFamily: fontPreset.fontFamily,
    fontVariantLigatures: 'none',
  };

  return (
    <div className="flex flex-col gap-3">
      <style>{`@media print { @page { size: ${sizePreset.printPageSize}; margin: 8mm; } #a4-resume-sheet { font-family: ${fontPreset.fontFamily} !important; font-variant-ligatures: none !important; } }`}</style>

      {/* Studio Controls Toolbar */}
      <div
        className={cn(
          'no-print rounded-lg border p-3.5 space-y-3',
          surfaceClass
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">Resume Studio</span>
              <span
                className={cn(
                  'rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase leading-none',
                  isDark
                    ? 'border-blue-500/35 bg-blue-500/15 text-blue-300'
                    : 'border-[#0a66c2]/25 bg-[#0a66c2]/10 text-[#0a66c2]'
                )}
              >
                AI
              </span>
              <span
                className={cn(
                  'rounded border px-2 py-0.5 text-[11px] font-medium',
                  activeResume.tailorMethod === 'gemini-ai'
                    ? tokens.primaryBtn
                    : activeResume.tailorMethod === 'smart-engine'
                      ? tokens.orangeBadge
                      : tokens.subSurface
                )}
              >
                {activeResume.tailorMethod === 'gemini-ai'
                  ? 'Personal Gemini AI'
                  : activeResume.tailorMethod === 'smart-engine'
                    ? 'Auto-Tailored'
                    : `Base ${sizePreset.shortLabel} CV`}
              </span>
              <span
                className={cn(
                  'rounded border px-2 py-0.5 font-mono text-[11px]',
                  tokens.subSurface,
                  tokens.mutedText
                )}
              >
                {sizePreset.shortLabel} • {fontPreset.shortLabel} •{' '}
                {sizePreset.dimensionsLabel}
              </span>
            </div>
            <p className={cn('text-xs', tokens.mutedText)}>
              {activeResume.tailoredForJobTitle
                ? `Tailored for: ${activeResume.tailoredForJobTitle}${
                    activeResume.tailoredForCompany
                      ? ` @ ${activeResume.tailoredForCompany}`
                      : ''
                  }`
                : 'Dynamic resume sheet (default A4). Adjust size, ATS font, or AI-tailor below.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {aiReady ? (
              <button
                type="button"
                onClick={() => setShowKeyInput((v) => !v)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                  isDark
                    ? 'border-emerald-700/70 bg-emerald-950/60 text-emerald-300'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                )}
                title="Personal Gemini API key from .env is active (click to override)"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{geminiApiKey ? 'Custom AI Key' : 'Personal AI Active'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowKeyInput((v) => !v)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                  buttonOutlineClass
                )}
                title="Optional Gemini API Key override"
              >
                <KeyRound className="h-3.5 w-3.5" />
                Gemini API
              </button>
            )}

            <button
              type="button"
              onClick={() => setEditMode((v) => !v)}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                editMode ? tokens.primaryBtn : buttonOutlineClass
              )}
            >
              {editMode ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Done Editing
                </>
              ) : (
                <>
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit Resume
                </>
              )}
            </button>

            {isTailored && (
              <button
                type="button"
                onClick={() => {
                  setCompareMode(false);
                  onResetResume();
                }}
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                  buttonOutlineClass
                )}
                title="Reset to base resume"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors',
                tokens.primaryBtn
              )}
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF ({sizePreset.shortLabel})
            </button>
          </div>
        </div>

        {/* Tailor, Dynamic Sizing & Top-5 AI-ATS Font Bar */}
        <div
          className={cn(
            'flex flex-wrap items-center gap-2 border-t pt-2.5',
            tokens.borderSubtle
          )}
        >
          <select
            value={selectedRoleForFix}
            onChange={(e) => setSelectedRoleForFix(e.target.value)}
            aria-label="Target role for AI tailoring"
            className={cn(
              'min-w-[160px] flex-1 rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none',
              tokens.inputSurface
            )}
          >
            {roleChoices.map((role) => (
              <option key={role} value={role}>
                Target role: {role}
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
            aria-label="Resume page size"
            className={cn(
              'rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none',
              tokens.inputSurface
            )}
          >
            {(Object.keys(PAGE_SIZE_PRESETS) as ResumePageSize[]).map((key) => (
              <option key={key} value={key}>
                Size: {PAGE_SIZE_PRESETS[key].label}
              </option>
            ))}
          </select>

          <select
            value={fontFamilyKey}
            onChange={(e) =>
              onUpdateResume({
                ...activeResume,
                fontFamily: e.target.value as ResumeFontFamily,
              })
            }
            aria-label="ATS Resume Font"
            className={cn(
              'rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none',
              tokens.inputSurface
            )}
          >
            {(Object.keys(ATS_FONT_PRESETS) as ResumeFontFamily[]).map((key) => (
              <option key={key} value={key}>
                Font: {ATS_FONT_PRESETS[key].label}
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
            aria-label="Resume density"
            className={cn(
              'rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none',
              tokens.inputSurface
            )}
          >
            {(Object.keys(DENSITY_PRESETS) as ResumeDensity[]).map((key) => (
              <option key={key} value={key}>
                Density: {DENSITY_PRESETS[key].label}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={tailoring}
            onClick={() => onTailorResume(activeTailorJob, selectedRoleForFix)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors disabled:opacity-50',
              tokens.contrastBtn
            )}
          >
            {tailoring ? 'Tailoring with AI...' : 'AI Tailor for Role'}
          </button>

          <label
            className={cn(
              'inline-flex cursor-pointer items-center gap-1.5 text-xs',
              tokens.mutedText
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

        {/* ATS Font Guide + AI Tailor Compare & Highlight Bar */}
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-2 border-t pt-2',
            tokens.borderSubtle
          )}
        >
          <p className={cn('text-[11px]', tokens.mutedText)}>
            ATS Font Guide:{' '}
            <strong className={cn('font-semibold', tokens.strongText)}>
              {fontPreset.shortLabel}
            </strong>{' '}
            ({fontPreset.category}) — {fontPreset.atsNote} • Ligatures disabled for
            AI PDF parsing.
          </p>

          {isTailored && (
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
                onClick={() => setHighlightChanges((v) => !v)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                  highlightChanges ? tokens.primaryBtn : buttonOutlineClass
                )}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>
                  {highlightChanges ? '✓ Highlights ON' : 'Highlight AI Changes'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCompareMode((v) => !v)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                  compareMode ? tokens.primaryBtn : buttonOutlineClass
                )}
              >
                <Columns2 className="h-3.5 w-3.5" />
                <span>
                  {compareMode ? '✓ Side-by-Side Active' : 'Side-by-Side Compare'}
                </span>
              </button>
            </div>
          )}
        </div>

        {showKeyInput && (
          <div
            className={cn(
              'flex flex-wrap items-center gap-2 rounded-lg border p-2.5 text-xs',
              tokens.subSurface
            )}
          >
            <input
              type="password"
              value={geminiApiKey}
              onChange={(e) => onUpdateGeminiKey(e.target.value)}
              placeholder="Optional browser override key — leave blank to use your personal .env GEMINI_API_KEY"
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

        {activeResume.tailorNotes && activeResume.tailorNotes.length > 0 && (
          <div
            className={cn(
              'rounded-lg border px-3 py-2 text-xs',
              tokens.subSurface
            )}
          >
            <div className="mb-1 font-semibold">
              Changes applied to your {sizePreset.shortLabel} resume sheet:
            </div>
            <ul className={cn('list-disc space-y-0.5 pl-4', tokens.mutedText)}>
              {activeResume.tailorNotes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Dynamic Resume Paper Preview (Single Sheet or Side-by-Side Comparison) */}
      <div
        className={cn(
          'print-only-container rounded-lg border p-3 sm:p-5',
          compareMode && isTailored
            ? 'grid grid-cols-1 items-start gap-5 xl:grid-cols-2'
            : 'flex justify-center overflow-x-auto',
          isDark
            ? 'border-slate-800 bg-slate-900/70'
            : 'border-slate-300 bg-slate-200/70'
        )}
      >
        {compareMode && isTailored && (
          <div className="no-print flex min-w-0 flex-col items-center gap-2">
            <div
              className={cn(
                'flex w-full items-center justify-between rounded-lg border px-3 py-1.5 text-xs',
                tokens.cardSurface
              )}
            >
              <span className="font-semibold">
                Before • Base Profile Resume
              </span>
              {highlightChanges && (
                <span className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                  Amber = modified or trimmed by AI
                </span>
              )}
            </div>
            <div className="flex w-full justify-center overflow-x-auto pb-2">
              <ResumeSheetDocument
                variant="base"
                resume={baseResume}
                compareReference={activeResume}
                showSummary={showSummary}
                showHighlights={highlightChanges}
                isTailored={isTailored}
                editMode={false}
                className={sheetClassName}
                style={sheetStyle}
              />
            </div>
          </div>
        )}

        <div
          className={cn(
            compareMode && isTailored
              ? 'flex min-w-0 flex-col items-center gap-2 print:block print:w-full'
              : 'w-full flex justify-center'
          )}
        >
          {compareMode && isTailored && (
            <div
              className={cn(
                'no-print flex w-full items-center justify-between rounded-lg border px-3 py-1.5 text-xs',
                tokens.cardSurface
              )}
            >
              <span className="font-semibold">
                After • AI Tailored Resume (Print Active)
              </span>
              {highlightChanges && (
                <span className="inline-flex items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-900">
                  ✓ Green = AI rewritten, reordered, or bolded
                </span>
              )}
            </div>
          )}

          <div
            className={cn(
              compareMode && isTailored
                ? 'flex w-full justify-center overflow-x-auto pb-2 print:block print:overflow-visible print:pb-0'
                : 'w-full flex justify-center print:block'
            )}
          >
            <ResumeSheetDocument
              sheetId="a4-resume-sheet"
              variant="tailored"
              resume={activeResume}
              compareReference={baseResume}
              showSummary={showSummary}
              showHighlights={highlightChanges}
              isTailored={isTailored}
              editMode={editMode}
              className={sheetClassName}
              style={sheetStyle}
              onUpdateResume={onUpdateResume}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

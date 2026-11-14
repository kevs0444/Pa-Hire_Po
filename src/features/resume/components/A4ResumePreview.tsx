'use client';

import { Fragment, useState } from 'react';
import {
  Check,
  Edit3,
  KeyRound,
  Printer,
  RotateCcw,
} from 'lucide-react';
import {
  JobListing,
  MonochromeTheme,
  ResumeDensity,
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

function renderFormattedLine(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-black">
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
  const [selectedRoleForFix, setSelectedRoleForFix] = useState(
    profile.primaryRole || 'Data Analyst'
  );

  const tokens = getThemeTokens(theme);
  const isDark = tokens.isDark;
  const surfaceClass = tokens.cardSurface;
  const buttonOutlineClass = tokens.secondaryBtn;

  const pageSize: ResumePageSize = activeResume.pageSize || 'a4';
  const density: ResumeDensity = activeResume.density || 'standard';
  const sizePreset = PAGE_SIZE_PRESETS[pageSize] || PAGE_SIZE_PRESETS.a4;
  const densityPreset = DENSITY_PRESETS[density] || DENSITY_PRESETS.standard;
  const aiReady = personalApiConfigured || Boolean(geminiApiKey.trim());

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

  return (
    <div className="flex flex-col gap-3">
      <style>{`@media print { @page { size: ${sizePreset.printPageSize}; margin: 8mm; } }`}</style>

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
              <span className="text-sm font-semibold">
                Resume Studio
              </span>
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
                {sizePreset.shortLabel} • {sizePreset.dimensionsLabel}
              </span>
            </div>
            <p className={cn('text-xs', tokens.mutedText)}>
              {activeResume.tailoredForJobTitle
                ? `Tailored for: ${activeResume.tailoredForJobTitle}${
                    activeResume.tailoredForCompany
                      ? ` @ ${activeResume.tailoredForCompany}`
                      : ''
                  }`
                : 'Dynamic resume sheet (default A4). Adjust page size or tailor for a target role below.'}
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

            {activeResume.tailorMethod !== 'base' && (
              <button
                type="button"
                onClick={onResetResume}
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

        {/* Tailor & Dynamic Sizing Bar */}
        <div className={cn('flex flex-wrap items-center gap-2 border-t pt-2.5', tokens.borderSubtle)}>
          <select
            value={selectedRoleForFix}
            onChange={(e) => setSelectedRoleForFix(e.target.value)}
            aria-label="Target role for AI tailoring"
            className={cn(
              'min-w-[170px] flex-1 rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none',
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

          <label className={cn('inline-flex cursor-pointer items-center gap-1.5 text-xs', tokens.mutedText)}>
            <input
              type="checkbox"
              checked={showSummary}
              onChange={(e) => setShowSummary(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            <span>Show Tailored Summary</span>
          </label>
        </div>

        {showKeyInput && (
          <div className={cn('flex flex-wrap items-center gap-2 rounded-lg border p-2.5 text-xs', tokens.subSurface)}>
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

      {/* Dynamic Resume Paper Preview (Default A4) */}
      <div
        className={cn(
          'print-only-container flex justify-center overflow-x-auto rounded-lg border p-3 sm:p-5',
          isDark
            ? 'border-slate-800 bg-slate-900/70'
            : 'border-slate-300 bg-slate-200/70'
        )}
      >
        <div
          id="a4-resume-sheet"
          className={cn(
            'w-full bg-white text-black shadow-xl ring-1 ring-black/10 font-sans transition-all',
            sizePreset.sheetClass,
            densityPreset.padClass,
            densityPreset.textClass
          )}
        >
          {/* Header */}
          <header className="text-center">
            {editMode ? (
              <input
                type="text"
                value={activeResume.fullName}
                onChange={(e) =>
                  onUpdateResume({ ...activeResume, fullName: e.target.value })
                }
                className="w-full border-b border-neutral-300 text-center text-2xl font-extrabold tracking-tight uppercase focus:outline-none"
              />
            ) : (
              <h1 className="text-[22px] font-extrabold tracking-tight text-black uppercase">
                {activeResume.fullName}
              </h1>
            )}

            {editMode ? (
              <input
                type="text"
                value={activeResume.targetHeadline}
                onChange={(e) =>
                  onUpdateResume({
                    ...activeResume,
                    targetHeadline: e.target.value,
                  })
                }
                className="mt-0.5 w-full border-b border-neutral-200 text-center text-[11px] font-semibold text-neutral-700 focus:outline-none"
              />
            ) : (
              activeResume.targetHeadline && (
                <p className="mt-0.5 text-[10.5px] font-semibold tracking-wide text-neutral-700">
                  {activeResume.targetHeadline}
                </p>
              )
            )}

            <p className="mt-1 text-[10px] text-neutral-800">
              {activeResume.email}
              {activeResume.phones.length > 0 &&
                ` | ${activeResume.phones.join(' | ')}`}
              {activeResume.location && ` | ${activeResume.location}`}
            </p>

            <p className="mt-0.5 text-[10px] text-neutral-800">
              {activeResume.linkedin && (
                <>
                  LinkedIn:{' '}
                  <span className="underline decoration-neutral-400 underline-offset-2">
                    {activeResume.linkedin}
                  </span>
                </>
              )}
              {activeResume.github && (
                <>
                  {' '}
                  | GitHub:{' '}
                  <a
                    href={`https://github.com/${activeResume.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-neutral-400 underline-offset-2"
                  >
                    {activeResume.github}
                  </a>
                </>
              )}
              {activeResume.portfolio && (
                <>
                  {' '}
                  | Portfolio:{' '}
                  <a
                    href={
                      activeResume.portfolio.startsWith('http')
                        ? activeResume.portfolio
                        : `https://${activeResume.portfolio}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-neutral-400 underline-offset-2"
                  >
                    {activeResume.portfolio}
                  </a>
                </>
              )}
            </p>
          </header>

          {/* Optional Tailored Summary */}
          {showSummary && activeResume.tailoredSummary && (
            <section className="mt-2.5 border-l-2 border-black bg-neutral-50 px-2.5 py-1.5 text-[10.5px] text-neutral-900">
              {editMode ? (
                <textarea
                  rows={2}
                  value={activeResume.tailoredSummary}
                  onChange={(e) =>
                    onUpdateResume({
                      ...activeResume,
                      tailoredSummary: e.target.value,
                    })
                  }
                  className="w-full resize-none bg-transparent text-[10.5px] focus:outline-none"
                />
              ) : (
                <p>{renderFormattedLine(activeResume.tailoredSummary)}</p>
              )}
            </section>
          )}

          {/* EXPERIENCE */}
          <section className="mt-3">
            <h2 className="border-b-[1.5px] border-black pb-0.5 text-[11px] font-bold tracking-wider text-black uppercase">
              Experience
            </h2>

            <div className="mt-1.5 space-y-2.5">
              {activeResume.experience.map((exp, expIdx) => (
                <div key={exp.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-black">{exp.role}</span>
                    <span className="shrink-0 font-semibold text-neutral-900">
                      {exp.period}
                    </span>
                  </div>
                  <p className="italic text-neutral-800">
                    {exp.company}
                    {exp.location ? ` | ${exp.location}` : ''}
                  </p>
                  <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-neutral-900">
                    {exp.bullets.map((bullet, bIdx) => (
                      <li key={bIdx}>
                        {editMode ? (
                          <textarea
                            rows={2}
                            value={bullet}
                            onChange={(e) => {
                              const nextExp = [...activeResume.experience];
                              const nextBullets = [...nextExp[expIdx].bullets];
                              nextBullets[bIdx] = e.target.value;
                              nextExp[expIdx] = {
                                ...nextExp[expIdx],
                                bullets: nextBullets,
                              };
                              onUpdateResume({
                                ...activeResume,
                                experience: nextExp,
                              });
                            }}
                            className="w-full rounded border border-neutral-300 px-1.5 py-0.5 text-[10px] focus:outline-none"
                          />
                        ) : (
                          renderFormattedLine(bullet)
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* PROJECTS */}
          {activeResume.projects.length > 0 && (
            <section className="mt-3">
              <h2 className="border-b-[1.5px] border-black pb-0.5 text-[11px] font-bold tracking-wider text-black uppercase">
                Projects
              </h2>
              <div className="mt-1.5 space-y-2">
                {activeResume.projects.map((proj) => (
                  <div key={proj.id}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-bold text-black">{proj.name}</span>
                      <span className="shrink-0 font-semibold text-neutral-900">
                        {proj.period}
                      </span>
                    </div>
                    {proj.subtitle && (
                      <p className="italic text-neutral-800">{proj.subtitle}</p>
                    )}
                    <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-neutral-900">
                      {proj.bullets.map((bullet, idx) => (
                        <li key={idx}>{renderFormattedLine(bullet)}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* TECHNICAL SKILLS */}
          {activeResume.skillCategories.length > 0 && (
            <section className="mt-3">
              <h2 className="border-b-[1.5px] border-black pb-0.5 text-[11px] font-bold tracking-wider text-black uppercase">
                Technical Skills
              </h2>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-neutral-900">
                {activeResume.skillCategories.map((cat, idx) => (
                  <li key={cat.category}>
                    <strong className="font-bold text-black">
                      {cat.category}:{' '}
                    </strong>
                    {editMode ? (
                      <input
                        type="text"
                        value={cat.items}
                        onChange={(e) => {
                          const nextCats = [...activeResume.skillCategories];
                          nextCats[idx] = {
                            ...nextCats[idx],
                            items: e.target.value,
                          };
                          onUpdateResume({
                            ...activeResume,
                            skillCategories: nextCats,
                          });
                        }}
                        className="w-full rounded border border-neutral-300 px-1 py-0.5 text-[10px]"
                      />
                    ) : (
                      <span>{cat.items}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* CERTIFICATIONS */}
          {activeResume.certifications.length > 0 && (
            <section className="mt-3">
              <h2 className="border-b-[1.5px] border-black pb-0.5 text-[11px] font-bold tracking-wider text-black uppercase">
                Certifications
              </h2>
              <ul className="mt-1.5 grid list-disc grid-cols-1 gap-x-6 gap-y-0.5 pl-4 text-neutral-900 sm:grid-cols-2">
                {activeResume.certifications.map((cert, idx) => (
                  <li key={idx}>{cert}</li>
                ))}
              </ul>
            </section>
          )}

          {/* EDUCATION */}
          {activeResume.education.length > 0 && (
            <section className="mt-3">
              <h2 className="border-b-[1.5px] border-black pb-0.5 text-[11px] font-bold tracking-wider text-black uppercase">
                Education
              </h2>
              <div className="mt-1.5 space-y-1">
                {activeResume.education.map((edu, idx) => (
                  <div key={idx}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-bold text-black">
                        {edu.degree}
                      </span>
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
      </div>
    </div>
  );
}

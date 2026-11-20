'use client';

import { useId, useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Link2,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import type {
  MonochromeTheme,
  ResumeHeaderLink,
  StructuredResume,
} from '@/types/job';
import {
  applyHeaderLinksToResume,
  createHeaderLinkId,
  extractSmartLinkPaste,
  getEffectiveHeaderLinks,
  inferLinkKind,
  normalizeHttpUrl,
  resolveResumeHeaderLink,
  type ResumeLinkKind,
} from '@/features/resume/lib/resume-links';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

export interface ResumeLinksEditorProps {
  resume: StructuredResume;
  theme: MonochromeTheme;
  variant?: 'panel' | 'sheet';
  onChangeResume: (next: StructuredResume) => void;
  onFocusLinkLabel?: (linkId: string, element: HTMLInputElement) => void;
}

const PRESET_LINKS: Array<{
  kind: ResumeLinkKind;
  platform: string;
  labelPlaceholder: string;
  urlPlaceholder: string;
}> = [
  {
    kind: 'linkedin',
    platform: 'LinkedIn',
    labelPlaceholder: 'Display text (e.g. Mar Kevin Alcantara)',
    urlPlaceholder: 'https://www.linkedin.com/in/your-handle',
  },
  {
    kind: 'github',
    platform: 'GitHub',
    labelPlaceholder: 'Handle or label (e.g. kevs0444)',
    urlPlaceholder: 'https://github.com/username',
  },
  {
    kind: 'portfolio',
    platform: 'Portfolio',
    labelPlaceholder: 'Site name (e.g. yoursite.vercel.app)',
    urlPlaceholder: 'https://your-portfolio.com',
  },
];

export function ResumeLinksEditor({
  resume,
  theme,
  variant = 'panel',
  onChangeResume,
  onFocusLinkLabel,
}: ResumeLinksEditorProps) {
  const baseId = useId();
  const tokens = getThemeTokens(theme);
  const isSheet = variant === 'sheet';

  // Defer invalid-URL warnings until the user edits and blurs a field
  const [blurredKeys, setBlurredKeys] = useState<Record<string, boolean>>({});
  const [dirtyKeys, setDirtyKeys] = useState<Record<string, boolean>>({});

  const links = getEffectiveHeaderLinks(resume);
  const isSectionRemoved = Boolean(resume.hideHeaderLinks);

  const presentKinds = new Set(
    links.map((item) => inferLinkKind(item.platform, item.kind))
  );

  const markDirty = (key: string) => {
    setDirtyKeys((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
    setBlurredKeys((prev) => (prev[key] ? { ...prev, [key]: false } : prev));
  };

  const markBlurred = (key: string) => {
    setBlurredKeys((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  const commitLinks = (nextLinks: ResumeHeaderLink[], hideSection = false) => {
    onChangeResume(applyHeaderLinksToResume(resume, nextLinks, hideSection));
  };

  const handleAddPresetLink = (kind: ResumeLinkKind, platform: string) => {
    const newItem: ResumeHeaderLink = {
      id: createHeaderLinkId(
        kind,
        links.map((l) => l.id)
      ),
      kind,
      platform,
      label: '',
      url: '',
    };
    commitLinks([...links, newItem], false);
  };

  const handleMoveLink = (idx: number, direction: -1 | 1) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= links.length) return;
    const next = [...links];
    const temp = next[targetIdx];
    next[targetIdx] = next[idx];
    next[idx] = temp;
    commitLinks(next, false);
  };

  const handleUpdateLink = (idx: number, patch: Partial<ResumeHeaderLink>) => {
    const next = [...links];
    if (!next[idx]) return;
    next[idx] = { ...next[idx], ...patch };
    commitLinks(next, false);
  };

  const handleDeleteLink = (idx: number) => {
    const next = links.filter((_, i) => i !== idx);
    commitLinks(next, false);
  };

  const handleRemoveSection = () => {
    // Preserve current ordered links in `headerLinks` so Restore recovers everything cleanly
    onChangeResume({
      ...resume,
      headerLinks: links,
      hideHeaderLinks: true,
    });
  };

  const handleRestoreSection = () => {
    const savedLinks = Array.isArray(resume.headerLinks)
      ? resume.headerLinks
      : [];
    if (savedLinks.length > 0) {
      commitLinks(savedLinks, false);
      return;
    }
    commitLinks(
      PRESET_LINKS.map((p, i) => ({
        id: `std-${p.kind}-${i + 1}`,
        kind: p.kind,
        platform: p.platform,
        label: '',
        url: '',
      })),
      false
    );
  };

  const inputClass = isSheet
    ? 'w-full rounded border border-neutral-300 bg-white px-1.5 py-0.5 text-[10px] text-neutral-900 placeholder:text-neutral-400 focus:border-[#0a66c2] focus:outline-none'
    : cn(
        'w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none',
        tokens.inputSurface
      );

  const invalidInputClass = isSheet
    ? 'border-red-600 bg-red-50/70'
    : tokens.isDark
      ? 'border-red-500 bg-red-950/35'
      : 'border-red-600 bg-red-50/80';

  const rowBoxClass = isSheet
    ? 'rounded border border-neutral-200 bg-white/90 p-1.5'
    : cn('rounded-lg border p-2.5', tokens.subSurface, tokens.borderSubtle);

  const labelTextClass = isSheet
    ? 'text-[9.5px] font-semibold text-neutral-700'
    : cn('text-[11px] font-semibold', tokens.strongText);

  const hintTextClass = isSheet
    ? 'text-[9px] text-neutral-500'
    : cn('text-[11px]', tokens.mutedText);

  const toolbarBtnClass = isSheet
    ? 'no-print inline-flex items-center gap-1 rounded border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-[9.5px] font-semibold text-neutral-900 transition-colors hover:bg-neutral-200'
    : cn(
        'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors',
        tokens.secondaryBtn
      );

  const iconMoveBtnClass = isSheet
    ? 'no-print rounded p-0.5 text-neutral-700 hover:bg-neutral-200 disabled:opacity-30'
    : cn(
        'rounded p-0.5 transition-colors disabled:opacity-30',
        tokens.mutedText,
        tokens.isDark ? 'hover:bg-zinc-700/60' : 'hover:bg-slate-200/70'
      );

  const deleteSectionBtnClass = isSheet
    ? 'no-print inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[9.5px] font-semibold text-red-700 transition-colors hover:bg-red-100'
    : cn(
        'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors',
        tokens.isDark
          ? 'border-red-700/70 bg-red-950/40 text-red-300 hover:bg-red-950/70'
          : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
      );

  const validBadgeClass = isSheet
    ? 'inline-flex items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-1.5 py-0 text-[9px] font-semibold text-emerald-800'
    : cn(
        'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10.5px] font-medium',
        tokens.badgeSuccess
      );

  const errorTextClass = isSheet
    ? 'mt-0.5 flex items-center gap-1 text-[9px] font-medium text-red-700'
    : cn(
        'mt-1 flex items-center gap-1 text-[11px] font-medium',
        tokens.isDark ? 'text-red-300' : 'text-red-700'
      );

  return (
    <div className={cn(isSheet ? 'space-y-1.5 text-left' : 'space-y-2.5')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Link2
            className={cn(
              isSheet ? 'h-3 w-3 text-neutral-700' : 'h-3.5 w-3.5',
              !isSheet && tokens.mutedText
            )}
            aria-hidden="true"
          />
          <span
            className={cn(
              isSheet
                ? 'text-[10px] font-bold text-neutral-900'
                : cn('text-xs font-semibold', tokens.strongText)
            )}
          >
            Header Links Subsection ({links.length})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {!presentKinds.has('linkedin') && !isSectionRemoved && (
            <button
              type="button"
              onClick={() => handleAddPresetLink('linkedin', 'LinkedIn')}
              className={toolbarBtnClass}
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
              LinkedIn
            </button>
          )}
          {!presentKinds.has('github') && !isSectionRemoved && (
            <button
              type="button"
              onClick={() => handleAddPresetLink('github', 'GitHub')}
              className={toolbarBtnClass}
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
              GitHub
            </button>
          )}
          {!presentKinds.has('portfolio') && !isSectionRemoved && (
            <button
              type="button"
              onClick={() => handleAddPresetLink('portfolio', 'Portfolio')}
              className={toolbarBtnClass}
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
              Portfolio
            </button>
          )}
          {!isSectionRemoved && (
            <button
              type="button"
              onClick={() => handleAddPresetLink('custom', 'Kaggle')}
              className={toolbarBtnClass}
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
              Add Link
            </button>
          )}
          {!isSectionRemoved && links.length > 0 && (
            <button
              type="button"
              onClick={handleRemoveSection}
              className={deleteSectionBtnClass}
              title="Remove the entire links subsection from your resume header"
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
              Remove Links Section
            </button>
          )}
        </div>
      </div>

      {isSectionRemoved ? (
        <div
          className={cn(
            rowBoxClass,
            'flex flex-wrap items-center justify-between gap-2'
          )}
        >
          <span className={hintTextClass}>
            Links subsection removed — no links will appear in your resume header or PDF.
          </span>
          <button
            type="button"
            onClick={handleRestoreSection}
            className={toolbarBtnClass}
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            Restore Links Section
          </button>
        </div>
      ) : links.length === 0 ? (
        <div
          className={cn(
            rowBoxClass,
            'flex flex-wrap items-center justify-between gap-2'
          )}
        >
          <span className={hintTextClass}>
            No links added. Use the buttons above to add LinkedIn, GitHub, Portfolio, or custom links.
          </span>
          <button
            type="button"
            onClick={handleRemoveSection}
            className={deleteSectionBtnClass}
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
            Hide Links Section
          </button>
        </div>
      ) : (
        <div className={cn(isSheet ? 'space-y-1' : 'space-y-2')}>
          {links.map((item, idx) => {
            const linkKind = inferLinkKind(item.platform, item.kind);
            const presetMeta =
              PRESET_LINKS.find((p) => p.kind === linkKind) || null;
            const resolved = resolveResumeHeaderLink(
              linkKind,
              item.label,
              item.url
            );
            const fieldKey = `hdr-${item.id || idx}`;
            const showError =
              Boolean(blurredKeys[fieldKey]) &&
              Boolean(dirtyKeys[fieldKey]) &&
              resolved.hasExplicitInvalidUrl;

            const platId = `${baseId}-plat-${idx}`;
            const lblId = `${baseId}-lbl-${idx}`;
            const urlId = `${baseId}-url-${idx}`;
            const errId = `${baseId}-err-${idx}`;

            const urlPlaceholder = presetMeta?.urlPlaceholder || 'https://...';
            const labelPlaceholder =
              presetMeta?.labelPlaceholder || 'Display text (e.g. Kaggle Profile)';

            return (
              <div key={item.id || idx} className={rowBoxClass}>
                <div className="mb-1 flex flex-wrap items-center justify-between gap-1.5">
                  <span className={labelTextClass}>
                    #{idx + 1} • {item.platform.trim() || 'Custom Link'}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {resolved.href && !showError && (
                      <>
                        <span className={validBadgeClass}>
                          <Check className="h-2.5 w-2.5" aria-hidden="true" />
                          {resolved.isAutoResolved ? 'Auto-linked' : 'Valid Link'}
                        </span>
                        <a
                          href={resolved.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            isSheet
                              ? 'inline-flex items-center gap-0.5 text-[9px] font-medium text-[#0a66c2] hover:underline'
                              : cn(
                                  'inline-flex items-center gap-1 text-[11px] font-medium hover:underline',
                                  tokens.isDark ? 'text-blue-400' : 'text-[#0a66c2]'
                                )
                          )}
                          aria-label={`Open ${item.platform || idx + 1} link in new tab`}
                        >
                          <span>Test</span>
                          <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
                        </a>
                      </>
                    )}

                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveLink(idx, -1)}
                      className={iconMoveBtnClass}
                      title="Move link earlier (left)"
                      aria-label={`Move ${item.platform || 'link'} earlier`}
                    >
                      <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === links.length - 1}
                      onClick={() => handleMoveLink(idx, 1)}
                      className={iconMoveBtnClass}
                      title="Move link later (right)"
                      aria-label={`Move ${item.platform || 'link'} later`}
                    >
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLink(idx)}
                      className={cn(
                        isSheet
                          ? 'no-print rounded p-0.5 text-neutral-600 hover:bg-red-50 hover:text-red-700'
                          : cn(
                              'rounded p-1 transition-colors hover:bg-red-500/15',
                              tokens.mutedText
                            )
                      )}
                      title="Delete this link"
                      aria-label={`Delete ${item.platform || `link #${idx + 1}`}`}
                    >
                      <Trash2 className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-12">
                  <div className="sm:col-span-3">
                    <label htmlFor={platId} className="sr-only">
                      Platform or prefix
                    </label>
                    <input
                      id={platId}
                      type="text"
                      value={item.platform}
                      onChange={(e) =>
                        handleUpdateLink(idx, { platform: e.target.value })
                      }
                      placeholder="Label (e.g. LinkedIn, Kaggle)"
                      className={inputClass}
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label htmlFor={lblId} className="sr-only">
                      Display text
                    </label>
                    <input
                      id={lblId}
                      type="text"
                      value={item.label}
                      onFocus={(e) => {
                        if (onFocusLinkLabel) {
                          onFocusLinkLabel(
                            item.id || `hdr-${idx}`,
                            e.currentTarget
                          );
                        }
                      }}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (!item.url.trim()) {
                          const smart = extractSmartLinkPaste(raw, linkKind);
                          if (smart) {
                            handleUpdateLink(idx, {
                              label: smart.label,
                              url: smart.url,
                            });
                            return;
                          }
                        }
                        handleUpdateLink(idx, { label: raw });
                      }}
                      placeholder={labelPlaceholder}
                      className={inputClass}
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <label htmlFor={urlId} className="sr-only">
                      Destination URL
                    </label>
                    <input
                      id={urlId}
                      type="url"
                      inputMode="url"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      value={item.url}
                      aria-invalid={showError ? 'true' : 'false'}
                      aria-describedby={showError ? errId : undefined}
                      onChange={(e) => {
                        e.currentTarget.setCustomValidity('');
                        markDirty(fieldKey);
                        handleUpdateLink(idx, { url: e.target.value });
                      }}
                      onBlur={(e) => {
                        markBlurred(fieldKey);
                        const raw = item.url.trim();
                        if (!raw) {
                          e.currentTarget.setCustomValidity('');
                          return;
                        }
                        const normalized = normalizeHttpUrl(raw, linkKind);
                        if (normalized) {
                          e.currentTarget.setCustomValidity('');
                          if (normalized !== raw) {
                            handleUpdateLink(idx, { url: normalized });
                          }
                        } else {
                          e.currentTarget.setCustomValidity(
                            `Enter a valid URL (for example, ${urlPlaceholder}).`
                          );
                        }
                      }}
                      placeholder={urlPlaceholder}
                      className={cn(inputClass, showError && invalidInputClass)}
                    />
                    {showError && (
                      <div id={errId} className={errorTextClass}>
                        <AlertCircle
                          className="h-3 w-3 shrink-0"
                          aria-hidden="true"
                        />
                        <span>
                          Enter a valid URL (for example, {urlPlaceholder}).
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className={hintTextClass}>
        Reorder links with ↑/↓, delete any link individually, or remove the entire links subsection anytime.
      </p>
    </div>
  );
}

/**
 * Reusable single URL field for Projects & Certifications with blur-deferred validation.
 */
export function ValidatedUrlInput({
  label,
  value,
  placeholder = 'https://...',
  variant = 'panel',
  theme,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  variant?: 'panel' | 'sheet';
  theme: MonochromeTheme;
  onChange: (nextUrl: string) => void;
}) {
  const id = useId();
  const errId = useId();
  const tokens = getThemeTokens(theme);
  const isSheet = variant === 'sheet';
  const [dirty, setDirty] = useState(false);
  const [blurred, setBlurred] = useState(false);

  const trimmed = value.trim();
  const normalized = trimmed ? normalizeHttpUrl(trimmed, 'portfolio') : null;
  const isInvalid = Boolean(trimmed && !normalized);
  const showError = dirty && blurred && isInvalid;

  const inputClass = isSheet
    ? 'w-full rounded border border-neutral-300 bg-white px-1.5 py-0.5 text-[10px] text-neutral-900 placeholder:text-neutral-400 focus:border-[#0a66c2] focus:outline-none'
    : cn(
        'w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none',
        tokens.inputSurface
      );

  const invalidClass = isSheet
    ? 'border-red-600 bg-red-50/70'
    : tokens.isDark
      ? 'border-red-500 bg-red-950/35'
      : 'border-red-600 bg-red-50/80';

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className={cn(
            isSheet
              ? 'sr-only'
              : cn('mb-1 block text-[11px] font-medium', tokens.mutedText)
          )}
        >
          {label}
        </label>
      </div>
      <div className="flex items-center gap-1.5">
        <input
          id={id}
          type="url"
          inputMode="url"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          value={value}
          aria-label={isSheet ? label : undefined}
          aria-invalid={showError ? 'true' : 'false'}
          aria-describedby={showError ? errId : undefined}
          onChange={(e) => {
            e.currentTarget.setCustomValidity('');
            setDirty(true);
            setBlurred(false);
            onChange(e.target.value);
          }}
          onBlur={(e) => {
            setBlurred(true);
            const raw = e.target.value.trim();
            if (!raw) {
              e.currentTarget.setCustomValidity('');
              return;
            }
            const nextNorm = normalizeHttpUrl(raw, 'portfolio');
            if (nextNorm) {
              e.currentTarget.setCustomValidity('');
              if (nextNorm !== raw) {
                onChange(nextNorm);
              }
            } else {
              e.currentTarget.setCustomValidity(
                'Enter a valid website URL (e.g. https://github.com/user/repo).'
              );
            }
          }}
          placeholder={placeholder}
          className={cn(inputClass, 'flex-1', showError && invalidClass)}
        />
        {normalized && (
          <a
            href={normalized}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              isSheet
                ? 'no-print inline-flex shrink-0 items-center gap-0.5 rounded border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-800 hover:bg-emerald-100'
                : cn(
                    'inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium',
                    tokens.badgeSuccess
                  )
            )}
            title={`Valid link: ${normalized}`}
            aria-label={`Open ${label} in new tab`}
          >
            <Check className="h-2.5 w-2.5" aria-hidden="true" />
            <span>Valid</span>
            <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
          </a>
        )}
      </div>
      {showError && (
        <div
          id={errId}
          className={cn(
            isSheet
              ? 'mt-0.5 flex items-center gap-1 text-[9px] font-medium text-red-700'
              : cn(
                  'mt-1 flex items-center gap-1 text-[11px] font-medium',
                  tokens.isDark ? 'text-red-300' : 'text-red-700'
                )
          )}
        >
          <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>Enter a valid URL (for example, {placeholder}).</span>
        </div>
      )}
    </div>
  );
}

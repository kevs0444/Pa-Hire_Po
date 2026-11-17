'use client';

import { useId, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  FileText,
  Upload,
  X,
} from 'lucide-react';
import type { MonochromeTheme } from '@/types/job';
import type { ParsedResumePayload } from '@/features/resume/lib/resume-parser';
import { useNativeDialog } from '@/hooks/useNativeDialog';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export interface ResumeUploadConfirmOptions {
  syncSmartProfile: boolean;
  saveVersionSnapshot: boolean;
}

export interface ResumeUploadDialogProps {
  isOpen: boolean;
  theme: MonochromeTheme;
  primaryRole: string;
  geminiApiKey?: string;
  onClose: () => void;
  onConfirmImport: (
    parsed: ParsedResumePayload,
    options: ResumeUploadConfirmOptions
  ) => Promise<void> | void;
}

export function ResumeUploadDialog({
  isOpen,
  theme,
  primaryRole,
  geminiApiKey = '',
  onClose,
  onConfirmImport,
}: ResumeUploadDialogProps) {
  const dialogRef = useNativeDialog(isOpen, onClose);
  const titleId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tokens = getThemeTokens(theme);
  const isDark = tokens.isDark;

  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedResumePayload | null>(null);
  const [syncSmartProfile, setSyncSmartProfile] = useState(true);
  const [saveVersionSnapshot, setSaveVersionSnapshot] = useState(true);

  const resetState = () => {
    setError(null);
    setParsed(null);
    setParsing(false);
    setSaving(false);
    setDragging(false);
  };

  const handleClose = () => {
    resetState();
    dialogRef.current?.close();
    onClose();
  };

  const processFile = async (file: File) => {
    setError(null);
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.doc') && !lowerName.endsWith('.docx')) {
      setError(
        'Legacy .doc (Word 97–2003) files are not supported. Please save your resume as .docx or .pdf and upload again.'
      );
      return;
    }

    setParsing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('primaryRole', primaryRole);
      if (geminiApiKey.trim()) {
        formData.append('geminiApiKey', geminiApiKey.trim());
      }

      const res = await fetch('/api/resume/parse', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          typeof data?.error === 'string'
            ? data.error
            : 'Could not extract readable text from that file.'
        );
        return;
      }

      setParsed(data as ParsedResumePayload);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Network error while reading your resume file.'
      );
    } finally {
      setParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };

  const handleConfirm = async () => {
    if (!parsed) return;
    setSaving(true);
    setError(null);
    try {
      await onConfirmImport(parsed, {
        syncSmartProfile,
        saveVersionSnapshot,
      });
      handleClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save imported resume to your workspace.'
      );
    } finally {
      setSaving(false);
    }
  };

  const extractedResume = parsed?.structuredResume;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      {...({ closedby: 'any' } as Record<string, string>)}
      className={cn(
        'm-auto w-[min(94vw,620px)] rounded-xl border p-0 shadow-2xl backdrop:bg-black/40',
        tokens.cardSurface
      )}
    >
      <div className="flex flex-col max-h-[88vh] overflow-y-auto">
        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between gap-3 border-b px-5 py-4',
            isDark ? 'border-slate-800' : 'border-slate-200'
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
                isDark
                  ? 'border-blue-800/60 bg-blue-950/40 text-blue-400'
                  : 'border-blue-200 bg-blue-50 text-[#0a66c2]'
              )}
            >
              <Upload className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2
                id={titleId}
                className={cn('text-sm font-bold', tokens.strongText)}
              >
                Import Existing Resume (PDF / Word)
              </h2>
              <p className={cn('text-xs', tokens.mutedText)}>
                Extracts structured sections, syncs Smart Profile, and opens in
                Resume Studio.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className={cn(
              'rounded-lg border p-1.5 transition-colors',
              tokens.secondaryBtn
            )}
            aria-label="Close import dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div
              role="alert"
              className={cn(
                'flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-xs',
                isDark
                  ? 'border-red-900/60 bg-red-950/40 text-red-300'
                  : 'border-red-200 bg-red-50 text-red-800'
              )}
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!parsed ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={cn(
                'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
                dragging
                  ? isDark
                    ? 'border-blue-500 bg-blue-950/20'
                    : 'border-[#0a66c2] bg-blue-50/70'
                  : isDark
                    ? 'border-slate-700 bg-slate-900/50'
                    : 'border-slate-300 bg-slate-50/70'
              )}
            >
              {parsing ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <LoadingSpinner
                    size={26}
                    isDark={isDark}
                    label="Extracting resume structure"
                  />
                  <div className="space-y-1">
                    <p className={cn('text-sm font-semibold', tokens.strongText)}>
                      Reading & structuring your resume...
                    </p>
                    <p className={cn('text-xs', tokens.mutedText)}>
                      Extracting contact details, experience, projects, skills,
                      and education.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <FileText
                    className={cn(
                      'h-8 w-8',
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    )}
                  />
                  <div className="space-y-1">
                    <p className={cn('text-sm font-semibold', tokens.strongText)}>
                      Drag & drop your resume here
                    </p>
                    <p className={cn('text-xs', tokens.mutedText)}>
                      Supports <span className="font-mono">.pdf</span>,{' '}
                      <span className="font-mono">.docx</span> (Word),{' '}
                      <span className="font-mono">.txt</span>,{' '}
                      <span className="font-mono">.md</span> up to{' '}
                      <span className="font-mono tabular-nums">4.5 MB</span>
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.md,.json,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-colors',
                      tokens.primaryBtn
                    )}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Choose Resume File
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Extracted Header Preview */}
              <div
                className={cn(
                  'rounded-lg border p-4 space-y-2',
                  isDark
                    ? 'border-slate-800 bg-slate-900/60'
                    : 'border-slate-200 bg-slate-50'
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p
                      className={cn(
                        'text-sm font-bold truncate',
                        tokens.strongText
                      )}
                    >
                      {extractedResume?.fullName || 'Candidate Resume'}
                    </p>
                    <p className={cn('text-xs truncate', tokens.mutedText)}>
                      {extractedResume?.targetHeadline || 'Professional Resume'}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium font-mono',
                      isDark
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    )}
                  >
                    <Check className="h-3 w-3" />
                    {parsed.parseMethod === 'gemini-ai'
                      ? 'AI Structured'
                      : 'Smart Parser'}
                  </span>
                </div>

                {(extractedResume?.email ||
                  extractedResume?.location ||
                  parsed.fileName) && (
                  <div
                    className={cn(
                      'flex flex-wrap gap-x-3 gap-y-1 text-[11px]',
                      tokens.mutedText
                    )}
                  >
                    {parsed.fileName && <span>File: {parsed.fileName}</span>}
                    {extractedResume?.email && (
                      <span>{extractedResume.email}</span>
                    )}
                    {extractedResume?.location && (
                      <span>{extractedResume.location}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Section Counts */}
              <div
                className={cn(
                  'grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x rounded-lg border',
                  isDark
                    ? 'border-slate-800 divide-slate-800'
                    : 'border-slate-200 divide-slate-200'
                )}
              >
                {[
                  { label: 'Skills', count: parsed.skills.length },
                  {
                    label: 'Experience',
                    count: extractedResume?.experience.length || 0,
                  },
                  {
                    label: 'Projects',
                    count: extractedResume?.projects.length || 0,
                  },
                  {
                    label: 'Certs',
                    count: extractedResume?.certifications.length || 0,
                  },
                  {
                    label: 'Education',
                    count: extractedResume?.education.length || 0,
                  },
                ].map((stat) => (
                  <div key={stat.label} className="px-3 py-2.5 text-center">
                    <div
                      className={cn(
                        'text-base font-bold font-mono tabular-nums',
                        tokens.strongText
                      )}
                    >
                      {stat.count}
                    </div>
                    <div className={cn('text-[11px]', tokens.mutedText)}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sync Options */}
              <div className="space-y-2.5 pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncSmartProfile}
                    onChange={(e) => setSyncSmartProfile(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300"
                  />
                  <span className="text-xs leading-relaxed">
                    <strong className={tokens.strongText}>
                      Sync to Smart Profile & Base Resume
                    </strong>{' '}
                    <span className={tokens.mutedText}>
                      — Updates your My Profile headline, bio, skills, open-to-work
                      roles, and Base Resume so job match scores stay accurate.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveVersionSnapshot}
                    onChange={(e) => setSaveVersionSnapshot(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300"
                  />
                  <span className="text-xs leading-relaxed">
                    <strong className={tokens.strongText}>
                      Save Version Snapshot
                    </strong>{' '}
                    <span className={tokens.mutedText}>
                      — Stores{' '}
                      <span className="font-mono">
                        Imported: {parsed.fileName || 'Resume'}
                      </span>{' '}
                      in your Resume Versions Drawer.
                    </span>
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3.5',
            isDark ? 'border-slate-800' : 'border-slate-200'
          )}
        >
          <div>
            {parsed && (
              <button
                type="button"
                onClick={resetState}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                  tokens.secondaryBtn
                )}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload Another File
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                tokens.secondaryBtn
              )}
            >
              Cancel
            </button>
            {parsed && (
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleConfirm()}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60',
                  tokens.primaryBtn
                )}
              >
                <Check className="h-3.5 w-3.5" />
                {saving ? 'Saving...' : 'Save & Edit in Resume Studio'}
              </button>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}

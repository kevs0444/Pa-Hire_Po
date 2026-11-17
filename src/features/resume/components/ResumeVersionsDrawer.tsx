'use client';

import { useId, useMemo, useState } from 'react';
import {
  Check,
  Clock,
  Edit2,
  FileText,
  History,
  Plus,
  Search,
  Bot,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type {
  JobListing,
  MonochromeTheme,
  StructuredResume,
  TailoredResumeRecord,
} from '@/types/job';
import { useNativeDialog } from '@/hooks/useNativeDialog';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { DeleteVersionConfirmDialog } from './DeleteVersionConfirmDialog';

export interface ResumeVersionsDrawerProps {
  isOpen: boolean;
  resumeRecords: TailoredResumeRecord[];
  activeResume: StructuredResume;
  activeTailorJob: JobListing | null;
  theme: MonochromeTheme;
  onClose: () => void;
  onSelectVersion: (resume: StructuredResume, record: TailoredResumeRecord) => void;
  onUpdateResumeRecord: (
    id: string,
    patch: {
      versionName?: string | null;
      company?: string;
      jobTitle?: string;
      notes?: string;
    }
  ) => Promise<void>;
  onDeleteResumeRecord: (id: string) => Promise<void>;
  onSaveSnapshot: (params: {
    company: string;
    jobTitle: string;
    jobId: string | null;
    versionName?: string;
    resume: StructuredResume;
    isSent: boolean;
    notes: string;
  }) => Promise<void> | void;
}

export function ResumeVersionsDrawer({
  isOpen,
  resumeRecords,
  activeResume,
  activeTailorJob,
  theme,
  onClose,
  onSelectVersion,
  onUpdateResumeRecord,
  onDeleteResumeRecord,
  onSaveSnapshot,
}: ResumeVersionsDrawerProps) {
  const dialogRef = useNativeDialog(isOpen, onClose);
  const titleId = useId();
  const tokens = getThemeTokens(theme);
  const isDark = tokens.isDark;

  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [savingRenameId, setSavingRenameId] = useState<string | null>(null);

  // Delete dialog state
  const [recordToDelete, setRecordToDelete] = useState<TailoredResumeRecord | null>(null);

  // New Version Form state
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [newName, setNewName] = useState(
    activeResume.versionName ||
      `${activeTailorJob?.company || activeResume.tailoredForCompany || 'General'} - ${
        activeTailorJob?.title || activeResume.tailoredForJobTitle || 'Custom'
      } Draft`
  );
  const [newCompany, setNewCompany] = useState(
    activeTailorJob?.company || activeResume.tailoredForCompany || ''
  );
  const [newRole, setNewRole] = useState(
    activeTailorJob?.title || activeResume.tailoredForJobTitle || ''
  );
  const [newNotes, setNewNotes] = useState('');
  const [newSent, setNewSent] = useState(false);
  const [isSavingNew, setIsSavingNew] = useState(false);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return resumeRecords;
    return resumeRecords.filter((rec) => {
      const vName = rec.versionName || rec.resumeData?.versionName || '';
      const comp = rec.company || '';
      const title = rec.jobTitle || '';
      const notes = rec.notes || '';
      return (
        vName.toLowerCase().includes(q) ||
        comp.toLowerCase().includes(q) ||
        title.toLowerCase().includes(q) ||
        notes.toLowerCase().includes(q)
      );
    });
  }, [resumeRecords, searchQuery]);

  const handleStartRename = (rec: TailoredResumeRecord) => {
    setEditingId(rec.id);
    setEditingName(
      rec.versionName ||
        rec.resumeData?.versionName ||
        `${rec.company || 'General'} — ${rec.jobTitle || 'Resume'}`
    );
  };

  const handleSaveRename = async (id: string) => {
    if (!editingName.trim()) return;
    setSavingRenameId(id);
    try {
      await onUpdateResumeRecord(id, {
        versionName: editingName.trim(),
      });
      setEditingId(null);
    } finally {
      setSavingRenameId(null);
    }
  };

  const handleSaveNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newRole.trim()) return;
    setIsSavingNew(true);
    try {
      const versionTitle = newName.trim() || `${newCompany.trim()} — ${newRole.trim()}`;
      await onSaveSnapshot({
        company: newCompany.trim(),
        jobTitle: newRole.trim(),
        jobId: activeTailorJob?.id || null,
        versionName: versionTitle,
        resume: {
          ...activeResume,
          versionName: versionTitle,
          tailoredForCompany: newCompany.trim(),
          tailoredForJobTitle: newRole.trim(),
        },
        isSent: newSent,
        notes: newNotes.trim(),
      });
      setShowSaveForm(false);
      setNewNotes('');
    } finally {
      setIsSavingNew(false);
    }
  };

  const getMethodBadge = (rec: TailoredResumeRecord) => {
    const method = rec.tailorMethod || rec.sourceType;
    if (method === 'gemini-ai' || method === 'ai-tailor') {
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium',
            tokens.badgeSuccess
          )}
        >
          <Bot className="h-3 w-3" />
          AI Tailored
        </span>
      );
    }
    if (method === 'smart-engine') {
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium',
            tokens.badgeAccent
          )}
        >
          Auto-Tailored
        </span>
      );
    }
    if (method === 'manual-edit') {
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium',
            tokens.badgeNeutral
          )}
        >
          Manual Edit
        </span>
      );
    }
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium',
          tokens.subSurface,
          tokens.mutedText
        )}
      >
        Base CV
      </span>
    );
  };

  return (
    <>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        {...({ closedby: 'any' } as Record<string, string>)}
        className={cn(
          'm-auto w-[min(94vw,680px)] rounded-xl border p-0 shadow-2xl backdrop:bg-black/45',
          tokens.cardSurface
        )}
      >
        <div className="flex max-h-[88vh] flex-col overflow-hidden">
          {/* Header */}
          <div
            className={cn(
              'flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5',
              tokens.borderSubtle
            )}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg border',
                  tokens.badgeAccent
                )}
              >
                <History className="h-4 w-4" />
              </div>
              <div>
                <h2 id={titleId} className={cn('text-sm font-bold', tokens.strongText)}>
                  Resume Versions &amp; History
                </h2>
                <p className={cn('text-xs', tokens.mutedText)}>
                  {resumeRecords.length} saved version{resumeRecords.length === 1 ? '' : 's'} • Rename, switch, or delete snapshots
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSaveForm((v) => !v)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                  showSaveForm ? tokens.primaryBtn : tokens.secondaryBtn
                )}
              >
                <Plus className="h-3.5 w-3.5" />
                {showSaveForm ? 'Cancel New' : 'Save Version'}
              </button>
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
          </div>

          {/* Quick Save New Version Form */}
          {showSaveForm && (
            <form
              onSubmit={handleSaveNewVersion}
              className={cn(
                'border-b p-4 space-y-3',
                tokens.subSurface,
                tokens.borderSubtle
              )}
            >
              <div className={cn('text-xs font-semibold', tokens.strongText)}>
                Archive Current Studio State as a New Version:
              </div>
              <div className="grid gap-2 sm:grid-cols-12">
                <div className="sm:col-span-12">
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Custom Version Name (e.g. Canva - Senior BI Analyst v2)"
                    className={cn(
                      'w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none font-medium',
                      tokens.inputSurface
                    )}
                  />
                </div>
                <div className="sm:col-span-6">
                  <input
                    type="text"
                    required
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="Company name (e.g. Canva, GCash)"
                    className={cn(
                      'w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none',
                      tokens.inputSurface
                    )}
                  />
                </div>
                <div className="sm:col-span-6">
                  <input
                    type="text"
                    required
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="Role (e.g. Data Analyst)"
                    className={cn(
                      'w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none',
                      tokens.inputSurface
                    )}
                  />
                </div>
                <div className="sm:col-span-9">
                  <input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Optional note (e.g. Emphasized Python & SQL)"
                    className={cn(
                      'w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none',
                      tokens.inputSurface
                    )}
                  />
                </div>
                <div className="sm:col-span-3 flex items-center gap-1.5 text-xs">
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={newSent}
                      onChange={(e) => setNewSent(e.target.checked)}
                      className="h-3.5 w-3.5"
                    />
                    <span>Mark Sent</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSaveForm(false)}
                  className={cn(
                    'rounded-lg border px-2.5 py-1 text-xs font-medium',
                    tokens.secondaryBtn
                  )}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingNew}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50',
                    tokens.primaryBtn
                  )}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {isSavingNew ? 'Saving...' : 'Save as Version'}
                </button>
              </div>
            </form>
          )}

          {/* Search bar */}
          <div className={cn('border-b px-4 py-2.5', tokens.borderSubtle)}>
            <div className="relative">
              <Search
                className={cn(
                  'pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5',
                  tokens.mutedText
                )}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search versions by custom name, company, or role..."
                className={cn(
                  'w-full rounded-lg border pl-8 pr-3 py-1.5 text-xs focus:outline-none',
                  tokens.inputSurface
                )}
              />
            </div>
          </div>

          {/* Version List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border',
                    tokens.subSurface
                  )}
                >
                  <FileText className={cn('h-5 w-5', tokens.mutedText)} />
                </div>
                <h3 className={cn('mt-2 text-xs font-semibold', tokens.strongText)}>
                  {searchQuery ? 'No matching versions found' : 'No saved versions yet'}
                </h3>
                <p className={cn('mt-0.5 text-[11px]', tokens.mutedText)}>
                  {searchQuery
                    ? 'Try a different search term or clear the filter.'
                    : 'Click "Save Version" above to archive snapshots with custom names.'}
                </p>
              </div>
            ) : (
              filteredRecords.map((rec) => {
                const displayName =
                  rec.versionName ||
                  rec.resumeData?.versionName ||
                  `${rec.company || 'General'} — ${rec.jobTitle || 'Resume'}`;
                const isEditing = editingId === rec.id;
                const dateLabel = rec.createdAt
                  ? new Date(rec.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Date unknown';

                return (
                  <div
                    key={rec.id}
                    className={cn(
                      'rounded-lg border p-3 transition-colors',
                      tokens.cardSurface,
                      tokens.borderSubtle,
                      isDark ? 'hover:border-zinc-600' : 'hover:border-[#0a66c2]/40'
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (
                                  e.key === 'Enter' &&
                                  !e.shiftKey &&
                                  !e.nativeEvent.isComposing &&
                                  e.keyCode !== 229
                                ) {
                                  e.preventDefault();
                                  void handleSaveRename(rec.id);
                                } else if (e.key === 'Escape') {
                                  setEditingId(null);
                                }
                              }}
                              autoFocus
                              placeholder="Version name..."
                              className={cn(
                                'flex-1 rounded-lg border px-2 py-1 text-xs font-semibold focus:outline-none',
                                tokens.inputSurface
                              )}
                            />
                            <button
                              type="button"
                              disabled={savingRenameId === rec.id}
                              onClick={() => void handleSaveRename(rec.id)}
                              aria-label="Confirm rename"
                              className={cn(
                                'inline-flex items-center rounded-lg border px-2 py-1 text-xs font-medium',
                                tokens.primaryBtn
                              )}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              aria-label="Cancel rename"
                              className={cn(
                                'rounded-lg border px-2 py-1 text-xs font-medium',
                                tokens.secondaryBtn
                              )}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 group">
                            <h3 className={cn('truncate text-xs font-bold', tokens.strongText)}>
                              {displayName}
                            </h3>
                            <button
                              type="button"
                              onClick={() => handleStartRename(rec)}
                              title="Rename version"
                              aria-label="Rename version"
                              className={cn(
                                'rounded p-0.5 opacity-60 transition-opacity group-hover:opacity-100 focus-visible:opacity-100',
                                tokens.mutedText,
                                isDark ? 'hover:text-zinc-100' : 'hover:text-slate-900'
                              )}
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}

                        <div className={cn('mt-1 flex flex-wrap items-center gap-2 text-[11px]', tokens.mutedText)}>
                          {rec.company && (
                            <span className={cn('font-semibold', tokens.strongText)}>
                              {rec.company}
                            </span>
                          )}
                          {rec.jobTitle && <span>• {rec.jobTitle}</span>}
                          <span className="inline-flex items-center gap-1 text-[10px]">
                            <Clock className="h-3 w-3" />
                            {dateLabel}
                          </span>
                        </div>

                        {rec.notes && (
                          <p className={cn('mt-1 truncate text-[11px] italic', tokens.mutedText)}>
                            &ldquo;{rec.notes}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {getMethodBadge(rec)}
                        {rec.isSent && (
                          <span
                            className={cn(
                              'rounded border px-1.5 py-0.5 text-[10px] font-medium',
                              tokens.badgeAccent
                            )}
                          >
                            ✓ Sent
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions footer */}
                    <div
                      className={cn(
                        'mt-2.5 flex items-center justify-between border-t pt-2',
                        tokens.borderSubtle
                      )}
                    >
                      <span className={cn('text-[10px] font-mono', tokens.mutedText)}>
                        {rec.resumeData?.pageSize?.toUpperCase() || 'A4'} •{' '}
                        {rec.resumeData?.fontFamily || 'Calibri'} •{' '}
                        {rec.resumeData?.textAlign === 'justify' ? 'Justified' : 'Left'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectVersion(rec.resumeData, rec);
                            dialogRef.current?.close();
                            onClose();
                          }}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                            tokens.secondaryBtn
                          )}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Load Version
                        </button>

                        <button
                          type="button"
                          onClick={() => setRecordToDelete(rec)}
                          title="Delete version"
                          aria-label="Delete version"
                          className={cn(
                            'rounded-lg border border-transparent p-1.5 transition-colors',
                            tokens.mutedText,
                            isDark
                              ? 'hover:border-red-900/60 hover:bg-red-950/40 hover:text-red-400'
                              : 'hover:border-red-300 hover:bg-red-50 hover:text-red-600'
                          )}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </dialog>

      {/* Delete Confirmation Dialog */}
      {recordToDelete && (
        <DeleteVersionConfirmDialog
          isOpen={Boolean(recordToDelete)}
          versionName={
            recordToDelete.versionName ||
            recordToDelete.resumeData?.versionName ||
            `${recordToDelete.company || 'General'} — ${recordToDelete.jobTitle || 'Resume'}`
          }
          versionDetails={
            recordToDelete.company
              ? `${recordToDelete.company} • ${recordToDelete.jobTitle || 'Tailored Resume'}`
              : undefined
          }
          theme={theme}
          onClose={() => setRecordToDelete(null)}
          onConfirm={async () => {
            if (recordToDelete) {
              await onDeleteResumeRecord(recordToDelete.id);
              setRecordToDelete(null);
            }
          }}
        />
      )}
    </>
  );
}

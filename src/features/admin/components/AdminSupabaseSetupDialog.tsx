'use client';

import { FormEvent, useId } from 'react';
import { Check, Copy, ExternalLink, X } from 'lucide-react';
import { MonochromeTheme } from '@/types/job';
import {
  DEFAULT_SUPABASE_PROJECT_REF,
  DEFAULT_SUPABASE_URL,
  extractSupabaseProjectRef,
} from '@/lib/supabase/config';
import { SUPABASE_SCHEMA_SQL } from '@/lib/supabase/schema-sql';
import { useNativeDialog } from '@/hooks/useNativeDialog';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface AdminSupabaseSetupDialogProps {
  theme: MonochromeTheme;
  isOpen: boolean;
  supabaseUrl: string;
  anonKeyDraft: string;
  serviceKeyDraft: string;
  savingKeys: boolean;
  copiedSql: boolean;
  onClose: () => void;
  onCopySql: () => void;
  onChangeAnonKey: (val: string) => void;
  onChangeServiceKey: (val: string) => void;
  onSaveKeys: (e: FormEvent) => void;
}

export function AdminSupabaseSetupDialog({
  theme,
  isOpen,
  supabaseUrl,
  anonKeyDraft,
  serviceKeyDraft,
  savingKeys,
  copiedSql,
  onClose,
  onCopySql,
  onChangeAnonKey,
  onChangeServiceKey,
  onSaveKeys,
}: AdminSupabaseSetupDialogProps) {
  const tokens = getThemeTokens(theme);
  const titleId = useId();
  const dialogRef = useNativeDialog(isOpen, onClose);

  const modalProjectRef = extractSupabaseProjectRef(
    supabaseUrl || DEFAULT_SUPABASE_URL
  ) || DEFAULT_SUPABASE_PROJECT_REF;
  const modalDashboardBase = `https://supabase.com/dashboard/project/${modalProjectRef}`;

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby={titleId}
      className="m-auto w-[min(95vw,48rem)] max-w-none rounded-xl border-0 bg-transparent p-0 backdrop:bg-slate-950/60"
    >
      <div
        className={cn(
          'flex max-h-[88vh] flex-col overflow-hidden rounded-xl border shadow-xl',
          tokens.cardSurface
        )}
      >
        <div className={cn('flex items-center justify-between border-b px-5 py-3.5', tokens.borderSubtle)}>
          <h3 id={titleId} className="text-base font-bold">
            Supabase Setup &amp; SQL Schema ({modalProjectRef})
          </h3>
          <button
            type="button"
            onClick={onClose}
            className={cn('rounded-lg border p-1.5', tokens.secondaryBtn)}
            aria-label="Close setup modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          <div className={cn('rounded-lg border p-3.5 space-y-2', tokens.subSurface)}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">
                Step 1: Run supabase/schema.sql in Supabase SQL Editor
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onCopySql}
                  className={cn('inline-flex items-center gap-1 rounded border px-2.5 py-1 font-medium', tokens.secondaryBtn)}
                >
                  {copiedSql ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[#057642]" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy SQL
                    </>
                  )}
                </button>
                <a
                  href={`${modalDashboardBase}/sql/new`}
                  target="_blank"
                  rel="noreferrer"
                  className={cn('inline-flex items-center gap-1 rounded px-2.5 py-1', tokens.primaryBtn)}
                >
                  Open SQL Editor
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            <pre className={cn('max-h-48 overflow-auto rounded border p-2.5 font-mono text-[11px]', tokens.cardSurface)}>
              {SUPABASE_SCHEMA_SQL}
            </pre>
          </div>

          <form onSubmit={onSaveKeys} className="space-y-3">
            <div className="font-semibold">
              Step 2: Save / Update Supabase API Keys (.env)
            </div>
            <div className={cn('rounded-lg border p-3 space-y-1.5', tokens.subSurface)}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={cn('text-[11px] font-medium', tokens.mutedText)}>
                  Vercel Store Supabase Target:
                </span>
                <span className="font-mono text-[11px] font-semibold">
                  supabase-erin-elephant ({modalProjectRef})
                </span>
              </div>
              <div className={cn('font-mono text-[11px] break-all', tokens.mutedText)}>
                {DEFAULT_SUPABASE_URL}
              </div>
              <div className={cn('text-[11px]', tokens.mutedText)}>
                Vercel integration sync:{' '}
                <code className="font-mono font-semibold">
                  npx vercel env pull .env.development.local
                </code>
              </div>
            </div>
            <div>
              <label className={cn('mb-1 block font-medium', tokens.mutedText)}>
                Anon / Publishable Key
              </label>
              <input
                type="text"
                required
                value={anonKeyDraft}
                onChange={(e) => onChangeAnonKey(e.target.value)}
                placeholder="eyJ... or sb_publishable_..."
                className={cn('w-full rounded-lg border px-3 py-2 font-mono text-xs focus:outline-none', tokens.inputSurface)}
              />
            </div>
            <div>
              <label className={cn('mb-1 block font-medium', tokens.mutedText)}>
                Service Role Secret Key (Optional — enables full auth.users list &amp; deletion)
              </label>
              <input
                type="password"
                value={serviceKeyDraft}
                onChange={(e) => onChangeServiceKey(e.target.value)}
                placeholder="eyJ... or sb_secret_..."
                className={cn('w-full rounded-lg border px-3 py-2 font-mono text-xs focus:outline-none', tokens.inputSurface)}
              />
            </div>
            <button
              type="submit"
              disabled={savingKeys}
              className={cn('w-full rounded-lg px-4 py-2 text-xs font-semibold', tokens.primaryBtn)}
            >
              {savingKeys ? 'Verifying & Saving...' : 'Verify & Save Keys to .env'}
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
}

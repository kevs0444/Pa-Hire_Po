'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Bookmark,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  Heart,
  HelpCircle,
  LogOut,
  Moon,
  Settings,
  Shield,
  Sun,
} from 'lucide-react';
import type {
  AuthSessionUser,
  MonochromeTheme,
  UserProfile,
} from '@/types/job';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface UserAvatarMenuProps {
  theme: MonochromeTheme;
  activeProfile: UserProfile;
  authUser: AuthSessionUser | null;
  storageMode: string;
  savedCount: number;
  savedSearchesCount: number;
  appliedCount: number;
  adminUserCount: number | null;
  signingOut: boolean;
  onOpenProfile: () => void;
  onOpenSavedSearches: () => void;
  onOpenSavedJobs: () => void;
  onOpenApplications: () => void;
  onOpenSettings: () => void;
  onOpenHowItWorks: () => void;
  onOpenAdmin: () => void;
  onChangeTheme: (theme: MonochromeTheme) => void;
  onSignOut: () => void;
}

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function UserAvatarMenu({
  theme,
  activeProfile,
  authUser,
  storageMode,
  savedCount,
  savedSearchesCount,
  appliedCount,
  adminUserCount,
  signingOut,
  onOpenProfile,
  onOpenSavedSearches,
  onOpenSavedJobs,
  onOpenApplications,
  onOpenSettings,
  onOpenHowItWorks,
  onOpenAdmin,
  onChangeTheme,
  onSignOut,
}: UserAvatarMenuProps) {
  const popoverId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const tokens = getThemeTokens(theme);
  const isDark = tokens.isDark;
  const displayName = activeProfile.name || authUser?.fullName || 'Applicant';
  const initials = getInitials(displayName);

  useEffect(() => {
    const popover = popoverRef.current;
    const trigger = triggerRef.current;
    if (!popover || !trigger) return;

    const handleBeforeToggle = (event: Event) => {
      const toggleEvent = event as ToggleEvent;
      if (toggleEvent.newState !== 'open') return;
      if (
        typeof CSS !== 'undefined' &&
        typeof CSS.supports === 'function' &&
        CSS.supports('position-area: block-end')
      ) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const panelWidth = Math.min(288, window.innerWidth - 24);
      const rightOffset = Math.max(12, window.innerWidth - rect.right);
      const maxHeight = Math.max(240, window.innerHeight - rect.bottom - 20);
      popover.style.position = 'fixed';
      popover.style.margin = '0';
      popover.style.top = `${Math.round(rect.bottom + 8)}px`;
      popover.style.right = `${Math.round(rightOffset)}px`;
      popover.style.left = 'auto';
      popover.style.width = `${panelWidth}px`;
      popover.style.maxHeight = `${Math.round(maxHeight)}px`;
    };

    const handleToggle = (event: Event) => {
      const toggleEvent = event as ToggleEvent;
      setIsOpen(toggleEvent.newState === 'open');
    };

    popover.addEventListener('beforetoggle', handleBeforeToggle);
    popover.addEventListener('toggle', handleToggle);
    return () => {
      popover.removeEventListener('beforetoggle', handleBeforeToggle);
      popover.removeEventListener('toggle', handleToggle);
    };
  }, []);

  const closeMenu = () => {
    const el = popoverRef.current as (HTMLDivElement & {
      hidePopover?: () => void;
    }) | null;
    if (el && typeof el.hidePopover === 'function') {
      try {
        el.hidePopover();
      } catch {
        // Already closed
      }
    }
  };

  const rowClass = cn(
    'civic-touch-target flex min-h-[42px] w-full items-center justify-between gap-3 px-4 py-2 text-left text-[13px] font-medium transition-colors',
    isDark
      ? 'text-zinc-200 hover:bg-zinc-800/80 hover:text-white'
      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
  );

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={triggerRef}
        type="button"
        aria-controls={popoverId}
        aria-expanded={isOpen}
        aria-label={`Account menu for ${displayName}`}
        {...({ popoverTarget: popoverId } as Record<string, string>)}
        className={cn(
          'civic-btn-motion civic-touch-target inline-flex items-center gap-1.5 rounded-lg border px-1.5 py-1 transition-colors',
          tokens.secondaryBtn
        )}
        title={
          authUser?.isAdmin
            ? `${authUser.email} • ${storageMode === 'supabase-cloud' ? 'Supabase Cloud' : 'Local Storage'}`
            : displayName
        }
      >
        <span
          className={cn(
            'relative inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border text-[11px] font-semibold',
            tokens.borderSubtle,
            isDark
              ? 'bg-zinc-800 text-zinc-100'
              : 'bg-[#0a66c2]/10 text-[#0a66c2]'
          )}
        >
          {activeProfile.avatarUrl ? (
            <Image
              src={activeProfile.avatarUrl}
              alt={displayName}
              fill
              unoptimized
              sizes="28px"
              className="object-cover"
            />
          ) : (
            initials
          )}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-150',
            tokens.mutedText,
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <div
        id={popoverId}
        ref={popoverRef}
        {...({ popover: 'auto' } as Record<string, string>)}
        className={cn(
          'civic-popover-panel w-[min(92vw,288px)] overflow-hidden rounded-xl border p-0 shadow-xl',
          tokens.cardSurface
        )}
      >
        {/* Profile Header (Pic 3 Top Block) */}
        <button
          type="button"
          onClick={() => {
            closeMenu();
            onOpenProfile();
          }}
          className={cn(
            'flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors',
            isDark ? 'hover:bg-zinc-800/70' : 'hover:bg-slate-50'
          )}
        >
          <span
            className={cn(
              'relative inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border text-sm font-semibold',
              tokens.borderSubtle,
              isDark
                ? 'bg-zinc-800 text-zinc-100'
                : 'bg-[#0a66c2]/10 text-[#0a66c2]'
            )}
          >
            {activeProfile.avatarUrl ? (
              <Image
                src={activeProfile.avatarUrl}
                alt={displayName}
                fill
                unoptimized
                sizes="44px"
                className="object-cover"
              />
            ) : (
              initials
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className={cn('truncate text-sm font-bold', tokens.strongText)}>
                {displayName}
              </span>
              <ChevronRight className={cn('h-4 w-4 shrink-0', tokens.mutedText)} />
            </div>
            <div className={cn('mt-0.5 flex items-center gap-1.5 text-xs', tokens.mutedText)}>
              <Eye className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {activeProfile.primaryRole || 'My Profile'}
              </span>
            </div>
          </div>
        </button>

        {/* Primary Menu Links */}
        <div className={cn('border-t py-1.5', tokens.borderSubtle)}>
          <button
            type="button"
            onClick={() => {
              closeMenu();
              onOpenSavedSearches();
            }}
            className={rowClass}
          >
            <span className="inline-flex items-center gap-3">
              <Heart className={cn('h-4 w-4', tokens.mutedText)} />
              <span>Saved searches</span>
            </span>
            {savedSearchesCount > 0 && (
              <span className={cn('font-mono text-xs tabular-nums', tokens.mutedText)}>
                {savedSearchesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              closeMenu();
              onOpenSavedJobs();
            }}
            className={rowClass}
          >
            <span className="inline-flex items-center gap-3">
              <Bookmark className={cn('h-4 w-4', tokens.mutedText)} />
              <span>Saved jobs</span>
            </span>
            {savedCount > 0 && (
              <span className={cn('font-mono text-xs tabular-nums', tokens.mutedText)}>
                {savedCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              closeMenu();
              onOpenApplications();
            }}
            className={rowClass}
          >
            <span className="inline-flex items-center gap-3">
              <CheckCircle2 className={cn('h-4 w-4', tokens.mutedText)} />
              <span>Activity (Applied)</span>
            </span>
            {appliedCount > 0 && (
              <span className={cn('font-mono text-xs tabular-nums', tokens.mutedText)}>
                {appliedCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              closeMenu();
              onOpenSettings();
            }}
            className={rowClass}
          >
            <span className="inline-flex items-center gap-3">
              <Settings className={cn('h-4 w-4', tokens.mutedText)} />
              <span>Settings</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              closeMenu();
              onOpenHowItWorks();
            }}
            className={rowClass}
          >
            <span className="inline-flex items-center gap-3">
              <HelpCircle className={cn('h-4 w-4', tokens.mutedText)} />
              <span>How It Works</span>
            </span>
          </button>

          {authUser?.isAdmin && (
            <button
              type="button"
              onClick={() => {
                closeMenu();
                onOpenAdmin();
              }}
              className={rowClass}
            >
              <span className="inline-flex items-center gap-3">
                <Shield className={cn('h-4 w-4', tokens.mutedText)} />
                <span>Admin Control Center</span>
              </span>
              {adminUserCount !== null && (
                <span className={cn('font-mono text-xs tabular-nums', tokens.mutedText)}>
                  {adminUserCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Appearance Switcher */}
        <div
          className={cn(
            'flex items-center justify-between border-t px-4 py-2.5',
            tokens.borderSubtle
          )}
        >
          <span className={cn('text-xs font-medium', tokens.mutedText)}>
            Appearance
          </span>
          <div
            className={cn('inline-flex items-center rounded-lg border p-0.5', tokens.navTrack)}
            role="group"
            aria-label="Color theme switcher"
          >
            {(
              [
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
              ] as const
            ).map((opt) => {
              const Icon = opt.icon;
              const active = (theme === 'dark' ? 'dark' : 'light') === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeTheme(opt.id)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
                    active ? tokens.primaryBtn : tokens.mutedText
                  )}
                >
                  <Icon className="h-3 w-3" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sign Out */}
        {authUser && (
          <div className={cn('border-t py-1.5', tokens.borderSubtle)}>
            <button
              type="button"
              disabled={signingOut}
              onClick={() => {
                closeMenu();
                onSignOut();
              }}
              className={cn(rowClass, 'disabled:opacity-50')}
            >
              <span className="inline-flex items-center gap-3">
                <LogOut className={cn('h-4 w-4', tokens.mutedText)} />
                <span>{signingOut ? 'Signing out...' : 'Sign out'}</span>
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

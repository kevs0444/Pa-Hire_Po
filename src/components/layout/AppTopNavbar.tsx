'use client';

import Image from 'next/image';
import {
  BarChart3,
  Briefcase,
  CheckCircle2,
  FileText,
  HelpCircle,
  Home,
  LogOut,
  Moon,
  Settings,
  Shield,
  Sun,
  UserCircle2,
} from 'lucide-react';
import {
  ActiveTab,
  AuthSessionUser,
  MonochromeTheme,
  UserProfile,
} from '@/types/job';
import type { ActivityNotification } from '@/features/notifications/types';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface AppTopNavbarProps {
  theme: MonochromeTheme;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  activeProfile: UserProfile;
  isDesktopApp: boolean;
  hydrated: boolean;
  activeJobsCount: number;
  appliedCount?: number;
  dbSyncing?: boolean;
  notifications?: ActivityNotification[];
  unreadCount?: number;
  nowMs?: number | null;
  isRealtimeConnected?: boolean;
  authUser: AuthSessionUser | null;
  storageMode: string;
  adminUserCount: number | null;
  signingOut: boolean;
  onSignOut: () => void;
  onOpenHowItWorks: () => void;
  onOpenSettings: () => void;
  onOpenChangelog: () => void;
  onMarkAllNotificationsRead?: () => void;
  onClearNotifications?: () => void;
  onSelectNotification?: (item: ActivityNotification) => void;
  onChangeTheme: (theme: MonochromeTheme) => void;
}

export function AppTopNavbar({
  theme,
  activeTab,
  onSelectTab,
  activeProfile,
  isDesktopApp,
  hydrated,
  activeJobsCount,
  appliedCount = 0,
  dbSyncing = false,
  notifications = [],
  unreadCount = 0,
  nowMs = null,
  isRealtimeConnected = false,
  authUser,
  storageMode,
  adminUserCount,
  signingOut,
  onSignOut,
  onOpenHowItWorks,
  onOpenSettings,
  onOpenChangelog,
  onMarkAllNotificationsRead = () => undefined,
  onClearNotifications = () => undefined,
  onSelectNotification = () => undefined,
  onChangeTheme,
}: AppTopNavbarProps) {
  const {
    isDark,
    navBg,
    subSurface,
    primaryBtn,
    secondaryBtn,
    mutedText,
    navTrack,
    borderSubtle,
  } = getThemeTokens(theme);

  const activeNavTabClass = isDark
    ? 'border-b-2 border-zinc-200 text-zinc-100 font-semibold'
    : 'border-b-2 border-[#0a66c2] text-[#0a66c2] font-semibold';

  const inactiveNavTabClass = cn(
    'border-b-2 border-transparent font-medium transition-colors',
    mutedText,
    isDark ? 'hover:text-slate-100' : 'hover:text-slate-900'
  );

  return (
    <header className={cn('no-print sticky top-0 z-30 border-b', navBg)}>
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-2.5 py-2 text-left transition-opacity hover:opacity-85"
          title="Go to Pa-Hire Po Overview"
        >
          <div
            className={cn(
              'relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border bg-white',
              borderSubtle
            )}
          >
            <Image
              src="/pa-hire-po-logo.jpg"
              alt="Pa-Hire Po Logo"
              fill
              sizes="36px"
              className="object-cover"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold tracking-tight leading-none">
                Pa-Hire Po
              </h1>
              {isDesktopApp && (
                <span
                  className={cn(
                    'rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none',
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-slate-200'
                      : 'border-slate-300 bg-slate-100 text-slate-700'
                  )}
                >
                  Desktop
                </span>
              )}
            </div>
            <p className={cn('hidden xl:block mt-0.5 text-[11px] leading-none', mutedText)}>
              {activeProfile.name} • {activeProfile.primaryRole}
            </p>
          </div>
        </button>

        {/* Primary Navigation Tabs */}
        <nav className="flex flex-wrap items-center gap-1 sm:gap-2" aria-label="Primary sections">
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-3.5 text-xs',
              activeTab === 'home' ? activeNavTabClass : inactiveNavTabClass
            )}
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('jobs')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-3.5 text-xs',
              activeTab === 'jobs' ? activeNavTabClass : inactiveNavTabClass
            )}
          >
            <Briefcase className="h-3.5 w-3.5" />
            Find Jobs
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('applications')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-3.5 text-xs',
              activeTab === 'applications' ? activeNavTabClass : inactiveNavTabClass
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Applied &amp; Resumes
            {hydrated && appliedCount > 0 && (
              <span className="font-mono text-[11px] tabular-nums opacity-80">
                ({appliedCount})
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('analytics')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-3.5 text-xs',
              activeTab === 'analytics' ? activeNavTabClass : inactiveNavTabClass
            )}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Analytics
            {hydrated && activeJobsCount > 0 && (
              <span className="font-mono text-[11px] tabular-nums opacity-80">
                ({activeJobsCount})
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('profile')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-3.5 text-xs',
              activeTab === 'profile' ? activeNavTabClass : inactiveNavTabClass
            )}
          >
            {hydrated && activeProfile.avatarUrl ? (
              <span className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full border border-slate-300/80">
                <Image
                  src={activeProfile.avatarUrl}
                  alt={activeProfile.name}
                  fill
                  unoptimized
                  sizes="16px"
                  className="object-cover"
                />
              </span>
            ) : (
              <UserCircle2 className="h-3.5 w-3.5" />
            )}
            My Profile
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('resume')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-3.5 text-xs',
              activeTab === 'resume' ? activeNavTabClass : inactiveNavTabClass
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Resume Studio</span>
            <span
              className={cn(
                'rounded border px-1 py-0.5 font-mono text-[10px] font-semibold uppercase leading-none',
                isDark
                  ? 'border-zinc-700 bg-zinc-800 text-zinc-200'
                  : 'border-[#0a66c2]/25 bg-[#0a66c2]/10 text-[#0a66c2]'
              )}
            >
              AI
            </span>
          </button>
          {authUser?.isAdmin && (
            <button
              type="button"
              onClick={() => onSelectTab('admin')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-3.5 text-xs',
                activeTab === 'admin' ? activeNavTabClass : inactiveNavTabClass
              )}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Admin</span>
              {adminUserCount !== null && (
                <span className="font-mono text-[11px] tabular-nums opacity-80">
                  ({adminUserCount})
                </span>
              )}
            </button>
          )}
        </nav>

        {/* Utility Controls */}
        <div className="flex flex-wrap items-center gap-2 py-2">
          {dbSyncing && (
            <div
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium',
                subSurface
              )}
              aria-live="polite"
            >
              <LoadingSpinner size={13} thickness={2} isDark={isDark} label="Saving changes" />
              <span className="hidden sm:inline">Saving...</span>
            </div>
          )}

          <NotificationBell
            theme={theme}
            notifications={notifications}
            unreadCount={unreadCount}
            nowMs={nowMs}
            isRealtimeConnected={isRealtimeConnected}
            onMarkAllRead={onMarkAllNotificationsRead}
            onClearNotifications={onClearNotifications}
            onSelectNotification={onSelectNotification}
            onOpenChangelog={onOpenChangelog}
          />

          <button
            type="button"
            onClick={onOpenSettings}
            className={cn(
              'civic-btn-motion inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
              secondaryBtn
            )}
            title="Open Settings, Target Roles, Salary & Desktop App Setup"
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          <button
            type="button"
            onClick={onOpenHowItWorks}
            className={cn(
              'civic-btn-motion inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
              secondaryBtn
            )}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">How It Works</span>
          </button>

          {authUser && (
            <div
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs',
                subSurface
              )}
              title={`${authUser.email} • ${storageMode === 'supabase-cloud' ? 'Synced to Supabase Cloud' : 'Local Storage Mode'}`}
            >
              <span className="max-w-[140px] truncate font-medium">
                {authUser.fullName}
              </span>
              {authUser.isAdmin && (
                <span
                  className={cn(
                    'rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase leading-none',
                    isDark
                      ? 'border-zinc-700 bg-zinc-800 text-zinc-100'
                      : 'border-[#0a66c2]/25 bg-[#0a66c2]/10 text-[#0a66c2]'
                  )}
                >
                  Admin
                </span>
              )}
              <button
                type="button"
                disabled={signingOut}
                onClick={onSignOut}
                className={cn(
                  'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium transition-colors disabled:opacity-50',
                  secondaryBtn
                )}
                title="Sign Out"
              >
                <LogOut className="h-3 w-3" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          )}

          {/* Light / Dark Theme Switcher */}
          <div
            className={cn('inline-flex items-center rounded-lg border p-0.5', navTrack)}
            role="group"
            aria-label="Color theme switcher"
          >
            {(
              [
                { id: 'light', label: 'Light', icon: Sun, title: 'Light Mode' },
                { id: 'dark', label: 'Dark', icon: Moon, title: 'Dark Mode' },
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
                    'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                    active ? primaryBtn : mutedText
                  )}
                  title={opt.title}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}

'use client';

import Image from 'next/image';
import {
  BarChart3,
  Briefcase,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import {
  ActiveTab,
  AuthSessionUser,
  MonochromeTheme,
  UserProfile,
} from '@/types/job';
import type { ActivityNotification } from '@/features/notifications/types';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { UserAvatarMenu } from '@/components/layout/UserAvatarMenu';
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
  savedCount?: number;
  savedSearchesCount?: number;
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
  onOpenSavedSearches?: () => void;
  onOpenSavedJobs?: () => void;
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
  savedCount = 0,
  savedSearchesCount = 0,
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
  onOpenSavedSearches = () => undefined,
  onOpenSavedJobs = () => onSelectTab('applications'),
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
    mutedText,
    strongText,
    borderSubtle,
    badgeNeutral,
    badgeAccent,
  } = getThemeTokens(theme);

  const activeNavTabClass = isDark
    ? 'border-b-2 border-zinc-100 text-zinc-50 font-semibold'
    : 'border-b-2 border-[#0a66c2] text-slate-950 font-semibold';

  const inactiveNavTabClass = cn(
    'border-b-2 border-transparent font-medium transition-colors',
    mutedText,
    isDark ? 'hover:text-zinc-100' : 'hover:text-slate-950'
  );

  const isJobSearchActive = activeTab === 'home' || activeTab === 'jobs';

  const mobileNavItems: {
    key: ActiveTab;
    label: string;
    icon: typeof Briefcase;
    active: boolean;
    badge?: number;
  }[] = [
    {
      key: 'home',
      label: 'Jobs',
      icon: Briefcase,
      active: isJobSearchActive,
    },
    {
      key: 'resume',
      label: 'Resume AI',
      icon: FileText,
      active: activeTab === 'resume',
    },
    {
      key: 'applications',
      label: 'Activity',
      icon: CheckCircle2,
      active: activeTab === 'applications',
      badge: hydrated && appliedCount > 0 ? appliedCount : undefined,
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      active: activeTab === 'analytics',
    },
  ];

  return (
    <>
      <header
        className={cn(
          'no-print sticky top-0 z-30 border-b pt-[env(safe-area-inset-top,0px)]',
          navBg
        )}
      >
        <div className="mx-auto flex min-h-[56px] max-w-[1280px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-6">
            <button
              type="button"
              onClick={() => onSelectTab('home')}
              className="civic-touch-target flex min-w-0 items-center gap-2.5 py-2 text-left transition-opacity hover:opacity-85"
              title="Go to Pa-Hire Po Job Search"
            >
              <div
                className={cn(
                  'relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border bg-white',
                  borderSubtle
                )}
              >
                <Image
                  src="/pa-hire-po-logo.jpg"
                  alt="Pa-Hire Po Logo"
                  fill
                  sizes="32px"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="flex min-w-0 items-center gap-1.5">
                <span
                  className={cn(
                    'truncate font-display text-base font-bold tracking-tight leading-none',
                    strongText
                  )}
                >
                  Pa-Hire Po
                </span>
                {isDesktopApp && (
                  <span
                    className={cn(
                      'hidden rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none sm:inline-block',
                      badgeNeutral
                    )}
                  >
                    Desktop
                  </span>
                )}
              </div>
            </button>

            {/* Desktop 4 Clean Primary Underline Tabs (Pic 2 Layout) */}
            <nav
              className="hidden items-center gap-1 md:flex"
              aria-label="Primary sections"
            >
              <button
                type="button"
                onClick={() => onSelectTab('home')}
                aria-current={isJobSearchActive ? 'page' : undefined}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-4 text-[13px]',
                  isJobSearchActive ? activeNavTabClass : inactiveNavTabClass
                )}
              >
                Job Search
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('resume')}
                aria-current={activeTab === 'resume' ? 'page' : undefined}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-4 text-[13px]',
                  activeTab === 'resume' ? activeNavTabClass : inactiveNavTabClass
                )}
              >
                <span>Resume Studio</span>
                <span
                  className={cn(
                    'rounded border px-1 py-0.5 font-mono text-[10px] font-semibold uppercase leading-none',
                    badgeAccent
                  )}
                >
                  AI
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('applications')}
                aria-current={activeTab === 'applications' ? 'page' : undefined}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-4 text-[13px]',
                  activeTab === 'applications'
                    ? activeNavTabClass
                    : inactiveNavTabClass
                )}
              >
                <span>Activity</span>
                {hydrated && appliedCount > 0 && (
                  <span className="font-mono text-[11px] tabular-nums opacity-75">
                    ({appliedCount})
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('analytics')}
                aria-current={activeTab === 'analytics' ? 'page' : undefined}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-4 text-[13px]',
                  activeTab === 'analytics'
                    ? activeNavTabClass
                    : inactiveNavTabClass
                )}
              >
                <span>Analytics</span>
                {hydrated && activeJobsCount > 0 && (
                  <span className="font-mono text-[11px] tabular-nums opacity-75">
                    ({activeJobsCount})
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Right Utility Cluster: Sync Indicator + Bell + Avatar Dropdown (Pic 2/3) */}
          <div className="flex shrink-0 items-center gap-2 py-2">
            {dbSyncing && (
              <div
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium',
                  subSurface
                )}
                aria-live="polite"
              >
                <LoadingSpinner
                  size={13}
                  thickness={2}
                  isDark={isDark}
                  label="Saving changes"
                />
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

            <UserAvatarMenu
              theme={theme}
              activeProfile={activeProfile}
              authUser={authUser}
              storageMode={storageMode}
              savedCount={hydrated ? savedCount : 0}
              savedSearchesCount={hydrated ? savedSearchesCount : 0}
              appliedCount={hydrated ? appliedCount : 0}
              adminUserCount={adminUserCount}
              signingOut={signingOut}
              onOpenProfile={() => onSelectTab('profile')}
              onOpenSavedSearches={onOpenSavedSearches}
              onOpenSavedJobs={onOpenSavedJobs}
              onOpenApplications={() => onSelectTab('applications')}
              onOpenSettings={onOpenSettings}
              onOpenHowItWorks={onOpenHowItWorks}
              onOpenAdmin={() => onSelectTab('admin')}
              onChangeTheme={onChangeTheme}
              onSignOut={onSignOut}
            />
          </div>
        </div>
      </header>

      {/* Fixed Mobile Bottom Navigation Bar (< 768px) */}
      <nav
        aria-label="Mobile primary sections"
        className={cn(
          'no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t pb-[max(0.35rem,env(safe-area-inset-bottom,0px))] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] md:hidden',
          navBg
        )}
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectTab(item.key)}
              aria-current={item.active ? 'page' : undefined}
              className={cn(
                'relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 border-t-2 px-1 pt-1.5 pb-1 text-[11px] transition-colors',
                item.active
                  ? isDark
                    ? 'border-t-zinc-100 font-semibold text-zinc-50'
                    : 'border-t-[#0a66c2] font-semibold text-[#0a66c2]'
                  : cn('border-t-transparent font-medium', mutedText)
              )}
            >
              <span className="relative inline-flex items-center justify-center">
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      'absolute -right-2.5 -top-1.5 inline-flex min-w-[16px] items-center justify-center rounded-full px-1 font-mono text-[9px] font-semibold leading-tight tabular-nums',
                      isDark
                        ? 'bg-zinc-100 text-zinc-950'
                        : 'bg-[#0a66c2] text-white'
                    )}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </span>
              <span className="truncate leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

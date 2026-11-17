'use client';

import { useEffect, useId, useRef } from 'react';
import {
  Bell,
  BookmarkCheck,
  Briefcase,
  CheckCheck,
  CheckCircle2,
  EyeOff,
  FileText,
  Settings,
  Trash2,
} from 'lucide-react';
import type { MonochromeTheme } from '@/types/job';
import type { ActivityNotification } from '@/features/notifications/types';
import { LATEST_CHANGELOG_RELEASE } from '@/features/changelog/data/changelog-data';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  theme: MonochromeTheme;
  notifications: ActivityNotification[];
  unreadCount: number;
  nowMs?: number | null;
  isRealtimeConnected?: boolean;
  onMarkAllRead: () => void;
  onClearNotifications: () => void;
  onSelectNotification: (item: ActivityNotification) => void;
  onOpenChangelog: () => void;
}

function formatNotificationTime(iso: string, nowMs?: number | null): string {
  if (!nowMs) {
    return iso.slice(0, 10);
  }
  const diffSec = Math.max(
    0,
    Math.floor((nowMs - new Date(iso).getTime()) / 1000)
  );
  if (diffSec < 45) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function getKindIcon(kind: ActivityNotification['kind']) {
  switch (kind) {
    case 'applied':
      return CheckCircle2;
    case 'saved':
      return BookmarkCheck;
    case 'hidden':
      return EyeOff;
    case 'resume':
      return FileText;
    case 'settings':
      return Settings;
    case 'scan':
      return Briefcase;
    default:
      return Bell;
  }
}

export function NotificationBell({
  theme,
  notifications,
  unreadCount,
  nowMs = null,
  isRealtimeConnected = false,
  onMarkAllRead,
  onClearNotifications,
  onSelectNotification,
  onOpenChangelog,
}: NotificationBellProps) {
  const popoverId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const tokens = getThemeTokens(theme);

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
      const panelWidth = Math.min(360, window.innerWidth - 24);
      const rightOffset = Math.max(12, window.innerWidth - rect.right);
      popover.style.position = 'fixed';
      popover.style.margin = '0';
      popover.style.top = `${Math.round(rect.bottom + 8)}px`;
      popover.style.right = `${Math.round(rightOffset)}px`;
      popover.style.left = 'auto';
      popover.style.width = `${panelWidth}px`;
    };

    popover.addEventListener('beforetoggle', handleBeforeToggle);
    return () => {
      popover.removeEventListener('beforetoggle', handleBeforeToggle);
    };
  }, []);

  const closePopover = () => {
    const el = popoverRef.current as (HTMLDivElement & {
      hidePopover?: () => void;
    }) | null;
    if (el && typeof el.hidePopover === 'function') {
      try {
        el.hidePopover();
      } catch {
        // Already hidden
      }
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={triggerRef}
        type="button"
        {...({ popoverTarget: popoverId } as Record<string, string>)}
        className={cn(
          'civic-btn-motion relative inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
          tokens.secondaryBtn
        )}
        aria-label={
          unreadCount > 0
            ? `Notifications (${unreadCount} unread)`
            : 'Notifications'
        }
        title="Notifications & Activity"
      >
        <Bell className="h-3.5 w-3.5" />
        {unreadCount > 0 && (
          <span
            key={unreadCount}
            className={cn(
              'civic-confirm-pop ml-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full px-1 py-0.5 font-mono text-[10px] font-semibold leading-none tabular-nums',
              tokens.primaryBtn
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <div
        id={popoverId}
        ref={popoverRef}
        {...({ popover: 'auto' } as Record<string, string>)}
        className={cn(
          'notification-popover w-[min(92vw,360px)] rounded-xl border p-0 shadow-xl',
          tokens.cardSurface
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between gap-2 border-b px-4 py-3',
            tokens.borderSubtle
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold">Notifications</span>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium',
                isRealtimeConnected ? tokens.badgeSuccess : tokens.badgeNeutral
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  isRealtimeConnected ? 'bg-emerald-500' : 'bg-zinc-400'
                )}
              />
              {isRealtimeConnected ? 'Live' : 'Sync'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className={cn(
                  'civic-btn-motion inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium',
                  tokens.secondaryBtn
                )}
              >
                <CheckCheck className="h-3 w-3" />
                Read all
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onClearNotifications}
                className={cn(
                  'civic-btn-motion rounded-md border p-1',
                  tokens.secondaryBtn
                )}
                aria-label="Clear notifications"
                title="Clear notifications"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="max-h-[340px] overflow-y-auto divide-y">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center space-y-1.5">
              <Bell className={cn('mx-auto h-5 w-5', tokens.mutedText)} />
              <p className="text-xs font-semibold">No recent activity yet</p>
              <p className={cn('text-[11px]', tokens.mutedText)}>
                Saves, job applications, resume snapshots, and job scan alerts appear here in real time.
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const Icon = getKindIcon(item.kind);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    closePopover();
                    onSelectNotification(item);
                  }}
                  className={cn(
                    'flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors',
                    tokens.borderSubtle,
                    !item.read && tokens.subSurface,
                    tokens.isDark
                      ? 'hover:bg-slate-800/70'
                      : 'hover:bg-slate-50'
                  )}
                >
                  <div
                    className={cn(
                      'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border',
                      tokens.cardSurface
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold">
                        {item.title}
                      </span>
                      <span className={cn('shrink-0 font-mono text-[10px]', tokens.mutedText)}>
                        {formatNotificationTime(item.createdAt, nowMs)}
                      </span>
                    </div>
                    <p className={cn('line-clamp-2 text-[11px] leading-snug', tokens.mutedText)}>
                      {item.detail}
                    </p>
                  </div>
                  {!item.read && (
                    <span
                      className={cn(
                        'mt-2 h-2 w-2 shrink-0 rounded-full',
                        tokens.barFill
                      )}
                      aria-label="Unread"
                    />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer: What's New Changelog */}
        <div
          className={cn(
            'flex items-center justify-between border-t px-4 py-2.5',
            tokens.borderSubtle,
            tokens.subSurface
          )}
        >
          <span className={cn('text-[11px]', tokens.mutedText)}>
            Latest: {LATEST_CHANGELOG_RELEASE.version} ({LATEST_CHANGELOG_RELEASE.date})
          </span>
          <button
            type="button"
            onClick={() => {
              closePopover();
              onOpenChangelog();
            }}
            className={cn(
              'civic-btn-motion inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-semibold',
              tokens.secondaryBtn
            )}
          >
            What&apos;s New ({LATEST_CHANGELOG_RELEASE.version})
          </button>
        </div>
      </div>
    </div>
  );
}

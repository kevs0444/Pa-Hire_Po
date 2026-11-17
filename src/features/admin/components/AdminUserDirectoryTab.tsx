'use client';

import { useId } from 'react';
import {
  Ban,
  Eye,
  FileText,
  Search,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { AdminUserRecord, MonochromeTheme, UserRole } from '@/types/job';
import { PRIMARY_ADMIN_EMAIL } from '@/lib/supabase/config';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface AdminUserDirectoryTabProps {
  theme: MonochromeTheme;
  users: AdminUserRecord[];
  loading: boolean;
  schemaReady: boolean;
  searchQuery: string;
  roleFilter: 'all' | 'admin' | 'user' | 'suspended';
  busyUserId: string | null;
  confirmDeleteId: string | null;
  onSearchChange: (val: string) => void;
  onRoleFilterChange: (val: 'all' | 'admin' | 'user' | 'suspended') => void;
  onInspectUser: (userId: string) => void;
  onUpdateUser: (
    userId: string,
    updates: { role?: UserRole; isSuspended?: boolean }
  ) => void;
  onRequestDelete: (userId: string | null) => void;
  onConfirmDelete: (userId: string) => void;
}

export function AdminUserDirectoryTab({
  theme,
  users,
  loading,
  schemaReady,
  searchQuery,
  roleFilter,
  busyUserId,
  confirmDeleteId,
  onSearchChange,
  onRoleFilterChange,
  onInspectUser,
  onUpdateUser,
  onRequestDelete,
  onConfirmDelete,
}: AdminUserDirectoryTabProps) {
  const tokens = getThemeTokens(theme);
  const searchInputId = useId();
  const captionId = useId();

  return (
    <section className={cn('rounded-lg border p-5 space-y-4', tokens.cardSurface)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
          <h3 className="text-sm font-bold">
            User Directory ({users.length})
          </h3>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Filter users by role or status">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'admin', label: 'Admins' },
                { id: 'user', label: 'Users' },
                { id: 'suspended', label: 'Suspended' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={roleFilter === tab.id}
                onClick={() => onRoleFilterChange(tab.id)}
                className={cn(
                  'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                  roleFilter === tab.id ? tokens.primaryBtn : tokens.secondaryBtn
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <search className="relative">
          <label htmlFor={searchInputId} className="sr-only">
            Search users by name, email, role, or location
          </label>
          <Search
            className={cn(
              'pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5',
              tokens.mutedText
            )}
            aria-hidden="true"
          />
          <input
            id={searchInputId}
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search name, email, role..."
            className={cn(
              'w-full rounded-lg border py-1.5 pl-8 pr-3 text-xs focus:outline-none sm:w-64',
              tokens.inputSurface
            )}
          />
        </search>
      </div>

      {users.length === 0 ? (
        <div
          className={cn(
            'rounded-lg border border-dashed p-8 text-center text-xs',
            tokens.borderSubtle,
            tokens.mutedText
          )}
        >
          {loading
            ? 'Loading users...'
            : 'No user accounts match that filter yet.'}
        </div>
      ) : (
        <div
          tabIndex={0}
          role="region"
          aria-labelledby={captionId}
          className="admin-table-wrapper max-h-[620px]"
        >
          <table className="w-full text-left text-xs">
            <caption id={captionId} className="sr-only">
              Registered Pa-Hire Po users, roles, pipelines, and moderation actions
            </caption>
            <thead
              className={cn(
                'sticky top-0 z-10',
                tokens.cardSurface
              )}
            >
              <tr className={cn('border-b', tokens.borderSubtle, tokens.mutedText)}>
                <th scope="col" className="border-b py-2.5 pr-3 font-semibold">
                  User
                </th>
                <th scope="col" className="border-b px-3 py-2.5 font-semibold">
                  Role &amp; Status
                </th>
                <th scope="col" className="border-b px-3 py-2.5 font-semibold">
                  Target Role &amp; Skills
                </th>
                <th scope="col" className="border-b px-3 py-2.5 font-semibold">
                  Jobs / Pipeline
                </th>
                <th scope="col" className="border-b px-3 py-2.5 font-semibold">
                  Last Active
                </th>
                <th scope="col" className="border-b py-2.5 pl-3 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={cn('divide-y', tokens.borderSubtle)}>
              {users.map((u) => {
                const isPrimaryAdmin =
                  u.email.toLowerCase() === PRIMARY_ADMIN_EMAIL;
                const isBusy = busyUserId === u.id;
                const displayLabel = u.fullName || u.email || u.id;
                return (
                  <tr key={u.id} className="align-top">
                    <th scope="row" className="py-3 pr-3 font-normal">
                      <div className={cn('font-semibold', tokens.strongText)}>
                        {u.fullName}
                      </div>
                      <div
                        className={cn(
                          'break-all font-mono text-[11px]',
                          tokens.mutedText
                        )}
                      >
                        {u.email || u.id}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <span
                          className={cn(
                            'rounded border px-1.5 py-0.5 font-mono text-[10px]',
                            tokens.subSurface
                          )}
                        >
                          {u.provider}
                        </span>
                        {u.resumeFileName && (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px]',
                              tokens.subSurface
                            )}
                          >
                            <FileText className="h-2.5 w-2.5" aria-hidden="true" />
                            {u.resumeFileName}
                          </span>
                        )}
                      </div>
                    </th>

                    <td data-label="Role & Status" className="px-3 py-3 space-y-1">
                      <div>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[11px] font-semibold',
                            u.role === 'admin'
                              ? tokens.badgeAccent
                              : tokens.badgeNeutral
                          )}
                        >
                          {u.role === 'admin' ? '✓ Admin' : 'User'}
                        </span>
                      </div>
                      {u.isSuspended && (
                        <div>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[10px] font-semibold',
                              tokens.badgeDanger
                            )}
                          >
                            × Suspended
                          </span>
                        </div>
                      )}
                    </td>

                    <td data-label="Target Role & Skills" className="px-3 py-3">
                      <div className="font-medium">{u.primaryRole}</div>
                      <div className={cn('text-[11px]', tokens.mutedText)}>
                        {u.location} ·{' '}
                        <span className="font-mono tabular-nums">
                          {u.skillsCount} skills
                        </span>
                      </div>
                    </td>

                    <td
                      data-label="Jobs / Pipeline"
                      className="px-3 py-3 font-mono text-[11px] tabular-nums"
                    >
                      <div>{u.totalJobs} tracked</div>
                      <div className={tokens.mutedText}>
                        {u.savedJobs} saved · {u.appliedJobs} applied ·{' '}
                        {u.scansCount} scans
                      </div>
                    </td>

                    <td
                      data-label="Last Active"
                      className="px-3 py-3 font-mono text-[11px]"
                    >
                      {u.lastActiveAt
                        ? new Date(u.lastActiveAt).toLocaleString()
                        : 'Never'}
                    </td>

                    <td data-label="Actions" className="py-3 pl-3 text-right">
                      <div className="flex flex-wrap justify-start gap-1.5 sm:justify-end">
                        <button
                          type="button"
                          onClick={() => onInspectUser(u.id)}
                          aria-label={`Inspect ${displayLabel}`}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors',
                            tokens.secondaryBtn
                          )}
                        >
                          <Eye className="h-3 w-3" aria-hidden="true" />
                          Inspect
                        </button>

                        {!isPrimaryAdmin && schemaReady && (
                          <>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                onUpdateUser(u.id, {
                                  role: u.role === 'admin' ? 'user' : 'admin',
                                })
                              }
                              aria-label={`${u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'} for ${displayLabel}`}
                              className={cn(
                                'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-50',
                                tokens.secondaryBtn
                              )}
                            >
                              <UserCheck className="h-3 w-3" aria-hidden="true" />
                              {u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                            </button>

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                onUpdateUser(u.id, {
                                  isSuspended: !u.isSuspended,
                                })
                              }
                              aria-label={`${u.isSuspended ? 'Activate' : 'Suspend'} ${displayLabel}`}
                              className={cn(
                                'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-50',
                                tokens.secondaryBtn
                              )}
                            >
                              <Ban className="h-3 w-3" aria-hidden="true" />
                              {u.isSuspended ? 'Activate' : 'Suspend'}
                            </button>

                            {confirmDeleteId === u.id ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => onConfirmDelete(u.id)}
                                  aria-label={`Confirm Delete ${displayLabel}`}
                                  className={cn(
                                    'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50',
                                    tokens.badgeDanger
                                  )}
                                >
                                  Confirm Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onRequestDelete(null)}
                                  className={cn(
                                    'rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors',
                                    tokens.secondaryBtn
                                  )}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => onRequestDelete(u.id)}
                                aria-label={`Delete ${displayLabel}`}
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-50',
                                  tokens.secondaryBtn
                                )}
                              >
                                <Trash2 className="h-3 w-3" aria-hidden="true" />
                                <span className="sr-only">Delete</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

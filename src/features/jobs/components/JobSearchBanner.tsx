'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import {
  Activity,
  ArrowUpDown,
  Bookmark,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Filter,
  Heart,
  History,
  MapPin,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  COUNTRY_CONFIGS,
  CountryCode,
  DateFilterOption,
  JobSortOption,
  JobSource,
  MonochromeTheme,
  RecentJobSearch,
  ScanSourceMeta,
  UserProfile,
} from '@/types/job';
import {
  DEFAULT_PAY_FILTER,
  formatCompactPay,
  getCurrencyPayConfig,
  JOB_CLASSIFICATION_OPTIONS,
  JOB_TYPE_OPTIONS,
  LISTING_TIME_OPTIONS,
  PayFilterConfig,
  PayPeriod,
  REMOTE_SETUP_OPTIONS,
} from '@/features/jobs/lib/job-filters';
import { BoardLogo } from '@/components/ui/BrandLogos';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface FilterPillPopoverProps {
  label: string;
  active?: boolean;
  isDark: boolean;
  tokens: ReturnType<typeof getThemeTokens>;
  panelClassName?: string;
  children: ReactNode;
}

function FilterPillPopover({
  label,
  active = false,
  isDark,
  tokens,
  panelClassName,
  children,
}: FilterPillPopoverProps) {
  const popoverId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

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
      const maxWidth = Math.min(340, window.innerWidth - 24);
      const leftPos = Math.max(
        12,
        Math.min(rect.left, window.innerWidth - maxWidth - 12)
      );
      const maxHeight = Math.max(220, window.innerHeight - rect.bottom - 24);
      popover.style.position = 'fixed';
      popover.style.margin = '0';
      popover.style.top = `${Math.round(rect.bottom + 8)}px`;
      popover.style.left = `${Math.round(leftPos)}px`;
      popover.style.maxWidth = `${maxWidth}px`;
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

  const highlighted = isOpen || active;

  return (
    <div className="relative inline-flex shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-controls={popoverId}
        aria-expanded={isOpen}
        {...({ popoverTarget: popoverId } as Record<string, string>)}
        className={cn(
          'civic-touch-target inline-flex min-h-[38px] items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
          highlighted
            ? isDark
              ? 'border-zinc-200 bg-zinc-100 text-zinc-950 font-semibold'
              : 'border-[#3b82f6] bg-[#2563eb] text-white font-semibold'
            : isDark
              ? 'border-zinc-700 bg-zinc-900/60 text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800'
              : 'border-white/30 bg-white/10 text-white hover:border-white/60 hover:bg-white/15'
        )}
      >
        <span>{label}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-150',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <div
        id={popoverId}
        ref={popoverRef}
        {...({ popover: 'auto' } as Record<string, string>)}
        className={cn(
          'civic-popover-panel-start rounded-xl border p-4 shadow-xl',
          tokens.cardSurface,
          panelClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}

interface JobSearchBannerProps {
  theme: MonochromeTheme;
  wideContainer?: boolean;
  activeProfile: UserProfile;
  roleDraft: string;
  companyDraft: string;
  activeSearchMeta: { role: string; company: string };
  scanning: boolean;
  scanError: string | null;
  countdown: number;
  enabledSources: JobSource[];
  boardMeta: ScanSourceMeta[];
  totalJobsCount: number;
  sourceFilter: 'all' | JobSource;
  fitFilter: 'all' | 'applicable';
  dateFilter: DateFilterOption;
  sortBy: JobSortOption;
  minScore: number;
  searchQuery: string;
  payFilter: PayFilterConfig;
  jobTypeFilters: string[];
  remoteFilters: string[];
  classificationFilters: string[];
  newToMeOnly: boolean;
  activeFilterCount: number;
  onChangeRoleDraft: (value: string) => void;
  onChangeCompanyDraft: (value: string) => void;
  onUpdateProfile: (next: UserProfile, rescore?: boolean) => void;
  onExecuteSearch: (role: string, company: string) => void;
  onSaveCurrentSearch: () => void;
  onApplyPrimaryRole: (role: string, triggerScan?: boolean) => void;
  onToggleSource: (source: JobSource) => void;
  onChangeSourceFilter: (source: 'all' | JobSource) => void;
  onToggleFitFilter: () => void;
  onChangeDateFilter: (date: DateFilterOption) => void;
  onChangeSortBy: (sort: JobSortOption) => void;
  onChangeMinScore: (score: number) => void;
  onChangeSearchQuery: (query: string) => void;
  onChangePayFilter: (next: PayFilterConfig) => void;
  onToggleJobTypeFilter: (value: string) => void;
  onToggleRemoteFilter: (value: string) => void;
  onToggleClassificationFilter: (value: string) => void;
  onToggleNewToMe: () => void;
  onResetAllFilters: () => void;
  onClearUnsavedJobs: () => void;
  onRunRecentSearch: (item: RecentJobSearch) => void;
}

export function JobSearchBanner({
  theme,
  wideContainer = false,
  activeProfile,
  roleDraft,
  companyDraft,
  activeSearchMeta,
  scanning,
  scanError,
  countdown,
  enabledSources,
  boardMeta,
  totalJobsCount,
  sourceFilter,
  fitFilter,
  dateFilter,
  sortBy,
  minScore,
  searchQuery,
  payFilter,
  jobTypeFilters,
  remoteFilters,
  classificationFilters,
  newToMeOnly,
  activeFilterCount,
  onChangeRoleDraft,
  onChangeCompanyDraft,
  onUpdateProfile,
  onExecuteSearch,
  onSaveCurrentSearch,
  onApplyPrimaryRole,
  onToggleSource,
  onChangeSourceFilter,
  onToggleFitFilter,
  onChangeDateFilter,
  onChangeSortBy,
  onChangeMinScore,
  onChangeSearchQuery,
  onChangePayFilter,
  onToggleJobTypeFilter,
  onToggleRemoteFilter,
  onToggleClassificationFilter,
  onToggleNewToMe,
  onResetAllFilters,
  onClearUnsavedJobs,
  onRunRecentSearch,
}: JobSearchBannerProps) {
  const [justSavedSearch, setJustSavedSearch] = useState(false);
  const [recentDesktopExpanded, setRecentDesktopExpanded] = useState(true);
  const [recentMobileExpanded, setRecentMobileExpanded] = useState(false);

  const tokens = getThemeTokens(theme);
  const isDark = tokens.isDark;
  const currencyConfig = getCurrencyPayConfig(activeProfile.country);
  const paySteps = currencyConfig.steps[payFilter.period];
  const recentSearches = activeProfile.recentSearches || [];

  const handleTriggerSaveSearch = () => {
    onSaveCurrentSearch();
    setJustSavedSearch(true);
    setTimeout(() => setJustSavedSearch(false), 1800);
  };

  const payPillLabel = (() => {
    if (payFilter.min === null && payFilter.max === null) return 'Pay';
    const minStr =
      payFilter.min !== null
        ? formatCompactPay(payFilter.min, currencyConfig.symbol)
        : `${currencyConfig.symbol}0`;
    const maxStr =
      payFilter.max !== null
        ? formatCompactPay(payFilter.max, currencyConfig.symbol)
        : 'Any';
    return `Pay: ${minStr}–${maxStr}`;
  })();

  const listingTimeLabel =
    dateFilter === 'all'
      ? 'Listing time'
      : LISTING_TIME_OPTIONS.find((o) => o.value === dateFilter)?.label ||
        'Listing time';

  const boardsExtraCount = [
    Boolean(companyDraft.trim()),
    enabledSources.length < 3,
    sourceFilter !== 'all',
    fitFilter !== 'all',
    sortBy !== 'match',
    minScore > 0,
    Boolean(searchQuery.trim()),
  ].filter(Boolean).length;

  return (
    <section className={cn('no-print w-full', tokens.searchBanner)}>
      {/* Main Banner Search + Pill Row */}
      <div
        className={cn(
          'mx-auto px-4 pt-4 pb-3.5 sm:px-6 sm:pt-5 sm:pb-4',
          wideContainer ? 'max-w-[1440px]' : 'max-w-[1140px]'
        )}
      >
        {/* Row 1: Single-Row Inputs (16px on mobile to prevent iOS Safari auto-zoom) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onExecuteSearch(roleDraft, companyDraft);
          }}
          className="flex flex-col gap-2.5 md:flex-row md:items-center"
        >
          <div className="relative flex-1 md:flex-[1.5]">
            <Search
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2',
                isDark ? 'text-zinc-400' : 'text-slate-500'
              )}
            />
            <input
              type="text"
              value={roleDraft}
              onChange={(e) => onChangeRoleDraft(e.target.value)}
              placeholder="Enter job title, keyword, or 'Role at Company'"
              aria-label="Job title or keyword"
              className={cn(
                'min-h-[44px] w-full rounded-lg border py-2.5 pl-10 pr-10 text-base font-medium focus:outline-none sm:text-sm',
                tokens.searchBannerInput
              )}
            />
            {roleDraft && (
              <button
                type="button"
                onClick={() => onChangeRoleDraft('')}
                aria-label="Clear job keyword"
                className={cn(
                  'civic-touch-target absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center justify-center rounded p-1.5 transition-colors',
                  isDark
                    ? 'text-zinc-400 hover:text-zinc-100'
                    : 'text-slate-400 hover:text-slate-700'
                )}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div
            className={cn(
              'flex min-h-[44px] flex-1 items-center rounded-lg border pr-2',
              tokens.searchBannerInput
            )}
          >
            <MapPin
              aria-hidden="true"
              className={cn(
                'ml-3.5 h-4 w-4 shrink-0',
                isDark ? 'text-zinc-400' : 'text-slate-500'
              )}
            />
            <input
              type="text"
              value={activeProfile.location}
              onChange={(e) =>
                onUpdateProfile({
                  ...activeProfile,
                  location: e.target.value,
                })
              }
              placeholder="Enter suburb, city, or region"
              aria-label="Location"
              className="min-w-0 flex-1 bg-transparent py-2.5 pl-2.5 pr-2 text-base font-medium focus:outline-none sm:text-sm"
            />
            <select
              value={activeProfile.country}
              aria-label="Country or market"
              onChange={(e) => {
                const code = e.target.value as CountryCode;
                onUpdateProfile({
                  ...activeProfile,
                  country: code,
                  location: COUNTRY_CONFIGS[code].defaultLocation,
                });
                onChangePayFilter(DEFAULT_PAY_FILTER);
              }}
              className={cn(
                'shrink-0 rounded border px-2 py-1 font-mono text-xs font-semibold uppercase focus:outline-none',
                isDark
                  ? 'border-zinc-700 bg-zinc-900 text-zinc-200'
                  : 'border-slate-200 bg-slate-100 text-slate-700'
              )}
            >
              {Object.values(COUNTRY_CONFIGS).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={scanning}
            className={cn(
              'civic-btn-motion inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm transition-colors disabled:opacity-60',
              tokens.searchBannerCta
            )}
          >
            <Search className="h-4 w-4" />
            <span>{scanning ? 'Searching...' : 'Search'}</span>
          </button>
        </form>

        {/* Row 2: JobStreet Outlined Filter Pills (Pics 2–6) + Save Search */}
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="no-scrollbar flex flex-1 flex-nowrap items-center gap-2 overflow-x-auto py-0.5">
            {/* 0. NEW TO ME 1-CLICK TOGGLE PILL */}
            <button
              type="button"
              aria-pressed={newToMeOnly}
              onClick={onToggleNewToMe}
              title="Hide applied, saved, queued, and duplicate applied roles"
              className={cn(
                'civic-touch-target inline-flex min-h-[38px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs transition-colors',
                newToMeOnly
                  ? isDark
                    ? 'border-zinc-200 bg-zinc-100 font-semibold text-zinc-950'
                    : 'border-[#3b82f6] bg-[#2563eb] font-semibold text-white'
                  : isDark
                    ? 'border-zinc-700 bg-zinc-900/60 font-medium text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800'
                    : 'border-white/30 bg-white/10 font-medium text-white hover:border-white/60 hover:bg-white/15'
              )}
            >
              {newToMeOnly ? (
                <span className="inline-flex items-center gap-1" aria-hidden="true">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      isDark ? 'bg-emerald-600' : 'bg-emerald-300'
                    )}
                  />
                  <Check className="h-3.5 w-3.5" />
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full border border-current opacity-65"
                />
              )}
              <span>New to me</span>
            </button>

            {/* 1. PAY PILL (Pic 2) */}
            <FilterPillPopover
              label={payPillLabel}
              active={payFilter.min !== null || payFilter.max !== null}
              isDark={isDark}
              tokens={tokens}
              panelClassName="w-[min(92dvw,320px)]"
            >
              <div className="space-y-4">
                <div
                  className={cn(
                    'flex items-center gap-4 border-b',
                    tokens.borderSubtle
                  )}
                >
                  {(
                    [
                      { id: 'annual', label: 'Annually' },
                      { id: 'monthly', label: 'Monthly' },
                      { id: 'hourly', label: 'Hourly' },
                    ] as { id: PayPeriod; label: string }[]
                  ).map((tab) => {
                    const active = payFilter.period === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() =>
                          onChangePayFilter({
                            period: tab.id,
                            min: null,
                            max: null,
                          })
                        }
                        className={cn(
                          'border-b-2 pb-2 text-xs font-semibold transition-colors',
                          active
                            ? isDark
                              ? 'border-zinc-100 text-zinc-50'
                              : 'border-[#0a66c2] text-[#0a66c2]'
                            : cn('border-transparent', tokens.mutedText)
                        )}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1 text-xs">
                    <span className={cn('block font-semibold', tokens.strongText)}>
                      From • {currencyConfig.code}
                    </span>
                    <select
                      value={payFilter.min ?? ''}
                      onChange={(e) =>
                        onChangePayFilter({
                          ...payFilter,
                          min: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className={cn(
                        'min-h-[40px] w-full rounded-lg border px-2.5 py-1.5 text-sm focus:outline-none',
                        tokens.inputSurface
                      )}
                    >
                      <option value="">Any ({currencyConfig.symbol}0)</option>
                      {paySteps.map((step) => (
                        <option key={`from-${step}`} value={step}>
                          {formatCompactPay(step, currencyConfig.symbol)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1 text-xs">
                    <span className={cn('block font-semibold', tokens.strongText)}>
                      To • {currencyConfig.code}
                    </span>
                    <select
                      value={payFilter.max ?? ''}
                      onChange={(e) =>
                        onChangePayFilter({
                          ...payFilter,
                          max: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className={cn(
                        'min-h-[40px] w-full rounded-lg border px-2.5 py-1.5 text-sm focus:outline-none',
                        tokens.inputSurface
                      )}
                    >
                      <option value="">
                        {formatCompactPay(
                          paySteps[paySteps.length - 1],
                          currencyConfig.symbol,
                          true
                        )}
                      </option>
                      {paySteps.slice(1).map((step) => (
                        <option key={`to-${step}`} value={step}>
                          {formatCompactPay(step, currencyConfig.symbol)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {(payFilter.min !== null || payFilter.max !== null) && (
                  <button
                    type="button"
                    onClick={() =>
                      onChangePayFilter({ ...payFilter, min: null, max: null })
                    }
                    className={cn(
                      'text-xs font-semibold underline-offset-2 hover:underline',
                      isDark ? 'text-zinc-300' : 'text-[#0a66c2]'
                    )}
                  >
                    Clear pay filter
                  </button>
                )}
              </div>
            </FilterPillPopover>

            {/* 2. TYPE PILL (Pic 3) */}
            <FilterPillPopover
              label={
                jobTypeFilters.length > 0
                  ? `Type (${jobTypeFilters.length})`
                  : 'Type'
              }
              active={jobTypeFilters.length > 0}
              isDark={isDark}
              tokens={tokens}
              panelClassName="w-[min(90dvw,260px)]"
            >
              <div className="space-y-1">
                {JOB_TYPE_OPTIONS.map((opt) => {
                  const checked = jobTypeFilters.includes(opt);
                  return (
                    <label
                      key={opt}
                      className={cn(
                        'flex min-h-[42px] cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors',
                        isDark ? 'hover:bg-zinc-800/70' : 'hover:bg-slate-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleJobTypeFilter(opt)}
                        className="h-4 w-4 rounded"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </FilterPillPopover>

            {/* 3. REMOTE PILL (Pic 4) */}
            <FilterPillPopover
              label={
                remoteFilters.length > 0
                  ? `Remote (${remoteFilters.length})`
                  : 'Remote'
              }
              active={remoteFilters.length > 0}
              isDark={isDark}
              tokens={tokens}
              panelClassName="w-[min(90dvw,240px)]"
            >
              <div className="space-y-1">
                {REMOTE_SETUP_OPTIONS.map((opt) => {
                  const checked = remoteFilters.includes(opt);
                  return (
                    <label
                      key={opt}
                      className={cn(
                        'flex min-h-[42px] cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors',
                        isDark ? 'hover:bg-zinc-800/70' : 'hover:bg-slate-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleRemoteFilter(opt)}
                        className="h-4 w-4 rounded"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </FilterPillPopover>

            {/* 4. CLASSIFICATION PILL (Pic 5) */}
            <FilterPillPopover
              label={
                classificationFilters.length > 0
                  ? `Classification (${classificationFilters.length})`
                  : 'Classification'
              }
              active={classificationFilters.length > 0}
              isDark={isDark}
              tokens={tokens}
              panelClassName="w-[min(92dvw,320px)] p-2"
            >
              <div className="max-h-64 space-y-0.5 overflow-y-auto pr-1">
                {JOB_CLASSIFICATION_OPTIONS.map((opt) => {
                  const checked = classificationFilters.includes(opt);
                  return (
                    <label
                      key={opt}
                      className={cn(
                        'flex min-h-[40px] cursor-pointer items-center gap-3 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors',
                        isDark ? 'hover:bg-zinc-800/70' : 'hover:bg-slate-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleClassificationFilter(opt)}
                        className="h-4 w-4 shrink-0 rounded"
                      />
                      <span className="leading-snug">{opt}</span>
                    </label>
                  );
                })}
              </div>
            </FilterPillPopover>

            {/* 5. LISTING TIME PILL (Pic 6) */}
            <FilterPillPopover
              label={listingTimeLabel}
              active={dateFilter !== 'all'}
              isDark={isDark}
              tokens={tokens}
              panelClassName="w-[min(90dvw,240px)]"
            >
              <div className="space-y-1">
                {LISTING_TIME_OPTIONS.map((opt) => {
                  const selected = dateFilter === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={cn(
                        'flex min-h-[40px] cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors',
                        isDark ? 'hover:bg-zinc-800/70' : 'hover:bg-slate-50'
                      )}
                    >
                      <input
                        type="radio"
                        name="job-listing-time"
                        checked={selected}
                        onChange={() => onChangeDateFilter(opt.value)}
                        className="h-4 w-4"
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </FilterPillPopover>

            {/* 6. PA-HIRE PO POWER PILL: BOARDS, COMPANY, TARGET ROLES & MATCH */}
            <FilterPillPopover
              label={
                boardsExtraCount > 0
                  ? `Boards & More (${boardsExtraCount})`
                  : 'Boards & More'
              }
              active={boardsExtraCount > 0}
              isDark={isDark}
              tokens={tokens}
              panelClassName="w-[min(94dvw,360px)]"
            >
              <div className="space-y-4 text-xs">
                {/* Optional Company Name */}
                <div className="space-y-1">
                  <label className={cn('block font-semibold', tokens.strongText)}>
                    Company name (optional)
                  </label>
                  <div className="relative">
                    <Building2
                      className={cn(
                        'pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5',
                        tokens.mutedText
                      )}
                    />
                    <input
                      type="text"
                      value={companyDraft}
                      onChange={(e) => onChangeCompanyDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          onExecuteSearch(roleDraft, companyDraft);
                        }
                      }}
                      placeholder="e.g. Canva, GCash, Medicare Plus"
                      className={cn(
                        'min-h-[38px] w-full rounded-lg border py-1.5 pl-8 pr-8 text-base focus:outline-none sm:text-xs',
                        tokens.inputSurface
                      )}
                    />
                    {companyDraft && (
                      <button
                        type="button"
                        onClick={() => {
                          onChangeCompanyDraft('');
                          if (activeSearchMeta.company) {
                            onExecuteSearch(roleDraft, '');
                          }
                        }}
                        aria-label="Clear company"
                        className={cn('absolute right-2 top-2 p-0.5', tokens.mutedText)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter loaded results + Sort */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={cn('mb-1 block font-semibold', tokens.strongText)}>
                      Filter loaded
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => onChangeSearchQuery(e.target.value)}
                      placeholder="Skill or title..."
                      className={cn(
                        'min-h-[36px] w-full rounded-lg border px-2.5 py-1.5 text-base focus:outline-none sm:text-xs',
                        tokens.inputSurface
                      )}
                    />
                  </div>
                  <div>
                    <label className={cn('mb-1 block font-semibold', tokens.strongText)}>
                      Sort order
                    </label>
                    <div className="relative flex items-center">
                      <ArrowUpDown
                        className={cn(
                          'pointer-events-none absolute left-2 top-2.5 h-3.5 w-3.5',
                          tokens.mutedText
                        )}
                      />
                      <select
                        value={sortBy}
                        onChange={(e) => onChangeSortBy(e.target.value as JobSortOption)}
                        className={cn(
                          'min-h-[36px] w-full rounded-lg border py-1.5 pl-7 pr-2 text-xs font-medium focus:outline-none',
                          tokens.inputSurface
                        )}
                      >
                        <option value="match">Best Match</option>
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3-Board Scraper Toggles */}
                <div className={cn('space-y-1.5 border-t pt-3', tokens.borderSubtle)}>
                  <p className={cn('font-semibold', tokens.strongText)}>
                    Job Boards (Scrape & Filter)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => onChangeSourceFilter('all')}
                      className={cn(
                        'rounded-md border px-2.5 py-1 text-xs font-medium',
                        sourceFilter === 'all'
                          ? tokens.primaryBtn
                          : tokens.secondaryBtn
                      )}
                    >
                      All ({totalJobsCount})
                    </button>
                    {(['linkedin', 'jobstreet', 'indeed'] as JobSource[]).map(
                      (board) => {
                        const enabled = enabledSources.includes(board);
                        const meta = boardMeta.find((m) => m.source === board);
                        return (
                          <div key={board} className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                onChangeSourceFilter(
                                  sourceFilter === board ? 'all' : board
                                )
                              }
                              className={cn(
                                'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-opacity',
                                sourceFilter === board
                                  ? tokens.primaryBtn
                                  : tokens.secondaryBtn,
                                !enabled && 'opacity-45'
                              )}
                              title={`Filter view to ${board}`}
                            >
                              <BoardLogo source={board} theme={theme} size="sm" />
                              {meta && (
                                <span className="font-mono text-[10px] tabular-nums">
                                  {meta.count}
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleSource(board)}
                              aria-label={`Toggle scraping ${board}`}
                              title={enabled ? `Disable ${board} scraping` : `Enable ${board} scraping`}
                              className={cn(
                                'rounded border px-1.5 py-1 font-mono text-[10px]',
                                enabled ? tokens.badgeSuccess : tokens.badgeNeutral
                              )}
                            >
                              {enabled ? 'ON' : 'OFF'}
                            </button>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Target Roles + Pivot Mode */}
                <div className={cn('space-y-2 border-t pt-3', tokens.borderSubtle)}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('font-semibold', tokens.strongText)}>
                      Target roles
                    </span>
                    <label
                      className={cn(
                        'inline-flex cursor-pointer items-center gap-1.5',
                        tokens.mutedText
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={activeProfile.autoPivotRoles}
                        onChange={(e) =>
                          onUpdateProfile({
                            ...activeProfile,
                            autoPivotRoles: e.target.checked,
                          })
                        }
                        className="h-3.5 w-3.5"
                      />
                      <span>Pivot Mode</span>
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeProfile.preferredRoles.map((role) => {
                      const isCurrent =
                        role.toLowerCase() ===
                        activeProfile.primaryRole.toLowerCase();
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => onApplyPrimaryRole(role, true)}
                          className={cn(
                            'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                            isCurrent ? tokens.primaryBtn : tokens.secondaryBtn
                          )}
                        >
                          {role}
                        </button>
                      );
                    })}
                    {roleDraft.trim() &&
                      roleDraft.trim().toLowerCase() !==
                        activeProfile.primaryRole.trim().toLowerCase() && (
                        <button
                          type="button"
                          onClick={() => onApplyPrimaryRole(roleDraft, false)}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-1 text-[11px] font-medium',
                            tokens.secondaryBtn
                          )}
                        >
                          <Bookmark className="h-3 w-3" />
                          Save Target Role
                        </button>
                      )}
                  </div>
                </div>

                {/* Experience Fit + Min Match % + Clear Unsaved */}
                <div
                  className={cn(
                    'space-y-2.5 border-t pt-3',
                    tokens.borderSubtle
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={onToggleFitFilter}
                      className={cn(
                        'rounded-md border px-2.5 py-1 text-xs font-medium',
                        fitFilter === 'applicable'
                          ? tokens.primaryBtn
                          : tokens.secondaryBtn
                      )}
                    >
                      {fitFilter === 'applicable'
                        ? '✓ Applicable Exp Only'
                        : 'Entry / Applicable Exp'}
                    </button>

                    {totalJobsCount > 0 && (
                      <button
                        type="button"
                        onClick={onClearUnsavedJobs}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium',
                          tokens.secondaryBtn
                        )}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Clear unsaved
                      </button>
                    )}
                  </div>

                  <label
                    className={cn('flex items-center gap-2 text-xs', tokens.mutedText)}
                  >
                    <Filter className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-mono text-[11px] tabular-nums">
                      Min {minScore}%
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={80}
                      step={5}
                      value={minScore}
                      onChange={(e) => onChangeMinScore(Number(e.target.value))}
                      className="flex-1"
                    />
                  </label>
                </div>
              </div>
            </FilterPillPopover>

            {/* Save Search Pill Action */}
            <button
              type="button"
              onClick={handleTriggerSaveSearch}
              className={cn(
                'civic-touch-target inline-flex min-h-[38px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                isDark
                  ? 'border-zinc-700 bg-zinc-900/60 text-zinc-200 hover:bg-zinc-800'
                  : 'border-white/25 bg-transparent text-blue-100 hover:bg-white/10 hover:text-white'
              )}
              title="Bookmark this search query"
            >
              {justSavedSearch ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Heart className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Save search</span>
                </>
              )}
            </button>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={onResetAllFilters}
                className={cn(
                  'inline-flex min-h-[38px] shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors',
                  tokens.searchBannerMuted
                )}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Clear ({activeFilterCount})</span>
              </button>
            )}
          </div>

          <div
            className={cn(
              'hidden shrink-0 items-center gap-1.5 font-mono text-[11px] tabular-nums lg:inline-flex',
              tokens.searchBannerMuted
            )}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>{countdown}s</span>
          </div>
        </div>

        {/* Active Company Chip when active */}
        {activeSearchMeta.company && (
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onChangeCompanyDraft('');
                onExecuteSearch(roleDraft, '');
              }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors',
                isDark
                  ? 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
                  : 'bg-white/15 text-white hover:bg-white/25'
              )}
            >
              <Building2 className="h-3 w-3" />
              <span>Company: {activeSearchMeta.company}</span>
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {scanError && (
          <p
            className={cn(
              'mt-3 rounded-lg border px-3 py-2 text-xs font-medium',
              tokens.badgeDanger
            )}
          >
            {scanError}
          </p>
        )}
      </div>

      {/* Row 3: Collapsible Recent Searches Lower Band (Pic 1 Style) */}
      {recentSearches.length > 0 && (
        <div
          className={cn(
            'border-t',
            isDark
              ? 'border-zinc-800/90 bg-[#141417]'
              : 'border-white/10 bg-[#062d57]'
          )}
        >
          <div
            className={cn(
              'mx-auto px-4 py-3 sm:px-6',
              wideContainer ? 'max-w-[1440px]' : 'max-w-[1140px]'
            )}
          >
            {/* Mobile Collapsed/Expanded Header */}
            <div className="flex items-center justify-between md:hidden">
              <button
                type="button"
                onClick={() => setRecentMobileExpanded((v) => !v)}
                aria-expanded={recentMobileExpanded}
                className={cn(
                  'inline-flex min-h-[36px] items-center gap-1.5 text-xs font-semibold',
                  tokens.searchBannerMuted
                )}
              >
                <History className="h-3.5 w-3.5" />
                <span>Recent searches ({recentSearches.length})</span>
                {recentMobileExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {/* Desktop Heading */}
            <div className="hidden items-center justify-between md:flex">
              <span
                className={cn(
                  'text-xs font-semibold tracking-tight',
                  isDark ? 'text-zinc-300' : 'text-blue-100'
                )}
              >
                Recent searches
              </span>
              {!recentDesktopExpanded && (
                <button
                  type="button"
                  onClick={() => setRecentDesktopExpanded(true)}
                  className={cn(
                    'inline-flex items-center gap-1 text-xs font-semibold',
                    tokens.searchBannerMuted
                  )}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                  <span>Show ({recentSearches.length})</span>
                </button>
              )}
            </div>

            {/* Horizontal Scrollable Recent Search Cards */}
            <div
              className={cn(
                recentMobileExpanded ? 'mt-2.5 block' : 'hidden',
                recentDesktopExpanded ? 'md:mt-2.5 md:block' : 'md:hidden'
              )}
            >
              <div className="no-scrollbar flex flex-nowrap items-stretch gap-2.5 overflow-x-auto pb-1">
                {recentSearches.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onRunRecentSearch(item)}
                    className={cn(
                      'flex min-h-[48px] min-w-[240px] max-w-[320px] shrink-0 items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors',
                      isDark
                        ? 'border-zinc-700/80 bg-zinc-900/70 text-zinc-100 hover:border-zinc-500 hover:bg-zinc-800'
                        : 'border-white/25 bg-white/5 text-white hover:border-white/50 hover:bg-white/10'
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <History
                        aria-hidden="true"
                        className={cn(
                          'h-4 w-4 shrink-0',
                          isDark ? 'text-zinc-400' : 'text-blue-200'
                        )}
                      />
                      <span className="truncate text-xs font-semibold">
                        {item.label}
                        {item.location ? ` in ${item.location}` : ''}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'shrink-0 rounded px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums',
                        isDark
                          ? 'bg-emerald-950/70 text-emerald-300'
                          : 'bg-emerald-100 text-emerald-900'
                      )}
                    >
                      {item.newCount > 0
                        ? `${item.newCount > 99 ? '99+' : item.newCount} new`
                        : `${item.totalCount} jobs`}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-1.5 hidden justify-end md:flex">
                <button
                  type="button"
                  onClick={() => setRecentDesktopExpanded(false)}
                  className={cn(
                    'inline-flex items-center gap-1 text-xs font-semibold',
                    tokens.searchBannerMuted
                  )}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                  <span>Show less</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

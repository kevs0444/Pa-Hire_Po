'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Briefcase,
  Check,
  Copy,
  Download,
  Laptop,
  Link2,
  Loader2,
  Plus,
  Search,
  Settings,
  Star,
  Unlink,
  User,
  Wallet,
  X,
} from 'lucide-react';
import type { UserIdentity } from '@supabase/supabase-js';
import {
  AutoApplyConfig,
  COUNTRY_CONFIGS,
  CountryCode,
  ExperienceLevel,
  MonochromeTheme,
  RoleLibraryEntry,
  TargetSalaryConfig,
  UserProfile,
  WorkType,
} from '@/types/job';
import {
  CROSS_INDUSTRY_ROLE_CATALOG,
  MAX_SAVED_TARGET_ROLES,
  RECOMMENDED_TARGET_ROLES_MIN,
  formatTargetSalaryLabel,
} from '@/features/roles/lib/role-library';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { SupportedOAuthProvider } from '@/lib/supabase/config';
import { runOAuthPopupFlow } from '@/lib/supabase/oauth-popup';
import { resumeToPlainText } from '@/lib/default-profile';
import { ResumeLinksEditor } from '@/features/resume/components/ResumeLinksEditor';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

export type SettingsSection =
  | 'personal'
  | 'salary'
  | 'roles'
  | 'accounts'
  | 'desktop';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface SettingsSidepanelProps {
  isOpen: boolean;
  section: SettingsSection;
  onChangeSection: (section: SettingsSection) => void;
  theme: MonochromeTheme;
  profile: UserProfile;
  autoApplyConfig: AutoApplyConfig;
  isDesktopApp: boolean;
  isAdmin?: boolean;
  storageMode: string;
  onClose: () => void;
  onSaveProfile: (next: UserProfile, rescore?: boolean) => void;
  onSaveAutoApplyConfig: (next: AutoApplyConfig) => void;
}

const DESKTOP_DOWNLOAD_URL =
  process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL ||
  'https://github.com/kevs0444/Pa-Hire_Po/releases/latest/download/Pa-Hire-Po-Setup.exe';

const DEVELOPER_COMMANDS = [
  {
    id: 'exe-launcher',
    label: 'Taskbar / Desktop Launcher',
    cmd: '.\\Pa-Hire-Po.exe',
    note: 'Standalone Windows .exe with Pa-Hire Po mascot icon. Double-click or right-click to pin to your taskbar.',
  },
  {
    id: 'oneclick',
    label: '1-Click Local Desktop',
    cmd: 'npm run desktop:open',
    note: 'Starts the local server and opens the Electron desktop shell.',
  },
  {
    id: 'live',
    label: 'Live Hosted Desktop',
    cmd: 'npm run desktop:live',
    note: 'Connects Electron directly to the deployed Vercel app.',
  },
];

const CURRENCY_OPTIONS = ['PHP', 'USD', 'SGD', 'MYR', 'IDR', 'EUR', 'GBP'];

export function SettingsSidepanel({
  isOpen,
  section,
  onChangeSection,
  theme,
  profile,
  autoApplyConfig,
  isDesktopApp,
  isAdmin = false,
  storageMode,
  onClose,
  onSaveProfile,
  onSaveAutoApplyConfig,
}: SettingsSidepanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const tokens = getThemeTokens(theme);
  const {
    isDark,
    cardSurface,
    subSurface,
    inputSurface,
    primaryBtn,
    secondaryBtn,
    mutedText,
    borderSubtle,
  } = tokens;

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  // Role Library Search State
  const [roleQuery, setRoleQuery] = useState('');
  const [roleResults, setRoleResults] = useState<RoleLibraryEntry[]>(
    CROSS_INDUSTRY_ROLE_CATALOG.slice(0, 12)
  );
  const [searchingRoles, setSearchingRoles] = useState(false);
  const [addingRoleTitle, setAddingRoleTitle] = useState<string | null>(null);

  // PWA Install Prompt State
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [pwaInstalledMsg, setPwaInstalledMsg] = useState<string | null>(null);

  // Connected OAuth Identities State (Google / GitHub)
  const [identities, setIdentities] = useState<UserIdentity[]>([]);
  const [authAccountEmail, setAuthAccountEmail] = useState<string>('');
  const [enabledOAuth, setEnabledOAuth] = useState<string[]>([]);
  const [loadingIdentities, setLoadingIdentities] = useState(false);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [identitySuccess, setIdentitySuccess] = useState<string | null>(null);
  const [supabaseConfigCache, setSupabaseConfigCache] = useState<{
    url: string;
    anonKey: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen || section !== 'accounts') return;
    let active = true;

    async function loadIdentities() {
      await Promise.resolve();
      if (!active) return;
      setLoadingIdentities(true);
      setIdentityError(null);

      try {
        const res = await fetch('/api/supabase/setup', { cache: 'no-store' });
        const cfg = (res.ok ? await res.json() : null) as {
          url?: string;
          anonKey?: string;
          enabledProviders?: string[];
        } | null;
        if (!active || !cfg?.url || !cfg?.anonKey) return;

        setSupabaseConfigCache({ url: cfg.url, anonKey: cfg.anonKey });
        setEnabledOAuth(
          Array.isArray(cfg.enabledProviders) ? cfg.enabledProviders : []
        );

        const supabase = createBrowserSupabaseClient(cfg.url, cfg.anonKey);
        if (!supabase) return;

        const [{ data: userData }, { data: idData, error: idErr }] =
          await Promise.all([
            supabase.auth.getUser(),
            supabase.auth.getUserIdentities(),
          ]);
        if (!active) return;
        if (userData?.user?.email) {
          setAuthAccountEmail(userData.user.email);
        }
        if (idErr) {
          setIdentityError(idErr.message);
        } else {
          setIdentities(idData?.identities || []);
        }
      } catch {
        if (active) {
          setIdentityError('Unable to load connected login methods.');
        }
      } finally {
        if (active) setLoadingIdentities(false);
      }
    }

    void loadIdentities();

    return () => {
      active = false;
    };
  }, [isOpen, section]);

  const handleLinkOAuthProvider = async (provider: SupportedOAuthProvider) => {
    if (!supabaseConfigCache) return;
    const supabase = createBrowserSupabaseClient(
      supabaseConfigCache.url,
      supabaseConfigCache.anonKey
    );
    if (!supabase) return;

    setLinkingProvider(provider);
    setIdentityError(null);
    setIdentitySuccess(`Continue linking ${provider} in the popout window...`);
    try {
      const result = await runOAuthPopupFlow({
        providerLabel: provider,
        getAuthUrl: async () => {
          const { data, error } = await supabase.auth.linkIdentity({
            provider,
            options: {
              redirectTo: `${window.location.origin}/auth/callback?popup=1&next=/`,
              skipBrowserRedirect: true,
            },
          });
          if (error) {
            return {
              url: null,
              error: error.message.toLowerCase().includes('manual linking')
                ? isAdmin
                  ? `${error.message}. Enable "Allow manual linking" in Supabase Dashboard -> Authentication -> Sign In / Providers.`
                  : 'Account linking is currently unavailable. Please contact support or try again later.'
                : error.message,
            };
          }
          return {
            url: data?.url || null,
            error: null,
          };
        },
      });

      if (result.fallbackRedirected) {
        return;
      }

      if (result.ok) {
        const { data: idData } = await supabase.auth.getUserIdentities();
        if (idData?.identities) {
          setIdentities(idData.identities);
        }
        setIdentitySuccess(`Connected ${provider} to your account.`);
        return;
      }

      setIdentitySuccess(null);
      if (result.error) {
        setIdentityError(result.error);
      }
    } finally {
      setLinkingProvider(null);
    }
  };

  const handleUnlinkOAuthProvider = async (identity: UserIdentity) => {
    if (!supabaseConfigCache) return;
    const supabase = createBrowserSupabaseClient(
      supabaseConfigCache.url,
      supabaseConfigCache.anonKey
    );
    if (!supabase) return;

    setLinkingProvider(identity.provider);
    setIdentityError(null);
    setIdentitySuccess(null);
    try {
      const { error } = await supabase.auth.unlinkIdentity(identity);
      if (error) {
        setIdentityError(error.message);
        return;
      }
      setIdentities((prev) =>
        prev.filter((item) => item.id !== identity.id)
      );
      setIdentitySuccess(`Disconnected ${identity.provider} from your account.`);
    } finally {
      setLinkingProvider(null);
    }
  };

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleNativeClose = () => {
      dialog.returnValue = '';
      onClose();
    };
    dialog.addEventListener('close', handleNativeClose);

    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const outside = (e: PointerEvent) => {
        const r = dialog.getBoundingClientRect();
        return (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        );
      };
      let pressedOutside = false;
      const onPointerDown = (e: PointerEvent) => {
        pressedOutside = outside(e);
      };
      const onPointerUp = (e: PointerEvent) => {
        if (pressedOutside && outside(e)) {
          dialog.close();
        }
      };
      dialog.addEventListener('pointerdown', onPointerDown);
      dialog.addEventListener('pointerup', onPointerUp);
      return () => {
        dialog.removeEventListener('close', handleNativeClose);
        dialog.removeEventListener('pointerdown', onPointerDown);
        dialog.removeEventListener('pointerup', onPointerUp);
      };
    }

    return () => {
      dialog.removeEventListener('close', handleNativeClose);
    };
  }, [onClose]);

  // Debounced Dynamic Role Library Search (ESCO + Catalog)
  useEffect(() => {
    if (!isOpen || section !== 'roles') return;
    const q = roleQuery.trim();
    if (!q) return;

    const timer = setTimeout(async () => {
      setSearchingRoles(true);
      try {
        const res = await fetch(
          `/api/roles/search?q=${encodeURIComponent(q)}`
        );
        if (res.ok) {
          const data = (await res.json()) as { results?: RoleLibraryEntry[] };
          if (Array.isArray(data.results)) {
            setRoleResults(data.results);
          }
        }
      } catch {
        // Keep current results on transient network error
      } finally {
        setSearchingRoles(false);
      }
    }, 260);

    return () => clearTimeout(timer);
  }, [isOpen, roleQuery, section]);

  const displayedRoleResults = roleQuery.trim()
    ? roleResults
    : CROSS_INDUSTRY_ROLE_CATALOG.slice(0, 12);

  const resume = profile.structuredResume;
  const targetSalary: TargetSalaryConfig = profile.targetSalary || {
    currency: 'PHP',
    min: '',
    max: '',
    period: 'monthly',
  };

  const notifySaved = (msg = 'Saved to database') => {
    setSavedFeedback(msg);
    setTimeout(
      () => setSavedFeedback((prev) => (prev === msg ? null : prev)),
      2200
    );
  };

  const updatePersonalField = (
    profilePatch: Partial<UserProfile>,
    resumePatch?: Partial<typeof resume>
  ) => {
    const nextResume = resumePatch
      ? { ...resume, ...resumePatch }
      : resume;
    onSaveProfile(
      {
        ...profile,
        ...profilePatch,
        structuredResume: nextResume,
        resumeText: resumePatch
          ? resumeToPlainText(nextResume)
          : profile.resumeText,
      },
      false
    );
  };

  const updateSalary = (patch: Partial<TargetSalaryConfig>) => {
    const nextSalary: TargetSalaryConfig = { ...targetSalary, ...patch };
    const formatted = formatTargetSalaryLabel(
      nextSalary,
      profile.salaryExpectation
    );
    onSaveProfile(
      {
        ...profile,
        targetSalary: nextSalary,
        salaryExpectation: formatted,
      },
      false
    );
    onSaveAutoApplyConfig({
      ...autoApplyConfig,
      expectedSalary: formatted || autoApplyConfig.expectedSalary,
    });
  };

  const handleAddRoleEntry = async (entry: RoleLibraryEntry) => {
    const title = entry.title.trim();
    if (!title) return;
    if (
      profile.preferredRoles.some(
        (r) => r.toLowerCase() === title.toLowerCase()
      )
    ) {
      return;
    }
    if (profile.preferredRoles.length >= MAX_SAVED_TARGET_ROLES) {
      notifySaved(`Maximum ${MAX_SAVED_TARGET_ROLES} target roles reached`);
      return;
    }

    setAddingRoleTitle(title);
    let skills = entry.skills || [];
    if (entry.source === 'esco' && entry.escoUri && skills.length === 0) {
      try {
        const res = await fetch(
          `/api/roles/search?uri=${encodeURIComponent(entry.escoUri)}`
        );
        if (res.ok) {
          const data = (await res.json()) as { skills?: string[] };
          if (Array.isArray(data.skills)) {
            skills = data.skills;
          }
        }
      } catch {
        // Non-blocking ESCO skills fetch
      }
    }

    const nextPreferred = [...profile.preferredRoles, title];
    const nextMeta = [
      ...(profile.roleLibraryMeta || []).filter(
        (m) => m.title.toLowerCase() !== title.toLowerCase()
      ),
      { ...entry, skills },
    ];
    const nextCustom = Array.from(
      new Set([
        ...(profile.customRoles || []),
        ...(title.toLowerCase() !== profile.primaryRole.toLowerCase()
          ? [title]
          : []),
      ])
    );

    onSaveProfile(
      {
        ...profile,
        preferredRoles: nextPreferred,
        roleLibraryMeta: nextMeta,
        customRoles: nextCustom,
      },
      true
    );
    setAddingRoleTitle(null);
    setRoleQuery('');
    notifySaved(`Added "${title}" (${nextPreferred.length}/${MAX_SAVED_TARGET_ROLES})`);
  };

  const handleMoveRole = (idx: number, delta: -1 | 1) => {
    const nextIdx = idx + delta;
    if (nextIdx < 0 || nextIdx >= profile.preferredRoles.length) return;
    const copy = [...profile.preferredRoles];
    const [item] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, item);
    onSaveProfile({ ...profile, preferredRoles: copy }, false);
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
    } catch {
      // Ignore clipboard restriction
    }
  };

  const handleInstallPwa = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setPwaInstalledMsg('Pa-Hire Po installed to your desktop!');
      setInstallPrompt(null);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      {...({ closedby: 'any' } as Record<string, string>)}
      className={cn(
        'no-print ml-auto mr-0 my-0 h-dvh max-h-dvh w-full max-w-xl border-l p-0 shadow-2xl',
        cardSurface
      )}
    >
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className={cn('flex items-center justify-between gap-3 border-b px-5 py-4', borderSubtle)}>
          <div className="flex items-center gap-2.5">
            <Settings className="h-4 w-4" />
            <div>
              <h2 id={titleId} className="text-base font-bold tracking-tight">
                Settings &amp; Career Preferences
              </h2>
              <p className={cn('text-xs', mutedText)}>
                Saved to{' '}
                {isAdmin
                  ? storageMode === 'supabase-cloud'
                    ? 'Supabase Cloud Database'
                    : 'Local Workspace'
                  : 'Cloud Account'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className={cn('rounded-lg border p-2 transition-colors', secondaryBtn)}
            aria-label="Close settings sidepanel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className={cn('flex flex-wrap gap-1.5 border-b px-5 py-2.5', borderSubtle, subSurface)}>
          {(
            [
              { id: 'personal', label: 'Personal Info', icon: User },
              { id: 'salary', label: 'Target Salary', icon: Wallet },
              {
                id: 'roles',
                label: `Job Roles (${profile.preferredRoles.length}/10)`,
                icon: Briefcase,
              },
              { id: 'accounts', label: 'Connected Logins', icon: Link2 },
              { id: 'desktop', label: 'Desktop App', icon: Laptop },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeSection(item.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                  active ? primaryBtn : secondaryBtn
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {section === 'personal' && (
            <div className="space-y-3">
              <p className={cn('text-xs', mutedText)}>
                Your personal contact details sync across My Profile, Resume Studio (AI), and your saved applications.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={cn('mb-1 block text-xs font-medium', mutedText)}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) =>
                      updatePersonalField(
                        { name: e.target.value },
                        { fullName: e.target.value.toUpperCase() }
                      )
                    }
                    className={cn('w-full rounded-lg border px-3 py-2 text-xs focus:outline-none', inputSurface)}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={cn('mb-1 block text-xs font-medium', mutedText)}>
                    Professional Headline
                  </label>
                  <input
                    type="text"
                    value={resume.targetHeadline}
                    onChange={(e) =>
                      updatePersonalField({}, { targetHeadline: e.target.value })
                    }
                    className={cn('w-full rounded-lg border px-3 py-2 text-xs focus:outline-none', inputSurface)}
                  />
                </div>

                <div>
                  <label className={cn('mb-1 block text-xs font-medium', mutedText)}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={resume.email}
                    onChange={(e) =>
                      updatePersonalField({}, { email: e.target.value })
                    }
                    className={cn('w-full rounded-lg border px-3 py-2 text-xs focus:outline-none', inputSurface)}
                  />
                </div>

                <div>
                  <label className={cn('mb-1 block text-xs font-medium', mutedText)}>
                    Phone Number(s)
                  </label>
                  <input
                    type="text"
                    value={resume.phones.join(', ')}
                    onChange={(e) =>
                      updatePersonalField(
                        {},
                        {
                          phones: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        }
                      )
                    }
                    placeholder="+63 900 000 0000"
                    className={cn('w-full rounded-lg border px-3 py-2 text-xs focus:outline-none', inputSurface)}
                  />
                </div>

                <div>
                  <label className={cn('mb-1 block text-xs font-medium', mutedText)}>
                    Target Country / Market
                  </label>
                  <select
                    value={profile.country}
                    onChange={(e) => {
                      const code = e.target.value as CountryCode;
                      updatePersonalField(
                        {
                          country: code,
                          location: COUNTRY_CONFIGS[code].defaultLocation,
                        },
                        { location: COUNTRY_CONFIGS[code].defaultLocation }
                      );
                    }}
                    className={cn('w-full rounded-lg border px-3 py-2 text-xs focus:outline-none', inputSurface)}
                  >
                    {Object.values(COUNTRY_CONFIGS).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={cn('mb-1 block text-xs font-medium', mutedText)}>
                    City / Location
                  </label>
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) =>
                      updatePersonalField(
                        { location: e.target.value },
                        { location: e.target.value }
                      )
                    }
                    className={cn('w-full rounded-lg border px-3 py-2 text-xs focus:outline-none', inputSurface)}
                  />
                </div>

                <div className="sm:col-span-2 pt-1">
                  <ResumeLinksEditor
                    resume={resume}
                    theme={theme}
                    variant="panel"
                    onChangeResume={(nextResume) =>
                      updatePersonalField({}, nextResume)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {section === 'salary' && (
            <div className="space-y-4">
              <div className={cn('rounded-lg border p-4 space-y-3', subSurface)}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold">
                    Target Compensation Range
                  </h3>
                  <span className="font-mono text-xs font-semibold">
                    {profile.salaryExpectation || 'Not set'}
                  </span>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-4">
                  <div>
                    <label className={cn('mb-1 block text-[11px] font-medium', mutedText)}>
                      Currency
                    </label>
                    <select
                      value={targetSalary.currency}
                      onChange={(e) =>
                        updateSalary({ currency: e.target.value })
                      }
                      className={cn('w-full rounded-lg border px-2.5 py-2 text-xs focus:outline-none', inputSurface)}
                    >
                      {CURRENCY_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={cn('mb-1 block text-[11px] font-medium', mutedText)}>
                      Min Salary
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={targetSalary.min}
                      onChange={(e) => updateSalary({ min: e.target.value })}
                      placeholder="25000"
                      className={cn('w-full rounded-lg border px-2.5 py-2 font-mono text-xs focus:outline-none', inputSurface)}
                    />
                  </div>

                  <div>
                    <label className={cn('mb-1 block text-[11px] font-medium', mutedText)}>
                      Max Salary
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={targetSalary.max}
                      onChange={(e) => updateSalary({ max: e.target.value })}
                      placeholder="35000"
                      className={cn('w-full rounded-lg border px-2.5 py-2 font-mono text-xs focus:outline-none', inputSurface)}
                    />
                  </div>

                  <div>
                    <label className={cn('mb-1 block text-[11px] font-medium', mutedText)}>
                      Pay Period
                    </label>
                    <select
                      value={targetSalary.period}
                      onChange={(e) =>
                        updateSalary({
                          period: e.target.value as 'monthly' | 'annual',
                        })
                      }
                      className={cn('w-full rounded-lg border px-2.5 py-2 text-xs focus:outline-none', inputSurface)}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annual</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={cn('mb-1 block text-xs font-medium', mutedText)}>
                    Experience Level
                  </label>
                  <select
                    value={profile.experienceLevel}
                    onChange={(e) =>
                      onSaveProfile(
                        {
                          ...profile,
                          experienceLevel: e.target.value as ExperienceLevel,
                        },
                        true
                      )
                    }
                    className={cn('w-full rounded-lg border px-3 py-2 text-xs focus:outline-none', inputSurface)}
                  >
                    <option value="entry">Fresh Grad / Entry Level</option>
                    <option value="mid">Mid-Level</option>
                    <option value="senior">Senior / Lead</option>
                    <option value="any">Any Experience</option>
                  </select>
                </div>

                <div>
                  <label className={cn('mb-1 block text-xs font-medium', mutedText)}>
                    Preferred Work Setup
                  </label>
                  <select
                    value={profile.workType}
                    onChange={(e) =>
                      onSaveProfile(
                        {
                          ...profile,
                          workType: e.target.value as WorkType,
                        },
                        true
                      )
                    }
                    className={cn('w-full rounded-lg border px-3 py-2 text-xs focus:outline-none', inputSurface)}
                  >
                    <option value="any">Any Work Setup</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">On-site</option>
                  </select>
                </div>

                <div>
                  <label className={cn('mb-1 block text-xs font-medium', mutedText)}>
                    Notice Period
                  </label>
                  <input
                    type="text"
                    value={autoApplyConfig.noticePeriod}
                    onChange={(e) =>
                      onSaveAutoApplyConfig({
                        ...autoApplyConfig,
                        noticePeriod: e.target.value,
                      })
                    }
                    placeholder="Immediate / 30 days"
                    className={cn('w-full rounded-lg border px-3 py-2 text-xs focus:outline-none', inputSurface)}
                  />
                </div>

                <div>
                  <label className={cn('mb-1 block text-xs font-medium', mutedText)}>
                    Work Authorization
                  </label>
                  <input
                    type="text"
                    value={autoApplyConfig.workAuthorization}
                    onChange={(e) =>
                      onSaveAutoApplyConfig({
                        ...autoApplyConfig,
                        workAuthorization: e.target.value,
                      })
                    }
                    placeholder="Authorized to work locally / remote"
                    className={cn('w-full rounded-lg border px-3 py-2 text-xs focus:outline-none', inputSurface)}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={cn('mb-1 block text-xs font-medium', mutedText)}>
                    Relocation Preference
                  </label>
                  <input
                    type="text"
                    value={autoApplyConfig.willingToRelocate}
                    onChange={(e) =>
                      onSaveAutoApplyConfig({
                        ...autoApplyConfig,
                        willingToRelocate: e.target.value,
                      })
                    }
                    className={cn('w-full rounded-lg border px-3 py-2 text-xs focus:outline-none', inputSurface)}
                  />
                </div>
              </div>
            </div>
          )}

          {section === 'roles' && (
            <div className="space-y-4">
              <div className={cn('rounded-lg border p-3.5 space-y-2', subSurface)}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold">
                    Your Top Target Roles ({profile.preferredRoles.length} /{' '}
                    {MAX_SAVED_TARGET_ROLES})
                  </span>
                  <span className={cn('font-mono text-[11px]', mutedText)}>
                    {profile.preferredRoles.length >= RECOMMENDED_TARGET_ROLES_MIN
                      ? '✓ 5–10 target sweet spot'
                      : `Add ${RECOMMENDED_TARGET_ROLES_MIN - profile.preferredRoles.length} more for broader matches`}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {profile.preferredRoles.map((role, idx) => {
                    const isPrimary =
                      role.toLowerCase() === profile.primaryRole.toLowerCase();
                    return (
                      <div
                        key={role}
                        className={cn(
                          'flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs',
                          cardSurface
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className={cn('font-mono text-[11px]', mutedText)}>
                            #{idx + 1}
                          </span>
                          <span className="truncate font-semibold">{role}</span>
                          {isPrimary && (
                            <span
                              className={cn(
                                'rounded border px-1.5 py-0.5 text-[10px] font-semibold',
                                isDark
                                  ? 'border-blue-500/40 bg-blue-950/60 text-blue-300'
                                  : 'border-blue-200 bg-blue-50 text-[#0a66c2]'
                              )}
                            >
                              Primary
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {!isPrimary && (
                            <button
                              type="button"
                              onClick={() =>
                                onSaveProfile(
                                  {
                                    ...profile,
                                    primaryRole: role,
                                    title: role,
                                  },
                                  true
                                )
                              }
                              className={cn('rounded border p-1', secondaryBtn)}
                              title="Set as #1 Primary Role"
                            >
                              <Star className="h-3 w-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveRole(idx, -1)}
                            className={cn('rounded border p-1 disabled:opacity-40', secondaryBtn)}
                            aria-label={`Move ${role} up`}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === profile.preferredRoles.length - 1}
                            onClick={() => handleMoveRole(idx, 1)}
                            className={cn('rounded border p-1 disabled:opacity-40', secondaryBtn)}
                            aria-label={`Move ${role} down`}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            disabled={profile.preferredRoles.length <= 1}
                            onClick={() =>
                              onSaveProfile(
                                {
                                  ...profile,
                                  preferredRoles: profile.preferredRoles.filter(
                                    (r) => r !== role
                                  ),
                                },
                                true
                              )
                            }
                            className={cn('rounded border p-1 disabled:opacity-40', secondaryBtn)}
                            aria-label={`Remove ${role}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic ESCO + Cross-Industry Role Library Search */}
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold">
                  Search Global Job Role Library (ESCO + Cross-Industry)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className={cn('pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5', mutedText)} />
                    <input
                      type="text"
                      value={roleQuery}
                      onChange={(e) => setRoleQuery(e.target.value)}
                      placeholder="Search any profession (e.g. Nurse, Civil Engineer, Accountant, DevOps)..."
                      className={cn('w-full rounded-lg border py-2 pl-9 pr-3 text-xs focus:outline-none', inputSurface)}
                    />
                  </div>
                  {roleQuery.trim() && (
                    <button
                      type="button"
                      onClick={() =>
                        void handleAddRoleEntry({
                          title: roleQuery.trim(),
                          source: 'custom',
                          category: 'Custom Role',
                          skills: [],
                        })
                      }
                      className={cn('inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs', primaryBtn)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Exact
                    </button>
                  )}
                </div>

                {searchingRoles && (
                  <p className={cn('inline-flex items-center gap-1.5 text-xs', mutedText)}>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Searching ESCO occupation taxonomy...
                  </p>
                )}

                <div className={cn('max-h-64 overflow-y-auto divide-y rounded-lg border', borderSubtle)}>
                  {displayedRoleResults.map((entry) => {
                    const alreadyAdded = profile.preferredRoles.some(
                      (r) => r.toLowerCase() === entry.title.toLowerCase()
                    );
                    const isAdding = addingRoleTitle === entry.title;
                    return (
                      <div
                        key={`${entry.source}:${entry.title}`}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-semibold">
                              {entry.title}
                            </span>
                            <span
                              className={cn(
                                'rounded border px-1.5 py-0.5 font-mono text-[10px]',
                                subSurface,
                                mutedText
                              )}
                            >
                              {entry.source === 'esco' ? 'ESCO' : 'Catalog'}
                            </span>
                          </div>
                          {entry.skills && entry.skills.length > 0 && (
                            <p className={cn('truncate text-[11px]', mutedText)}>
                              Skills: {entry.skills.slice(0, 4).join(', ')}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={
                            alreadyAdded ||
                            isAdding ||
                            profile.preferredRoles.length >=
                              MAX_SAVED_TARGET_ROLES
                          }
                          onClick={() => void handleAddRoleEntry(entry)}
                          className={cn(
                            'inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium disabled:opacity-50',
                            alreadyAdded ? subSurface : secondaryBtn
                          )}
                        >
                          {alreadyAdded ? (
                            <>
                              <Check className="h-3 w-3" />
                              Saved
                            </>
                          ) : isAdding ? (
                            'Adding...'
                          ) : (
                            <>
                              <Plus className="h-3 w-3" />
                              Add
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {section === 'accounts' && (
            <div className="space-y-4">
              <div className={cn('rounded-lg border p-4 space-y-2', subSurface)}>
                <h3 className="text-xs font-semibold">
                  Connected Login Providers (Google &amp; GitHub)
                </h3>
                <p className={cn('text-xs leading-relaxed', mutedText)}>
                  Link Google or GitHub to your{' '}
                  <strong className={tokens.strongText}>
                    {authAccountEmail || resume.email || 'account'}
                  </strong>{' '}
                  so you can use one-click OAuth sign-in on the login page.
                </p>
              </div>

              {identityError && (
                <div
                  className={cn(
                    'flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium',
                    isDark
                      ? 'border-red-500/40 bg-red-950/50 text-red-200'
                      : 'border-red-300 bg-red-50 text-red-800'
                  )}
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{identityError}</span>
                </div>
              )}

              {identitySuccess && (
                <div
                  className={cn(
                    'flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium',
                    isDark
                      ? 'border-emerald-700/60 bg-emerald-950/60 text-emerald-200'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  )}
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{identitySuccess}</span>
                </div>
              )}

              {loadingIdentities ? (
                <div className="flex items-center gap-2 py-4 text-xs">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className={mutedText}>Loading linked accounts...</span>
                </div>
              ) : (
                <div className={cn('divide-y rounded-lg border', borderSubtle, cardSurface)}>
                  {(
                    [
                      {
                        id: 'google' as SupportedOAuthProvider,
                        label: 'Google',
                        desc: 'Sign in with your Google account',
                      },
                      {
                        id: 'github' as SupportedOAuthProvider,
                        label: 'GitHub',
                        desc: 'Sign in with your GitHub developer account',
                      },
                    ] as const
                  ).map((provider) => {
                    const linked = identities.find(
                      (item) => item.provider === provider.id
                    );
                    const isEnabled = enabledOAuth.includes(provider.id);
                    const isBusy = linkingProvider === provider.id;
                    const linkedEmail =
                      (linked?.identity_data?.email as string | undefined) ||
                      (linked?.identity_data?.user_name as string | undefined);

                    return (
                      <div
                        key={provider.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">
                              {provider.label}
                            </span>
                            {linked ? (
                              <span
                                className={cn(
                                  'rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold',
                                  isDark
                                    ? 'border-emerald-700/70 bg-emerald-950/60 text-emerald-300'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                )}
                              >
                                ✓ Connected
                              </span>
                            ) : (
                              <span
                                className={cn(
                                  'rounded border px-1.5 py-0.5 font-mono text-[10px]',
                                  subSurface,
                                  mutedText
                                )}
                              >
                                Not linked
                              </span>
                            )}
                          </div>
                          <p className={cn('text-[11px]', mutedText)}>
                            {linked
                              ? linkedEmail
                                ? `Linked as ${linkedEmail}`
                                : `Ready for ${provider.label} login`
                              : provider.desc}
                          </p>
                        </div>

                        {linked ? (
                          <button
                            type="button"
                            disabled={isBusy || identities.length <= 1}
                            onClick={() => void handleUnlinkOAuthProvider(linked)}
                            title={
                              identities.length <= 1
                                ? 'Add another login method before disconnecting this one'
                                : `Disconnect ${provider.label}`
                            }
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50',
                              secondaryBtn
                            )}
                          >
                            <Unlink className="h-3.5 w-3.5" />
                            {isBusy ? 'Updating...' : 'Disconnect'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isBusy || !isEnabled}
                            onClick={() => void handleLinkOAuthProvider(provider.id)}
                            title={
                              isEnabled
                                ? `Link ${provider.label} to your account`
                                : `${provider.label} sign-in is currently unavailable`
                            }
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50',
                              primaryBtn
                            )}
                          >
                            <Link2 className="h-3.5 w-3.5" />
                            {isBusy
                              ? 'Connecting...'
                              : isEnabled
                                ? `Connect ${provider.label}`
                                : 'Unavailable'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {isAdmin && (
                <p className={cn('text-[11px] leading-relaxed', mutedText)}>
                  Admin note: If linking returns a manual-linking error, enable{' '}
                  <strong className={tokens.strongText}>
                    Allow manual linking
                  </strong>{' '}
                  in Supabase Dashboard → Authentication → Sign In / Providers.
                </p>
              )}
            </div>
          )}

          {section === 'desktop' && (
            <div className="space-y-4">
              <div className={cn('rounded-lg border p-4 space-y-3', subSurface)}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Laptop className="h-4 w-4" />
                    <h3 className="text-sm font-bold">
                      Pa-Hire Po Desktop App
                    </h3>
                  </div>
                  <span
                    className={cn(
                      'rounded border px-2 py-0.5 font-mono text-[11px] font-semibold',
                      isDesktopApp
                        ? isDark
                          ? 'border-emerald-700/70 bg-emerald-950/60 text-emerald-300'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : cardSurface
                    )}
                  >
                    {isDesktopApp
                      ? '✓ Running in Desktop App'
                      : 'Viewing in Web Browser'}
                  </span>
                </div>

                <p className={cn('text-xs leading-relaxed', mutedText)}>
                  {isDesktopApp
                    ? 'You are running Pa-Hire Po inside the dedicated Desktop App. Your saved jobs, applications, and tailored resumes sync automatically with your cloud account.'
                    : 'Download or install the Pa-Hire Po Desktop App for a distraction-free taskbar window with one-click resume printing and live cloud sync.'}
                </p>

                {!isDesktopApp && (
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={DESKTOP_DOWNLOAD_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs transition-colors',
                        primaryBtn
                      )}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download Windows Installer (.exe)
                    </a>

                    {installPrompt && (
                      <button
                        type="button"
                        onClick={() => void handleInstallPwa()}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors',
                          secondaryBtn
                        )}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Install Desktop App (1-Click)
                      </button>
                    )}
                  </div>
                )}

                {pwaInstalledMsg && (
                  <p
                    className={cn(
                      'text-xs font-medium',
                      isDark ? 'text-emerald-300' : 'text-emerald-800'
                    )}
                  >
                    ✓ {pwaInstalledMsg}
                  </p>
                )}
              </div>

              {/* Guided Setup Steps */}
              <div className={cn('rounded-lg border p-4 space-y-2.5', cardSurface)}>
                <h4 className="text-xs font-semibold">
                  Quick Desktop App Setup
                </h4>
                <ol className={cn('list-decimal space-y-1.5 pl-4 text-xs leading-relaxed', mutedText)}>
                  <li>
                    <strong className={tokens.strongText}>Install:</strong>{' '}
                    Click <em>Download Windows Installer (.exe)</em> above, or in Chrome/Edge click the{' '}
                    <em>Install Pa-Hire Po</em> icon in your address bar.
                  </li>
                  <li>
                    <strong className={tokens.strongText}>Pin to Taskbar:</strong>{' '}
                    Launch Pa-Hire Po once, then right-click the mascot icon on your taskbar and choose <em>Pin to taskbar</em>.
                  </li>
                  <li>
                    <strong className={tokens.strongText}>Sign In Once:</strong>{' '}
                    Your Saved, Applied, and Hidden jobs, Target Salary, Top 5–10 Job Roles, and Edited Resumes sync automatically across Desktop and Web.
                  </li>
                </ol>
              </div>

              {/* Collapsible Developer CLI Disclosure */}
              <details className={cn('rounded-lg border p-3.5', cardSurface)}>
                <summary className="cursor-pointer text-xs font-semibold">
                  Developer Local Setup (CLI &amp; Repo Launchers)
                </summary>
                <div className="mt-3 space-y-2.5">
                  {DEVELOPER_COMMANDS.map((item) => {
                    const copied = copiedId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={cn('rounded-lg border p-3 space-y-1.5', subSurface)}
                      >
                        <div className="text-xs font-semibold">{item.label}</div>
                        <div
                          className={cn(
                            'flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 font-mono text-xs',
                            cardSurface
                          )}
                        >
                          <code className="truncate">{item.cmd}</code>
                          <button
                            type="button"
                            onClick={() => void handleCopy(item.id, item.cmd)}
                            className={cn(
                              'inline-flex shrink-0 items-center gap-1 rounded border px-2 py-0.5 font-sans text-[11px] font-medium',
                              secondaryBtn
                            )}
                          >
                            {copied ? (
                              <>
                                <Check className="h-3 w-3" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <p className={cn('text-[11px]', mutedText)}>{item.note}</p>
                      </div>
                    );
                  })}
                </div>
              </details>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={cn('flex items-center justify-between gap-3 border-t px-5 py-3', borderSubtle, subSurface)}>
          <span className={cn('text-xs font-medium', mutedText)}>
            {savedFeedback ? `✓ ${savedFeedback}` : 'Changes sync automatically'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onSaveProfile(profile, true);
                notifySaved('Synced to database');
              }}
              className={cn('rounded-lg px-3.5 py-1.5 text-xs', primaryBtn)}
            >
              Save &amp; Sync
            </button>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className={cn('rounded-lg border px-3 py-1.5 text-xs font-medium', secondaryBtn)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

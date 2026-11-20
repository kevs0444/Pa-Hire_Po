'use client';

import { FormEvent, useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  Check,
  ExternalLink,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Moon,
  RefreshCw,
  Sun,
  UserPlus,
} from 'lucide-react';
import { MonochromeTheme } from '@/types/job';
import {
  DEFAULT_SUPABASE_URL,
  SUPABASE_OAUTH_PROVIDERS,
  SupportedOAuthProvider,
} from '@/lib/supabase/config';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import {
  cancelActiveOAuthPopup,
  focusActiveOAuthPopup,
  runOAuthPopupFlow,
} from '@/lib/supabase/oauth-popup';
import { clearLegacyUnscopedLocalState } from '@/lib/storage';
import { SetupStatus } from '@/features/admin/types';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

type AuthMode = 'signin' | 'signup' | 'magic' | 'reset';

function OAuthProviderMark({ id }: { id: SupportedOAuthProvider }) {
  if (id === 'google') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    );
  }
  if (id === 'linkedin_oidc') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
        <rect width="24" height="24" rx="4" fill="#0A66C2" />
        <path
          fill="#fff"
          d="M7.5 18.2H4.9V9.8h2.6v8.4zM6.2 8.7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM19.1 18.2h-2.6v-4.1c0-1-.02-2.2-1.4-2.2-1.4 0-1.6 1.1-1.6 2.1v4.2h-2.6V9.8h2.5v1.1h.04c.35-.66 1.2-1.35 2.46-1.35 2.63 0 3.12 1.73 3.12 3.98v4.67z"
        />
      </svg>
    );
  }
  if (id === 'github') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current" aria-hidden="true">
        <path d="M12 1.5a10.5 10.5 0 0 0-3.32 20.46c.53.1.72-.23.72-.5v-1.77c-2.93.64-3.55-1.24-3.55-1.24-.48-1.22-1.17-1.54-1.17-1.54-.96-.66.07-.64.07-.64 1.06.07 1.62 1.09 1.62 1.09.94 1.61 2.47 1.15 3.07.88.1-.68.37-1.15.67-1.41-2.34-.27-4.8-1.17-4.8-5.21 0-1.15.41-2.09 1.08-2.83-.1-.27-.47-1.34.1-2.79 0 0 .89-.28 2.9 1.08a10.1 10.1 0 0 1 5.28 0c2.01-1.36 2.9-1.08 2.9-1.08.57 1.45.2 2.52.1 2.79.67.74 1.08 1.68 1.08 2.83 0 4.05-2.46 4.94-4.81 5.2.38.33.72.97.72 1.96v2.91c0 .27.19.6.73.5A10.5 10.5 0 0 0 12 1.5z" />
      </svg>
    );
  }
  if (id === 'azure') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
        <rect x="2" y="2" width="9" height="9" fill="#F25022" />
        <rect x="13" y="2" width="9" height="9" fill="#7FBA00" />
        <rect x="2" y="13" width="9" height="9" fill="#00A4EF" />
        <rect x="13" y="13" width="9" height="9" fill="#FFB900" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        fill="#5865F2"
        d="M20.3 4.4A18.7 18.7 0 0 0 15.7 3l-.2.5c-.6-.1-1.3-.2-2-.2h-3c-.7 0-1.4.1-2 .2L8.3 3a18.7 18.7 0 0 0-4.6 1.4C.8 8.8 0 13.1.4 17.3a19 19 0 0 0 5.7 2.9l.7-1.1a12 12 0 0 1-1.9-.9l.5-.4a13.4 13.4 0 0 0 13.2 0l.5.4c-.6.4-1.2.7-1.9.9l.7 1.1a19 19 0 0 0 5.7-2.9c.5-4.9-.8-9.1-3.3-12.9zM8.5 14.8c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2zm7 0c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2z"
      />
    </svg>
  );
}

export function AuthScreen({
  initialError = '',
  nextPath = '/',
}: {
  initialError?: string;
  nextPath?: string;
}) {
  const router = useRouter();
  const [theme, setTheme] = useState<MonochromeTheme>('light');
  const [mode, setMode] = useState<AuthMode>('signin');
  const [setup, setSetup] = useState<SetupStatus>({
    url: DEFAULT_SUPABASE_URL,
    anonKey: '',
    enabledProviders: [],
  });
  const [loadingSetup, setLoadingSetup] = useState(true);

  // Auth form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [primaryRole, setPrimaryRole] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [signupOtpSent, setSignupOtpSent] = useState(false);
  const [activeSessionEmail, setActiveSessionEmail] = useState<string | null>(
    null
  );

  const [submitting, setSubmitting] = useState(false);
  const [oauthPopupProvider, setOauthPopupProvider] = useState<string | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState(initialError);
  const [successMsg, setSuccessMsg] = useState('');

  const oauthDialogRef = useRef<HTMLDialogElement>(null);
  const oauthDialogTitleId = useId();

  const tokens = getThemeTokens(theme);
  const safeNext =
    nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')
      ? nextPath
      : '/';

  useEffect(() => {
    let active = true;
    fetch('/api/supabase/setup', { cache: 'no-store' })
      .then((res) => res.json() as Promise<SetupStatus>)
      .then(async (data) => {
        if (!active) return;
        setSetup(data);
        const sb = createBrowserSupabaseClient(data.url, data.anonKey);
        if (sb) {
          const {
            data: { user },
          } = await sb.auth.getUser().catch(() => ({ data: { user: null } }));
          if (active && user?.email) {
            setActiveSessionEmail(user.email);
          }
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoadingSetup(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.colorScheme =
      theme === 'dark' ? 'dark' : 'light';
  }, [theme]);

  useEffect(() => {
    const dialog = oauthDialogRef.current;
    if (!dialog) return;

    if (oauthPopupProvider && !dialog.open) {
      dialog.showModal();
    } else if (!oauthPopupProvider && dialog.open) {
      dialog.close();
    }
  }, [oauthPopupProvider]);

  useEffect(() => {
    const dialog = oauthDialogRef.current;
    if (!dialog) return;
    const onNativeClose = () => {
      dialog.returnValue = '';
      if (oauthPopupProvider) {
        cancelActiveOAuthPopup();
        setOauthPopupProvider(null);
      }
    };
    dialog.addEventListener('close', onNativeClose);
    return () => {
      dialog.removeEventListener('close', onNativeClose);
    };
  }, [oauthPopupProvider]);

  const getSupabase = () => {
    return createBrowserSupabaseClient(setup.url, setup.anonKey);
  };

  const handleSwitchSignOut = async () => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.auth.signOut().catch(() => undefined);
      }
      await fetch('/api/supabase/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signout' }),
      }).catch(() => undefined);
      clearLegacyUnscopedLocalState();
      setActiveSessionEmail(null);
      setSuccessMsg('Signed out. You can now sign in with another account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendSignupOtp = async () => {
    const supabase = getSupabase();
    const cleanEmail = email.trim();
    if (!supabase || !cleanEmail) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
      });
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      setSuccessMsg(
        `A new verification code was sent to ${cleanEmail}.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const supabase = getSupabase();
    if (!supabase) {
      setErrorMsg(
        'Sign-in service is temporarily unavailable. Please try again shortly.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const cleanEmail = email.trim();
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) {
          setErrorMsg(error.message);
          return;
        }
        clearLegacyUnscopedLocalState();
        router.push(safeNext);
        router.refresh();
        return;
      }

      if (mode === 'signup') {
        if (signupOtpSent) {
          const cleanCode = otpCode.replace(/\s+/g, '').trim();
          if (!cleanCode) {
            setErrorMsg('Enter the verification code sent to your email.');
            return;
          }

          let verifyErr: { message: string } | null = null;
          const signupRes = await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: cleanCode,
            type: 'signup',
          });
          verifyErr = signupRes.error;

          if (verifyErr) {
            const emailRes = await supabase.auth.verifyOtp({
              email: cleanEmail,
              token: cleanCode,
              type: 'email',
            });
            verifyErr = emailRes.error;
          }

          if (verifyErr) {
            setErrorMsg(verifyErr.message);
            return;
          }

          clearLegacyUnscopedLocalState();
          router.push(safeNext);
          router.refresh();
          return;
        }

        const cleanFullName =
          fullName.trim() || cleanEmail.split('@')[0] || 'User';
        const cleanPrimaryRole =
          primaryRole.trim() || 'Data Analyst / Junior Data Analyst';

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`,
            data: {
              full_name: cleanFullName,
              primary_role: cleanPrimaryRole,
            },
          },
        });
        if (error) {
          setErrorMsg(error.message);
          return;
        }
        if (
          data.user &&
          Array.isArray(data.user.identities) &&
          data.user.identities.length === 0
        ) {
          setErrorMsg(
            'An account with this email already exists. Sign in with Password, Magic Link / OTP, or Reset Password.'
          );
          return;
        }
        if (data.session) {
          clearLegacyUnscopedLocalState();
          router.push(safeNext);
          router.refresh();
          return;
        }
        setSignupOtpSent(true);
        setOtpCode('');
        setSuccessMsg(
          `Verification code sent to ${cleanEmail}! Enter the code from your email (or click the confirmation button) to activate your account.`
        );
        return;
      }

      if (mode === 'magic') {
        const cleanToken = otpCode.replace(/\s+/g, '').trim();
        if (otpSent && cleanToken) {
          const { error } = await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: cleanToken,
            type: 'email',
          });
          if (error) {
            setErrorMsg(error.message);
            return;
          }
          clearLegacyUnscopedLocalState();
          router.push(safeNext);
          router.refresh();
          return;
        }

        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`,
          },
        });
        if (error) {
          setErrorMsg(error.message);
          return;
        }
        setOtpSent(true);
        setSuccessMsg(
          'Login code sent! Click the button in your email or enter the code below.'
        );
        return;
      }

      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
        });
        if (error) {
          setErrorMsg(error.message);
          return;
        }
        setSuccessMsg(
          'Password reset instructions sent to your email.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const enabledOAuthProviders = SUPABASE_OAUTH_PROVIDERS.filter((provider) => {
    const shortKey = provider.id.replace('_oidc', '');
    return setup.enabledProviders.some(
      (p) => p === provider.id || p === shortKey
    );
  });

  const handleOAuthLogin = async (provider: SupportedOAuthProvider) => {
    setErrorMsg('');
    setSuccessMsg('');
    const shortKey = provider.replace('_oidc', '');
    const providerMeta = SUPABASE_OAUTH_PROVIDERS.find(
      (p) => p.id === provider
    );
    const providerLabel = providerMeta?.label || shortKey;
    const isEnabled = setup.enabledProviders.some(
      (p) => p === provider || p === shortKey
    );
    if (!isEnabled) {
      setErrorMsg(
        `${providerLabel} sign-in is currently unavailable. Please use Email & Password or Magic Link / OTP above.`
      );
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setErrorMsg(
        'Sign-in service is temporarily unavailable. Please try again shortly.'
      );
      return;
    }

    setSubmitting(true);
    setOauthPopupProvider(providerLabel);
    setSuccessMsg(
      `Continue in the ${providerLabel} sign-in popout window...`
    );
    try {
      const popupResult = await runOAuthPopupFlow({
        providerLabel,
        getAuthUrl: async () => {
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo: `${window.location.origin}/auth/callback?popup=1&next=${encodeURIComponent(safeNext)}`,
              skipBrowserRedirect: true,
            },
          });
          return {
            url: data?.url || null,
            error: error?.message || null,
          };
        },
        verifySessionFallback: async () => {
          const {
            data: { user },
          } = await supabase.auth
            .getUser()
            .catch(() => ({ data: { user: null } }));
          return Boolean(user);
        },
      });

      if (popupResult.fallbackRedirected) {
        return;
      }

      if (popupResult.ok) {
        clearLegacyUnscopedLocalState();
        setOauthPopupProvider(null);
        setSuccessMsg(`Signed in with ${providerLabel}. Opening workspace...`);
        router.push(popupResult.next || safeNext);
        router.refresh();
        return;
      }

      setOauthPopupProvider(null);
      setSuccessMsg('');
      if (popupResult.error) {
        setErrorMsg(popupResult.error);
      }
    } finally {
      setOauthPopupProvider(null);
      setSubmitting(false);
    }
  };

  return (
    <div
      className={cn('min-h-screen transition-colors', tokens.pageBg)}
      style={{ colorScheme: tokens.isDark ? 'dark' : 'light' }}
    >
      {/* Top Bar */}
      <header className={cn('border-b', tokens.navBg)}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border bg-white',
                tokens.borderSubtle
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
              <h1 className="text-base font-bold tracking-tight leading-none">
                Pa-Hire Po
              </h1>
              <p className={cn('mt-0.5 text-[11px]', tokens.mutedText)}>
                Civic Career Utility • Job Explorer &amp; Resume Studio (AI)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium',
              tokens.secondaryBtn
            )}
          >
            {tokens.isDark ? (
              <>
                <Sun className="h-3.5 w-3.5" />
                Light
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5" />
                Dark
              </>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-4.25rem)] max-w-xl flex-col justify-center px-4 py-8 sm:px-6">
        <section className="w-full">
          <div className={cn('rounded-lg border p-6 space-y-5', tokens.cardSurface)}>
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight">
                Sign in to Pa-Hire Po
              </h2>
              <p className={cn('text-xs sm:text-sm', tokens.mutedText)}>
                Sync your job pipeline, Resume Studio (AI), and uploaded CV across Web and Desktop.
              </p>
            </div>

            {activeSessionEmail && (
              <div
                className={cn(
                  'flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-xs',
                  tokens.subSurface
                )}
              >
                <span>
                  Signed in as{' '}
                  <strong className={tokens.strongText}>
                    {activeSessionEmail}
                  </strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      router.push(safeNext);
                      router.refresh();
                    }}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-medium',
                      tokens.primaryBtn
                    )}
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleSwitchSignOut()}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium',
                      tokens.secondaryBtn
                    )}
                  >
                    <LogOut className="h-3 w-3" />
                    Switch Account
                  </button>
                </div>
              </div>
            )}

            {/* Auth Method Switcher */}
            <div className={cn('grid grid-cols-2 gap-1 rounded-lg border p-1 sm:grid-cols-4', tokens.navTrack)}>
              {(
                [
                  { id: 'signin', label: 'Password' },
                  { id: 'signup', label: 'Create Account' },
                  { id: 'magic', label: 'Magic Link / OTP' },
                  { id: 'reset', label: 'Reset Password' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setMode(tab.id);
                    setOtpSent(false);
                    setSignupOtpSent(false);
                    setOtpCode('');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={cn(
                    'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                    mode === tab.id ? tokens.primaryBtn : tokens.mutedText
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {errorMsg && (
              <div
                className={cn(
                  'flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium',
                  tokens.isDark
                    ? 'border-red-500/40 bg-red-950/50 text-red-200'
                    : 'border-red-300 bg-red-50 text-red-800'
                )}
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div
                className={cn(
                  'flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium',
                  tokens.isDark
                    ? 'border-emerald-700/60 bg-emerald-950/60 text-emerald-200'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                )}
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Main Auth Form */}
            <form onSubmit={(e) => void handleAuthSubmit(e)} className="space-y-3.5">
              {mode === 'signup' && !signupOtpSent && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={cn('mb-1 block text-xs font-medium', tokens.mutedText)}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Mar Kevin P. Alcantara"
                      className={cn(
                        'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none',
                        tokens.inputSurface
                      )}
                    />
                  </div>
                  <div>
                    <label className={cn('mb-1 block text-xs font-medium', tokens.mutedText)}>
                      Target Primary Role
                    </label>
                    <input
                      type="text"
                      value={primaryRole}
                      onChange={(e) => setPrimaryRole(e.target.value)}
                      placeholder="Data Analyst / Junior Data Analyst"
                      className={cn(
                        'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none',
                        tokens.inputSurface
                      )}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className={cn('mb-1 block text-xs font-medium', tokens.mutedText)}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className={cn('pointer-events-none absolute left-3 top-2.5 h-4 w-4', tokens.mutedText)} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={cn(
                      'w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:outline-none',
                      tokens.inputSurface
                    )}
                  />
                </div>
              </div>

              {(mode === 'signin' || (mode === 'signup' && !signupOtpSent)) && (
                <div>
                  <label className={cn('mb-1 block text-xs font-medium', tokens.mutedText)}>
                    Password
                  </label>
                  <div className="relative">
                    <Lock className={cn('pointer-events-none absolute left-3 top-2.5 h-4 w-4', tokens.mutedText)} />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className={cn(
                        'w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:outline-none',
                        tokens.inputSurface
                      )}
                    />
                  </div>
                </div>
              )}

              {((mode === 'magic' && otpSent) ||
                (mode === 'signup' && signupOtpSent)) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className={cn('block text-xs font-medium', tokens.mutedText)}>
                      Verification / OTP Code (from Email)
                    </label>
                    {mode === 'signup' && signupOtpSent && (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => {
                            setSignupOtpSent(false);
                            setOtpCode('');
                            setErrorMsg('');
                            setSuccessMsg('');
                          }}
                          className="text-[11px] font-medium text-slate-500 hover:underline disabled:opacity-50"
                        >
                          Edit Details
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => void handleResendSignupOtp()}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0a66c2] hover:underline disabled:opacity-50"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Resend Code
                        </button>
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required={mode === 'signup' && signupOtpSent}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\s+/g, ''))}
                    placeholder="Enter 6 or 8-digit code (e.g. 63746146)"
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 font-mono text-sm tracking-widest focus:outline-none',
                      tokens.inputSurface
                    )}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={cn(
                  'inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm transition-colors disabled:opacity-60',
                  tokens.primaryBtn
                )}
              >
                {mode === 'signup' ? (
                  <>
                    <UserPlus className="h-4 w-4" />
                    {submitting
                      ? signupOtpSent
                        ? 'Verifying Code...'
                        : 'Creating Account...'
                      : signupOtpSent
                        ? 'Verify Email OTP & Sign In'
                        : 'Create Account & Send OTP'}
                  </>
                ) : mode === 'magic' ? (
                  <>
                    <Mail className="h-4 w-4" />
                    {submitting
                      ? 'Sending...'
                      : otpSent && otpCode.trim()
                        ? 'Verify Code & Sign In'
                        : 'Send Magic Link & OTP Code'}
                  </>
                ) : mode === 'reset' ? (
                  <>
                    <KeyRound className="h-4 w-4" />
                    {submitting ? 'Sending Reset Link...' : 'Send Password Reset Email'}
                  </>
                ) : (
                  <>
                    <span>{submitting ? 'Signing In...' : 'Sign In'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Social / OAuth Section — rendered only for enabled providers */}
            {!loadingSetup && enabledOAuthProviders.length > 0 && (
              <div className={cn('border-t pt-4 space-y-3', tokens.borderSubtle)}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={cn('text-xs font-semibold', tokens.strongText)}>
                    Or continue with
                  </span>
                  <span className={cn('font-mono text-[11px]', tokens.mutedText)}>
                    {enabledOAuthProviders.map((p) => p.label).join(' • ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {enabledOAuthProviders.map((provider) => (
                    <button
                      key={provider.id}
                      type="button"
                      disabled={submitting}
                      onClick={() => void handleOAuthLogin(provider.id)}
                      className={cn(
                        'inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-60',
                        tokens.secondaryBtn
                      )}
                      title={`Continue with ${provider.label}`}
                    >
                      <OAuthProviderMark id={provider.id} />
                      <span>{provider.label}</span>
                      <span className="text-[10px] text-[#057642]">✓</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Legal & Compliance Footer */}
        <footer
          className={cn(
            'mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs',
            tokens.mutedText
          )}
        >
          <Link
            href="/privacy"
            className="hover:underline hover:text-[#0a66c2] transition-colors"
          >
            Privacy Policy
          </Link>
          <span>•</span>
          <Link
            href="/terms"
            className="hover:underline hover:text-[#0a66c2] transition-colors"
          >
            Terms of Service
          </Link>
          <span>•</span>
          <span className="font-mono text-[11px]">
            © 2026 Pa-Hire Po
          </span>
        </footer>
      </main>

      {/* Active OAuth Popout Focus Overlay — keeps /login visible underneath */}
      <dialog
        ref={oauthDialogRef}
        aria-labelledby={oauthDialogTitleId}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            focusActiveOAuthPopup();
          }
        }}
        className={cn(
          'm-auto max-w-md rounded-xl border p-0 shadow-xl backdrop:bg-slate-900/35',
          tokens.cardSurface
        )}
      >
        {oauthPopupProvider && (
          <div className="space-y-3 p-5">
            <div className="space-y-1">
              <h3 id={oauthDialogTitleId} className="text-sm font-semibold">
                {oauthPopupProvider} sign-in window is open
              </h3>
              <p className={cn('text-xs leading-relaxed', tokens.mutedText)}>
                Complete sign-in in the floating {oauthPopupProvider} popout window. If it went behind your browser, click below to bring it right back to the top.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <button
                type="button"
                data-oauth-cancel="true"
                onClick={() => {
                  cancelActiveOAuthPopup();
                  setOauthPopupProvider(null);
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                  tokens.secondaryBtn
                )}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => focusActiveOAuthPopup()}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs transition-colors',
                  tokens.primaryBtn
                )}
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Bring Sign-In Window to Front</span>
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}

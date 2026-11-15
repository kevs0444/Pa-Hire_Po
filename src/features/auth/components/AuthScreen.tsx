'use client';

import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  Check,
  KeyRound,
  Lock,
  Mail,
  Moon,
  Shield,
  Sun,
  UserPlus,
} from 'lucide-react';
import { MonochromeTheme } from '@/types/job';
import {
  DEFAULT_SUPABASE_PROJECT_REF,
  DEFAULT_SUPABASE_URL,
  PRIMARY_ADMIN_EMAIL,
  SUPABASE_OAUTH_PROVIDERS,
  SupportedOAuthProvider,
} from '@/lib/supabase/config';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
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
    projectRef: DEFAULT_SUPABASE_PROJECT_REF,
    anonKey: '',
    isConfigured: false,
    hasServiceRole: false,
    keyValid: false,
    schemaReady: false,
    enabledProviders: [],
    message: 'Checking Supabase connection...',
  });
  const [loadingSetup, setLoadingSetup] = useState(true);

  // Auth form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [primaryRole, setPrimaryRole] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(initialError);
  const [successMsg, setSuccessMsg] = useState('');

  const tokens = getThemeTokens(theme);
  const safeNext =
    nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')
      ? nextPath
      : '/';

  useEffect(() => {
    let active = true;
    fetch('/api/supabase/setup', { cache: 'no-store' })
      .then((res) => res.json() as Promise<SetupStatus>)
      .then((data) => {
        if (!active) return;
        setSetup(data);
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

  const getSupabase = () => {
    return createBrowserSupabaseClient(setup.url, setup.anonKey);
  };

  const handleLocalAdminLogin = async () => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/supabase/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enable-local-admin' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Please sign in with Supabase Auth.');
        return;
      }
      router.push(safeNext);
      router.refresh();
    } catch {
      setErrorMsg('Unable to activate local Admin session.');
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
        'Cloud sign-in is awaiting Supabase configuration. Sign in as Admin below to configure Cloud Settings in the Admin Control Center.'
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
        router.push(safeNext);
        router.refresh();
        return;
      }

      if (mode === 'signup') {
        const cleanFullName =
          fullName.trim() || cleanEmail.split('@')[0] || 'User';
        const cleanPrimaryRole =
          primaryRole.trim() || 'Data Analyst / Junior Data Analyst';

        const signupRes = await fetch('/api/supabase/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'signup',
            email: cleanEmail,
            password,
            fullName: cleanFullName,
            primaryRole: cleanPrimaryRole,
          }),
        });
        const signupData = (await signupRes.json().catch(() => ({}))) as {
          ok?: boolean;
          confirmed?: boolean;
          fallbackClientSignup?: boolean;
          error?: string;
        };

        if (!signupRes.ok) {
          setErrorMsg(signupData.error || 'Could not create account.');
          return;
        }

        if (signupData.ok && signupData.confirmed) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          if (signInErr) {
            setErrorMsg(signInErr.message);
            return;
          }
          router.push(safeNext);
          router.refresh();
          return;
        }

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
        if (data.session) {
          router.push(safeNext);
          router.refresh();
          return;
        }
        setSuccessMsg(
          'Account created! Check your email inbox to confirm your address before signing in.'
        );
        return;
      }

      if (mode === 'magic') {
        if (otpSent && otpCode.trim()) {
          const { error } = await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: otpCode.trim(),
            type: 'email',
          });
          if (error) {
            setErrorMsg(error.message);
            return;
          }
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
          'Magic link & 6-digit login code sent! Click the link in your email or enter the 6-digit code below.'
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

  const handleOAuthLogin = async (provider: SupportedOAuthProvider) => {
    setErrorMsg('');
    setSuccessMsg('');
    const supabase = getSupabase();
    if (!supabase) {
      setErrorMsg(
        'Cloud OAuth is awaiting Supabase configuration. Sign in as Admin below to open Cloud Settings.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`,
        },
      });
      if (error) {
        setErrorMsg(
          `${error.message}. Make sure this provider is enabled in Supabase Dashboard -> Authentication -> Providers.`
        );
      }
    } finally {
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
              {mode === 'signup' && (
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

              {(mode === 'signin' || mode === 'signup') && (
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

              {mode === 'magic' && otpSent && (
                <div>
                  <label className={cn('mb-1 block text-xs font-medium', tokens.mutedText)}>
                    6-Digit OTP Code (from Email)
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
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
                    {submitting ? 'Creating Account...' : 'Create Account'}
                  </>
                ) : mode === 'magic' ? (
                  <>
                    <Mail className="h-4 w-4" />
                    {submitting
                      ? 'Sending...'
                      : otpSent && otpCode.trim()
                        ? 'Verify 6-Digit Code'
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

            {/* Social / OAuth Section */}
            <div className={cn('border-t pt-4 space-y-3', tokens.borderSubtle)}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={cn('text-xs font-semibold', tokens.strongText)}>
                  One-Click Social &amp; OAuth Sign-In (Supabase)
                </span>
                {setup.enabledProviders.length > 0 && (
                  <span className={cn('font-mono text-[11px]', tokens.mutedText)}>
                    Enabled: {setup.enabledProviders.join(', ')}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {SUPABASE_OAUTH_PROVIDERS.map((provider) => {
                  const shortKey = provider.id.replace('_oidc', '');
                  const isActiveInSupabase = setup.enabledProviders.some(
                    (p) => p === provider.id || p === shortKey
                  );
                  return (
                    <button
                      key={provider.id}
                      type="button"
                      disabled={submitting}
                      onClick={() => void handleOAuthLogin(provider.id)}
                      className={cn(
                        'inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-60',
                        tokens.secondaryBtn
                      )}
                      title={
                        isActiveInSupabase
                          ? `Continue with ${provider.label}`
                          : `Continue with ${provider.label} (Enable under Supabase Auth Providers)`
                      }
                    >
                      <OAuthProviderMark id={provider.id} />
                      <span>{provider.label}</span>
                      {isActiveInSupabase && (
                        <span className="text-[10px] text-[#057642]">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {!loadingSetup &&
              (setup.allowLocalAdmin ?? (!setup.keyValid || !setup.schemaReady)) && (
                <div className={cn('border-t pt-4 space-y-2', tokens.borderSubtle)}>
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className={tokens.mutedText}>
                      Local workspace &amp; Admin settings access
                    </span>
                    <span
                      className={cn(
                        'font-mono',
                        setup.keyValid && setup.schemaReady
                          ? 'font-medium text-[#057642]'
                          : tokens.mutedText
                      )}
                    >
                      {setup.keyValid && setup.schemaReady
                        ? '✓ Cloud Connected'
                        : 'Setup Pending'}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleLocalAdminLogin()}
                    className={cn(
                      'inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-60',
                      tokens.secondaryBtn
                    )}
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Continue as Admin ({PRIMARY_ADMIN_EMAIL})
                  </button>
                </div>
              )}
          </div>
        </section>
      </main>
    </div>
  );
}

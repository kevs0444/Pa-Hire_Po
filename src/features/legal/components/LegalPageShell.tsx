'use client';

import { ReactNode, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Moon, Shield, Sun } from 'lucide-react';
import { MonochromeTheme } from '@/types/job';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
}

interface LegalPageShellProps {
  title: string;
  subtitle: string;
  effectiveDate: string;
  currentPath: '/privacy' | '/terms';
  navItems: NavItem[];
  children: ReactNode;
}

export function LegalPageShell({
  title,
  subtitle,
  effectiveDate,
  currentPath,
  navItems,
  children,
}: LegalPageShellProps) {
  const [theme, setTheme] = useState<MonochromeTheme>(() => {
    if (typeof window === 'undefined') return 'light';
    try {
      const stored = localStorage.getItem('pa_hire_po_theme');
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // Fallback to light
    }
    return 'light';
  });

  const toggleTheme = () => {
    const next: MonochromeTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('pa_hire_po_theme', next);
    } catch {
      // Ignore storage errors
    }
  };

  const tokens = getThemeTokens(theme);

  useEffect(() => {
    document.documentElement.style.colorScheme =
      theme === 'dark' ? 'dark' : 'light';
  }, [theme]);

  return (
    <div
      className={cn('min-h-screen transition-colors', tokens.pageBg)}
      style={{ colorScheme: tokens.isDark ? 'dark' : 'light' }}
    >
      {/* Top Civic Navigation Bar */}
      <header className={cn('sticky top-0 z-40 border-b', tokens.navBg)}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
            >
              <div
                className={cn(
                  'relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border bg-white',
                  tokens.borderSubtle
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
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight leading-none group-hover:text-[#0a66c2]">
                  Pa-Hire Po
                </span>
                <span className={cn('text-[10px] mt-0.5 font-mono', tokens.mutedText)}>
                  Civic Career Utility
                </span>
              </div>
            </Link>

            <span className="hidden sm:inline-block text-xs text-slate-300 dark:text-zinc-700">|</span>
            <span
              className={cn(
                'hidden sm:inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-mono',
                tokens.orangeBadge
              )}
            >
              <Shield className="h-3 w-3" />
              Legal &amp; Trust
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Nav switcher between Privacy and Terms */}
            <div className={cn('inline-flex rounded-lg border p-0.5 text-xs font-medium', tokens.navTrack)}>
              <Link
                href="/privacy"
                className={cn(
                  'rounded-md px-2.5 py-1 transition-colors',
                  currentPath === '/privacy'
                    ? tokens.primaryBtn
                    : cn(tokens.mutedText, 'hover:text-slate-900 dark:hover:text-zinc-100')
                )}
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className={cn(
                  'rounded-md px-2.5 py-1 transition-colors',
                  currentPath === '/terms'
                    ? tokens.primaryBtn
                    : cn(tokens.mutedText, 'hover:text-slate-900 dark:hover:text-zinc-100')
                )}
              >
                Terms
              </Link>
            </div>

            {/* Back to App Link */}
            <Link
              href="/"
              className={cn(
                'hidden sm:inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                tokens.secondaryBtn
              )}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              App
            </Link>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${tokens.isDark ? 'light' : 'dark'} mode`}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                tokens.secondaryBtn
              )}
            >
              {tokens.isDark ? (
                <>
                  <Sun className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Dark</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <article className="space-y-8">
          {/* Document Header */}
          <header className={cn('rounded-lg border p-6 sm:p-8 space-y-4', tokens.cardSurface)}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-200">
                <span className="font-bold">✓</span> Official Policy
              </span>
              <span className={cn('text-xs font-mono', tokens.mutedText)}>
                Version 1.0 • Effective: <time dateTime={effectiveDate}>{effectiveDate}</time>
              </span>
            </div>

            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                {title}
              </h1>
              <p className={cn('mt-2 text-sm sm:text-base leading-relaxed', tokens.mutedText)}>
                {subtitle}
              </p>
            </div>

            {/* Quick Table of Contents Anchor Navigation */}
            {navItems.length > 0 && (
              <nav
                aria-label="Document Sections"
                className={cn('border-t pt-4', tokens.borderSubtle)}
              >
                <div className="text-xs font-medium mb-2 text-slate-700 dark:text-zinc-300">
                  Quick Navigation:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {navItems.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={cn(
                        'inline-flex items-center rounded-md border px-2 py-1 text-xs transition-colors hover:border-[#0a66c2] hover:text-[#0a66c2]',
                        tokens.subSurface
                      )}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </nav>
            )}
          </header>

          {/* Legal Document Body */}
          <div className={cn('rounded-lg border divide-y', tokens.cardSurface, tokens.borderSubtle)}>
            {children}
          </div>
        </article>

        {/* Civic Footer */}
        <footer className={cn('mt-12 border-t pt-8 pb-12 text-xs space-y-4', tokens.borderSubtle, tokens.mutedText)}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-zinc-100">Pa-Hire Po</span>
              <span>•</span>
              <span>Civic Career Utility</span>
              <span>•</span>
              <span>© 2026</span>
            </div>

            <nav aria-label="Footer Links" className="flex flex-wrap items-center gap-4">
              <Link href="/" className="hover:underline">
                Dashboard
              </Link>
              <Link href="/login" className="hover:underline">
                Sign In
              </Link>
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:underline">
                Terms of Service
              </Link>
            </nav>
          </div>

          <p className="text-[11px] leading-relaxed">
            Pa-Hire Po is an independent career search and resume utility. We respect user privacy, enforce Row-Level Security on all stored documents, and comply with the Google API Services User Data Policy, Philippine Data Privacy Act of 2012 (RA 10173), and applicable global privacy regulations.
          </p>
        </footer>
      </main>
    </div>
  );
}

---
type: feature
status: verified
priority: p0-now
area: product
milestone: v2-rebrand
commit_ref: "ad54cde"
files:
  - src/app/page.tsx
  - src/components/LandingPageView.tsx
  - src/features/home/components/LandingPageView.tsx
  - src/components/layout/AppTopNavbar.tsx
  - public/pa-hire-po-logo.jpg
updated: 2026-11-16
tags:
  - pahirepo
  - feature
  - branding
---

# Feature — Workspace Home & Branding

## Purpose & User Outcome
Provides a calm, utilitarian **Civic Career Utility** entry screen (`/`) instead of noisy SaaS marketing fluff, giving job seekers immediate access to job search, Resume Studio (`AI`), board jump links, and desktop launchers.

## Sub-Features & Behavior
- **Official Branding:** Displays `/pa-hire-po-logo.jpg` and `/favicon.ico` in the sticky top navbar (`AppTopNavbar.tsx`), browser tab, workspace overview card, and Electron desktop window icon (`public/pa-hire-po.ico`).
- **Light / Dark Theme Toggle:** Switch seamlessly between **Light Civic** (default) and **Soft Grayscale Dark** (legacy `'orange'` localStorage preferences safely normalize to `'light'`).
- **Workspace Overview:** Live job counters, direct shortcuts to **JobStreet**, **LinkedIn**, and **Indeed**, quick buttons for `Open Job Explorer` (`/jobs`) and `Resume Studio [AI]`, and copy-ready desktop launch instructions.

## Code Map
- Entry Route: [`src/app/page.tsx`](file:///d:/Dev/Pa-Hire%20Po/src/app/page.tsx)
- Components: `src/features/home/components/LandingPageView.tsx`, `src/components/layout/AppTopNavbar.tsx`
- Theme Tokens: `src/lib/theme.ts`

## Related Notes
- [[Design - Civic Career Utility & Theme Tokens]]
- [[Feature - Multi-Board Job Scraper Engine]]
- [[00 - Home MOC]]

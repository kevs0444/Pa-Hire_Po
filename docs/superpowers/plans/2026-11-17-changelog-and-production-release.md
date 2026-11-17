# Changelog (`v1.0.0`–`v1.0.3`), Notification Bell Sync & Production Release Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` (or `superpowers:subagent-driven-development`) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a complete, day-versioned user changelog from launch to today (`v1.0.0` Nov 14 → `v1.0.1` Nov 15 → `v1.0.2` Nov 16 → `v1.0.3` Nov 17), wire `v1.0.3` into `NotificationBell` with persistent `localStorage` read tracking, sync `package.json`, `CHANGELOG.md`, `AGENTS.md`, and the Obsidian Second Brain, and push verified changes to `origin/main` to trigger Vercel production deployment (`https://pa-hire-po.vercel.app`).

**Architecture:** `src/features/changelog/data/changelog-data.ts` is the single typed source of truth (`USER_CHANGELOG_RELEASES`, `LATEST_CHANGELOG_RELEASE`, `CHANGELOG_SEEN_STORAGE_KEY`) consumed by `PleaseHireMeDashboard.tsx` (Notification Bell seeding & read state) and `ChangelogModal.tsx` (native `<dialog>` + native `<details>` disclosures with `v1.0.3` expanded by default and `v1.0.0`–`v1.0.2` collapsible).

## Global Constraints
- Day-based versioning: `v1.0.0` (Nov 14, 2026), `v1.0.1` (Nov 15, 2026), `v1.0.2` (Nov 16, 2026), `v1.0.3` (Nov 17, 2026), synced with `package.json` (`1.0.3`).
- Non-admin views (`ChangelogModal`, `NotificationBell`) describe strictly user-facing features and account security/reliability benefits without exposing Supabase setup checklists or `.env` keys.
- Use `getThemeTokens(theme)` (`badgeAccent`, `badgeSuccess`, `badgeNeutral`, `cardSurface`, `subSurface`, `borderSubtle`) and native `<details>`/`<summary>` HTML disclosures.

## Tasks
- [x] Task 1: Save plan, bump `package.json` to `1.0.3`, update `src/features/changelog/data/changelog-data.ts`, and strengthen `AGENTS.md` Obsidian MOC first-read rule.
- [x] Task 2: Upgrade `ChangelogModal.tsx`, `NotificationBell.tsx`, and `PleaseHireMeDashboard.tsx` read-state sync.
- [x] Task 3: Update `CHANGELOG.md`, `context.md`, and `Pa-Hire Po/` Obsidian Second Brain notes.
- [x] Task 4: Run `npx tsc --noEmit`, `npm run lint`, `npm run build`, commit cleanly on `main`, and push to `origin/main` for Vercel production deploy.

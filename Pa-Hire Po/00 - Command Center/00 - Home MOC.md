---
type: moc
status: active
priority: p0-now
area: product
milestone: v1.0.4
commit_ref: "pending"
files:
  - AGENTS.md
  - context.md
  - CHANGELOG.md
  - package.json
  - README.md
updated: 2026-11-18
tags:
  - pahirepo
  - moc
  - command-center
---

# Pa-Hire Po — Second Brain Command Center

> **Mission:** A high-contrast, distraction-free **Civic Career Utility** helping entry-to-mid career professionals discover live jobs across LinkedIn, JobStreet, and Indeed with honest weighted scoring, ATS-safe resume tailoring via Google Gemini, and full application lifecycle tracking.

- **Production Web App:** https://pa-hire-po.vercel.app
- **Repository:** `https://github.com/kevs0444/Pa-Hire_Po.git` (`main`)
- **Current Version:** `v1.0.4` (`package.json` • day-based versioning `v1.0.0`–`v1.0.4`)
- **Supabase Store Lock:** `Pa-Hire Po` (`muftcprpqnzuzfosvftz`)
- **Mandatory AI First-Read & Pre/Post-Push Sync Rule:** Every AI session MUST read this MOC, [[Active State & Progress Ledger]], [[Changelog Mirror]], and root [`context.md`](file:///d:/Dev/Pa-Hire%20Po/context.md) before designing or editing code, and **mandatory** update the Second Brain, `context.md`, and day-based changelog both before pushing and after verifying a production push (see `AGENTS.md` Section 8 & [[Frontmatter Schema & Vault Conventions]]).

---

## Visual Dashboards & Maps

- [[System Architecture.canvas|System Architecture & Data Flow Canvas]]
- [[Features Matrix.base|Features Matrix (Obsidian Base)]]
- [[Roadmap Tracker.base|Roadmap Tracker: P0 Core vs P2 Backlog (Obsidian Base)]]
- [[Decisions Log.base|Architecture Decision Records (Obsidian Base)]]
- [[Active State & Progress Ledger]]

---

## 01 — Origin, Timeline & History

- [[Project Evolution Timeline (Start to Present)]] — Complete 20-commit evolution from `PleaseHireMe` (`41ce8d2`) to `Pa-Hire Po` (`a1059ca`)
- [[Specs & Plans Archive Index]] — Links to `docs/superpowers/` design specs and implementation plans
- [[Changelog Mirror]] — Customer-facing updates mirrored from `CHANGELOG.md`
- [[2026-11-18|Session Log — 2026-11-18 (PDF/Word Resume Import, Smart Profile Sync, Justify & Optional Company)]]
- [[2026-11-17|Session Log — 2026-11-17 (Email Templates, Auth Lockdown & UX Polish)]]
- [[2026-11-16|Session Log — 2026-11-16 (Second Brain Setup)]]

---

## 02 — Features & Product (Core Utility)

1. [[Feature - Workspace Home & Branding]]
2. [[Feature - Multi-Board Job Scraper Engine]]
3. [[Feature - Match Scorer & Experience Analyzer]]
4. [[Feature - 2-Column Job Explorer & Date Sorting]]
5. [[Feature - Resume Studio AI & ATS Printing]]
6. [[Feature - Applications Compilation & Submitted Resume Modal]]
7. [[Feature - Job Market Analytics & Screening Queue]]
8. [[Feature - LinkedIn Profile Media & 2-Way Resume Sync]]
9. [[Feature - Settings Sidepanel, ESCO Role Library & Notifications]]
10. [[Feature - Auth, Admin Control Center & Legal Compliance]]

---

## 03 — Architecture & Systems

- [[Architecture - Next.js 16 App Router & API Map]]
- [[Architecture - Supabase Schema, RLS & 1k-User Scale]]
- [[Architecture - Gemini AI Pipeline & Anti-Hallucination Grounding]]
- [[Architecture - Electron Desktop Shell & PWA]]
- [[Architecture - Rate Limiting, Caching & Security]]

---

## 04 — Design System & Guardrails

- [[Design - Civic Career Utility & Theme Tokens]]
- [[Design - Anti-AI-Slop Rules & Accessibility]]
- [[Design - Ruthless UI Architect & Anti-AI-Slop Rules]]

---

## 05 — Architecture Decision Records (ADRs)

- [[ADR-001 - Lock Single Vercel Supabase Store]]
- [[ADR-002 - Gemini 3.1 Flash-Lite with Deterministic Local Fallback]]
- [[ADR-003 - Native HTML Dialog Over Div Overlays]]
- [[ADR-004 - Client-Side Canvas Compression for Profile Media]]
- [[ADR-005 - Soft Grayscale Dark Mode Replacing Blue Dark Slate]]
- [[ADR-006 - Google OAuth Testing Mode Until Custom Domain]]

---

## 06 — Product Strategy & Future Roadmap

> **Current Focus Rule:** Stay strictly anchored on **P0 Core Function Polish & Public Launch Readiness**. P2 initiatives are captured cleanly in the backlog so nothing is forgotten, without distracting from core reliability.

- [[Product Strategy - Vision, Persona & Core Loop]]
- **P0 (Now):** [[Roadmap P0 - Core Function Polish & Public OAuth Launch]]
- **P2 (Backlog / Later):**
  - [[Roadmap P2 - Auto-Apply Queue & Browser Extension Bridge]]
  - [[Roadmap P2 - AI Interview Prep & Cover Letter Suite]]
  - [[Roadmap P2 - Monetization, SaaS Tiers & Growth]]
  - [[Roadmap P2 - Mobile PWA Push & Automated E2E Testing]]

---
type: infra
status: active
priority: p0-now
area: infra
milestone: v1.0.7
commit_ref: "pending"
files:
  - AGENTS.md
  - context.md
  - CHANGELOG.md
  - package.json
updated: 2026-11-22
tags:
  - pahirepo
  - agents-rules
  - memory-protocol
  - deployment-gate
---

# Agent Rules — Persistent Memory & Pre/Post-Push Gate

Mirrors the **Next.js 16 Docs Rule** and **Section 8** of root [`AGENTS.md`](file:///d:/Dev/Pa-Hire%20Po/AGENTS.md).

---

## Next.js 16 Breaking-Changes Rule
- Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code and heed deprecation notices.
- Keep the `<!-- BEGIN:nextjs-agent-rules --> ... <!-- END:nextjs-agent-rules -->` block intact in root [`AGENTS.md`](file:///d:/Dev/Pa-Hire%20Po/AGENTS.md) so `next dev` does not re-create uncommitted diffs.

---

## 8. Project Mission, System Architecture & Persistent Memory Protocol
- **North Star Mission:** Pa-Hire Po is a high-contrast, distraction-free **Civic Career Utility** built for entry-to-mid career job seekers (especially Data Analysts, BI Analysts, Junior Engineers, and Tech Professionals in Southeast Asia & Globally) to discover jobs across LinkedIn, JobStreet, and Indeed with honest match scoring, and tailor ATS-optimized resumes via Google Gemini AI (`gemini-3.1-flash-lite`).
- **Core Technology Stack:**
  - **Framework:** Next.js 16 (App Router, Turbopack, Partial Prerendering, `@vercel/analytics`).
  - **Styling:** Tailwind CSS v4, custom Civic Career Utility tokens (`getThemeTokens`).
  - **Backend & Database:** Vercel-linked Supabase PostgreSQL (`muftcprpqnzuzfosvftz`), Row-Level Security (RLS), GoTrue OAuth (Google, GitHub, Magic Link).
  - **AI Engine:** Google Gemini API (`gemini-3.1-flash-lite`, enterprise non-training terms).
  - **Desktop Shell:** Electron with modular IPC handlers (`electron/{main,preload,ipc-handlers,config}.cjs`).

### Mandatory AI First-Read Protocol
Every time an AI assistant starts working on Pa-Hire Po — before designing, planning, editing code, or proposing features — it **MUST** first open and read:
1. [[00 - Home MOC]] (`Pa-Hire Po/00 - Command Center/00 - Home MOC.md`)
2. [[Active State & Progress Ledger]] (`Pa-Hire Po/00 - Command Center/Active State & Progress Ledger.md`)
3. [[Changelog Mirror]] (`Pa-Hire Po/01 - Origin & Timeline/Changelog Mirror.md`)
4. Root [`context.md`](file:///d:/Dev/Pa-Hire%20Po/context.md)
5. Any domain-specific Feature, Architecture, Design System, ADR, or Roadmap notes under `Pa-Hire Po/`.

### Dual-Sync Memory & Changelog Protocol
Whenever a feature, architectural decision, or release is added, modified, or verified, update:
1. Root `context.md` and `CHANGELOG.md` / `src/features/changelog/data/changelog-data.ts` (day-based `v1.0.x` versioning).
2. Corresponding Obsidian notes in `Pa-Hire Po/` (`00 - Command Center/Active State & Progress Ledger.md`, `01 - Origin & Timeline/Changelog Mirror.md`, `01 - Origin & Timeline/Project Evolution Timeline (Start to Present).md`, `01 - Origin & Timeline/Session Logs/`, `02 - Features & Product/`, `03 - Architecture & Systems/`, `05 - Architecture Decision Records (ADRs)/`, or `07 - Agent Rules & Guidelines/`).
- **Security Rule:** Never store raw API keys or secrets inside Obsidian notes.

### Mandatory Pre-Push & Post-Push Production Gate
1. **Pre-Push (before pushing to `origin/main`):**
   - Update the day-based user changelog (`CHANGELOG.md`, `src/features/changelog/data/changelog-data.ts`, `package.json`, synced to `NotificationBell` & `ChangelogModal`), root `context.md`, and the Obsidian Second Brain (`00 - Home MOC.md`, `Active State & Progress Ledger.md`, `Changelog Mirror.md`, `Project Evolution Timeline (Start to Present).md`, and today's `Session Logs/` note).
   - Pass `npx tsc --noEmit`, `npm run lint`, and `npm run build` with exit code `0`.
2. **Post-Push (after pushing to production):**
   - Verify the live production deployment (`https://pa-hire-po.vercel.app`).
   - Update the Obsidian Second Brain (`00 - Home MOC.md`, `Active State & Progress Ledger.md`, `Changelog Mirror.md`, `Project Evolution Timeline (Start to Present).md`, `Session Logs/`), `context.md`, and changelog metadata with the verified live commit SHA and production check results.
   - Commit and push that single `docs(memory)` sync commit cleanly (without recursively triggering another `docs(memory)` commit).
3. **Keep `AGENTS.md` Focused on Rules:** Do not dump transient daily logs into `AGENTS.md`. Keep `AGENTS.md` reserved for permanent rules, architectural invariants, and design system constraints.

---

## Related Notes
- [[00 - AGENTS Rules Index]]
- [[00 - Home MOC]]
- [[Frontmatter Schema & Vault Conventions]]
- [[Active State & Progress Ledger]]

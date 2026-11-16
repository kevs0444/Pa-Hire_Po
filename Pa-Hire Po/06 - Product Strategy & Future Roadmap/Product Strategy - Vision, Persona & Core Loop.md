---
type: roadmap
status: active
priority: p0-now
area: product
milestone: roadmap
commit_ref: "a1059ca"
files:
  - context.md
  - README.md
updated: 2026-11-16
tags:
  - pahirepo
  - strategy
  - product
---

# Product Strategy — Vision, Persona & Core Loop

## Vision
**Pa-Hire Po** eliminates job-hunting friction and AI resume slop by giving job seekers a single calm, high-contrast **Civic Career Utility** where discovery, honest match scoring, grounded AI resume tailoring, and application tracking live in one cohesive workspace.

## Target Persona
- **Primary:** Entry-to-mid career professionals (especially Data Analysts, BI Analysts, Junior Data Engineers, Software/AI Engineers, and Career Shifters) across the **Philippines & Southeast Asia** (`PH`, `MY`, `SG`, `ID`) plus Global Remote.
- **Secondary:** Cross-industry professionals discovering roles via the ESCO + local catalog (`MAX_SAVED_TARGET_ROLES = 10`).

## Core Value Loop (The Main Core Function)
1. **Discover (`Find Jobs`):** Scrape LinkedIn, JobStreet, and Indeed concurrently with recency filtering and compound/pivot role expansion.
2. **Evaluate Honestly (`Match Scorer`):** Surface `28–98%` weighted alignment + realistic experience-level warnings (`fit` vs `stretch` vs `senior-warning`).
3. **Tailor Groundedly (`Resume Studio AI`):** Rewrite emphasis using *only* factual Career Journey & base CV data via `gemini-3.1-flash-lite` + ATS-safe ligature-free PDF export.
4. **Track & Audit (`Applications`):** Save jobs, log stages (`Applied` → `Interviewing` → `Offer`), and pop out the exact resume submitted (`SubmittedResumeModal`).

## Strategic Focus Rule
> Keep engineering energy locked on **P0 Core Function Polish & Public Launch Readiness** first. All P2 expansion tracks (Auto-Apply, Interview Prep, Browser Extension, Cover Letters, Monetization, Mobile/CI) are captured here so nothing is lost, without derailing core reliability.

## Related Notes
- [[Roadmap P0 - Core Function Polish & Public OAuth Launch]]
- [[Roadmap Tracker.base]]
- [[00 - Home MOC]]

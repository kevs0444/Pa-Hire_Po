---
type: adr
status: accepted
priority: p0-now
area: product
milestone: v2-rebrand
commit_ref: "288ca06"
files:
  - src/hooks/useNativeDialog.ts
  - src/features/jobs/components/ApplyFlowModal.tsx
  - src/features/applications/components/SubmittedResumeModal.tsx
updated: 2026-11-16
tags:
  - pahirepo
  - adr
  - accessibility
---

# ADR-003 — Native HTML Dialog Over Div Overlays

## Context
Generic `fixed inset-0` `<div>` modal overlays suffer from focus-trap bugs, z-index wars, missing Escape handling, and broken scroll containment when printing `#a4-resume-sheet`.

## Decision
Mandate native HTML `<dialog>` opened via `showModal()` through shared `useNativeDialog.ts`, using `closedby="any"`, `aria-labelledby`, `dialog.returnValue = ''` reset, inner flex/scroll wrapper, and explicit `@media print` reset rules.

## Alternatives Considered & Rejected
- **Custom Portal `<div>` overlays:** Reinvents browser top-layer semantics poorly.
- **Heavy third-party UI modal library:** Unnecessary bundle weight when native `<dialog>` handles top-layer + backdrop natively.

## Consequences
- **Positive:** Reliable keyboard Escape, clean print output for pop-out resumes (`SubmittedResumeModal`), zero z-index collisions.
- **Tradeoffs:** Must never force `display: flex` directly on `<dialog>` without `[open]` scoping, or closed dialogs stay visible.

## Related Notes
- [[Design - Anti-AI-Slop Rules & Accessibility]]
- [[Feature - Applications Compilation & Submitted Resume Modal]]

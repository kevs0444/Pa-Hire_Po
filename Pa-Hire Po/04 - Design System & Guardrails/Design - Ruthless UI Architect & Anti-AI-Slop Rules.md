---
type: design-system
status: verified
priority: p0-now
area: product
milestone: v4-ux-polish
commit_ref: "a1059ca"
files:
  - AGENTS.md
  - context.md
  - src/app/globals.css
  - src/lib/theme.ts
updated: 2026-11-17
tags:
  - pahirepo
  - design-system
  - anti-ai-slop
  - ui-architect
  - responsive-safety
---

# Design — Ruthless UI Architect & Anti-AI-Slop Rules

> **Persona & Mandate:** You are a ruthless, opinionated UI Design Architect. You refuse to fall back to the generic, formulaic defaults that LLMs are trained on. Every UI contribution to **Pa-Hire Po** must serve the high-contrast, distraction-free **Civic Career Utility** ethos (inspired by LinkedIn and JobStreet).

---

## Strictly Banned "AI Slop" Tells

Before writing code or laying out a page, strictly ban the following patterns:

### 1. Typography Tells
- **Banned Voices:** No `Inter`, `Roboto`, `Arial`, or bare `system-ui` as the primary brand voice.
- **Intentional Pairing:** Pick one intentional display face and one body face.
  - **Headings & Display:** `Plus Jakarta Sans` (`--font-display`)
  - **Body & Dense Job Data:** `Source Sans 3` (`--font-sans`)
  - **Tabular Scores & Code Metrics:** `JetBrains Mono` (`--font-mono font-mono tabular-nums`)
  - **Resume Printing Only (`#a4-resume-sheet`):** Grounded Top 5 ATS Fonts (`Calibri`, `Helvetica`, `Garamond`, `Arial`, `Georgia`) with `font-variant-ligatures: none`.

### 2. Color & Gradient Tells
- **No Purple Slop:** No purple-on-white or purple-to-indigo "AI product" gradients.
- **No Muddy Shortcuts:** No default warm cream/sand body backgrounds used as a cheap "premium" shortcut.
- **No Neon Pitch-Black:** No near-black + single acid-green/lime accent dark themes (`#000000` canvas with `#f97316` or acid-neon glow).
- **Approved Palettes:**
  - **Light Civic (Default):** Canvas `#f3f2ef`, cards `#ffffff`, primary ink `#0f172a`, muted `#475569`, LinkedIn civic blue accent `#0a66c2`, high-match emerald `#057642`.
  - **Soft Grayscale Dark Mode:** Canvas `#121214`, cards `#18181b`, sub-surface `#202024`, text `#f4f4f5`, muted `#a1a1aa`, clean zinc border/accents (`#3f3f46` / `#e4e4e7`).

### 3. Layout & Card Tells
- **No Formulaic Grids:** No identical 3-column card grids without functional variation.
- **No Fake Numbering:** No fake `01/02/03` step markers with no real sequential dependency.
- **No Nested Card Soup:** Never nest 3+ card borders inside one another; use `divide-y` or `border-t` hairlines instead.
- **No Purely Decorative Geometry:** No broadsheet hairline rules and zero-radius boxes used purely as decoration. Radius standard is `rounded-lg` (max `rounded-xl` on outer modal shells); never use `rounded-3xl` bubble geometry.

### 4. UI Chrome & Fake Data Tells
- **No Invented Metrics:** No invented metrics, fake case-study counts, or phantom testimonials.
- **No Fake Mockup Windows:** No re-drawn UI chrome (fake browser frames, mobile mockups, floating code windows).
- **No Decorative Icon Spam:** Never import `Sparkles` or `Wand2` from `lucide-react`; no shouting `font-black uppercase tracking-widest` micro-labels.

### 5. Motion Tells
- **No Bouncy Transforms:** No bouncy/elastic easing curves.
- **No Random Scales:** No random hover-scale transforms (`hover:scale-105` on cards) that disorient reading.
- **Purposeful Micro-interactions Only:** No scattered micro-animations without a clear interaction purpose. Transitions must be subtle (`transition-colors duration-150` or `ease-out`).

---

## Required Rules for This Build

### Rule 1: Structural Variety
- **Macro-Structure Fit:** Do not use the tired `Hero -> 3-Feature Cards -> CTA -> Footer` rhythm.
- Invent a macro-structure that fits *this specific product’s* actual purpose:
  - **Workspace Home (`/`):** Instant operational status, live board counters (LinkedIn, JobStreet, Indeed), direct resume shortcuts, and desktop launcher disclosure.
  - **Job Explorer (`/jobs`):** Scannable 2-column master-detail layout (left card stream + right single-surface reading pane separated by hairlines).
  - **Applications (`/applications`):** Stage tracking ledger (`Applied`, `Interviewing`, `Offer`, `Rejected`) with pop-out submitted resume review modal.
  - **Resume Studio (`/jobs` tab):** Direct in-sheet A4 document editor with top ATS typography toolbar and live side-by-side diffing.

### Rule 2: Token Discipline
- **Zero Arbitrary Inlines:** No inline color or font-size values bypassing your design tokens.
- Rely strictly on:
  - Theme utility tokens (`getThemeTokens(theme)`) in `src/lib/theme.ts`.
  - Semantic CSS variables (`var(--background)`, `var(--foreground)`, `var(--accent-color)`).
  - Explicit Tailwind utility scales configured in `globals.css` (`@theme inline`).

### Rule 3: Responsive Safety
- **Canvas Overflow Protection:** Enforce `overflow-x: clip` on `html` and `body` (never use `overflow-x: hidden`, which breaks sticky positioning and scroll containers).
- **Header Line-Wrap Safety:** Display headers must wrap cleanly with `overflow-wrap: anywhere; min-width: 0`.
- **Zero Mobile Overflow:** Zero horizontal scroll at any mobile width (from `375px` upwards).
- **Modal Containment:** Native HTML `<dialog>` with `overscroll-behavior: contain` and light-dismiss backdrop.

### Rule 4: Content Truth
- **Real Copy & Functional States:** Use real copy, real layout pacing, and functional states (`empty`, `loading`, `error`) rather than placeholder lorem ipsum or fake statistics.
- **Non-Color-Only Indicators:** Never rely on color alone for match tiers or fit status — pair colors with explicit `✓` iconography and descriptive text labels (e.g. `✓ Matches Your Level`, `✓ 85% High Match`).

---

## Related Notes & MOC Connections
- [[00 - Home MOC]] — Second Brain Central Command
- [[Design - Anti-AI-Slop Rules & Accessibility]] — Accessibility, native dialogs & image optimization
- [[Design - Civic Career Utility & Theme Tokens]] — Token mapping, typography & color roles
- [[ADR-003 - Native HTML Dialog Over Div Overlays]] — Native top-layer dialog architecture
- [[ADR-005 - Soft Grayscale Dark Mode Replacing Blue Dark Slate]] — Monochrome dark mode rationale

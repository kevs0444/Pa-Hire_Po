---
type: moc
status: active
priority: p0-now
area: infra
milestone: v4-ux-polish
commit_ref: "a1059ca"
files:
  - AGENTS.md
  - context.md
updated: 2026-11-16
tags:
  - pahirepo
  - system
  - templates
---

# Frontmatter Schema & Vault Conventions

This vault uses consistent YAML properties so Obsidian **Properties**, **Graph View**, and **Obsidian Bases** (`.base` tables) can query and cross-reference every note automatically.

## Standard Properties

| Property | Allowed Values | Purpose |
|---|---|---|
| `type` | `moc` \| `timeline` \| `feature` \| `architecture` \| `design-system` \| `adr` \| `roadmap` \| `session-log` | Drives `.base` table filters |
| `status` | `active` \| `verified` \| `draft` \| `backlog` \| `superseded` | Operational maturity |
| `priority` | `p0-now` \| `p1-next` \| `p2-later` | Keeps core focus separated from backlog |
| `area` | `jobs` \| `resume-ai` \| `profile` \| `analytics` \| `applications` \| `auth-admin` \| `infra` \| `desktop` \| `product` | Feature-sliced domain grouping |
| `milestone` | `v1-pleasehireme` \| `v2-rebrand` \| `v3-supabase-scale` \| `v4-ux-polish` \| `roadmap` | Historical release anchor |
| `commit_ref` | Git short SHA (e.g., `"a1059ca"`) | Ground-truth trace to Git history |
| `files` | List of repo-relative file paths | Exact codebase mapping |
| `updated` | `YYYY-MM-DD` | Last verified date |
| `tags` | Array (`pahirepo`, domain tags) | Graph & tag filtering |

## Security Rule (Zero Raw Secrets)

- **Never** write API keys, service-role keys, OAuth client secrets, or database passwords into any note.
- Always reference environment variable names (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, etc.) instead of literal values.

## Available Templates

- [[Template - Feature Note]]
- [[Template - ADR]]
- [[Template - Session Log]]
- [[Template - Roadmap Initiative]]
- [[Template - Brainstorm & Spec]]

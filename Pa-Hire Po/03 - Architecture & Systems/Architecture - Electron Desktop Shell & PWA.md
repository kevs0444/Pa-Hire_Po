---
type: architecture
status: verified
priority: p0-now
area: desktop
milestone: v4-ux-polish
commit_ref: "22c463d"
files:
  - electron/main.cjs
  - electron/preload.cjs
  - electron/ipc-handlers.cjs
  - electron/config.cjs
  - electron/open-desktop.cjs
  - electron/launch-dev.cjs
  - electron-builder.json
  - open-desktop.bat
  - src/lib/desktop/electron-bridge.ts
  - src/app/manifest.ts
updated: 2026-11-16
tags:
  - pahirepo
  - architecture
  - electron
  - pwa
---

# Architecture — Electron Desktop Shell & PWA

## Hybrid Web + Desktop Strategy
Pa-Hire Po runs identically as a Vercel-hosted web app, an installable **PWA**, and an **Electron (`45.3.2`)** desktop app with native IPC bridges.

## Electron Module Breakdown (`electron/`)
- `electron/main.cjs` — Desktop `BrowserWindow` lifecycle, official icon (`public/pa-hire-po.ico` / `.jpg`), single-instance lock.
- `electron/preload.cjs` & `src/lib/desktop/electron-bridge.ts` — Safe `contextBridge` exposing desktop capabilities to the renderer without `nodeIntegration`.
- `electron/ipc-handlers.cjs` — Modular IPC handlers (local `.data/store.json` persistence, external link opening, desktop dialogs).
- `electron/config.cjs` — Resolves local dev URL (`http://localhost:3000`) vs live production URL (`https://pa-hire-po.vercel.app`).
- `electron/open-desktop.cjs` & `open-desktop.bat` — 1-click launcher scripts (`npm run desktop:open` for local dev, `npm run desktop:live` for Vercel production).

## Windows Packaging (`electron-builder.json`)
- `appId: "com.pahirepo.desktop"`, `productName: "Pa-Hire Po"`, output directory `dist-desktop`.
- Builds **NSIS Installer** (`x64`, desktop & start menu shortcuts) + **Portable `.exe`** (`Pa-Hire-Po-${version}-${arch}.${ext}`) via `npm run desktop:package`.

## Progressive Web App (`src/app/manifest.ts`)
- Enables 1-click browser-to-desktop taskbar installation directly from Chrome/Edge for end users who prefer not to download an `.exe`, documented inside `SettingsSidepanel.tsx`.

## Related Notes
- [[Feature - Settings Sidepanel, ESCO Role Library & Notifications]]
- [[00 - Home MOC]]

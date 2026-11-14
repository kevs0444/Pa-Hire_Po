# PleaseHireMe

> *Because manually refreshing LinkedIn, JobStreet, and Indeed is a full-time job.*

**PleaseHireMe** is a dynamic, automated job discovery and resume-matching web app built with Next.js, TypeScript, and Tailwind CSS — designed to run locally and deploy directly to **Vercel**.

## Features

- **3-Board Multi-Scraper Engine**: Concurrently searches **LinkedIn**, **JobStreet** (v5 API across PH, MY, SG, ID), and **Indeed** (`ts-jobspy`), with honest live/fallback reporting per board.
- **Resume & Skills Brain**: Upload a `.txt`, `.md`, or `.pdf` resume (or paste resume text) to automatically extract skills and generate tailored match rationales + resume tailoring tips.
- **Dynamic Role Engine & Role Pivot Mode**: Starts with **Data Analyst** by default, adapts dynamically to **any** profession you type or infer from your resume, and optionally mixes in high-overlap adjacent roles (*Business Intelligence Analyst*, *Product Analyst*, etc.) during automated scans.
- **Auto-Pilot Timer & Tracker**: Background interval scanner + Inbox / Saved / Applied / Hidden job tracking, synced locally to `.data/store.json` and browser `localStorage`.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

Push this repository to GitHub and import it into Vercel (or run `vercel` via CLI). No extra environment variables are required; client state persists automatically in browser storage when running in serverless mode.

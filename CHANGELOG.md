# Pa-Hire Po Updates

See what is new in your job search and resume workspace, from initial launch (`v1.0.0`) to today (`v1.0.3`).

## v1.0.3 — November 17, 2026

### Direct In-Sheet Resume Editor, Formatting Toolbar & Versions Drawer
- **In-Sheet Editing:** Edit contact details, headlines, tailored summaries, experience bullets, projects, skills, certifications, and education directly on the Resume Studio sheet.
- **Formatting Toolbar:** Apply Bold (`**`), Italic (`*`), Tool Tags (`` ` ``), and switch between Justified and Left-Aligned text with responsive mobile zoom scaling.
- **Resume Versions Drawer:** Save tailored snapshots, rename versions inline, and restore or safely delete past resumes anytime.

### 1-Minute Live Auto-Scan, Email OTP & Connected Logins
- **Automatic Job Discovery:** Scans automatically on page load and refreshes every 60 seconds when the tab is active.
- **Email OTP Signup & Connected Logins:** Verify new accounts with a 6-digit email code and link or unlink Google and GitHub sign-in methods inside Settings.
- **Soft Grayscale UI & Session Security:** Unified Soft Grayscale Dark Mode and Civic Career Utility contrast across Home, Job Explorer, Analytics, and Applications, backed by cryptographic sessions and tightened response security headers.

*(Admin Control Center Note: Refactored `/admin` into an accessible 3-tab console with live Vercel Hobby & Supabase Free-Tier status probes via `GET /api/admin/platform-status` and 13 Civic Auth/Security email templates.)*

---

## v1.0.2 — November 16, 2026

### Real-Time Activity Bell and Loading Feedback
- **Live Notification Bell:** A Bell icon in the top bar tracks saved jobs, applications, tailored resumes, and job scan results in real time across open tabs.
- **Database Loading Indicators:** Clear loading indicators and subtle confirmation animations show when your workspace loads or saves updates to your account.
- **What is New Changelog:** Open What is New anytime from the notification panel to catch up on feature updates.

### Applied Companies and Resume Pop-Out Preview
- **Applied and Resumes Tab:** Review every company you applied to in one organized workspace, update your stage (Applied, Interviewing, Offer, or Closed), and save personal notes.
- **Pop-Out Submitted Resume:** Click Show Resume on any application or resume version to open only the exact resume you sent, ready to print or edit again.
- **Saved and Hidden Job Lists:** Bookmark jobs to revisit later or hide roles you do not want to see; saved, applied, and hidden lists stay stored on your account.

### Global Job Role Library, Settings Sidepanel, and Desktop App
- **Right-Side Settings Panel:** Edit personal contact details, target salary range, work setup, and preferred job roles from one slide-over panel.
- **Searchable Job Role Library:** Search beyond data and tech roles to pick and prioritize your top 5 to 10 target roles across any career field.
- **Desktop App Setup Guide:** Install Pa-Hire Po on your desktop directly from the Settings panel.

---

## v1.0.1 — November 15, 2026

### Pa-Hire Po Rebrand & Civic Career Utility
- **Workspace Home, Explorer & Analytics:** Launched Workspace Home (`/`), the 2-column Job Explorer (`/jobs`), Job Market & Board Analytics (`/analytics`), and Light Civic / Soft Grayscale Dark themes.
- **Date Recency Filters & Sorting:** Filter postings by Past 24 Hours, Past Week, or Past Month and sort by Best Match, Newest First, or Oldest First.

### Resume Studio AI, Top 5 ATS Fonts & Profile Media
- **Resume Studio AI & Side-by-Side Diff:** Tailor resumes against job descriptions with anti-hallucination grounding, change highlighting, A4 / US Letter / US Legal / Auto sizing, and Top 5 ATS-safe fonts (`Calibri`, `Helvetica`, `Garamond`, `Arial`, `Georgia`).
- **Cloud Accounts & LinkedIn-Style Profile Media:** Sign in to sync profiles and job pipelines across devices, upload cropped profile photos and cover banners, parse uploaded CVs (`.pdf`, `.txt`, `.md`, `.json`), and view `/privacy` and `/terms`.

---

## v1.0.0 — November 14, 2026

### Initial Launch — Multi-Board Job Finder & Match Scoring
- **Concurrent 3-Board Job Search:** Search live listings across LinkedIn, JobStreet, and Indeed with country (`PH`, `MY`, `SG`, `ID`, `US`, Remote) and work-setup targeting.
- **Weighted Match Scoring & Experience Fit:** Automatic 28–98% match scoring with matched vs. missing skill chips and entry-level vs. senior experience analysis.
- **Assisted Apply Flow & Print-Ready Resume Preview:** Step-by-step application workflow and clean PDF export.

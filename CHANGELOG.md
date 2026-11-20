# Pa-Hire Po Updates

See what is new in your job search and resume workspace, from initial launch (`v1.0.0`) to today (`v1.0.6`).

## v1.0.6 — November 21, 2026

### Dynamic Editable, Validated, Reorderable & Deletable Resume URLs
- **Editable Display Text & Target URLs Across Header, Projects & Certifications:** Edit both link labels and target URLs (`https://...`) for **LinkedIn**, **GitHub**, **Portfolio**, custom links (`+ Add Link`), **Project** titles, and **Certifications** directly inside **Resume Studio**, **My Profile**, and **Settings**, synced cleanly to clickable PDF/HTML links and AI tailoring preservation rules.
- **Blur-Deferred Validation & Safe Auto-Resolution:** Handles and bare domains (e.g., `github.com/kevs0444`, `linkedin.com/in/markevinalcantara`, `markevinalcantara.vercel.app`) resolve automatically to safe `https://` URLs with live `✓ Valid Link` / `✓ Auto-linked` status badges and a 1-click **Test** link button.
- **Reorderable & Deletable Links Section:** Reorder any header link (`↑` / `↓`), add preset or custom links (`+ LinkedIn`, `+ GitHub`, `+ Portfolio`, `+ Add Link`), delete individual links, or toggle **Remove Links Section** / **Restore Links Section** cleanly without data loss.
- **PDF & Word (`.docx`) Hyperlink Extraction on Import:** Importing a `.pdf` (extracting PDF `/URI` link annotations) or `.docx` (converting Word `<a href>` hyperlinks via `mammoth.convertToHtml`) automatically restores clickable LinkedIn, GitHub, Portfolio, project, and certification URLs.

### 7 Ranked ATS Fonts (`Calibri ★ Best for ATS`) & Borderless PDF Export
- **Expanded 7-Font Ranked ATS Selector:** Expanded the Resume Studio font selector to 7 ATS-safe fonts led by **`Calibri ★ Best for ATS (#1 Default)`** (highest OCR & token accuracy in Workday, Greenhouse, Lever & Taleo) alongside **`Helvetica (#2 Tech & Eng ATS)`**, **`Arial (#3 Universal Legacy ATS)`**, **`Garamond (#4 Researcher 1-Page)`**, **`Georgia (#5 Screen & ATS Serif)`**, **`Cambria (#6 Executive Word ATS)`**, and **`Times New Roman (#7 Classic Academic)`**.
- **Borderless PDF Print Export Fix:** Forced borderless pure white `@media print` backgrounds on `html, body` and `#a4-resume-sheet` so saving to PDF never prints a grayish `#f3f2ef` canvas border around the resume.

### Zero-Lag Editing (INP Optimization) & Always-on-Top OAuth Popout
- **Zero-Lag Resume & Profile Editing:** Eliminated typing lag with isolated local draft state (`0ms` typing response with `320ms` debounced parent sync and immediate flush on action), CSS layout/paint containment (`content-visibility: auto`), debounced local storage writes, and yielding background job rescoring (`50ms` time slicing).
- **Always-on-Top Centered OAuth Popout (`520×680`):** Google and GitHub sign-in on `/login` and **Settings → Connected Logins** now open in a centered `520×680` popout window above the dimmed backdrop (plus OS-level always-on-top modal child window in Electron and a **Bring Sign-In Window to Front** control) that auto-closes and signs you in seamlessly.

---

## v1.0.5 — November 20, 2026

### Multi-Platform Job Extraction, Title + Company Search & Internet Fallback
- **Specific Job Title & Company Name Search:** Search any Job Title alongside an optional Company Name (or type `"Role at Company"`) across **LinkedIn**, **JobStreet**, and **Indeed** without overwriting your saved Profile Primary Role unless you click **Save as Target Role**.
- **Site-Scoped Internet Web Search Fallback & Deeper Extraction:** Automatically triggers site-scoped web search (`web-fallback.ts` + `ts-jobspy` Google Jobs) and HTML/JSON-LD extraction whenever any board is blocked, rate-limited, or returns fewer than 3 correlated results.
- **Strict Search Correlation:** Replaces stale unsaved suggestions from older searches with tightly correlated results (preserving all **Saved**, **Applied**, **Hidden**, and **Queued** jobs) and boosts matching Company + Title listings.
- **1-Click `Copy URL` Everywhere:** Copy any job listing link directly from Job Cards, the Job Detail Pane, and Top 3 Recommended cards with instant confirmation.

### Job Tracking & Resume Applied Suite
- **Renamed to `Job Tracking` with `Resume Applied` Sub-Feature:** Manage **Applied Jobs**, **Resume Applied** (filterable by `All`, `✓ Applied`, and `Saved`), **Saved Jobs**, and **Hidden Jobs** from one unified workspace.
- **Rich `+ Add Job Application` Form & URL Auto-Detect:** Log external or board applications with Company/Job URL (plus **Paste URL** auto-detection of platform, company, and title), Company Name, Job Title, Platform, Location, Work Setup, Salary/Offer, Stage, Date Applied, Resume Version Applied, and Notes.
- **Inline Application Editing & `Copy URL`:** Edit URLs, Location, Work Setup, Salary, Stage, Linked Resume, and Notes directly inside **Job Tracking**, and copy any company or job link in one click.

---

## v1.0.4 — November 18, 2026

### PDF & Word (`.docx`) Resume Import + Smart Profile Sync
- **Resume Upload Panel (`Import PDF / Word`):** Upload an existing `.pdf`, `.docx` (Word), `.txt`, `.md`, or `.json` resume from either **Resume Studio** or **My Profile**.
- **Structured Extraction & Import Preview:** Extracts contact details, headline, summary, experience, projects, skill categories, certifications, and education into an editable CV, with a quick preview before saving.
- **2-Way Smart Profile Sync:** Automatically updates your **My Profile** headline, bio, skills, open-to-work roles, and Base CV, and archives an `"Imported: <filename>"` snapshot in your Versions Drawer.

### Resume Studio Justify Mode & Flexible Version Saving
- **Hyphen-Free Smart Justify Mode:** Justified text now wraps whole words cleanly without awkward mid-word hyphen splits (such as `im-` / `proving`), keeping every word intact for recruiters and ATS parsers.
- **Optional Company on Save Version:** Save general resume edits in **Save New Resume Version** without needing a company name, with a **Sync to My Profile & Base CV** option that updates your Supabase profile alongside your version history.

---

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

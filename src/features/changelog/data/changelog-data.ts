export type ChangelogTag = 'New' | 'Improved' | 'Fixed';

export interface ChangelogItem {
  tag: ChangelogTag;
  title: string;
  description: string;
}

export interface ChangelogRelease {
  version: string;
  date: string;
  isoDate: string;
  headline: string;
  items: ChangelogItem[];
}

export const CHANGELOG_SEEN_STORAGE_KEY = 'pahirepo_seen_changelog_version';

export const USER_CHANGELOG_RELEASES: ChangelogRelease[] = [
  {
    version: 'v1.0.7',
    date: 'November 22, 2026',
    isoDate: '2026-11-22T00:00:00.000Z',
    headline:
      '1:1 A4 preview-to-PDF export with Fit 1 Page auto-scaling, dynamic Certifications row/column controls, and organized Agent Rules',
    items: [
      {
        tag: 'Fixed',
        title: '1-Page A4 Preview Splitting Into 2-Page PDF Export',
        description:
          'Removed print font-size inflation so Compact, Standard, and Comfortable densities match 1:1 on PDF export, added Fit 1 Page (ON by default for A4, Letter, and Legal) with a live page status badge and Page 1 boundary line, and safeguarded printing from Edit Mode, Apply Flow, and Show Resume.',
      },
      {
        tag: 'New',
        title: 'Add Rows or Columns in Resume Studio Certifications',
        description:
          'Switch Certifications between 1, 2, or 3 ATS-safe columns (+ Add Column / - Col), append a full row (+ Add Row), or add single entries (+ Add Certification) with a live Cols x Rows readout that prints identically to PDF.',
      },
      {
        tag: 'Improved',
        title: 'Reorderable Certifications with synced credential URLs',
        description:
          'Move any certification earlier or later while keeping its optional credential URL intact, with responsive minmax(0, 1fr) track bounds that prevent horizontal overflow on A4 sheets.',
      },
    ],
  },
  {
    version: 'v1.0.6',
    date: 'November 21, 2026',
    isoDate: '2026-11-21T00:00:00.000Z',
    headline:
      'Dynamic editable, reorderable, and removable resume links, 7 ranked ATS fonts (Calibri ★ Best for ATS), borderless PDF export, zero-lag editing, and always-on-top OAuth popout',
    items: [
      {
        tag: 'New',
        title: 'Dynamic editable, validated, reorderable, and removable resume URLs',
        description:
          'Edit both Display Text and Target URL for LinkedIn, GitHub, Portfolio, custom header links (+ Add Link), Project titles, and Certifications across Resume Studio, My Profile, and Settings — with blur-deferred URL validation, up/down reordering, Remove/Restore Links Section toggle, and automatic PDF/Word link import.',
      },
      {
        tag: 'Improved',
        title: '7 ranked ATS fonts (Calibri ★ Best for ATS) & borderless PDF export',
        description:
          'Expanded the Resume Studio font selector to 7 ATS-safe fonts led by Calibri ★ Best for ATS (#1 Default) alongside Helvetica (#2), Arial (#3), Garamond (#4), Georgia (#5), Cambria (#6), and Times New Roman (#7), and removed the grayish outer frame around the A4 sheet when saving to PDF.',
      },
      {
        tag: 'Improved',
        title: 'Zero-lag resume editing (INP) & always-on-top OAuth popout window',
        description:
          'Eliminated typing lag in Resume Studio with local draft isolation, layout containment, and yielding job rescoring, and upgraded Google/GitHub sign-in to a centered 520x680 popout window that stays focused on top of /login.',
      },
    ],
  },
  {
    version: 'v1.0.5',
    date: 'November 20, 2026',
    isoDate: '2026-11-20T00:00:00.000Z',
    headline:
      'Specific Title & Company search with Internet fallback, 1-click Copy URL, and the new Job Tracking & Resume Applied suite',
    items: [
      {
        tag: 'New',
        title: 'Job Title + Company Name search with Internet Web Search fallback',
        description:
          'Search any Job Title and optional Company Name (or type "Role at Company") across LinkedIn, JobStreet, and Indeed with strict search correlation and automatic web search fallback when boards rate-limit.',
      },
      {
        tag: 'New',
        title: '1-click Copy URL across Find Jobs & Job Tracking',
        description:
          'Copy any job or company URL directly from Job Cards, the Job Detail Pane, Top 3 Recommended picks, and tracked applications.',
      },
      {
        tag: 'Improved',
        title: 'Renamed Applied & Resumes to Job Tracking with Resume Applied',
        description:
          'Track Applied Jobs, inspect Resume Applied snapshots, paste or copy company URLs, and log common application info (Location, Work Setup, Salary, Date Applied, Stage, and Resume Used) in one form.',
      },
    ],
  },
  {
    version: 'v1.0.4',
    date: 'November 18, 2026',
    isoDate: '2026-11-18T00:00:00.000Z',
    headline:
      'PDF & Word (.docx) resume import with Smart Profile sync, hyphen-free Justify mode, and optional Company on save',
    items: [
      {
        tag: 'New',
        title: 'Import PDF & Word (.docx) resumes into Resume Studio',
        description:
          'Upload an existing PDF or Word resume from Resume Studio or My Profile to extract structured sections, preview them, sync your Smart Profile, and edit immediately.',
      },
      {
        tag: 'Improved',
        title: 'Smarter, hyphen-free Justify mode',
        description:
          'Justified text in Resume Studio now wraps whole words cleanly without mid-word hyphen splits, keeping every word intact for recruiters and ATS parsers.',
      },
      {
        tag: 'Improved',
        title: 'Optional Company on Save Version & Profile Sync',
        description:
          'Save general resume edits without entering a company name, and sync saved edits directly to My Profile & Base CV in Supabase.',
      },
    ],
  },
  {
    version: 'v1.0.3',
    date: 'November 17, 2026',
    isoDate: '2026-11-17T00:00:00.000Z',
    headline:
      '1-minute live job scan, direct in-sheet Resume Studio editor, and account security upgrades',
    items: [
      {
        tag: 'New',
        title: 'Direct in-sheet resume editor and formatting toolbar',
        description:
          'Edit contact details, summaries, experience bullets, projects, skills, and education directly on the Resume Studio sheet with live Bold, Italic, Tool Tag, and Justified or Left-Aligned text.',
      },
      {
        tag: 'New',
        title: 'Resume versions drawer with custom naming',
        description:
          'Archive tailored resume snapshots, rename versions inline, and restore or safely delete past resumes anytime.',
      },
      {
        tag: 'New',
        title: 'Email OTP signup and connected Google or GitHub logins',
        description:
          'Verify new email registrations with a 6-digit code and link or unlink Google and GitHub sign-in methods inside Settings.',
      },
      {
        tag: 'Improved',
        title: '1-minute auto-refresh and calmer Soft Grayscale UI',
        description:
          'Job discovery now scans automatically on page load and every 60 seconds, paired with unified Soft Grayscale Dark Mode and cleaner contrast across Home, Explorer, Analytics, and Applications.',
      },
      {
        tag: 'Fixed',
        title: 'Stricter session and account security',
        description:
          'All sessions require verified account sign-in with tightened browser security headers and rate-limited endpoints.',
      },
    ],
  },
  {
    version: 'v1.0.2',
    date: 'November 16, 2026',
    isoDate: '2026-11-16T00:00:00.000Z',
    headline:
      'Live notification bell, Applied & Resumes tracker, global role library, and desktop setup',
    items: [
      {
        tag: 'New',
        title: 'Real-time notification bell and What is New changelog',
        description:
          'Check the Bell icon in the top bar for live updates when jobs are saved, applied to, tailored, or discovered in a scan.',
      },
      {
        tag: 'New',
        title: 'Applied and Resumes compilation with Show Resume pop-out',
        description:
          'Track every company you applied to, update your stage (Applied, Interviewing, Offer, or Closed), save notes, and click Show Resume to inspect or print only the exact resume you sent.',
      },
      {
        tag: 'New',
        title: 'Global job role library, Settings sidepanel, and Desktop app',
        description:
          'Search roles across any industry to pick your top 5 to 10 target roles, save salary preferences, and install the desktop app.',
      },
      {
        tag: 'Fixed',
        title: 'Saved and hidden job persistence',
        description:
          'Jobs you save, apply to, or hide stay stored on your account when you refresh or clear older search results.',
      },
    ],
  },
  {
    version: 'v1.0.1',
    date: 'November 15, 2026',
    isoDate: '2026-11-15T00:00:00.000Z',
    headline:
      'Pa-Hire Po Civic UI, Resume Studio AI with Top 5 ATS fonts, profile media, and cloud sync',
    items: [
      {
        tag: 'New',
        title: 'Pa-Hire Po rebrand and Civic Career Utility workspace',
        description:
          'Launched Workspace Home, the 2-column Job Explorer, Job Market & Board Analytics, and Light Civic / Soft Grayscale Dark themes.',
      },
      {
        tag: 'New',
        title: 'Resume Studio AI, side-by-side diff, and Top 5 ATS fonts',
        description:
          'Tailor resumes to job descriptions with change highlighting, A4/Letter/Legal/Auto paper sizing, and ATS-safe Calibri, Helvetica, Garamond, Arial, and Georgia typography.',
      },
      {
        tag: 'New',
        title: 'Cloud accounts, LinkedIn-style profile media, and legal pages',
        description:
          'Sign in to sync profiles and job pipelines across devices, upload cropped profile photos and cover banners, parse uploaded CVs, and view Privacy Policy and Terms of Service.',
      },
      {
        tag: 'Improved',
        title: 'Date recency filters and multi-strategy sorting',
        description:
          'Filter job postings by Past 24 Hours, Past Week, or Past Month and sort by Best Match, Newest First, or Oldest First.',
      },
    ],
  },
  {
    version: 'v1.0.0',
    date: 'November 14, 2026',
    isoDate: '2026-11-14T00:00:00.000Z',
    headline:
      'Initial launch — multi-board job finder, weighted match scoring, and print-ready resume preview',
    items: [
      {
        tag: 'New',
        title: 'Concurrent 3-board job discovery',
        description:
          'Search live job listings across LinkedIn, JobStreet, and Indeed with country and work-setup targeting (Remote, Hybrid, Onsite).',
      },
      {
        tag: 'New',
        title: 'Honest 28–98% match scoring and experience analyzer',
        description:
          'Evaluate each listing with matched vs. missing skill chips and automatic entry-level vs. senior experience checks.',
      },
      {
        tag: 'New',
        title: 'Step-by-step assisted apply flow and PDF print export',
        description:
          'Review match alignment, generate a tailored resume preview, and export clean PDFs for applications.',
      },
    ],
  },
];

export const LATEST_CHANGELOG_RELEASE = USER_CHANGELOG_RELEASES[0];

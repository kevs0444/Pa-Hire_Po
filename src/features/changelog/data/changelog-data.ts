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

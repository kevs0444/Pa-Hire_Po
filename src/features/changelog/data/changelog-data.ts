export type ChangelogTag = 'New' | 'Improved' | 'Fixed';

export interface ChangelogItem {
  tag: ChangelogTag;
  title: string;
  description: string;
}

export interface ChangelogRelease {
  version: string;
  date: string;
  headline: string;
  items: ChangelogItem[];
}

export const USER_CHANGELOG_RELEASES: ChangelogRelease[] = [
  {
    version: 'v1.4',
    date: 'November 16, 2026',
    headline: 'Live activity bell, loading feedback, and submitted resume pop-out',
    items: [
      {
        tag: 'New',
        title: 'Real-time notification bell',
        description:
          'Check the Bell icon in the top bar for live updates when jobs are saved, applied to, tailored, or discovered in a scan.',
      },
      {
        tag: 'New',
        title: 'Pop-out submitted resume viewer',
        description:
          'Open Applied and Resumes and click Show Resume on any company or version to inspect or print only the exact resume you sent.',
      },
      {
        tag: 'Improved',
        title: 'Loading indicators and tactile button feedback',
        description:
          'Subtle spinners and calm button confirmation animations show when your workspace is loading or saving your updates.',
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
    version: 'v1.3',
    date: 'November 15, 2026',
    headline: 'Applied companies tracker, global role search, and settings sidepanel',
    items: [
      {
        tag: 'New',
        title: 'Applied and Resumes compilation',
        description:
          'Track every company you applied to, update your interview stage, keep recruiter notes, and log external applications.',
      },
      {
        tag: 'New',
        title: 'Global job role library (top 5 to 10 roles)',
        description:
          'Search roles across any industry in Settings and save your top 5 to 10 target job titles for better job matching.',
      },
      {
        tag: 'New',
        title: 'Settings sidepanel and desktop app setup',
        description:
          'Manage your contact info, target salary range, job roles, and desktop app installation from one sidepanel.',
      },
    ],
  },
];

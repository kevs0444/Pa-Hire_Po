export type JobSource = 'linkedin' | 'jobstreet' | 'indeed';

export type JobStatus = 'suggested' | 'saved' | 'applied' | 'hidden';

export type CountryCode = 'ph' | 'my' | 'sg' | 'id' | 'us' | 'remote';

export type WorkType = 'any' | 'remote' | 'hybrid' | 'onsite';

export type ExperienceLevel = 'any' | 'entry' | 'mid' | 'senior';

export interface UserProfile {
  name: string;
  title: string;
  summary: string;
  resumeText: string;
  resumeFileName: string | null;
  skills: string[];
  primaryRole: string;
  customRoles: string[];
  autoPivotRoles: boolean;
  pivotFrequency: number; // percentage of scan dedicated to adjacent/pivot roles (e.g. 25)
  experienceLevel: ExperienceLevel;
  country: CountryCode;
  location: string;
  workType: WorkType;
  autoScanIntervalMinutes: number;
}

export interface DynamicRoleSuggestion {
  role: string;
  overlapPercent: number;
  matchedSkills: string[];
  rationale: string;
  category: string;
}

export interface RawScrapedJob {
  externalId: string;
  title: string;
  company: string;
  location: string;
  source: JobSource;
  url: string;
  postedAt: string;
  salary: string | null;
  description: string;
  workType: string;
  searchedRole: string;
  isPivotSuggestion: boolean;
  isFallback?: boolean;
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  source: JobSource;
  url: string;
  postedAt: string;
  salary: string | null;
  description: string;
  workType: string;
  searchedRole: string;
  isPivotSuggestion: boolean;
  isFallback?: boolean;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchReason: string;
  tailoringTips: string[];
  status: JobStatus;
  discoveredAt: string;
}

export interface ScanSourceMeta {
  source: JobSource;
  status: 'live' | 'fallback' | 'error';
  count: number;
  message?: string;
  durationMs: number;
}

export interface ScanHistoryEntry {
  id: string;
  timestamp: string;
  searchedRoles: string[];
  totalFound: number;
  newAdded: number;
  meta: ScanSourceMeta[];
}

export interface AppStoreState {
  profile: UserProfile;
  jobs: JobListing[];
  scanHistory: ScanHistoryEntry[];
  lastScannedAt: string | null;
}

export interface CountryConfig {
  code: CountryCode;
  label: string;
  defaultLocation: string;
  linkedInLocation: string;
  indeedDomain: string;
  jobspyCountry: string;
  jobstreetDomain: string | null;
  jobstreetSiteKey: string | null;
}

export const COUNTRY_CONFIGS: Record<CountryCode, CountryConfig> = {
  ph: {
    code: 'ph',
    label: 'Philippines',
    defaultLocation: 'Manila, Philippines',
    linkedInLocation: 'Philippines',
    indeedDomain: 'https://ph.indeed.com',
    jobspyCountry: 'philippines',
    jobstreetDomain: 'https://ph.jobstreet.com',
    jobstreetSiteKey: 'PH-Main',
  },
  my: {
    code: 'my',
    label: 'Malaysia',
    defaultLocation: 'Kuala Lumpur, Malaysia',
    linkedInLocation: 'Malaysia',
    indeedDomain: 'https://malaysia.indeed.com',
    jobspyCountry: 'malaysia',
    jobstreetDomain: 'https://my.jobstreet.com',
    jobstreetSiteKey: 'MY-Main',
  },
  sg: {
    code: 'sg',
    label: 'Singapore',
    defaultLocation: 'Singapore',
    linkedInLocation: 'Singapore',
    indeedDomain: 'https://sg.indeed.com',
    jobspyCountry: 'singapore',
    jobstreetDomain: 'https://sg.jobstreet.com',
    jobstreetSiteKey: 'SG-Main',
  },
  id: {
    code: 'id',
    label: 'Indonesia',
    defaultLocation: 'Jakarta, Indonesia',
    linkedInLocation: 'Indonesia',
    indeedDomain: 'https://id.indeed.com',
    jobspyCountry: 'indonesia',
    jobstreetDomain: 'https://id.jobstreet.com',
    jobstreetSiteKey: 'ID-Main',
  },
  us: {
    code: 'us',
    label: 'United States',
    defaultLocation: 'United States',
    linkedInLocation: 'United States',
    indeedDomain: 'https://www.indeed.com',
    jobspyCountry: 'usa',
    jobstreetDomain: null,
    jobstreetSiteKey: null,
  },
  remote: {
    code: 'remote',
    label: 'Global Remote',
    defaultLocation: 'Remote',
    linkedInLocation: 'Worldwide',
    indeedDomain: 'https://www.indeed.com',
    jobspyCountry: 'usa',
    jobstreetDomain: 'https://ph.jobstreet.com',
    jobstreetSiteKey: 'PH-Main',
  },
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Alex Rivera',
  title: 'Data Analyst',
  summary:
    'Analytical problem-solver experienced in turning messy datasets into clear business dashboards, SQL pipelines, and executive insights. Open to Data Analyst roles and adjacent analytics/product opportunities.',
  resumeText: `ALEX RIVERA
Data Analyst | SQL • Python • Power BI • Tableau • Excel

SUMMARY
Data Analyst with 3+ years of experience cleaning datasets, building automated reporting pipelines, writing complex SQL queries, and designing KPI dashboards that drive revenue and operational decisions.

CORE SKILLS
- Languages & Querying: SQL (PostgreSQL, BigQuery, MySQL), Python (Pandas, NumPy, Matplotlib), R
- BI & Visualization: Power BI, Tableau, Looker Studio, Google Sheets, Advanced Excel (Pivot Tables, XLOOKUP, Power Query)
- Analytics & Methods: A/B Testing, Funnel Analysis, Cohort Analysis, Forecasting, Data Cleaning, ETL, Data Modeling
- Collaboration & Tools: Git, Jira, Notion, Stakeholder Presentation, KPI Reporting

EXPERIENCE
Data Analyst — Retail & E-Commerce Operations (2023–Present)
• Automated weekly executive KPI dashboards in Power BI & SQL, cutting manual reporting time by 65%.
• Analyzed customer retention cohorts and marketing attribution using Python (Pandas) and BigQuery.
• Partnered with Product & Operations teams to run A/B experiments and optimize checkout conversion by 11%.

Junior Business & Data Analyst (2021–2023)
• Built automated Excel & SQL reconciliation trackers across 120K+ monthly transactions.
• Standardized data dictionaries and ETL validation checks across CRM and finance tables.`,
  resumeFileName: 'sample-data-analyst-resume.txt',
  skills: [
    'SQL',
    'Python',
    'Power BI',
    'Tableau',
    'Excel',
    'Pandas',
    'BigQuery',
    'Data Cleaning',
    'A/B Testing',
    'ETL',
    'KPI Reporting',
    'Data Modeling',
  ],
  primaryRole: 'Data Analyst',
  customRoles: ['Business Intelligence Analyst', 'Product Analyst'],
  autoPivotRoles: true,
  pivotFrequency: 25,
  experienceLevel: 'mid',
  country: 'ph',
  location: 'Manila, Philippines',
  workType: 'any',
  autoScanIntervalMinutes: 30,
};

export type JobSource = 'linkedin' | 'jobstreet' | 'indeed';

export type JobStatus = 'suggested' | 'saved' | 'applied' | 'hidden';

export type CountryCode = 'ph' | 'my' | 'sg' | 'id' | 'us' | 'remote';

export type WorkType = 'any' | 'remote' | 'hybrid' | 'onsite';

export type ExperienceLevel = 'any' | 'entry' | 'mid' | 'senior';

export type MonochromeTheme = 'dark' | 'light' | 'orange';

export type ResumePageSize = 'a4' | 'letter' | 'legal' | 'auto';

export type ResumeDensity = 'compact' | 'standard' | 'comfortable';

export type ResumeFontFamily =
  | 'calibri'
  | 'helvetica'
  | 'garamond'
  | 'arial'
  | 'georgia';

export interface ResumeExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  period: string;
  bullets: string[];
}

export interface ResumeProjectItem {
  id: string;
  name: string;
  subtitle: string;
  period: string;
  bullets: string[];
}

export interface ResumeSkillCategory {
  category: string;
  items: string;
}

export interface ResumeEducationItem {
  degree: string;
  school: string;
  period: string;
  honors: string;
}

export interface StructuredResume {
  fullName: string;
  targetHeadline: string;
  tailoredSummary: string | null;
  email: string;
  phones: string[];
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  experience: ResumeExperienceItem[];
  projects: ResumeProjectItem[];
  skillCategories: ResumeSkillCategory[];
  certifications: string[];
  education: ResumeEducationItem[];
  tailoredForJobTitle?: string | null;
  tailoredForCompany?: string | null;
  tailorMethod?: 'base' | 'smart-engine' | 'gemini-ai';
  tailorNotes?: string[];
  pageSize?: ResumePageSize;
  density?: ResumeDensity;
  fontFamily?: ResumeFontFamily;
}

export interface UserProfile {
  id: string;
  name: string;
  title: string;
  summary: string;
  resumeText: string;
  resumeFileName: string | null;
  skills: string[];
  primaryRole: string;
  preferredRoles: string[];
  customRoles: string[];
  autoPivotRoles: boolean;
  pivotFrequency: number;
  experienceLevel: ExperienceLevel;
  country: CountryCode;
  location: string;
  workType: WorkType;
  salaryExpectation: string;
  autoScanIntervalMinutes: number;
  careerJourneyMarkdown: string;
  structuredResume: StructuredResume;
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
  experienceRequired: string;
  experienceFit: 'fit' | 'stretch' | 'senior-warning';
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

export interface AutoApplyConfig {
  expectedSalary: string;
  noticePeriod: string;
  workAuthorization: string;
  willingToRelocate: string;
  autoTailorResume: boolean;
  humanReviewBeforeSubmit: boolean;
}

export interface AppStoreState {
  users: UserProfile[];
  activeUserId: string;
  theme: MonochromeTheme;
  geminiApiKey?: string;
  jobs: JobListing[];
  queuedJobIds?: string[];
  autoApplyConfig?: AutoApplyConfig;
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
    defaultLocation: 'Taguig City, Metro Manila',
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

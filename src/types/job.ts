export type JobSource = 'linkedin' | 'jobstreet' | 'indeed';

export type JobStatus = 'suggested' | 'saved' | 'applied' | 'hidden';

export type CountryCode = 'ph' | 'my' | 'sg' | 'id' | 'us' | 'remote';

export type WorkType = 'any' | 'remote' | 'hybrid' | 'onsite';

export type ExperienceLevel = 'any' | 'entry' | 'mid' | 'senior';

export type DateFilterOption = 'all' | '24h' | '7d' | '30d';

export type JobSortOption = 'match' | 'newest' | 'oldest';

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

export * from './auth';
export * from './admin';
export * from './resume';
export * from './profile';
export * from './store';

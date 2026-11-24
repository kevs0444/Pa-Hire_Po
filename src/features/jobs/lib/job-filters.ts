import type { CountryCode, JobListing, JobSource } from '@/types/job';
import {
  filterJobsByDate,
  type DateFilterOption,
} from '@/features/jobs/lib/job-date-utils';

export type PayPeriod = 'annual' | 'monthly' | 'hourly';

export interface PayFilterConfig {
  period: PayPeriod;
  min: number | null;
  max: number | null;
}

export const DEFAULT_PAY_FILTER: PayFilterConfig = {
  period: 'monthly',
  min: null,
  max: null,
};

export const JOB_TYPE_OPTIONS = [
  'Full time',
  'Part time',
  'Contract/Temp',
  'Casual/Internship',
] as const;

export type JobTypeOption = (typeof JOB_TYPE_OPTIONS)[number];

export const REMOTE_SETUP_OPTIONS = ['On-site', 'Hybrid', 'Remote'] as const;
export type RemoteSetupOption = (typeof REMOTE_SETUP_OPTIONS)[number];

export const JOB_CLASSIFICATION_OPTIONS = [
  'Accounting',
  'Administration & Office Support',
  'Advertising, Arts & Media',
  'Banking & Financial Services',
  'Call Centre & Customer Service',
  'CEO & General Management',
  'Community Services & Development',
  'Construction',
  'Consulting & Strategy',
  'Data & Analytics',
  'Design & Architecture',
  'Education & Training',
  'Engineering',
  'Healthcare & Medical',
  'Human Resources & Recruitment',
  'Information & Communication Technology',
  'Marketing & Communications',
] as const;

export type JobClassificationOption =
  (typeof JOB_CLASSIFICATION_OPTIONS)[number];

export const LISTING_TIME_OPTIONS: {
  value: DateFilterOption;
  label: string;
}[] = [
  { value: 'all', label: 'Any time' },
  { value: '24h', label: 'Today' },
  { value: '3d', label: 'Last 3 days' },
  { value: '7d', label: 'Last 7 days' },
  { value: '14d', label: 'Last 14 days' },
  { value: '30d', label: 'Last 30 days' },
];

const CLASSIFICATION_KEYWORDS: Record<JobClassificationOption, string[]> = {
  Accounting: ['accountant', 'accounting', 'bookkeeper', 'audit', 'tax', 'cpa', 'payroll'],
  'Administration & Office Support': ['admin', 'administrative', 'receptionist', 'clerk', 'executive assistant', 'office'],
  'Advertising, Arts & Media': ['media', 'video', 'content creator', 'journalist', 'editor', 'copywriter', 'creative'],
  'Banking & Financial Services': ['bank', 'finance', 'financial', 'investment', 'treasury', 'credit', 'fintech'],
  'Call Centre & Customer Service': ['customer service', 'call center', 'call centre', 'support specialist', 'csr', 'bpo', 'helpdesk'],
  'CEO & General Management': ['ceo', 'director', 'general manager', 'vp ', 'vice president', 'chief', 'operations manager'],
  'Community Services & Development': ['community', 'ngo', 'non-profit', 'social worker', 'civic', 'program coordinator'],
  Construction: ['construction', 'site engineer', 'civil', 'quantity surveyor', 'foreman', 'autocad'],
  'Consulting & Strategy': ['consultant', 'consulting', 'strategy', 'business analyst', 'management analyst'],
  'Data & Analytics': ['data analyst', 'analytics', 'business intelligence', 'bi ', 'sql', 'power bi', 'tableau', 'data scientist', 'data engineer'],
  'Design & Architecture': ['ui', 'ux', 'product designer', 'graphic designer', 'architect', 'figma'],
  'Education & Training': ['teacher', 'trainer', 'instructor', 'professor', 'curriculum', 'learning'],
  Engineering: ['engineer', 'mechanical', 'electrical', 'industrial', 'manufacturing', 'technician', 'qa '],
  'Healthcare & Medical': ['nurse', 'medical', 'clinical', 'healthcare', 'pharmacist', 'doctor', 'hospital'],
  'Human Resources & Recruitment': ['hr ', 'human resources', 'recruiter', 'talent acquisition', 'people operations'],
  'Information & Communication Technology': ['software', 'developer', 'devops', 'cloud', 'it ', 'cybersecurity', 'network', 'full stack', 'frontend', 'backend', 'ai '],
  'Marketing & Communications': ['marketing', 'seo', 'sem', 'social media', 'brand', 'growth', 'public relations'],
};

export interface CurrencyPayConfig {
  code: string;
  symbol: string;
  steps: Record<PayPeriod, number[]>;
}

export function getCurrencyPayConfig(country: CountryCode): CurrencyPayConfig {
  switch (country) {
    case 'my':
      return {
        code: 'MYR',
        symbol: 'RM',
        steps: {
          monthly: [0, 2500, 4000, 6000, 8000, 12000, 18000],
          annual: [0, 30000, 48000, 72000, 96000, 144000, 216000],
          hourly: [0, 15, 25, 40, 60, 100, 150],
        },
      };
    case 'sg':
      return {
        code: 'SGD',
        symbol: 'S$',
        steps: {
          monthly: [0, 3000, 4500, 6500, 9000, 13000, 18000],
          annual: [0, 36000, 54000, 78000, 108000, 156000, 216000],
          hourly: [0, 18, 30, 45, 70, 100, 150],
        },
      };
    case 'id':
      return {
        code: 'IDR',
        symbol: 'Rp',
        steps: {
          monthly: [0, 5000000, 8000000, 12000000, 18000000, 28000000, 45000000],
          annual: [0, 60000000, 96000000, 144000000, 216000000, 336000000, 540000000],
          hourly: [0, 30000, 50000, 80000, 120000, 200000, 350000],
        },
      };
    case 'us':
    case 'remote':
      return {
        code: 'USD',
        symbol: '$',
        steps: {
          monthly: [0, 2500, 4000, 6000, 8500, 12000, 18000],
          annual: [0, 30000, 50000, 75000, 100000, 140000, 200000],
          hourly: [0, 15, 25, 40, 60, 85, 125],
        },
      };
    case 'ph':
    default:
      return {
        code: 'PHP',
        symbol: '₱',
        steps: {
          monthly: [0, 20000, 30000, 40000, 50000, 70000, 100000, 150000],
          annual: [0, 240000, 360000, 480000, 600000, 840000, 1200000, 1800000],
          hourly: [0, 150, 250, 400, 600, 900, 1500],
        },
      };
  }
}

export function formatCompactPay(
  amount: number,
  symbol: string,
  isMaxCap = false
): string {
  if (amount <= 0) return `${symbol}0`;
  const suffix = isMaxCap ? '+' : '';
  if (amount >= 1_000_000) {
    const val = (amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1);
    return `${symbol}${val}M${suffix}`;
  }
  if (amount >= 1_000) {
    const val = Math.round(amount / 1_000);
    return `${symbol}${val}K${suffix}`;
  }
  return `${symbol}${amount.toLocaleString()}${suffix}`;
}

export function isJobSaved(
  job: JobListing,
  unsavedAppliedIds?: string[] | Set<string>
): boolean {
  if (job.status === 'saved') return true;
  if (job.status !== 'applied') return false;
  if (!unsavedAppliedIds) return true;
  if (unsavedAppliedIds instanceof Set) {
    return !unsavedAppliedIds.has(job.id);
  }
  return !unsavedAppliedIds.includes(job.id);
}

function parseSalaryRangeNormalized(
  rawSalary: string | null,
  targetPeriod: PayPeriod
): { low: number; high: number } | null {
  if (!rawSalary) return null;
  const text = rawSalary.toLowerCase();
  const matches = Array.from(text.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(k|m)?/gi));
  if (matches.length === 0) return null;

  const numbers = matches
    .map((m) => {
      const base = Number(m[1].replace(/,/g, ''));
      if (Number.isNaN(base)) return NaN;
      const mult =
        m[2]?.toLowerCase() === 'm'
          ? 1_000_000
          : m[2]?.toLowerCase() === 'k'
            ? 1_000
            : 1;
      return base * mult;
    })
    .filter((n) => !Number.isNaN(n) && n > 0);

  if (numbers.length === 0) return null;

  let detectedPeriod: PayPeriod = 'monthly';
  if (/hour|\/hr|\bhr\b/.test(text)) {
    detectedPeriod = 'hourly';
  } else if (/year|annual|annum|\/yr|\byr\b|\bpa\b/.test(text)) {
    detectedPeriod = 'annual';
  }

  const convert = (val: number): number => {
    let monthly = val;
    if (detectedPeriod === 'annual') monthly = val / 12;
    else if (detectedPeriod === 'hourly') monthly = val * 160;

    if (targetPeriod === 'annual') return monthly * 12;
    if (targetPeriod === 'hourly') return monthly / 160;
    return monthly;
  };

  const low = convert(Math.min(...numbers));
  const high = convert(Math.max(...numbers));
  return { low, high };
}

export function matchesPayFilter(
  job: JobListing,
  payFilter: PayFilterConfig
): boolean {
  if (payFilter.min === null && payFilter.max === null) return true;
  const parsed = parseSalaryRangeNormalized(job.salary, payFilter.period);
  if (!parsed) return false;

  if (payFilter.min !== null && parsed.high < payFilter.min) {
    return false;
  }
  if (payFilter.max !== null && parsed.low > payFilter.max) {
    return false;
  }
  return true;
}

export function matchesJobTypeFilters(
  job: JobListing,
  selectedTypes: string[]
): boolean {
  if (selectedTypes.length === 0) return true;
  const hay = `${job.workType} ${job.title} ${job.description.slice(0, 400)}`.toLowerCase();

  return selectedTypes.some((type) => {
    if (type === 'Full time') {
      return (
        hay.includes('full time') ||
        hay.includes('full-time') ||
        hay.includes('permanent') ||
        (!hay.includes('part time') &&
          !hay.includes('part-time') &&
          !hay.includes('contract') &&
          !hay.includes('intern') &&
          !hay.includes('casual'))
      );
    }
    if (type === 'Part time') {
      return hay.includes('part time') || hay.includes('part-time');
    }
    if (type === 'Contract/Temp') {
      return (
        hay.includes('contract') ||
        hay.includes('temp') ||
        hay.includes('project-based') ||
        hay.includes('freelance')
      );
    }
    if (type === 'Casual/Internship') {
      return (
        hay.includes('casual') ||
        hay.includes('intern') ||
        hay.includes('ojt') ||
        hay.includes('vacation')
      );
    }
    return false;
  });
}

export function matchesRemoteFilters(
  job: JobListing,
  selectedSetups: string[]
): boolean {
  if (selectedSetups.length === 0) return true;
  const hay = `${job.workType} ${job.location} ${job.title}`.toLowerCase();

  return selectedSetups.some((setup) => {
    if (setup === 'Remote') {
      return (
        hay.includes('remote') ||
        hay.includes('work from home') ||
        hay.includes('wfh')
      );
    }
    if (setup === 'Hybrid') {
      return hay.includes('hybrid');
    }
    if (setup === 'On-site') {
      return (
        hay.includes('onsite') ||
        hay.includes('on-site') ||
        (!hay.includes('remote') &&
          !hay.includes('hybrid') &&
          !hay.includes('wfh'))
      );
    }
    return false;
  });
}

export function matchesClassificationFilters(
  job: JobListing,
  selectedClassifications: string[]
): boolean {
  if (selectedClassifications.length === 0) return true;
  const hay = `${job.title} ${job.searchedRole} ${job.description.slice(0, 600)}`.toLowerCase();

  return selectedClassifications.some((cls) => {
    const keywords =
      CLASSIFICATION_KEYWORDS[cls as JobClassificationOption] || [
        cls.toLowerCase(),
      ];
    return keywords.some((kw) => hay.includes(kw));
  });
}

export interface BannerFilterState {
  sourceFilter: 'all' | JobSource;
  fitFilter: 'all' | 'applicable';
  dateFilter: DateFilterOption;
  minScore: number;
  searchQuery: string;
  payFilter: PayFilterConfig;
  jobTypeFilters: string[];
  remoteFilters: string[];
  classificationFilters: string[];
  referenceNow?: number;
}

export function applyBannerFilters(
  jobs: JobListing[],
  filters: BannerFilterState
): JobListing[] {
  const q = filters.searchQuery.trim().toLowerCase();
  const matched = jobs.filter((job) => {
    if (filters.sourceFilter !== 'all' && job.source !== filters.sourceFilter) {
      return false;
    }
    if (
      filters.fitFilter === 'applicable' &&
      job.experienceFit === 'senior-warning'
    ) {
      return false;
    }
    if (job.matchScore < filters.minScore) return false;
    if (!matchesPayFilter(job, filters.payFilter)) return false;
    if (!matchesJobTypeFilters(job, filters.jobTypeFilters)) return false;
    if (!matchesRemoteFilters(job, filters.remoteFilters)) return false;
    if (!matchesClassificationFilters(job, filters.classificationFilters)) {
      return false;
    }
    if (q) {
      const hay = `${job.title} ${job.company} ${job.location} ${job.searchedRole} ${job.experienceRequired} ${job.matchedSkills.join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return filterJobsByDate(matched, filters.dateFilter, filters.referenceNow);
}

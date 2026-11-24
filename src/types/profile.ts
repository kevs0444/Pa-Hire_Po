import type { CountryCode, ExperienceLevel, WorkType } from './job';
import type { StructuredResume } from './resume';

export interface TargetSalaryConfig {
  currency: string;
  min: string;
  max: string;
  period: 'monthly' | 'annual';
}

export interface RoleLibraryEntry {
  title: string;
  source: 'esco' | 'catalog' | 'custom';
  escoUri?: string;
  category?: string;
  skills?: string[];
}

export interface SavedJobSearch {
  id: string;
  label: string;
  query: string;
  company?: string;
  country: CountryCode;
  location: string;
  createdAt: string;
}

export interface RecentJobSearch {
  id: string;
  label: string;
  query: string;
  company?: string;
  country: CountryCode;
  location: string;
  newCount: number;
  totalCount: number;
  searchedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  title: string;
  summary: string;
  resumeText: string;
  resumeFileName: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  skills: string[];
  primaryRole: string;
  preferredRoles: string[];
  roleLibraryMeta?: RoleLibraryEntry[];
  customRoles: string[];
  autoPivotRoles: boolean;
  pivotFrequency: number;
  experienceLevel: ExperienceLevel;
  country: CountryCode;
  location: string;
  workType: WorkType;
  salaryExpectation: string;
  targetSalary?: TargetSalaryConfig;
  autoScanIntervalMinutes: number;
  careerJourneyMarkdown: string;
  structuredResume: StructuredResume;
  savedSearches?: SavedJobSearch[];
  recentSearches?: RecentJobSearch[];
  viewedJobIds?: string[];
  unsavedAppliedJobIds?: string[];
}

export interface DynamicRoleSuggestion {
  role: string;
  overlapPercent: number;
  matchedSkills: string[];
  rationale: string;
  category: string;
}

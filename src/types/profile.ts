import type { CountryCode, ExperienceLevel, WorkType } from './job';
import type { StructuredResume } from './resume';

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

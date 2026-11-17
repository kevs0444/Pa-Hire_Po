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
  versionName?: string;
  textAlign?: 'left' | 'justify';
  pageSize?: ResumePageSize;
  density?: ResumeDensity;
  fontFamily?: ResumeFontFamily;
}

export type TailoredResumeSourceType =
  | 'base'
  | 'ai-tailor'
  | 'smart-engine'
  | 'manual-edit';

export interface TailoredResumeRecord {
  id: string;
  userId: string;
  jobId: string | null;
  jobTitle: string | null;
  company: string | null;
  versionName?: string | null;
  tailorMethod: string | null;
  sourceType: TailoredResumeSourceType;
  isSent: boolean;
  sentAt: string | null;
  notes: string;
  resumeData: StructuredResume;
  createdAt: string;
  updatedAt: string;
}

import type {
  ExperienceLevel,
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeProjectItem,
  ResumeSkillCategory,
  StructuredResume,
  UserProfile,
} from '@/types/job';
import {
  extractSkillsFromResume,
  extractSummaryFromResume,
} from './resume-analyzer';

export interface ParsedResumePayload {
  fileName: string | null;
  resumeText: string;
  structuredResume: StructuredResume;
  skills: string[];
  summary: string;
  suggestedRoles: string[];
  inferredExperienceLevel: ExperienceLevel;
  inferredLocation: string | null;
  parseMethod: 'gemini-ai' | 'smart-parser';
  storagePath: string | null;
}

type SectionKey =
  | 'header'
  | 'summary'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'certifications'
  | 'education';

const SECTION_HEADING_PATTERNS: Array<{ key: SectionKey; pattern: RegExp }> = [
  {
    key: 'summary',
    pattern:
      /^(professional\s+summary|executive\s+summary|career\s+summary|summary|profile|about(\s+me)?|career\s+objective|objective)\s*:?$/i,
  },
  {
    key: 'experience',
    pattern:
      /^(professional\s+experience|work\s+experience|relevant\s+experience|employment(\s+history)?|work\s+history|experience|internships?)\s*:?$/i,
  },
  {
    key: 'projects',
    pattern:
      /^(key\s+projects|selected\s+projects|academic\s+projects|personal\s+projects|capstone(\s+project)?|projects?)\s*:?$/i,
  },
  {
    key: 'skills',
    pattern:
      /^(technical\s+skills|core\s+skills|core\s+competencies|skills(\s*&\s*tools)?|technologies|tech\s+stack|tools(\s*&\s*technologies)?)\s*:?$/i,
  },
  {
    key: 'certifications',
    pattern:
      /^(licenses?\s*(&|and)\s*certifications?|certifications?(\s*&\s*training)?|professional\s+certifications?|awards?\s*(&|and)\s*certifications?|honors?\s*(&|and)\s*awards?|training)\s*:?$/i,
  },
  {
    key: 'education',
    pattern:
      /^(education(al)?(\s+background|\s+attainment)?|academic\s+background)\s*:?$/i,
  },
];

const BULLET_PREFIX_RE = /^[\u2022\u25CF\u25AA\u25E6\u2023\-\*•▪◦‣–]\s+/;
const DATE_RANGE_RE =
  /((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}|\d{1,2}\/\d{4}|\b(?:19|20)\d{2}\b)\s*(?:-|–|—|to)\s*((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}|\d{1,2}\/\d{4}|\b(?:19|20)\d{2}\b|Present|Current|Now)/i;

function normalizeLines(rawText: string): string[] {
  return rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, '  ')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0);
}

function detectSectionHeading(line: string): SectionKey | null {
  const clean = line.replace(/^[#*_=\-\s]+|[#*_=\-\s]+$/g, '').trim();
  if (!clean || clean.length > 48) return null;
  for (const { key, pattern } of SECTION_HEADING_PATTERNS) {
    if (pattern.test(clean)) {
      return key;
    }
  }
  return null;
}

function extractContactInfo(lines: string[], fullText: string) {
  const emailMatch = fullText.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
  );
  const email = emailMatch ? emailMatch[0] : '';

  const phoneMatches =
    fullText.match(
      /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)\d{3,4}[\s.-]?\d{4}/g
    ) || [];
  const phones = Array.from(
    new Set(
      phoneMatches
        .map((p) => p.trim())
        .filter((p) => p.replace(/\D/g, '').length >= 7)
    )
  ).slice(0, 2);

  const linkedinMatch = fullText.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([A-Za-z0-9\-_%]+)/i
  );
  const linkedin = linkedinMatch
    ? `linkedin.com/in/${linkedinMatch[1]}`
    : '';

  const githubMatch = fullText.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9\-_]+)/i
  );
  const github = githubMatch ? githubMatch[1] : '';

  const urlMatches =
    fullText.match(/(?:https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s,|)]*)?/gi) ||
    [];
  const portfolio =
    urlMatches.find((u) => {
      const lower = u.toLowerCase();
      return (
        !lower.includes('@') &&
        !lower.includes('linkedin.com') &&
        !lower.includes('github.com') &&
        !lower.includes('gmail.com') &&
        !lower.includes('yahoo.com') &&
        !lower.endsWith('.pdf') &&
        !lower.endsWith('.docx')
      );
    }) || '';

  // Infer name & headline from top header lines
  let fullName = '';
  let targetHeadline = '';
  let location = '';

  const topLines = lines.slice(0, 8);
  for (const line of topLines) {
    if (detectSectionHeading(line)) break;
    const hasContactToken =
      /@|linkedin\.com|github\.com|http|\+?\d{3}[\s.-]?\d{3}/i.test(line);

    if (!fullName && !hasContactToken && line.length >= 3 && line.length <= 55) {
      // Likely the candidate's name
      fullName = line.replace(/[|•]/g, ' ').replace(/\s+/g, ' ').trim();
      continue;
    }

    if (
      fullName &&
      !targetHeadline &&
      !hasContactToken &&
      line.length >= 4 &&
      line.length <= 100 &&
      !/,\s*(city|metro|philippines|malaysia|singapore|indonesia|usa|uk)/i.test(
        line
      )
    ) {
      targetHeadline = line;
      continue;
    }

    if (!location) {
      const locMatch = line.match(
        /([A-Za-z .]+,\s*[A-Za-z .]+(?:,\s*\d{4,5})?)/
      );
      if (locMatch && !/@|http/i.test(locMatch[1])) {
        location = locMatch[1].trim();
      }
    }
  }

  return {
    fullName,
    targetHeadline,
    email,
    phones,
    location,
    linkedin,
    github,
    portfolio,
  };
}

function parseExperienceLines(lines: string[]): ResumeExperienceItem[] {
  const items: ResumeExperienceItem[] = [];
  let current: ResumeExperienceItem | null = null;

  const pushCurrent = () => {
    if (!current) return;
    if (current.role || current.company || current.bullets.length > 0) {
      items.push(current);
    }
    current = null;
  };

  for (const line of lines) {
    if (BULLET_PREFIX_RE.test(line)) {
      const bullet = line.replace(BULLET_PREFIX_RE, '').trim();
      if (!current) {
        current = {
          id: `exp-${items.length + 1}`,
          role: 'Role',
          company: 'Organization',
          location: '',
          period: '',
          bullets: [],
        };
      }
      if (bullet) current.bullets.push(bullet);
      continue;
    }

    const dateMatch = line.match(DATE_RANGE_RE);
    const hasSeparator = /\s[|—–-]\s|\s+at\s+/i.test(line);

    if (dateMatch || hasSeparator || !current) {
      if (
        current &&
        (current.bullets.length > 0 || dateMatch || current.period)
      ) {
        pushCurrent();
      }

      const period = dateMatch ? dateMatch[0].trim() : '';
      const withoutDate = period
        ? line.replace(period, '').replace(/[()|\-–—,\s]+$/, '').trim()
        : line;

      const parts = withoutDate
        .split(/\s*[|—–]\s*|\s+-\s+|\s+at\s+/i)
        .map((p) => p.trim())
        .filter(Boolean);

      if (!current) {
        current = {
          id: `exp-${items.length + 1}`,
          role: parts[0] || withoutDate || 'Role',
          company: parts[1] || '',
          location: parts[2] || '',
          period,
          bullets: [],
        };
      } else {
        if (!current.company && parts[0]) {
          current.company = parts[0];
        }
        if (!current.period && period) {
          current.period = period;
        }
        if (!current.location && parts[1]) {
          current.location = parts[1];
        }
      }
    } else if (current) {
      // Continuation line: if no bullets yet and short, treat as company/location; else bullet
      if (current.bullets.length === 0 && !current.company && line.length < 70) {
        current.company = line;
      } else {
        current.bullets.push(line);
      }
    }
  }

  pushCurrent();
  return items.slice(0, 8);
}

function parseProjectLines(lines: string[]): ResumeProjectItem[] {
  const items: ResumeProjectItem[] = [];
  let current: ResumeProjectItem | null = null;

  const pushCurrent = () => {
    if (!current) return;
    if (current.name || current.bullets.length > 0) {
      items.push(current);
    }
    current = null;
  };

  for (const line of lines) {
    if (BULLET_PREFIX_RE.test(line)) {
      const bullet = line.replace(BULLET_PREFIX_RE, '').trim();
      if (!current) {
        current = {
          id: `proj-${items.length + 1}`,
          name: 'Project',
          subtitle: '',
          period: '',
          bullets: [],
        };
      }
      if (bullet) current.bullets.push(bullet);
      continue;
    }

    const dateMatch = line.match(DATE_RANGE_RE);
    if (!current || current.bullets.length > 0 || dateMatch) {
      pushCurrent();
      const period = dateMatch ? dateMatch[0].trim() : '';
      const clean = period
        ? line.replace(period, '').replace(/[()|\-–—,\s]+$/, '').trim()
        : line;
      const parts = clean
        .split(/\s*[|—–:]\s*/)
        .map((p) => p.trim())
        .filter(Boolean);
      current = {
        id: `proj-${items.length + 1}`,
        name: parts[0] || clean || 'Project',
        subtitle: parts.slice(1).join(' | '),
        period,
        bullets: [],
      };
    } else {
      current.bullets.push(line);
    }
  }

  pushCurrent();
  return items.slice(0, 6);
}

function parseSkillLines(
  lines: string[],
  extractedSkills: string[]
): ResumeSkillCategory[] {
  const categories: ResumeSkillCategory[] = [];

  for (const line of lines) {
    const clean = line.replace(BULLET_PREFIX_RE, '').trim();
    const colonIdx = clean.indexOf(':');
    if (colonIdx > 1 && colonIdx < 38) {
      const category = clean.slice(0, colonIdx).trim();
      const items = clean.slice(colonIdx + 1).trim();
      if (category && items) {
        categories.push({ category, items });
      }
    }
  }

  if (categories.length > 0) {
    return categories.slice(0, 8);
  }

  if (lines.length > 0) {
    const joined = lines
      .map((l) => l.replace(BULLET_PREFIX_RE, '').trim())
      .join(', ');
    if (joined) {
      return [{ category: 'Technical & Core Skills', items: joined }];
    }
  }

  if (extractedSkills.length > 0) {
    return [
      { category: 'Extracted Skills', items: extractedSkills.join(', ') },
    ];
  }

  return [];
}

function parseEducationLines(lines: string[]): ResumeEducationItem[] {
  const items: ResumeEducationItem[] = [];
  let current: ResumeEducationItem | null = null;

  for (const line of lines) {
    const clean = line.replace(BULLET_PREFIX_RE, '').trim();
    const dateMatch = clean.match(DATE_RANGE_RE) || clean.match(/\b(?:19|20)\d{2}\b/);
    const looksLikeDegree =
      /(bachelor|master|b\.?s\.?|m\.?s\.?|b\.?a\.?|ph\.?d|associate|diploma|degree|computer|engineering|science|arts|business)/i.test(
        clean
      );
    const looksLikeHonors =
      /(gpa|gwa|cum laude|honors?|scholar|dean'?s list|award)/i.test(clean);

    if (!current || (looksLikeDegree && current.degree)) {
      if (current) items.push(current);
      const period = dateMatch ? dateMatch[0].trim() : '';
      const text = period
        ? clean.replace(period, '').replace(/[()|\-–—,\s]+$/, '').trim()
        : clean;
      const parts = text.split(/\s*[|—–]\s*/).map((p) => p.trim());
      current = {
        degree: parts[0] || text,
        school: parts[1] || '',
        period,
        honors: parts[2] || '',
      };
    } else if (looksLikeHonors) {
      current.honors = current.honors ? `${current.honors} • ${clean}` : clean;
    } else if (!current.school) {
      const period = dateMatch ? dateMatch[0].trim() : '';
      current.school = period
        ? clean.replace(period, '').replace(/[()|\-–—,\s]+$/, '').trim()
        : clean;
      if (!current.period && period) current.period = period;
    }
  }

  if (current) items.push(current);
  return items.slice(0, 4);
}

export function inferExperienceLevelFromText(text: string): ExperienceLevel {
  const lower = text.toLowerCase();
  const yearMatches = Array.from(
    lower.matchAll(/(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?experience/g)
  ).map((m) => Number(m[1]));
  const maxYears = yearMatches.length > 0 ? Math.max(...yearMatches) : 0;

  if (
    maxYears >= 5 ||
    /\b(senior|principal|staff|lead\s+engineer|head\s+of|director)\b/i.test(lower)
  ) {
    return 'senior';
  }
  if (maxYears >= 2 || /\bmid[- ]level\b/i.test(lower)) {
    return 'mid';
  }
  return 'entry';
}

export function parseResumeTextToStructured(
  rawText: string,
  fallback?: Partial<StructuredResume>
): StructuredResume {
  const lines = normalizeLines(rawText);
  const contact = extractContactInfo(lines, rawText);
  const extractedSkills = extractSkillsFromResume(rawText);

  const buckets: Record<SectionKey, string[]> = {
    header: [],
    summary: [],
    experience: [],
    projects: [],
    skills: [],
    certifications: [],
    education: [],
  };

  let activeSection: SectionKey = 'header';
  for (const line of lines) {
    const heading = detectSectionHeading(line);
    if (heading) {
      activeSection = heading;
      continue;
    }
    buckets[activeSection].push(line);
  }

  const summaryText =
    buckets.summary.join(' ').trim() || extractSummaryFromResume(rawText);
  const experience = parseExperienceLines(buckets.experience);
  const projects = parseProjectLines(buckets.projects);
  const skillCategories = parseSkillLines(buckets.skills, extractedSkills);
  const certifications = buckets.certifications
    .map((l) => l.replace(BULLET_PREFIX_RE, '').trim())
    .filter(Boolean)
    .slice(0, 12);
  const education = parseEducationLines(buckets.education);

  return {
    fullName: contact.fullName || fallback?.fullName || 'Candidate Resume',
    targetHeadline:
      contact.targetHeadline ||
      fallback?.targetHeadline ||
      'Professional Resume',
    tailoredSummary: summaryText || fallback?.tailoredSummary || null,
    email: contact.email || fallback?.email || '',
    phones: contact.phones.length > 0 ? contact.phones : fallback?.phones || [],
    location: contact.location || fallback?.location || '',
    linkedin: contact.linkedin || fallback?.linkedin || '',
    github: contact.github || fallback?.github || '',
    portfolio: contact.portfolio || fallback?.portfolio || '',
    experience:
      experience.length > 0 ? experience : fallback?.experience || [],
    projects: projects.length > 0 ? projects : fallback?.projects || [],
    skillCategories:
      skillCategories.length > 0
        ? skillCategories
        : fallback?.skillCategories || [],
    certifications:
      certifications.length > 0
        ? certifications
        : fallback?.certifications || [],
    education: education.length > 0 ? education : fallback?.education || [],
    tailorMethod: 'base',
    textAlign: fallback?.textAlign || 'justify',
    pageSize: fallback?.pageSize || 'a4',
    density: fallback?.density || 'standard',
    fontFamily: fallback?.fontFamily || 'calibri',
  };
}

export function buildCareerJourneyMarkdownFromResume(
  resume: StructuredResume,
  rawText: string
): string {
  const parts: string[] = [
    `# ${resume.fullName || 'Candidate'} — Imported Career Profile`,
  ];
  if (resume.targetHeadline) parts.push(`**Headline:** ${resume.targetHeadline}`);
  if (resume.tailoredSummary) parts.push(`\n## Summary\n${resume.tailoredSummary}`);

  if (resume.experience.length > 0) {
    parts.push('\n## Experience');
    for (const exp of resume.experience) {
      parts.push(
        `### ${exp.company || 'Company'} — ${exp.role} (${exp.period || 'Dates N/A'})`
      );
      for (const b of exp.bullets) {
        parts.push(`- ${b}`);
      }
    }
  }

  if (resume.projects.length > 0) {
    parts.push('\n## Projects');
    for (const proj of resume.projects) {
      parts.push(`- **${proj.name}** (${proj.period || 'Project'}): ${proj.bullets.join(' ')}`);
    }
  }

  if (resume.education.length > 0) {
    parts.push('\n## Education');
    for (const edu of resume.education) {
      parts.push(`- ${edu.degree} — ${edu.school} (${edu.period})`);
    }
  }

  const md = parts.join('\n').trim();
  return md.length >= 60 ? md.slice(0, 12000) : rawText.slice(0, 12000);
}

export function buildSmartProfilePatchFromResume(
  currentProfile: UserProfile,
  parsed: ParsedResumePayload,
  options: { syncSmartProfile: boolean }
): UserProfile {
  const skillMap = new Map<string, string>();
  for (const s of [...parsed.skills, ...currentProfile.skills]) {
    const clean = s.trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (!skillMap.has(key)) skillMap.set(key, clean);
  }
  const mergedSkills = Array.from(skillMap.values()).slice(0, 80);

  const importedResume: StructuredResume = {
    ...parsed.structuredResume,
    tailorMethod: 'base',
    pageSize: currentProfile.structuredResume?.pageSize || 'a4',
    density: currentProfile.structuredResume?.density || 'standard',
    fontFamily: currentProfile.structuredResume?.fontFamily || 'calibri',
    textAlign: currentProfile.structuredResume?.textAlign || 'justify',
  };

  const basePatch: UserProfile = {
    ...currentProfile,
    resumeFileName: parsed.fileName || currentProfile.resumeFileName,
    resumeText: parsed.resumeText || currentProfile.resumeText,
    skills: mergedSkills,
    structuredResume: importedResume,
  };

  if (!options.syncSmartProfile) {
    return basePatch;
  }

  const nextPrimaryRole =
    parsed.suggestedRoles[0] ||
    (importedResume.targetHeadline &&
    importedResume.targetHeadline.length <= 60 &&
    !importedResume.targetHeadline.includes('•')
      ? importedResume.targetHeadline
      : currentProfile.primaryRole);

  const nextPreferredRoles = Array.from(
    new Set([
      ...(nextPrimaryRole ? [nextPrimaryRole] : []),
      ...parsed.suggestedRoles,
      ...currentProfile.preferredRoles,
    ])
  ).slice(0, 8);

  return {
    ...basePatch,
    name:
      importedResume.fullName &&
      importedResume.fullName !== 'Candidate Resume'
        ? importedResume.fullName
        : currentProfile.name,
    title: importedResume.targetHeadline || currentProfile.title,
    summary:
      importedResume.tailoredSummary ||
      parsed.summary ||
      currentProfile.summary,
    location:
      parsed.inferredLocation ||
      importedResume.location ||
      currentProfile.location,
    primaryRole: nextPrimaryRole,
    preferredRoles: nextPreferredRoles,
    experienceLevel:
      parsed.inferredExperienceLevel || currentProfile.experienceLevel,
    careerJourneyMarkdown: buildCareerJourneyMarkdownFromResume(
      importedResume,
      parsed.resumeText
    ),
  };
}

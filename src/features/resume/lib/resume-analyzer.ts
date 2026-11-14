import {
  DynamicRoleSuggestion,
  ExperienceLevel,
  JobListing,
  RawScrapedJob,
  UserProfile,
} from '@/types/job';

interface RoleBlueprint {
  role: string;
  category: string;
  coreSkills: string[];
  bonusSkills: string[];
  aliases: string[];
}

/**
 * Broad cross-industry catalog so Pa-Hire Po adapts dynamically to any profession,
 * starting with Data Analyst by default while supporting tech, product, design, finance,
 * marketing, operations, and custom user-entered roles.
 */
export const ROLE_BLUEPRINTS: RoleBlueprint[] = [
  {
    role: 'Data Analyst',
    category: 'Data & Analytics',
    coreSkills: ['SQL', 'Excel', 'Python', 'Power BI', 'Tableau', 'Data Cleaning', 'KPI Reporting'],
    bonusSkills: ['BigQuery', 'Looker Studio', 'Pandas', 'A/B Testing', 'Statistics', 'ETL'],
    aliases: ['data analyst', 'junior data analyst', 'reporting analyst', 'insights analyst'],
  },
  {
    role: 'Business Intelligence Analyst',
    category: 'Data & Analytics',
    coreSkills: ['SQL', 'Power BI', 'Tableau', 'Data Modeling', 'KPI Reporting', 'ETL'],
    bonusSkills: ['Looker', 'BigQuery', 'Snowflake', 'DAX', 'Excel', 'Data Warehouse'],
    aliases: ['bi analyst', 'business intelligence', 'bi developer'],
  },
  {
    role: 'Product Analyst',
    category: 'Data & Product',
    coreSkills: ['SQL', 'A/B Testing', 'Cohort Analysis', 'Funnel Analysis', 'Python', 'KPI Reporting'],
    bonusSkills: ['Amplitude', 'Mixpanel', 'Google Analytics', 'Tableau', 'Experimentation'],
    aliases: ['product analyst', 'growth analyst', 'experimentation analyst'],
  },
  {
    role: 'Analytics Engineer',
    category: 'Data & Engineering',
    coreSkills: ['SQL', 'dbt', 'Data Modeling', 'ETL', 'BigQuery', 'Python', 'Git'],
    bonusSkills: ['Snowflake', 'Airflow', 'PostgreSQL', 'CI/CD', 'Data Warehouse'],
    aliases: ['analytics engineer', 'bi engineer', 'data modeling engineer'],
  },
  {
    role: 'Data Scientist',
    category: 'Data & AI',
    coreSkills: ['Python', 'SQL', 'Pandas', 'Machine Learning', 'Statistics', 'NumPy'],
    bonusSkills: ['Scikit-learn', 'TensorFlow', 'PyTorch', 'A/B Testing', 'Forecasting'],
    aliases: ['data scientist', 'applied scientist', 'ml analyst'],
  },
  {
    role: 'Junior Data Engineer',
    category: 'Data & Engineering',
    coreSkills: ['Python', 'SQL', 'ETL', 'MySQL', 'Data Integration', 'REST APIs'],
    bonusSkills: ['Docker', 'Git', 'Azure', 'Data Warehousing', 'SQLAlchemy'],
    aliases: ['junior data engineer', 'data engineer', 'etl developer', 'pipeline engineer'],
  },
  {
    role: 'AI Engineer',
    category: 'Data & AI',
    coreSkills: ['Python', 'TensorFlow', 'XGBoost', 'REST APIs', 'FastAPI', 'Git'],
    bonusSkills: ['YOLOv8', 'OpenCV', 'Docker', 'Next.js', 'SQL', 'Deep Learning'],
    aliases: ['ai engineer', 'ai developer', 'ml engineer', 'machine learning engineer'],
  },
  {
    role: 'Operations Analyst',
    category: 'Business & Operations',
    coreSkills: ['Excel', 'SQL', 'KPI Reporting', 'Process Improvement', 'Power BI', 'Forecasting'],
    bonusSkills: ['Supply Chain', 'Python', 'Tableau', 'ERP', 'Jira'],
    aliases: ['operations analyst', 'supply chain analyst', 'business operations analyst'],
  },
  {
    role: 'Financial Analyst',
    category: 'Finance',
    coreSkills: ['Excel', 'Financial Modeling', 'Forecasting', 'KPI Reporting', 'SQL'],
    bonusSkills: ['Power BI', 'Tableau', 'Accounting', 'Budgeting', 'Variance Analysis'],
    aliases: ['financial analyst', 'fp&a analyst', 'finance analyst'],
  },
  {
    role: 'Marketing Analyst',
    category: 'Marketing & Growth',
    coreSkills: ['Google Analytics', 'SQL', 'Excel', 'A/B Testing', 'Attribution', 'KPI Reporting'],
    bonusSkills: ['Looker Studio', 'Tableau', 'SEO', 'CRM', 'Meta Ads', 'Python'],
    aliases: ['marketing analyst', 'digital marketing analyst', 'campaign analyst'],
  },
  {
    role: 'Business Analyst',
    category: 'Business & Product',
    coreSkills: ['SQL', 'Excel', 'Requirements Gathering', 'Stakeholder Management', 'Jira', 'KPI Reporting'],
    bonusSkills: ['Power BI', 'Tableau', 'Agile', 'Process Mapping', 'UAT'],
    aliases: ['business analyst', 'it business analyst', 'systems analyst'],
  },
  {
    role: 'Software Engineer',
    category: 'Engineering',
    coreSkills: ['TypeScript', 'JavaScript', 'Python', 'Git', 'REST APIs', 'SQL'],
    bonusSkills: ['React', 'Node.js', 'Docker', 'AWS', 'Testing', 'CI/CD'],
    aliases: ['software engineer', 'software developer', 'full stack developer', 'backend developer'],
  },
  {
    role: 'Frontend Developer',
    category: 'Engineering',
    coreSkills: ['React', 'TypeScript', 'JavaScript', 'Next.js', 'Tailwind CSS', 'HTML', 'CSS'],
    bonusSkills: ['GraphQL', 'Accessibility', 'Figma', 'Testing', 'Git'],
    aliases: ['frontend developer', 'front-end engineer', 'ui developer', 'react developer'],
  },
  {
    role: 'Backend Developer',
    category: 'Engineering',
    coreSkills: ['Node.js', 'Python', 'SQL', 'PostgreSQL', 'REST APIs', 'Docker', 'Git'],
    bonusSkills: ['TypeScript', 'Go', 'Java', 'Redis', 'AWS', 'Microservices'],
    aliases: ['backend developer', 'backend engineer', 'api developer'],
  },
  {
    role: 'Full Stack Developer',
    category: 'Engineering',
    coreSkills: ['TypeScript', 'React', 'Next.js', 'Node.js', 'SQL', 'PostgreSQL', 'Git'],
    bonusSkills: ['Tailwind CSS', 'Docker', 'AWS', 'Python', 'REST APIs'],
    aliases: ['full stack developer', 'full-stack engineer', 'web developer'],
  },
  {
    role: 'QA Engineer',
    category: 'Engineering',
    coreSkills: ['Test Automation', 'Playwright', 'Cypress', 'Selenium', 'API Testing', 'Jira'],
    bonusSkills: ['JavaScript', 'TypeScript', 'Python', 'SQL', 'CI/CD'],
    aliases: ['qa engineer', 'quality assurance', 'sdet', 'test engineer'],
  },
  {
    role: 'DevOps Engineer',
    category: 'Cloud & Infrastructure',
    coreSkills: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'Linux', 'Git'],
    bonusSkills: ['GCP', 'Azure', 'Python', 'Monitoring', 'Bash'],
    aliases: ['devops engineer', 'site reliability engineer', 'cloud engineer'],
  },
  {
    role: 'Product Manager',
    category: 'Product',
    coreSkills: ['Product Strategy', 'Roadmapping', 'Stakeholder Management', 'Agile', 'Jira', 'A/B Testing'],
    bonusSkills: ['SQL', 'User Research', 'Figma', 'KPI Reporting', 'Analytics'],
    aliases: ['product manager', 'associate product manager', 'product owner'],
  },
  {
    role: 'UI/UX Designer',
    category: 'Design',
    coreSkills: ['Figma', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems'],
    bonusSkills: ['HTML', 'CSS', 'Accessibility', 'Usability Testing', 'Adobe XD'],
    aliases: ['ui/ux designer', 'product designer', 'ux designer', 'ui designer'],
  },
  {
    role: 'Digital Marketing Specialist',
    category: 'Marketing & Growth',
    coreSkills: ['SEO', 'Google Analytics', 'Content Marketing', 'Meta Ads', 'Google Ads', 'Copywriting'],
    bonusSkills: ['CRM', 'Email Marketing', 'Excel', 'HubSpot', 'Canva'],
    aliases: ['digital marketer', 'growth marketer', 'performance marketing'],
  },
  {
    role: 'Customer Success Manager',
    category: 'Customer & Revenue',
    coreSkills: ['CRM', 'Account Management', 'Onboarding', 'Stakeholder Management', 'Retention'],
    bonusSkills: ['Salesforce', 'HubSpot', 'Excel', 'SaaS', 'KPI Reporting'],
    aliases: ['customer success', 'account manager', 'client partner'],
  },
];

export const KNOWN_SKILLS: string[] = Array.from(
  new Set([
    ...ROLE_BLUEPRINTS.flatMap((r) => [...r.coreSkills, ...r.bonusSkills]),
    'R',
    'SAS',
    'SPSS',
    'Alteryx',
    'Airbyte',
    'Fivetran',
    'Metabase',
    'Superset',
    'Excel',
    'Google Sheets',
    'Power Query',
    'Pivot Tables',
    'XLOOKUP',
    'VBA',
    'Excel VBA',
    'Google Apps Script',
    'Power Apps',
    'MySQL',
    'MS SQL',
    'MariaDB',
    'SQLite',
    'DBeaver',
    'OpenVINO',
    'Deep Learning',
    'Computer Vision',
    'Jupyter',
    'SQL Server',
    'Oracle',
    'MongoDB',
    'GraphQL',
    'FastAPI',
    'Django',
    'Flask',
    'Express',
    'Vue',
    'Angular',
    'Java',
    'C#',
    '.NET',
    'PHP',
    'Laravel',
    'Ruby',
    'Rust',
    'Swift',
    'Kotlin',
    'Flutter',
    'React Native',
    'Prompt Engineering',
    'LLM',
    'OpenAI',
    'LangChain',
    'Notion',
    'Confluence',
    'Slack',
    'Scrum',
    'Kanban',
    'Project Management',
    'Communication',
    'Data Visualization',
    'Statistical Analysis',
    'Predictive Modeling',
    'Regression',
    'Time Series',
    'Cohort Analysis',
    'Funnel Analysis',
    'Data Governance',
    'Microsoft Office',
  ])
);

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'your', 'will', 'have', 'are',
  'our', 'you', 'who', 'can', 'able', 'work', 'working', 'team', 'years', 'year',
  'experience', 'role', 'job', 'company', 'looking', 'strong', 'skills', 'using',
  'build', 'building', 'support', 'across', 'including', 'must', 'preferred', 'plus',
  'based', 'remote', 'hybrid', 'onsite', 'full', 'time', 'apply', 'position',
  'responsibilities', 'requirements', 'qualifications', 'benefits', 'salary',
  'manila', 'philippines', 'singapore', 'malaysia', 'indonesia', 'makati', 'bgc',
]);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizeSkill(skill: string): string {
  return skill.trim().replace(/\s+/g, ' ');
}

export function textContainsSkill(text: string, skill: string): boolean {
  const lowerText = text.toLowerCase();
  const cleanSkill = skill.trim().toLowerCase();
  if (!cleanSkill) return false;

  // Short symbols like R or C# need careful boundaries
  if (cleanSkill === 'r') {
    return /(?:^|[\s,;/|(])r(?:$|[\s,;/|).])/i.test(text);
  }
  if (cleanSkill === 'c#') {
    return /(?:^|[\s,;/|(])c#(?:$|[\s,;/|).])/i.test(text);
  }
  if (cleanSkill === '.net') {
    return /\.net\b/i.test(text);
  }

  const pattern = new RegExp(`(^|[^a-z0-9+])${escapeRegex(cleanSkill)}($|[^a-z0-9+])`, 'i');
  return pattern.test(lowerText);
}

/**
 * Extracts skills from any resume text dynamically using both known cross-domain
 * skill matching and explicit "Skills:" / bullet parsing for niche tools.
 */
export function extractSkillsFromResume(resumeText: string): string[] {
  if (!resumeText?.trim()) return [];

  const found = new Map<string, string>();
  for (const skill of KNOWN_SKILLS) {
    if (textContainsSkill(resumeText, skill)) {
      found.set(skill.toLowerCase(), skill);
    }
  }

  // Also parse explicit Skills lines for tools/certifications not in KNOWN_SKILLS
  const lines = resumeText.split(/\r?\n/);
  for (const line of lines) {
    if (/(skills|tools|stack|technologies|tech|proficiencies|certifications)\s*[:|-]/i.test(line)) {
      const afterColon = line.split(/[:|-]/).slice(1).join(' ');
      const tokens = afterColon
        .split(/[,•|/;]+/)
        .map((t) => normalizeSkill(t.replace(/[()]/g, '')))
        .filter((t) => t.length >= 2 && t.length <= 32);
      for (const token of tokens) {
        if (!STOP_WORDS.has(token.toLowerCase()) && !found.has(token.toLowerCase())) {
          // Only keep concise skill phrases (1 to 3 words)
          if (token.split(' ').length <= 3) {
            found.set(token.toLowerCase(), token);
          }
        }
      }
    }
  }

  return Array.from(found.values()).slice(0, 24);
}

export function extractSummaryFromResume(resumeText: string): string {
  const lines = resumeText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return '';

  const summaryIdx = lines.findIndex((l) => /^(summary|profile|about|objective)\b/i.test(l));
  if (summaryIdx !== -1 && lines[summaryIdx + 1]) {
    return lines.slice(summaryIdx + 1, summaryIdx + 3).join(' ').slice(0, 280);
  }

  const substantive = lines.filter((l) => l.length > 40 && !l.includes('@'));
  return (substantive[0] || lines.slice(0, 3).join(' • ')).slice(0, 280);
}

/**
 * Recommends target & adjacent pivot roles dynamically based on the user's resume,
 * skills, and current primary role. Works for Data Analysts AND any other career.
 */
export function inferDynamicRoles(
  resumeText: string,
  skills: string[],
  currentPrimaryRole?: string
): DynamicRoleSuggestion[] {
  const combinedText = `${resumeText}\n${skills.join(', ')}\n${currentPrimaryRole ?? ''}`;
  const lowerSkills = new Set(skills.map((s) => s.toLowerCase()));
  const primaryLower = (currentPrimaryRole ?? '').trim().toLowerCase();

  const suggestions: DynamicRoleSuggestion[] = ROLE_BLUEPRINTS.map((bp) => {
    const matchedCore = bp.coreSkills.filter(
      (s) => lowerSkills.has(s.toLowerCase()) || textContainsSkill(combinedText, s)
    );
    const matchedBonus = bp.bonusSkills.filter(
      (s) => lowerSkills.has(s.toLowerCase()) || textContainsSkill(combinedText, s)
    );

    const matchedSkills = Array.from(new Set([...matchedCore, ...matchedBonus]));
    const coreRatio = matchedCore.length / Math.max(bp.coreSkills.length, 1);
    const bonusRatio = matchedBonus.length / Math.max(bp.bonusSkills.length, 1);

    // Slight boost if role shares tokens with current primaryRole (e.g. "Analyst", "Developer", "Manager")
    const primaryTokens = primaryLower.split(/\s+/).filter((t) => t.length > 3);
    const roleLower = bp.role.toLowerCase();
    const sharedTitleToken = primaryTokens.some((tok) => roleLower.includes(tok));
    const aliasBoost = bp.aliases.some((a) => combinedText.toLowerCase().includes(a)) ? 12 : 0;

    let overlapPercent = Math.round(coreRatio * 68 + bonusRatio * 20 + (sharedTitleToken ? 10 : 0) + aliasBoost);
    overlapPercent = Math.max(15, Math.min(98, overlapPercent));

    let rationale = '';
    if (matchedSkills.length > 0) {
      rationale = `Shares ${matchedSkills.slice(0, 4).join(', ')} with your profile`;
    } else if (sharedTitleToken) {
      rationale = `Adjacent career path to ${currentPrimaryRole}`;
    } else {
      rationale = `Cross-functional ${bp.category} track`;
    }

    return {
      role: bp.role,
      overlapPercent,
      matchedSkills,
      rationale,
      category: bp.category,
    };
  });

  return suggestions.sort((a, b) => b.overlapPercent - a.overlapPercent);
}

/**
 * Splits compound `/` roles (e.g. "Data Analyst / Junior Data Analyst") into clean search queries.
 */
function splitCompoundRoles(roleLabel: string): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const part of roleLabel.split('/')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      unique.push(trimmed);
    }
  }
  return unique;
}

/**
 * Picks which roles to include in a scan: always includes primaryRole, plus
 * 1-2 dynamic pivot roles when autoPivotRoles is enabled (rotating smoothly).
 */
export function selectRolesForScan(
  profile: UserProfile,
  explicitRoles?: string[]
): { role: string; isPivot: boolean }[] {
  const primary =
    profile.primaryRole.trim() || 'Data Analyst / Junior Data Analyst';
  const expandedPrimary = splitCompoundRoles(primary);
  const primaryQueries =
    expandedPrimary.length > 0
      ? expandedPrimary
      : ['Data Analyst', 'Junior Data Analyst'];
  const primaryVariants = new Set([
    primary.toLowerCase(),
    ...primaryQueries.map((r) => r.toLowerCase()),
  ]);

  if (explicitRoles && explicitRoles.length > 0) {
    const expanded: { role: string; isPivot: boolean }[] = [];
    const seen = new Set<string>();
    explicitRoles.forEach((rawRole, idx) => {
      for (const part of splitCompoundRoles(rawRole)) {
        const lower = part.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          expanded.push({
            role: part,
            isPivot: idx > 0 && !primaryVariants.has(lower),
          });
        }
      }
    });
    if (expanded.length > 0) return expanded;
  }

  const result: { role: string; isPivot: boolean }[] = primaryQueries.map(
    (role) => ({
      role,
      isPivot: false,
    })
  );

  if (!profile.autoPivotRoles) {
    return result;
  }

  const candidates = new Set<string>();
  for (const custom of profile.customRoles) {
    const trimmed = custom.trim();
    if (trimmed && !primaryVariants.has(trimmed.toLowerCase())) {
      candidates.add(trimmed);
    }
  }

  const inferred = inferDynamicRoles(profile.resumeText, profile.skills, primary);
  for (const item of inferred) {
    if (!primaryVariants.has(item.role.toLowerCase()) && item.overlapPercent >= 45) {
      candidates.add(item.role);
    }
    if (candidates.size >= 5) break;
  }

  const candidateList = Array.from(candidates);
  if (candidateList.length > 0) {
    // Rotate which pivot role is picked based on current hour/minute so suggestions evolve naturally
    const slot = Math.floor(Date.now() / (1000 * 60 * 15)) % candidateList.length;
    const pickedPivot = candidateList[slot];
    result.push({ role: pickedPivot, isPivot: true });

    // If user configured high pivot frequency (>= 35%), include a second pivot option
    if (profile.pivotFrequency >= 35 && candidateList.length > 1) {
      const second = candidateList[(slot + 1) % candidateList.length];
      result.push({ role: second, isPivot: true });
    }
  }

  return result;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
}

function inferRequirementsFromTitle(title: string): string[] {
  const lower = title.toLowerCase();
  for (const bp of ROLE_BLUEPRINTS) {
    if (
      lower.includes(bp.role.toLowerCase()) ||
      bp.aliases.some((a) => lower.includes(a))
    ) {
      return bp.coreSkills;
    }
  }
  return [];
}

export function extractExperienceRequirement(
  title: string,
  description: string,
  userLevel: ExperienceLevel
): {
  experienceRequired: string;
  experienceFit: 'fit' | 'stretch' | 'senior-warning';
} {
  const combined = `${title}\n${description}`;
  const lowerTitle = title.toLowerCase();

  // Check explicit year ranges e.g. "1-3 years", "2 to 4 yrs"
  const rangeMatch = combined.match(
    /\b(\d{1,2})\s*(?:-|to|–)\s*(\d{1,2})\s*\+?\s*(?:years?|yrs?)\b/i
  );
  if (rangeMatch) {
    const minYrs = Number(rangeMatch[1]);
    const maxYrs = Number(rangeMatch[2]);
    const label = `${minYrs}–${maxYrs} yrs experience`;
    if (userLevel === 'entry') {
      return {
        experienceRequired: label,
        experienceFit: minYrs <= 1 ? 'fit' : minYrs <= 2 ? 'stretch' : 'senior-warning',
      };
    }
    if (userLevel === 'mid') {
      return {
        experienceRequired: label,
        experienceFit: minYrs <= 4 ? 'fit' : 'stretch',
      };
    }
    return { experienceRequired: label, experienceFit: 'fit' };
  }

  // Check minimum years e.g. "3+ years", "at least 2 years"
  const minMatch = combined.match(
    /(?:at\s+least|minimum(?:\s+of)?|min\.?)?\s*(\d{1,2})\s*\+?\s*(?:years?|yrs?)(?:\s+of)?\s*(?:relevant|related|work|working|experience|exp)/i
  );
  if (minMatch) {
    const yrs = Number(minMatch[1]);
    const label = yrs === 0 ? 'Fresh Grad / 0 yrs' : `${yrs}+ yrs experience`;
    if (userLevel === 'entry') {
      return {
        experienceRequired: label,
        experienceFit: yrs <= 1 ? 'fit' : yrs <= 2 ? 'stretch' : 'senior-warning',
      };
    }
    if (userLevel === 'mid') {
      return {
        experienceRequired: label,
        experienceFit: yrs <= 4 ? 'fit' : 'stretch',
      };
    }
    return { experienceRequired: label, experienceFit: 'fit' };
  }

  // Check entry / fresh grad signals
  if (
    /\b(fresh\s*grad\w*|entry[\s-]level|junior|jr\.?|intern|internship|ojt|trainee|associate|no\s*experience)\b/i.test(
      combined
    )
  ) {
    const isIntern = /\b(intern|internship|ojt)\b/i.test(lowerTitle);
    const label = isIntern ? 'Internship / Student' : 'Fresh Grad / Entry Level';
    return {
      experienceRequired: label,
      experienceFit: userLevel === 'senior' ? 'stretch' : 'fit',
    };
  }

  // Check senior title signals
  if (
    /\b(senior|sr\.?|lead|principal|staff|director|vp|head\s+of|manager|architect)\b/i.test(
      lowerTitle
    )
  ) {
    return {
      experienceRequired: 'Senior / Lead (3–5+ yrs)',
      experienceFit: userLevel === 'entry' ? 'senior-warning' : 'fit',
    };
  }

  return {
    experienceRequired: 'Open / Not Specified',
    experienceFit: 'fit',
  };
}

/**
 * Scores a scraped job listing (0-100) against the user's resume, skills, and target role.
 */
export function scoreJobAgainstProfile(
  raw: RawScrapedJob,
  profile: UserProfile
): JobListing {
  const jobText = `${raw.title}\n${raw.company}\n${raw.location}\n${raw.description}`;
  const userSkills = profile.skills.length > 0
    ? profile.skills
    : extractSkillsFromResume(profile.resumeText);

  const matchedSkills: string[] = [];
  for (const skill of userSkills) {
    if (textContainsSkill(jobText, skill)) {
      matchedSkills.push(skill);
    }
  }

  // Detect skills asked for in the job posting (or implied by the role) that the user didn't list
  const jobDetectedSkills = extractSkillsFromResume(jobText);
  const roleImpliedSkills = inferRequirementsFromTitle(raw.title);
  const jobRequiredSkills = Array.from(new Set([...jobDetectedSkills, ...roleImpliedSkills]));
  const userSkillSet = new Set(userSkills.map((s) => s.toLowerCase()));

  const missingSkills = jobRequiredSkills
    .filter((s) => !userSkillSet.has(s.toLowerCase()) && !textContainsSkill(profile.resumeText, s))
    .slice(0, 6);

  // 1. Title alignment (up to 38 pts)
  const titleLower = raw.title.toLowerCase();
  const primaryLower = profile.primaryRole.toLowerCase();
  const primaryVariants = splitCompoundRoles(primaryLower);
  const searchedLower = raw.searchedRole.toLowerCase();
  const primaryWords = tokenize(primaryLower);
  const searchedWords = tokenize(searchedLower);

  let titleScore = 10;
  if (
    titleLower.includes(primaryLower) ||
    primaryVariants.some((variant) => titleLower.includes(variant))
  ) {
    titleScore = 38;
  } else if (titleLower.includes(searchedLower)) {
    titleScore = 32;
  } else {
    const primaryHits = primaryWords.filter((w) => titleLower.includes(w)).length;
    const searchedHits = searchedWords.filter((w) => titleLower.includes(w)).length;
    const hitRatio = Math.max(
      primaryHits / Math.max(primaryWords.length, 1),
      searchedHits / Math.max(searchedWords.length, 1)
    );
    titleScore = Math.round(10 + hitRatio * 24);
  }

  // 2. Skill match (up to 40 pts)
  let skillScore = 16;
  if (jobRequiredSkills.length > 0) {
    const coverage = matchedSkills.length / Math.max(Math.min(jobRequiredSkills.length, 7), 1);
    skillScore = Math.round(Math.min(1, coverage) * 40);
  } else if (matchedSkills.length > 0) {
    skillScore = Math.min(36, 14 + matchedSkills.length * 6);
  }

  // 3. Resume context / keyword overlap (up to 16 pts)
  const resumeTokens = new Set(tokenize(profile.resumeText));
  const jobTokens = Array.from(new Set(tokenize(jobText)));
  const contextOverlap = jobTokens.filter((t) => resumeTokens.has(t)).length;
  const contextScore = Math.min(16, Math.round((contextOverlap / Math.max(Math.min(jobTokens.length, 30), 1)) * 28));

  // 4. Work type & location alignment (up to 6 pts)
  let preferenceBonus = 2;
  const combinedLoc = `${raw.location} ${raw.workType} ${raw.description}`.toLowerCase();
  if (profile.workType === 'any' || combinedLoc.includes(profile.workType)) {
    preferenceBonus += 4;
  }

  // Experience extraction & alignment
  const { experienceRequired, experienceFit } = extractExperienceRequirement(
    raw.title,
    raw.description,
    profile.experienceLevel
  );

  let experienceAdjustment = 0;
  if (experienceFit === 'fit') {
    experienceAdjustment = 5;
  } else if (experienceFit === 'senior-warning') {
    experienceAdjustment = -15;
  } else if (experienceFit === 'stretch') {
    experienceAdjustment = -4;
  }

  let matchScore = titleScore + skillScore + contextScore + preferenceBonus + experienceAdjustment;
  if (raw.isFallback) {
    matchScore = Math.min(matchScore, 82);
  }
  matchScore = Math.max(28, Math.min(98, Math.round(matchScore)));

  // Build crisp explanation
  const reasons: string[] = [];
  if (raw.isPivotSuggestion) {
    reasons.push(`Dynamic Pivot (${raw.searchedRole}): expands your options beyond ${profile.primaryRole}`);
  } else if (titleScore >= 32) {
    reasons.push(`Direct title alignment with "${profile.primaryRole}"`);
  } else {
    reasons.push(`Relevant match for "${raw.searchedRole}"`);
  }

  if (matchedSkills.length > 0) {
    reasons.push(`matches ${matchedSkills.slice(0, 4).join(', ')}`);
  }

  if (profile.workType !== 'any' && combinedLoc.includes(profile.workType)) {
    reasons.push(`supports ${profile.workType} setup`);
  }

  const tailoringTips: string[] = [];
  if (matchedSkills.length > 0) {
    tailoringTips.push(
      `Lead your resume bullet points with ${matchedSkills.slice(0, 3).join(', ')} impact metrics.`
    );
  }
  if (missingSkills.length > 0) {
    tailoringTips.push(
      `The listing mentions ${missingSkills.slice(0, 3).join(', ')} — highlight any related coursework, dashboards, or projects if you have them.`
    );
  }
  if (raw.isPivotSuggestion) {
    tailoringTips.push(
      `Since this is a role pivot from ${profile.primaryRole} to ${raw.searchedRole}, tweak your top summary line to emphasize transferable outcomes.`
    );
  }
  if (tailoringTips.length === 0) {
    tailoringTips.push(`Customize your top summary to mirror keywords in ${raw.company}'s job title.`);
  }

  let hash = 2166136261;
  const rawKey = `${raw.externalId}-${raw.url}`;
  for (let i = 0; i < rawKey.length; i++) {
    hash ^= rawKey.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const stableId = `${raw.source}-${(hash >>> 0).toString(36)}`;

  return {
    id: stableId,
    title: raw.title,
    company: raw.company,
    location: raw.location,
    source: raw.source,
    url: raw.url,
    postedAt: raw.postedAt,
    salary: raw.salary,
    description: raw.description,
    workType: raw.workType,
    searchedRole: raw.searchedRole,
    isPivotSuggestion: raw.isPivotSuggestion,
    isFallback: raw.isFallback,
    experienceRequired,
    experienceFit,
    matchScore,
    matchedSkills,
    missingSkills,
    matchReason: reasons.join(' • '),
    tailoringTips,
    status: 'suggested',
    discoveredAt: new Date().toISOString(),
  };
}

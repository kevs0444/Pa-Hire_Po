import {
  JobListing,
  ResumeProjectItem,
  StructuredResume,
  UserProfile,
} from '@/types/job';

function boldMatchingKeywords(text: string, keywords: string[]): string {
  let result = text;
  const cleanKeywords = keywords
    .map((k) => k.trim())
    .filter((k) => k.length >= 2)
    .sort((a, b) => b.length - a.length)
    .slice(0, 8);

  for (const kw of cleanKeywords) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<!\\*\\*)\\b(${escaped})\\b(?!\\*\\*)`, 'gi');
    result = result.replace(regex, (match, group, offset, full) => {
      // Avoid breaking inside already-bolded **...** spans
      const before = full.slice(0, offset);
      const starsBefore = (before.match(/\*\*/g) || []).length;
      if (starsBefore % 2 === 1) return match;
      return `**${group}**`;
    });
  }
  return result;
}

type TrackKind = 'engineering' | 'ai-ds' | 'analytics' | 'general';

function detectTrack(text: string): TrackKind {
  const lower = text.toLowerCase();
  if (
    /\b(data engineer|etl|elt|pipeline|warehouse|airflow|dbt|azure|integration)\b/.test(
      lower
    )
  ) {
    return 'engineering';
  }
  if (
    /\b(data scientist|ai engineer|ml engineer|machine learning|deep learning|xgboost|tensorflow|yolo|forecasting|llm)\b/.test(
      lower
    )
  ) {
    return 'ai-ds';
  }
  if (
    /\b(data analyst|junior data analyst|business intelligence|bi analyst|power bi|tableau|excel|reporting|kpi)\b/.test(
      lower
    )
  ) {
    return 'analytics';
  }
  return 'general';
}

export function tailorResumeLocally(
  profile: UserProfile,
  targetJob?: JobListing | null,
  targetRoleOverride?: string
): StructuredResume {
  const base = profile.structuredResume;
  const targetRole = (
    targetJob?.title ||
    targetRoleOverride ||
    profile.primaryRole ||
    'Data Analyst / Junior Data Analyst'
  ).trim();
  const targetCompany = targetJob?.company || null;

  const contextText = [
    targetRole,
    targetJob?.searchedRole || '',
    targetJob?.description || '',
    ...(targetJob?.matchedSkills || []),
    ...(targetJob?.missingSkills || []),
  ].join('\n');

  const track = detectTrack(contextText);
  const tailorNotes: string[] = [];

  // 1. Reorder skill categories based on target track
  const skillPriorityMap: Record<TrackKind, string[]> = {
    engineering: [
      'Data Engineering',
      'Databases',
      'Data Automation',
      'Programming',
      'Data Analytics & Business Intelligence',
      'Tools & Technologies',
      'Machine Learning & AI',
    ],
    'ai-ds': [
      'Machine Learning & AI',
      'Programming',
      'Data Analytics & Business Intelligence',
      'Data Engineering',
      'Databases',
      'Data Automation',
      'Tools & Technologies',
    ],
    analytics: [
      'Data Analytics & Business Intelligence',
      'Databases',
      'Data Automation',
      'Data Engineering',
      'Programming',
      'Tools & Technologies',
      'Machine Learning & AI',
    ],
    general: [],
  };

  const priorityOrder = skillPriorityMap[track];
  const reorderedSkills = [...base.skillCategories].sort((a, b) => {
    const idxA = priorityOrder.indexOf(a.category);
    const idxB = priorityOrder.indexOf(b.category);
    const rankA = idxA === -1 ? 99 : idxA;
    const rankB = idxB === -1 ? 99 : idxB;
    return rankA - rankB;
  });

  if (priorityOrder.length > 0 && reorderedSkills.length > 1) {
    tailorNotes.push(
      `Prioritized "${reorderedSkills[0].category}" at the top of Technical Skills.`
    );
  }

  // 2. Highlight matched skills inside existing experience bullets and prioritize matching bullets
  const matchedKeywords = Array.from(
    new Set([
      ...(targetJob?.matchedSkills || []),
      ...(track === 'engineering'
        ? ['ETL', 'SQL', 'Python', 'MySQL', 'Azure', 'REST API']
        : track === 'ai-ds'
          ? ['XGBoost', 'TensorFlow', 'Python', 'forecasting', 'React.js']
          : ['Power BI', 'SQL', 'Python', 'Excel VBA', 'KPIs']),
    ])
  );

  const tailoredExperience = base.experience.map((exp) => {
    const scoredBullets = exp.bullets.map((bullet, idx) => {
      const lower = bullet.toLowerCase();
      let relevance = 0;
      for (const kw of matchedKeywords) {
        if (lower.includes(kw.toLowerCase())) relevance += 2;
      }
      if (track === 'engineering' && /\b(etl|mysql|database|azure|file|sql)\b/.test(lower)) {
        relevance += 3;
      }
      if (track === 'ai-ds' && /\b(xgboost|forecasting|predict|heatmap|machine learning)\b/.test(lower)) {
        relevance += 3;
      }
      if (track === 'analytics' && /\b(power bi|kpi|dashboard|excel|83%|75%-80%)\b/.test(lower)) {
        relevance += 3;
      }
      return {
        bullet: boldMatchingKeywords(bullet, matchedKeywords),
        relevance,
        idx,
      };
    });

    scoredBullets.sort((a, b) => b.relevance - a.relevance || a.idx - b.idx);
    return {
      ...exp,
      bullets: scoredBullets.map((item) => item.bullet),
    };
  });

  // 3. Dynamically surface LEAP AURA from Career Journey when relevant to ETL/Data Eng/Analytics
  const hasLeapAuraInJourney = /LEAP AURA/i.test(profile.careerJourneyMarkdown);
  let tailoredProjects: ResumeProjectItem[] = base.projects.map((p) => ({
    ...p,
    bullets: p.bullets.map((b) => boldMatchingKeywords(b, matchedKeywords)),
  }));

  if (
    hasLeapAuraInJourney &&
    (track === 'engineering' || track === 'analytics') &&
    !tailoredProjects.some((p) => /LEAP AURA/i.test(p.name))
  ) {
    const leapAuraProject: ResumeProjectItem = {
      id: 'proj-leap-aura',
      name: 'LEAP AURA: Automated Unified Reconciliation and Analytics',
      subtitle: 'Internship Improvement Concept | LUXASIA LEAP',
      period: 'October 2026',
      bullets: [
        'Architected a unified **ETL & reconciliation workflow** spanning **75 marketplace accounts and 460 ingestion files** (404 core files across Shopee & Lazada PH/VN) to eliminate fragmented manual data checks.',
      ],
    };

    if (track === 'engineering') {
      tailoredProjects = [leapAuraProject, ...tailoredProjects.slice(0, 1)];
      tailorNotes.push(
        'Promoted LEAP AURA (75 accounts / 460 files ETL architecture) from your Career Journey to Projects.'
      );
    } else {
      tailoredProjects = [...tailoredProjects.slice(0, 1), leapAuraProject];
      tailorNotes.push(
        'Added LEAP AURA unified reconciliation project from your Career Journey.'
      );
    }
  }

  // 4. Build dynamic headline & concise summary
  let targetHeadline = `${targetRole} • Python • SQL • Power BI • Automation`;
  if (track === 'engineering') {
    targetHeadline = `${targetRole} • Python • SQL • ETL Pipelines • MySQL & Azure`;
  } else if (track === 'ai-ds') {
    targetHeadline = `${targetRole} • Python • XGBoost • TensorFlow • Forecasting & AI`;
  } else if (track === 'analytics') {
    targetHeadline = `${targetRole} • SQL • Python • Power BI • Excel VBA & ETL`;
  }

  const companyClause = targetCompany ? ` at ${targetCompany}` : '';
  const highlightedMatch =
    targetJob && targetJob.matchedSkills.length > 0
      ? `Proven hands-on impact with ${targetJob.matchedSkills.slice(0, 5).join(', ')}`
      : 'Proven impact delivering Python/SQL automation (75%–83% effort reduction), Power BI KPIs, and XGBoost forecasting';

  const tailoredSummary = `Computer Engineering graduate (GWA 1.71, Taguig Scholar Award) targeting the ${targetRole} opportunity${companyClause}. ${highlightedMatch} across LUXASIA, Phoenix Petroleum, and Denso Ten Solutions.`;

  tailorNotes.push(
    `Updated headline & bold keyword emphasis for "${targetRole}"${companyClause}.`
  );

  return {
    ...base,
    targetHeadline,
    tailoredSummary,
    experience: tailoredExperience,
    projects: tailoredProjects,
    skillCategories: reorderedSkills,
    tailoredForJobTitle: targetRole,
    tailoredForCompany: targetCompany,
    tailorMethod: 'smart-engine',
    tailorNotes,
  };
}

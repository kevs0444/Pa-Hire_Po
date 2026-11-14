import { StructuredResume, UserProfile } from '@/types/job';

export const MAR_KEVIN_CAREER_JOURNEY = `# My Journey: From Computer Engineering Graduate to Data Professional
As of November 14, 2026

## 1. Background & Education
- Name: Mar Kevin P. Alcantara
- Degree: Bachelor of Science in Computer Engineering (BSCpE), Rizal Technological University (RTU) – Pasig Campus
- Graduation: July 30 / August 2026 | GWA: 1.71 | Recipient: Taguig Scholar Award
- Focus: Transforming raw business data into actionable insights, automating ETL workflows, building BI dashboards, and engineering intelligent data/AI systems.

## 2. Professional Experience
### LUXASIA Pte. Ltd & Leap Commerce (LEAP) — Data Analyst Intern (July 6, 2026 – Dec 29, 2026)
- Markets: Shopee (PH, VN, SG, MY) & Lazada (PH, VN, TH).
- Built Python automation for file extraction, renaming, validation, and consolidation across regional brand accounts.
- Prepared raw data for Azure-related ETL upload workflows and validated marketplace datasets (e.g., Peter Thomas Roth Lazada PH 233-row troubleshooting, SK-II September uploads).
- Developed interactive Power BI dashboards tracking e-commerce KPIs, revenue trends, and data discrepancies.
- Proposed LEAP AURA (Automated Unified Reconciliation and Analytics) on Oct 2, 2026 covering 75 accounts and 460 ingestion files (404 core files) across Lazada PH/VN and Shopee PH/VN.

### Phoenix Petroleum Philippines, Inc. — Voluntary Data Science Intern (June 15, 2026 – Early July 2026)
- Extracted data from SQL data warehouses and transformed raw datasets in Python.
- Automated daily ad hoc reporting via Python, Google Apps Script, and Google Sheets, reducing preparation time by 83% (30 min to 5 min).
- Developed XGBoost forecasting models for 1-day, 2-day, and 3-day canister product demand; enhanced executive dashboards with heatmaps.

### Denso Ten Solutions Philippines Corporation — Academic Data Analyst / Software Developer Intern (Feb 2026 – Apr 2026)
- Built Python & Excel VBA automation reducing manual reporting effort by 75%–80% (10 min to 2–3 min).
- Engineered Internal Defects Gathering Tool and Stack Output Analysis System backed by MySQL Database for thousands of production issues.
- Built Power BI & Power Apps dashboards (10-person Embedded Skills Dashboard, Timekeeping & Product Progress dashboards) and presented solutions to Japanese counterparts.

## 3. Capstone & Projects
- FOVB-AIoT (Aug 2025 – Mar 2026): Lead AI & Software Developer — IoT health monitoring kiosk at RTU Pasig using Arduino sensors, Python, Flask/REST API, React.js, MySQL (vital_signs_db), YOLOv8 + OpenVINO, and XGBoost cross-validated with Gemini & Groq APIs (GitHub: kevs0444/4in4-vital-sign).
- Portfolio: https://mar-kevs.vercel.app | https://markevinalcantara.vercel.app

## 4. Upskilling & Career Direction
- Data Engineering Pilipinas x DataCamp Donates Scholarship (June 2026): Introduction to Excel (2,800 XP), Data Preparation in Excel (2,250 XP).
- Cisco Data Analytics Essentials, Cisco Python Essentials 1, FastAPI, SQLAlchemy, React, Next.js, Docker, Linux.
- Target Roles: Data Analyst / Junior Data Analyst, Business Intelligence Analyst, Junior Data Engineer, Data Scientist, AI Engineer.
- Long-term Trajectory: Data Analyst -> Data Engineer -> Data Scientist / AI Engineer.
- Work Preference: Remote or Hybrid (open to onsite); Target Compensation: PHP 25,000–30,000+.`;

export const MAR_KEVIN_BASE_RESUME: StructuredResume = {
  fullName: 'MAR KEVIN P. ALCANTARA',
  targetHeadline: 'Data Analyst / Junior Data Analyst • Business Intelligence • ETL Automation',
  tailoredSummary: null,
  email: 'markevinalcantara40@gmail.com',
  phones: ['+63 952 470 2284', '+63 992 003 0148'],
  location: 'Taguig City, Metro Manila, 1630',
  linkedin: 'Mar Kevin Alcantara',
  github: 'kevs0444',
  portfolio: 'mar-kevs.vercel.app',
  experience: [
    {
      id: 'exp-luxasia',
      role: 'Data Analyst Intern',
      company: 'Luxasia Pte. Ltd & Leap Commerce',
      location: 'BGC, Taguig City',
      period: 'July 2026 - Present',
      bullets: [
        'Retrieved, validated, and analyzed **Shopee and Lazada e-commerce data** for regional brands across the Philippines, Thailand, and Vietnam using **SQL** and **Python**, monitoring key e-commerce KPIs, performance trends, and **data accuracy** to support reliable business reporting and decision-making.',
        'Developed an all-in-one web application that automated **data extraction, file renaming, data consolidation, and data validation**, streamlining **ETL workflows**, improving data quality, and significantly reducing manual processing.',
        'Developed interactive **Power BI dashboards** and performance reports to track e-commerce KPIs, revenue trends, marketplace performance, and data discrepancies, translating complex datasets into actionable insights for stakeholders and supporting data-driven business decisions.',
      ],
    },
    {
      id: 'exp-phoenix',
      role: 'Data Science Intern',
      company: 'Phoenix Petroleum Philippines, Inc',
      location: 'BGC, Taguig City',
      period: 'June 2026 - July 2026',
      bullets: [
        'Developed **automated ETL workflows** by extracting data from SQL data warehouses and transforming raw datasets into analysis-ready data using Python.',
        'Automated daily ad hoc reporting using Python, Google Apps Script, and Google Sheets, **reducing report preparation time by 83% (from 30 min to 5 min)** while improving reporting efficiency.',
        'Developed **XGBoost forecasting models** to **predict 1-day, 2-day, and 3-day canister product demand**, supporting inventory planning and data-driven business decisions.',
        'Enhanced executive dashboards with **analytical heatmaps**, automated daily data refreshes, and web-based monitoring tools using Google Apps Script to improve product performance tracking.',
      ],
    },
    {
      id: 'exp-densoten',
      role: 'Data Analyst Intern',
      company: 'Denso Ten Solutions Philippines Corporation',
      location: 'Ortigas Center, Pasig City',
      period: 'February 2026 - April 2026',
      bullets: [
        'Developed automated data extraction and processing workflows using Python and Excel VBA, **reducing manual reporting effort by over 75%-80% (from 10 min to 2-3 min)** while improving reporting accuracy and operational efficiency.',
        'Engineered the **Internal Defects Gathering Tool and Stack Output Analysis System** using MySQL Database, automating the tracking and analysis of thousands of production issues to support operational monitoring and reporting.',
        'Designed interactive dashboards and business intelligence solutions using **Microsoft Power BI** and **Power Apps**, including a Skills Dashboard for a 10-member engineering team and product progress dashboards that **enabled real-time performance monitoring and data-driven decision-making**.',
      ],
    },
  ],
  projects: [
    {
      id: 'proj-fovb',
      name: 'FOVB-AIoT: Four-in-One Vital Sign Sensor with BMI Calculation',
      subtitle: 'Thesis Project | Lead AI and Software Developer',
      period: 'August 2025 - March 2026',
      bullets: [
        'Developed an **AI-powered health monitoring system** using **Python, XGBoost, TensorFlow, IoT sensors, and MySQL** to capture, process, and analyze real-time health data (`kevs0444/4in4-vital-sign`).',
        'Built a **React.js** and **Python REST API** dashboard for real-time monitoring, centralized data management, and AI-based health risk prediction.',
      ],
    },
  ],
  skillCategories: [
    {
      category: 'Data Analytics & Business Intelligence',
      items:
        'Data Analysis, Data Cleaning, Data Visualization, ETL & ELT Processes, Data Extraction, Data Transformation, Data Consolidation, Reporting Dashboards (Power BI, Tableau), Microsoft Excel (Advanced Formulas, PivotTables, VBA, Power Query), Google Sheets, Business Intelligence',
    },
    {
      category: 'Data Engineering',
      items:
        'SQL, Data Warehousing, Database Management, Data Integration, REST APIs, Azure Upload Workflows',
    },
    {
      category: 'Data Automation',
      items: 'Python Automation, Excel VBA, Google Apps Script',
    },
    {
      category: 'Databases',
      items: 'MySQL, MS SQL, MariaDB, SQLite, SQLAlchemy',
    },
    {
      category: 'Programming',
      items: 'Python, R, SQL, HTML, CSS, JavaScript, Java, C#, C++',
    },
    {
      category: 'Machine Learning & AI',
      items:
        'XGBoost, TensorFlow, Deep Learning, Predictive Analytics, YOLOv8, OpenCV, OpenVINO',
    },
    {
      category: 'Tools & Technologies',
      items:
        'Git, GitHub, Linux, Docker, DBeaver, Jupyter Notebook, Spyder IDE, FastAPI, Flask, Next.js',
    },
  ],
  certifications: [
    'Data Analytics Essentials - Cisco',
    'Python Essentials 1 - Cisco',
    'Introduction to Excel - DataCamp',
    'Data Preparation in Excel - DataCamp',
  ],
  education: [
    {
      degree: 'Bachelor of Science in Computer Engineering (BSCpE)',
      school: 'Rizal Technological University - Pasig City',
      period: 'August 2022 - July 2026',
      honors: 'GWA: 1.71 • Taguig Scholar Award',
    },
  ],
  tailoredForJobTitle: null,
  tailoredForCompany: null,
  tailorMethod: 'base',
  tailorNotes: [],
};

export function resumeToPlainText(resume: StructuredResume): string {
  const lines: string[] = [
    resume.fullName,
    resume.targetHeadline,
    `${resume.email} | ${resume.phones.join(' | ')} | ${resume.location}`,
    `LinkedIn: ${resume.linkedin} | GitHub: ${resume.github} | Portfolio: ${resume.portfolio}`,
    '',
    'EXPERIENCE',
    ...resume.experience.flatMap((exp) => [
      `${exp.role} | ${exp.company} | ${exp.location} (${exp.period})`,
      ...exp.bullets.map((b) => `- ${b.replace(/\*\*/g, '')}`),
    ]),
    '',
    'PROJECTS',
    ...resume.projects.flatMap((proj) => [
      `${proj.name} — ${proj.subtitle} (${proj.period})`,
      ...proj.bullets.map((b) => `- ${b.replace(/\*\*/g, '')}`),
    ]),
    '',
    'TECHNICAL SKILLS',
    ...resume.skillCategories.map((c) => `${c.category}: ${c.items}`),
    '',
    'CERTIFICATIONS',
    ...resume.certifications.map((c) => `- ${c}`),
    '',
    'EDUCATION',
    ...resume.education.map(
      (ed) => `${ed.degree} — ${ed.school} (${ed.period}) | ${ed.honors}`
    ),
  ];

  return lines.join('\n');
}

export const MAR_KEVIN_PROFILE: UserProfile = {
  id: 'mar-kevin-alcantara',
  name: 'Mar Kevin P. Alcantara',
  title: 'Data Analyst / Junior Data Analyst',
  summary:
    'Computer Engineering graduate (GWA 1.71, Taguig Scholar Award) with hands-on internships at LUXASIA (LEAP), Phoenix Petroleum, and Denso Ten Solutions. Experienced in Python, SQL, Power BI, ETL automation, and XGBoost forecasting.',
  resumeText: resumeToPlainText(MAR_KEVIN_BASE_RESUME),
  resumeFileName: 'Mar-Kevin-Alcantara-Resume.pdf',
  skills: [
    'Python',
    'SQL',
    'Power BI',
    'Tableau',
    'Excel',
    'Excel VBA',
    'Power Query',
    'Google Apps Script',
    'Google Sheets',
    'ETL',
    'MySQL',
    'MariaDB',
    'SQLite',
    'SQLAlchemy',
    'Data Cleaning',
    'Data Visualization',
    'XGBoost',
    'TensorFlow',
    'YOLOv8',
    'OpenCV',
    'FastAPI',
    'Flask',
    'React',
    'Next.js',
    'REST APIs',
    'Git',
    'Docker',
    'Linux',
  ],
  primaryRole: 'Data Analyst / Junior Data Analyst',
  preferredRoles: [
    'Data Analyst / Junior Data Analyst',
    'Data Analyst',
    'Junior Data Analyst',
    'Business Intelligence Analyst',
    'Junior Data Engineer',
    'Data Scientist',
    'AI Engineer',
  ],
  customRoles: [
    'Data Analyst',
    'Junior Data Analyst',
    'Business Intelligence Analyst',
    'Junior Data Engineer',
    'Data Scientist',
    'AI Engineer',
  ],
  autoPivotRoles: true,
  pivotFrequency: 25,
  experienceLevel: 'entry',
  country: 'ph',
  location: 'Taguig City, Metro Manila',
  workType: 'any',
  salaryExpectation: 'PHP 25,000 - 30,000',
  autoScanIntervalMinutes: 30,
  careerJourneyMarkdown: MAR_KEVIN_CAREER_JOURNEY,
  structuredResume: MAR_KEVIN_BASE_RESUME,
};

export function createBlankUserProfile(params: {
  name: string;
  email?: string;
  primaryRole: string;
  preferredRoles?: string[];
  location?: string;
  resumeText?: string;
  skills?: string[];
}): UserProfile {
  const id = `user-${Date.now().toString(36)}`;
  const role = params.primaryRole.trim() || 'Data Analyst / Junior Data Analyst';
  const preferred =
    params.preferredRoles && params.preferredRoles.length > 0
      ? params.preferredRoles
      : [role];
  const loc = params.location?.trim() || 'Metro Manila, Philippines';
  const resume: StructuredResume = {
    fullName: params.name.trim().toUpperCase() || 'NEW APPLICANT',
    targetHeadline: `${role} | ${(params.skills || []).slice(0, 4).join(' • ') || 'Resume Profile'}`,
    tailoredSummary: null,
    email: params.email?.trim() || 'hello@example.com',
    phones: ['+63 900 000 0000'],
    location: loc,
    linkedin: params.name.trim(),
    github: '',
    portfolio: '',
    experience: [
      {
        id: 'exp-1',
        role,
        company: 'Your Previous / Current Company',
        location: loc,
        period: '2025 - Present',
        bullets: [
          `Delivered measurable results in **${role}** workflows, automation, and stakeholder reporting.`,
        ],
      },
    ],
    projects: [],
    skillCategories: [
      {
        category: 'Core Skills',
        items: (params.skills && params.skills.length > 0
          ? params.skills
          : ['Communication', 'Problem Solving', 'Analytics']
        ).join(', '),
      },
    ],
    certifications: [],
    education: [
      {
        degree: 'Bachelor Degree / Relevant Program',
        school: 'University / College',
        period: 'Graduated',
        honors: '',
      },
    ],
    tailoredForJobTitle: null,
    tailoredForCompany: null,
    tailorMethod: 'base',
    tailorNotes: [],
  };

  return {
    id,
    name: params.name.trim() || 'New User',
    title: role,
    summary: `Seeking ${role} opportunities in ${loc}.`,
    resumeText: params.resumeText?.trim() || resumeToPlainText(resume),
    resumeFileName: null,
    skills: params.skills || [],
    primaryRole: role,
    preferredRoles: preferred,
    customRoles: preferred.filter((r) => r.toLowerCase() !== role.toLowerCase()),
    autoPivotRoles: true,
    pivotFrequency: 25,
    experienceLevel: 'any',
    country: 'ph',
    location: loc,
    workType: 'any',
    salaryExpectation: '',
    autoScanIntervalMinutes: 30,
    careerJourneyMarkdown: params.resumeText?.trim() || '',
    structuredResume: resume,
  };
}

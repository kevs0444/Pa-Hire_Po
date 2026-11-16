import type { RoleLibraryEntry, TargetSalaryConfig } from '@/types/profile';

export const MAX_SAVED_TARGET_ROLES = 10;
export const RECOMMENDED_TARGET_ROLES_MIN = 5;

export const CROSS_INDUSTRY_ROLE_CATALOG: RoleLibraryEntry[] = [
  // Data, Analytics & AI
  {
    title: 'Data Analyst',
    source: 'catalog',
    category: 'Data & Analytics',
    skills: ['SQL', 'Excel', 'Python', 'Power BI', 'Tableau', 'Data Cleaning'],
  },
  {
    title: 'Junior Data Analyst',
    source: 'catalog',
    category: 'Data & Analytics',
    skills: ['SQL', 'Excel', 'Power BI', 'Google Sheets', 'Data Visualization'],
  },
  {
    title: 'Business Intelligence Analyst',
    source: 'catalog',
    category: 'Data & Analytics',
    skills: ['SQL', 'Power BI', 'Tableau', 'Data Modeling', 'ETL', 'KPI Reporting'],
  },
  {
    title: 'Data Engineer',
    source: 'catalog',
    category: 'Data & Engineering',
    skills: ['Python', 'SQL', 'ETL', 'Data Warehousing', 'Docker', 'REST APIs'],
  },
  {
    title: 'Data Scientist',
    source: 'catalog',
    category: 'Data & AI',
    skills: ['Python', 'SQL', 'Machine Learning', 'Statistics', 'Pandas'],
  },
  {
    title: 'AI Engineer',
    source: 'catalog',
    category: 'Data & AI',
    skills: ['Python', 'TensorFlow', 'LLM', 'REST APIs', 'FastAPI', 'Docker'],
  },
  // Software & Engineering
  {
    title: 'Software Engineer',
    source: 'catalog',
    category: 'Software Engineering',
    skills: ['TypeScript', 'JavaScript', 'Python', 'Git', 'REST APIs', 'SQL'],
  },
  {
    title: 'Frontend Developer',
    source: 'catalog',
    category: 'Software Engineering',
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'HTML', 'CSS'],
  },
  {
    title: 'Backend Developer',
    source: 'catalog',
    category: 'Software Engineering',
    skills: ['Node.js', 'Python', 'PostgreSQL', 'REST APIs', 'Docker', 'Git'],
  },
  {
    title: 'Full Stack Developer',
    source: 'catalog',
    category: 'Software Engineering',
    skills: ['TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'Git'],
  },
  {
    title: 'Mobile App Developer',
    source: 'catalog',
    category: 'Software Engineering',
    skills: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'REST APIs', 'Git'],
  },
  {
    title: 'QA Engineer',
    source: 'catalog',
    category: 'Software Engineering',
    skills: ['Test Automation', 'Playwright', 'Cypress', 'API Testing', 'Jira'],
  },
  {
    title: 'DevOps Engineer',
    source: 'catalog',
    category: 'Cloud & Infrastructure',
    skills: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'Linux'],
  },
  {
    title: 'IT Support Specialist',
    source: 'catalog',
    category: 'IT & Systems',
    skills: ['Troubleshooting', 'Windows Server', 'Networking', 'Ticketing', 'Active Directory'],
  },
  {
    title: 'Cybersecurity Analyst',
    source: 'catalog',
    category: 'Security',
    skills: ['SIEM', 'Network Security', 'Incident Response', 'Vulnerability Assessment', 'Linux'],
  },
  // Product & Design
  {
    title: 'Product Manager',
    source: 'catalog',
    category: 'Product',
    skills: ['Product Strategy', 'Roadmapping', 'Stakeholder Management', 'Agile', 'Jira'],
  },
  {
    title: 'Project Manager',
    source: 'catalog',
    category: 'Operations & Project',
    skills: ['Project Management', 'Agile', 'Scrum', 'Risk Management', 'Stakeholder Management'],
  },
  {
    title: 'UI/UX Designer',
    source: 'catalog',
    category: 'Design',
    skills: ['Figma', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems'],
  },
  {
    title: 'Graphic Designer',
    source: 'catalog',
    category: 'Design & Creative',
    skills: ['Adobe Photoshop', 'Illustrator', 'Figma', 'Canva', 'Brand Identity'],
  },
  {
    title: 'Video Editor',
    source: 'catalog',
    category: 'Design & Creative',
    skills: ['Premiere Pro', 'After Effects', 'Color Grading', 'Storytelling', 'Audio Mixing'],
  },
  // Finance, Accounting & Banking
  {
    title: 'Accountant',
    source: 'catalog',
    category: 'Finance & Accounting',
    skills: ['General Ledger', 'Financial Reporting', 'Tax Compliance', 'Excel', 'QuickBooks'],
  },
  {
    title: 'Financial Analyst',
    source: 'catalog',
    category: 'Finance & Accounting',
    skills: ['Financial Modeling', 'Forecasting', 'Excel', 'Variance Analysis', 'SQL'],
  },
  {
    title: 'Bookkeeper',
    source: 'catalog',
    category: 'Finance & Accounting',
    skills: ['Accounts Payable', 'Accounts Receivable', 'Reconciliation', 'Xero', 'Excel'],
  },
  {
    title: 'Audit Associate',
    source: 'catalog',
    category: 'Finance & Accounting',
    skills: ['Internal Audit', 'Risk Assessment', 'Financial Statements', 'Excel', 'Compliance'],
  },
  // Business, Operations & Supply Chain
  {
    title: 'Business Analyst',
    source: 'catalog',
    category: 'Business & Operations',
    skills: ['Requirements Gathering', 'SQL', 'Excel', 'Process Mapping', 'Jira'],
  },
  {
    title: 'Operations Analyst',
    source: 'catalog',
    category: 'Business & Operations',
    skills: ['Excel', 'KPI Reporting', 'Process Improvement', 'SQL', 'Power BI'],
  },
  {
    title: 'Supply Chain Analyst',
    source: 'catalog',
    category: 'Supply Chain & Logistics',
    skills: ['Inventory Management', 'Forecasting', 'ERP', 'Excel', 'Logistics'],
  },
  {
    title: 'Procurement Specialist',
    source: 'catalog',
    category: 'Supply Chain & Logistics',
    skills: ['Vendor Management', 'Negotiation', 'Purchase Orders', 'Cost Analysis', 'ERP'],
  },
  {
    title: 'Executive Assistant',
    source: 'catalog',
    category: 'Administration',
    skills: ['Calendar Management', 'Travel Coordination', 'Documentation', 'Microsoft Office', 'Communication'],
  },
  {
    title: 'Virtual Assistant',
    source: 'catalog',
    category: 'Administration',
    skills: ['Scheduling', 'Email Management', 'Data Entry', 'Google Workspace', 'CRM'],
  },
  // Marketing, Sales & Customer Success
  {
    title: 'Digital Marketing Specialist',
    source: 'catalog',
    category: 'Marketing & Growth',
    skills: ['SEO', 'Google Analytics', 'Meta Ads', 'Google Ads', 'Content Marketing'],
  },
  {
    title: 'Social Media Manager',
    source: 'catalog',
    category: 'Marketing & Growth',
    skills: ['Content Calendar', 'Copywriting', 'Community Management', 'Analytics', 'Canva'],
  },
  {
    title: 'Sales Representative',
    source: 'catalog',
    category: 'Sales & Revenue',
    skills: ['Lead Generation', 'CRM', 'Negotiation', 'Pipeline Management', 'Cold Outreach'],
  },
  {
    title: 'Account Executive',
    source: 'catalog',
    category: 'Sales & Revenue',
    skills: ['B2B Sales', 'Salesforce', 'Contract Negotiation', 'Account Management', 'SaaS'],
  },
  {
    title: 'Customer Success Manager',
    source: 'catalog',
    category: 'Customer & Support',
    skills: ['CRM', 'Onboarding', 'Retention', 'Account Management', 'Communication'],
  },
  {
    title: 'Customer Support Specialist',
    source: 'catalog',
    category: 'Customer & Support',
    skills: ['Zendesk', 'Ticket Resolution', 'Communication', 'CRM', 'Troubleshooting'],
  },
  // HR & Recruiting
  {
    title: 'Human Resources Generalist',
    source: 'catalog',
    category: 'Human Resources',
    skills: ['Employee Relations', 'Onboarding', 'HRIS', 'Payroll', 'Labor Compliance'],
  },
  {
    title: 'Talent Acquisition Specialist',
    source: 'catalog',
    category: 'Human Resources',
    skills: ['Sourcing', 'Interviewing', 'ATS', 'LinkedIn Recruiter', 'Employer Branding'],
  },
  // Engineering (Physical) & Architecture
  {
    title: 'Civil Engineer',
    source: 'catalog',
    category: 'Engineering & Construction',
    skills: ['AutoCAD', 'Structural Analysis', 'Site Supervision', 'Quantity Surveying', 'Project Management'],
  },
  {
    title: 'Mechanical Engineer',
    source: 'catalog',
    category: 'Engineering & Manufacturing',
    skills: ['SolidWorks', 'AutoCAD', 'Thermodynamics', 'CAD', 'Quality Control'],
  },
  {
    title: 'Electrical Engineer',
    source: 'catalog',
    category: 'Engineering & Manufacturing',
    skills: ['Circuit Design', 'AutoCAD Electrical', 'PLC', 'Power Systems', 'Testing'],
  },
  {
    title: 'Industrial Engineer',
    source: 'catalog',
    category: 'Engineering & Manufacturing',
    skills: ['Lean Six Sigma', 'Process Optimization', 'Time Study', 'Quality Assurance', 'Excel'],
  },
  {
    title: 'Architect',
    source: 'catalog',
    category: 'Architecture & Design',
    skills: ['Revit', 'AutoCAD', 'SketchUp', '3D Modeling', 'Building Codes'],
  },
  // Healthcare, Education & Legal
  {
    title: 'Registered Nurse',
    source: 'catalog',
    category: 'Healthcare',
    skills: ['Patient Care', 'Clinical Assessment', 'Electronic Health Records', 'Triage', 'Medication Administration'],
  },
  {
    title: 'Medical Virtual Assistant',
    source: 'catalog',
    category: 'Healthcare',
    skills: ['Medical Terminology', 'HIPAA', 'EHR', 'Patient Scheduling', 'Insurance Verification'],
  },
  {
    title: 'Pharmacist',
    source: 'catalog',
    category: 'Healthcare',
    skills: ['Medication Dispensing', 'Patient Counseling', 'Clinical Pharmacology', 'Inventory Control'],
  },
  {
    title: 'Teacher / Instructor',
    source: 'catalog',
    category: 'Education',
    skills: ['Lesson Planning', 'Curriculum Design', 'Classroom Management', 'Assessment', 'Communication'],
  },
  {
    title: 'Instructional Designer',
    source: 'catalog',
    category: 'Education',
    skills: ['LMS', 'Articulate Storyline', 'Curriculum Development', 'E-Learning', 'Assessment'],
  },
  {
    title: 'Paralegal',
    source: 'catalog',
    category: 'Legal',
    skills: ['Legal Research', 'Contract Drafting', 'Case Management', 'Compliance', 'Documentation'],
  },
];

export function searchLocalRoleCatalog(
  query: string,
  limit = 12
): RoleLibraryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return CROSS_INDUSTRY_ROLE_CATALOG.slice(0, limit);
  }

  const tokens = q.split(/\s+/).filter(Boolean);
  const scored = CROSS_INDUSTRY_ROLE_CATALOG.map((entry) => {
    const titleLower = entry.title.toLowerCase();
    const catLower = (entry.category || '').toLowerCase();
    const skillsText = (entry.skills || []).join(' ').toLowerCase();
    let score = 0;

    if (titleLower === q) score += 100;
    else if (titleLower.startsWith(q)) score += 70;
    else if (titleLower.includes(q)) score += 50;

    for (const token of tokens) {
      if (titleLower.includes(token)) score += 20;
      if (catLower.includes(token)) score += 8;
      if (skillsText.includes(token)) score += 6;
    }

    return { entry, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((item) => item.entry);
}

export function formatTargetSalaryLabel(
  salary?: TargetSalaryConfig | null,
  fallbackText = ''
): string {
  if (!salary) return fallbackText;
  const currency = (salary.currency || 'PHP').trim().toUpperCase();
  const minRaw = salary.min.trim();
  const maxRaw = salary.max.trim();
  const periodLabel = salary.period === 'annual' ? '/ yr' : '/ mo';

  if (!minRaw && !maxRaw) return fallbackText;

  const formatNum = (raw: string) => {
    const digits = raw.replace(/[^0-9.]/g, '');
    if (!digits) return raw;
    const num = Number(digits);
    return Number.isFinite(num) ? num.toLocaleString('en-US') : raw;
  };

  if (minRaw && maxRaw) {
    return `${currency} ${formatNum(minRaw)} - ${formatNum(maxRaw)} ${periodLabel}`;
  }
  if (minRaw) {
    return `${currency} ${formatNum(minRaw)}+ ${periodLabel}`;
  }
  return `Up to ${currency} ${formatNum(maxRaw)} ${periodLabel}`;
}

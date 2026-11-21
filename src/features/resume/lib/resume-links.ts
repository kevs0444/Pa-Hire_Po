import type {
  ResumeCertificationColumns,
  ResumeHeaderLink,
  StructuredResume,
} from '@/types/resume';

export type ResumeLinkKind = 'linkedin' | 'github' | 'portfolio' | 'custom';

export interface ResolvedResumeLink {
  displayLabel: string;
  href: string | null;
  isAutoResolved: boolean;
  hasExplicitInvalidUrl: boolean;
}

const UNSAFE_SCHEME_RE = /^(?:javascript|data|vbscript|file):/i;
const HAS_HTTP_SCHEME_RE = /^https?:\/\//i;
const DOMAIN_LIKE_RE =
  /^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[:/?#][^\s]*)?$/i;
const LINKEDIN_URL_RE =
  /^(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/([^\s]+)$/i;
const LINKEDIN_HANDLE_RE =
  /^(?:in\/|pub\/)?@?[A-Za-z0-9][A-Za-z0-9._%-]{1,90}\/?$/i;
const GITHUB_URL_RE = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\s]+)$/i;
const GITHUB_HANDLE_RE =
  /^@?[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})(?:\/[A-Za-z0-9._-]+)?$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateUrlObject(candidate: string): string | null {
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Normalizes a pasted URL, domain, or social handle into a safe http(s) URL.
 * Rejects dangerous protocols and returns null for non-URL free text.
 */
export function normalizeHttpUrl(
  raw: string | undefined | null,
  kind: ResumeLinkKind = 'portfolio'
): string | null {
  const trimmed = (raw || '').trim();
  if (!trimmed || UNSAFE_SCHEME_RE.test(trimmed) || /\s/.test(trimmed)) {
    return null;
  }

  if (kind === 'linkedin') {
    if (LINKEDIN_URL_RE.test(trimmed)) {
      const candidate = HAS_HTTP_SCHEME_RE.test(trimmed)
        ? trimmed
        : `https://${trimmed}`;
      return validateUrlObject(candidate);
    }
    if (HAS_HTTP_SCHEME_RE.test(trimmed)) {
      return validateUrlObject(trimmed);
    }
    if (DOMAIN_LIKE_RE.test(trimmed)) {
      return validateUrlObject(`https://${trimmed}`);
    }
    if (LINKEDIN_HANDLE_RE.test(trimmed)) {
      const clean = trimmed.replace(/^@/, '').replace(/\/+$/, '');
      if (clean.startsWith('pub/')) {
        return validateUrlObject(`https://www.linkedin.com/${clean}`);
      }
      const slug = clean.replace(/^in\//i, '');
      return validateUrlObject(`https://www.linkedin.com/in/${slug}`);
    }
    return null;
  }

  if (kind === 'github') {
    if (GITHUB_URL_RE.test(trimmed)) {
      const candidate = HAS_HTTP_SCHEME_RE.test(trimmed)
        ? trimmed
        : `https://${trimmed}`;
      return validateUrlObject(candidate);
    }
    if (HAS_HTTP_SCHEME_RE.test(trimmed)) {
      return validateUrlObject(trimmed);
    }
    if (DOMAIN_LIKE_RE.test(trimmed)) {
      return validateUrlObject(`https://${trimmed}`);
    }
    if (GITHUB_HANDLE_RE.test(trimmed)) {
      const clean = trimmed.replace(/^@/, '').replace(/\/+$/, '');
      return validateUrlObject(`https://github.com/${clean}`);
    }
    return null;
  }

  if (HAS_HTTP_SCHEME_RE.test(trimmed)) {
    return validateUrlObject(trimmed);
  }
  if (DOMAIN_LIKE_RE.test(trimmed)) {
    return validateUrlObject(`https://${trimmed}`);
  }
  return null;
}

/**
 * Produces a concise resume-friendly display label from a valid URL.
 */
export function formatConciseLabelFromUrl(
  url: string,
  kind: ResumeLinkKind = 'portfolio'
): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./i, '');
    const path = parsed.pathname.replace(/\/+$/, '');

    if (kind === 'linkedin' && host.includes('linkedin.com')) {
      return path ? `linkedin.com${path}` : host;
    }
    if (kind === 'github' && host === 'github.com') {
      const cleanPath = path.replace(/^\/+/, '');
      if (cleanPath && !cleanPath.includes('/')) {
        return cleanPath;
      }
      return cleanPath ? `github.com/${cleanPath}` : host;
    }
    return `${host}${path}${parsed.search}`;
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/+$/, '');
  }
}

/**
 * Resolves a resume header link (Display Label + Optional Target URL) into a validated href.
 */
export function resolveResumeHeaderLink(
  kind: ResumeLinkKind,
  label: string | undefined | null,
  explicitUrl?: string | null
): ResolvedResumeLink {
  const trimmedLabel = (label || '').trim();
  const trimmedUrl = (explicitUrl || '').trim();

  if (trimmedUrl) {
    const normalizedExplicit = normalizeHttpUrl(trimmedUrl, kind);
    if (normalizedExplicit) {
      return {
        displayLabel:
          trimmedLabel || formatConciseLabelFromUrl(normalizedExplicit, kind),
        href: normalizedExplicit,
        isAutoResolved: false,
        hasExplicitInvalidUrl: false,
      };
    }
    return {
      displayLabel: trimmedLabel,
      href: null,
      isAutoResolved: false,
      hasExplicitInvalidUrl: true,
    };
  }

  if (trimmedLabel) {
    const autoHref = normalizeHttpUrl(trimmedLabel, kind);
    if (autoHref) {
      return {
        displayLabel: trimmedLabel,
        href: autoHref,
        isAutoResolved: true,
        hasExplicitInvalidUrl: false,
      };
    }
  }

  return {
    displayLabel: trimmedLabel,
    href: null,
    isAutoResolved: false,
    hasExplicitInvalidUrl: false,
  };
}

/**
 * Detects when a user pastes a URL into a Display Label field and splits it into a clean label + normalized URL.
 */
export function extractSmartLinkPaste(
  rawInput: string,
  kind: ResumeLinkKind
): { label: string; url: string } | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  const looksLikePastedUrl =
    HAS_HTTP_SCHEME_RE.test(trimmed) ||
    /^www\./i.test(trimmed) ||
    LINKEDIN_URL_RE.test(trimmed) ||
    GITHUB_URL_RE.test(trimmed);

  if (!looksLikePastedUrl) return null;

  const normalized = normalizeHttpUrl(trimmed, kind);
  if (!normalized) return null;

  return {
    label: formatConciseLabelFromUrl(normalized, kind),
    url: normalized,
  };
}

export function resolveEmailHref(email: string | undefined | null): string | null {
  const trimmed = (email || '').trim();
  if (!trimmed || !EMAIL_RE.test(trimmed)) return null;
  return `mailto:${trimmed}`;
}

/**
 * Reindexes a 0-based certification URL map when a certification entry is removed.
 */
export function shiftCertificationUrlsOnDelete(
  urls: Record<number, string> | undefined,
  removedIdx: number
): Record<number, string> {
  if (!urls) return {};
  const next: Record<number, string> = {};
  for (const [keyStr, val] of Object.entries(urls)) {
    const k = Number(keyStr);
    if (!Number.isInteger(k) || !val) continue;
    if (k < removedIdx) next[k] = val;
    else if (k > removedIdx) next[k - 1] = val;
  }
  return next;
}

/**
 * Normalizes the certifications grid column count to the supported 1-3 ATS-safe range.
 */
export function clampCertificationColumns(
  cols?: number | null
): ResumeCertificationColumns {
  if (cols === 1) return 1;
  if (cols === 3) return 3;
  return 2;
}

/**
 * Swaps two 0-based certification URL entries when reordering certifications.
 */
export function swapCertificationUrls(
  urls: Record<number, string> | undefined,
  indexA: number,
  indexB: number
): Record<number, string> {
  const next: Record<number, string> = {};
  if (urls) {
    for (const [keyStr, val] of Object.entries(urls)) {
      const k = Number(keyStr);
      if (Number.isInteger(k) && val) {
        next[k] = val;
      }
    }
  }
  const valA = next[indexA];
  const valB = next[indexB];
  if (valB) next[indexA] = valB;
  else delete next[indexA];
  if (valA) next[indexB] = valA;
  else delete next[indexB];
  return next;
}

let headerLinkSeq = 0;

export function createHeaderLinkId(
  kind: ResumeLinkKind,
  existingIds: string[] = []
): string {
  const taken = new Set(existingIds);
  let candidate = '';
  do {
    headerLinkSeq += 1;
    candidate = `link-${kind}-${headerLinkSeq}`;
  } while (taken.has(candidate));
  return candidate;
}

export function inferLinkKind(
  platform?: string | null,
  explicitKind?: ResumeLinkKind
): ResumeLinkKind {
  if (explicitKind) return explicitKind;
  const p = (platform || '').trim().toLowerCase();
  if (p.includes('linkedin')) return 'linkedin';
  if (p.includes('github')) return 'github';
  if (p.includes('portfolio') || p === 'website' || p === 'site') {
    return 'portfolio';
  }
  return 'custom';
}

/**
 * Resolves the active ordered list of header links from `headerLinks` (if set)
 * or constructs them from legacy `linkedin` / `github` / `portfolio` / `customLinks`.
 * Returns an empty array when `hideHeaderLinks` is true.
 */
export function getEffectiveHeaderLinks(
  resume: Pick<
    StructuredResume,
    | 'linkedin'
    | 'linkedinUrl'
    | 'github'
    | 'githubUrl'
    | 'portfolio'
    | 'portfolioUrl'
    | 'customLinks'
    | 'headerLinks'
    | 'hideHeaderLinks'
  >
): ResumeHeaderLink[] {
  if (resume.hideHeaderLinks) return [];

  if (Array.isArray(resume.headerLinks)) {
    return resume.headerLinks;
  }

  const derived: ResumeHeaderLink[] = [];
  if ((resume.linkedin || '').trim() || (resume.linkedinUrl || '').trim()) {
    derived.push({
      id: 'std-linkedin',
      kind: 'linkedin',
      platform: 'LinkedIn',
      label: resume.linkedin || '',
      url: resume.linkedinUrl || '',
    });
  }
  if ((resume.github || '').trim() || (resume.githubUrl || '').trim()) {
    derived.push({
      id: 'std-github',
      kind: 'github',
      platform: 'GitHub',
      label: resume.github || '',
      url: resume.githubUrl || '',
    });
  }
  if ((resume.portfolio || '').trim() || (resume.portfolioUrl || '').trim()) {
    derived.push({
      id: 'std-portfolio',
      kind: 'portfolio',
      platform: 'Portfolio',
      label: resume.portfolio || '',
      url: resume.portfolioUrl || '',
    });
  }
  for (let i = 0; i < (resume.customLinks || []).length; i++) {
    const cl = (resume.customLinks || [])[i];
    derived.push({
      id: cl.id || `custom-${i + 1}`,
      kind: cl.kind || inferLinkKind(cl.platform),
      platform: cl.platform || 'Link',
      label: cl.label || '',
      url: cl.url || '',
    });
  }

  return derived;
}

/**
 * Applies an updated ordered list of header links back to `StructuredResume`
 * while syncing legacy fields for backward compatibility across exporters & AI tailoring.
 */
export function applyHeaderLinksToResume(
  resume: StructuredResume,
  links: ResumeHeaderLink[],
  hideHeaderLinks = false
): StructuredResume {
  let linkedin = '';
  let linkedinUrl = '';
  let usedLinkedin = false;
  let github = '';
  let githubUrl = '';
  let usedGithub = false;
  let portfolio = '';
  let portfolioUrl = '';
  let usedPortfolio = false;
  const customLinks: ResumeHeaderLink[] = [];

  for (const item of links) {
    const kind = inferLinkKind(item.platform, item.kind);
    if (kind === 'linkedin' && !usedLinkedin) {
      usedLinkedin = true;
      linkedin = item.label;
      linkedinUrl = item.url;
    } else if (kind === 'github' && !usedGithub) {
      usedGithub = true;
      github = item.label;
      githubUrl = item.url;
    } else if (kind === 'portfolio' && !usedPortfolio) {
      usedPortfolio = true;
      portfolio = item.label;
      portfolioUrl = item.url;
    } else {
      customLinks.push(item);
    }
  }

  return {
    ...resume,
    hideHeaderLinks,
    headerLinks: links,
    linkedin,
    linkedinUrl,
    github,
    githubUrl,
    portfolio,
    portfolioUrl,
    customLinks,
  };
}



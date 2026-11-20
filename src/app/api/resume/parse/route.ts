import { NextRequest, NextResponse } from 'next/server';
import {
  extractSkillsFromResume,
  extractSummaryFromResume,
  inferDynamicRoles,
} from '@/features/resume/lib/resume-analyzer';
import {
  inferExperienceLevelFromText,
  parseResumeTextToStructured,
} from '@/features/resume/lib/resume-parser';
import { normalizeHttpUrl } from '@/features/resume/lib/resume-links';
import { FREE_TIER_LIMITS } from '@/lib/supabase/free-tier-limits';
import { resolveServerSession } from '@/lib/supabase/session';
import type { StructuredResume } from '@/types/job';

const GEMINI_PARSE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
] as const;

function extractReadableTextFromPdfBuffer(buffer: Buffer): string {
  const raw = buffer.toString('latin1');
  const chunks: string[] = [];

  const textOperatorRegex = /\(([^()\\]{2,200})\)\s*(?:Tj|'|")/g;
  let match: RegExpExecArray | null;
  while ((match = textOperatorRegex.exec(raw)) !== null) {
    const cleaned = match[1]
      .replace(/\\n/g, ' ')
      .replace(/\\r/g, ' ')
      .replace(/\\t/g, ' ')
      .replace(/[^\x20-\x7E]/g, ' ')
      .trim();
    if (cleaned.length >= 2) {
      chunks.push(cleaned);
    }
  }

  if (chunks.length >= 10) {
    return chunks.join(' ').replace(/\s+/g, ' ').trim();
  }

  const asciiMatches = buffer
    .toString('utf8')
    .match(/[A-Za-z0-9+#.,:/@&()\- ]{6,}/g);
  if (!asciiMatches) return '';

  return asciiMatches
    .filter(
      (line) =>
        !/^(endobj|stream|endstream|xref|trailer|startxref|obj|FlateDecode|Filter|Length|Type|Font)/i.test(
          line.trim()
        )
    )
    .join('\n')
    .slice(0, 15000);
}

function extractPdfAnnotationUrls(buffer: Buffer): string[] {
  const raw = buffer.toString('latin1');
  const uriRegex = /\/URI\s*\(([^)\\]+(?:\\.[^)\\]+)*)\)/gi;
  const urls = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = uriRegex.exec(raw)) !== null) {
    const rawUri = match[1]
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\')
      .trim();
    const lower = rawUri.toLowerCase();
    if (
      lower.includes('schemas.openxmlformats.org') ||
      lower.includes('ns.adobe.com') ||
      lower.includes('w3.org') ||
      lower.includes('purl.org')
    ) {
      continue;
    }
    const normalized = normalizeHttpUrl(rawUri, 'portfolio');
    if (normalized) {
      urls.add(normalized);
    }
  }

  return Array.from(urls);
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const { extractText } = await import('unpdf');
    const result = await extractText(new Uint8Array(buffer), {
      mergePages: true,
    });
    const text = Array.isArray(result.text)
      ? result.text.join('\n')
      : result.text || '';
    if (text.trim().length >= 20) {
      return text;
    }
  } catch {
    // Fallback to raw PDF stream extraction below
  }
  return extractReadableTextFromPdfBuffer(buffer);
}

async function extractTextAndLinksFromDocx(buffer: Buffer): Promise<{
  text: string;
  links: string[];
}> {
  const mammoth = await import('mammoth');
  const rawResult = await mammoth.extractRawText({ buffer });
  const links = new Set<string>();

  try {
    const htmlResult = await mammoth.convertToHtml({ buffer });
    const hrefRegex = /href="(https?:\/\/[^"]+)"/gi;
    let match: RegExpExecArray | null;
    while ((match = hrefRegex.exec(htmlResult.value || '')) !== null) {
      const normalized = normalizeHttpUrl(match[1], 'portfolio');
      if (normalized) links.add(normalized);
    }
  } catch {
    // Ignore HTML conversion failure if raw text succeeded
  }

  return { text: rawResult.value || '', links: Array.from(links) };
}

async function extractStructuredResumeWithGemini(
  apiKey: string,
  rawText: string,
  fallback: StructuredResume,
  hintUrls: string[] = []
): Promise<StructuredResume | null> {
  const systemPrompt = `You are an expert resume parser. Convert the provided raw resume text into structured JSON.
STRICT RULES:
1. ONLY extract facts actually present in the resume text or hyperlink annotations. NEVER invent URLs, companies, dates, skills, degrees, or metrics.
2. Return ONLY valid JSON matching this exact schema:
{
  "fullName": "string",
  "targetHeadline": "string",
  "tailoredSummary": "string | null",
  "email": "string",
  "phones": ["string"],
  "location": "string",
  "linkedin": "string",
  "linkedinUrl": "string",
  "github": "string",
  "githubUrl": "string",
  "portfolio": "string",
  "portfolioUrl": "string",
  "customLinks": [{ "id": "string", "platform": "string", "label": "string", "url": "string" }],
  "experience": [{ "id": "string", "role": "string", "company": "string", "location": "string", "period": "string", "bullets": ["string"] }],
  "projects": [{ "id": "string", "name": "string", "subtitle": "string", "period": "string", "url": "string | null", "bullets": ["string"] }],
  "skillCategories": [{ "category": "string", "items": "string" }],
  "certifications": ["string"],
  "education": [{ "degree": "string", "school": "string", "period": "string", "honors": "string" }]
}`;

  const promptContent =
    hintUrls.length > 0
      ? `${rawText.slice(0, 12500)}\n\nEmbedded Document Hyperlinks:\n${hintUrls.slice(0, 20).join('\n')}`
      : rawText.slice(0, 14000);

  for (const model of GEMINI_PARSE_MODELS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 14000);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
          apiKey
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: promptContent }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) continue;
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text !== 'string' || !text.trim()) continue;

      const parsed = JSON.parse(text) as Partial<StructuredResume>;
      return {
        fullName: parsed.fullName?.trim() || fallback.fullName,
        targetHeadline: parsed.targetHeadline?.trim() || fallback.targetHeadline,
        tailoredSummary:
          parsed.tailoredSummary !== undefined
            ? parsed.tailoredSummary
            : fallback.tailoredSummary,
        email: parsed.email?.trim() || fallback.email,
        phones:
          Array.isArray(parsed.phones) && parsed.phones.length > 0
            ? parsed.phones.map((p) => String(p).trim()).filter(Boolean)
            : fallback.phones,
        location: parsed.location?.trim() || fallback.location,
        linkedin: parsed.linkedin?.trim() || fallback.linkedin,
        linkedinUrl:
          normalizeHttpUrl(parsed.linkedinUrl, 'linkedin') ||
          fallback.linkedinUrl ||
          '',
        github: parsed.github?.trim() || fallback.github,
        githubUrl:
          normalizeHttpUrl(parsed.githubUrl, 'github') ||
          fallback.githubUrl ||
          '',
        portfolio: parsed.portfolio?.trim() || fallback.portfolio,
        portfolioUrl:
          normalizeHttpUrl(parsed.portfolioUrl, 'portfolio') ||
          fallback.portfolioUrl ||
          '',
        customLinks:
          Array.isArray(parsed.customLinks) && parsed.customLinks.length > 0
            ? parsed.customLinks
                .map((l, idx) => ({
                  id: l.id || `link-${idx + 1}`,
                  platform: String(l.platform || 'Link').trim(),
                  label: String(l.label || '').trim(),
                  url: normalizeHttpUrl(l.url, 'custom') || String(l.url || '').trim(),
                }))
                .filter((l) => l.label || l.url)
            : fallback.customLinks || [],
        experience: Array.isArray(parsed.experience)
          ? parsed.experience.map((e, i) => ({
              id: e.id || `exp-${i + 1}`,
              role: e.role || 'Role',
              company: e.company || '',
              location: e.location || '',
              period: e.period || '',
              bullets: Array.isArray(e.bullets)
                ? e.bullets.map((b) => String(b).trim()).filter(Boolean)
                : [],
            }))
          : fallback.experience,
        projects: Array.isArray(parsed.projects)
          ? parsed.projects.map((p, i) => {
              const matchedFallback = fallback.projects.find(
                (fp) =>
                  fp.name.trim().toLowerCase() ===
                  (p.name || '').trim().toLowerCase()
              );
              return {
                id: p.id || `proj-${i + 1}`,
                name: p.name || 'Project',
                subtitle: p.subtitle || '',
                period: p.period || '',
                url:
                  normalizeHttpUrl(p.url, 'portfolio') ||
                  matchedFallback?.url ||
                  undefined,
                bullets: Array.isArray(p.bullets)
                  ? p.bullets.map((b) => String(b).trim()).filter(Boolean)
                  : [],
              };
            })
          : fallback.projects,
        skillCategories: Array.isArray(parsed.skillCategories)
          ? parsed.skillCategories
              .filter((c) => c?.category && c?.items)
              .map((c) => ({
                category: String(c.category).trim(),
                items: String(c.items).trim(),
              }))
          : fallback.skillCategories,
        certifications: Array.isArray(parsed.certifications)
          ? parsed.certifications.map((c) => String(c).trim()).filter(Boolean)
          : fallback.certifications,
        certificationUrls: fallback.certificationUrls || {},
        education: Array.isArray(parsed.education)
          ? parsed.education.map((ed) => ({
              degree: ed.degree || '',
              school: ed.school || '',
              period: ed.period || '',
              honors: ed.honors || '',
            }))
          : fallback.education,
        tailorMethod: 'base',
        textAlign: 'justify',
        pageSize: 'a4',
        density: 'standard',
        fontFamily: 'calibri',
      };
    } catch {
      continue;
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let resumeText = '';
    let hintUrls: string[] = [];
    let fileName: string | null = null;
    let primaryRole = '';
    let userGeminiKey = '';
    let uploadedFileBuffer: Buffer | null = null;
    let uploadedMimeType = 'application/octet-stream';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      const roleField = formData.get('primaryRole');
      const textField = formData.get('resumeText');
      const keyField = formData.get('geminiApiKey');

      if (typeof roleField === 'string') primaryRole = roleField;
      if (typeof keyField === 'string') userGeminiKey = keyField.trim();

      if (file instanceof File) {
        if (file.size > FREE_TIER_LIMITS.maxResumeUploadBytes) {
          return NextResponse.json(
            {
              error:
                'Resume file exceeds the 4.5 MB free-tier upload limit. Please upload a compact PDF or Word (.docx) file.',
            },
            { status: 413 }
          );
        }

        fileName = file.name;
        const lowerName = file.name.toLowerCase();
        if (lowerName.endsWith('.doc') && !lowerName.endsWith('.docx')) {
          return NextResponse.json(
            {
              error:
                'Legacy .doc (Word 97–2003) files are not supported. Please save as .docx or .pdf and upload again.',
            },
            { status: 400 }
          );
        }

        uploadedMimeType = file.type || uploadedMimeType;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        uploadedFileBuffer = buffer;

        if (lowerName.endsWith('.pdf')) {
          resumeText = await extractTextFromPdf(buffer);
          hintUrls = extractPdfAnnotationUrls(buffer);
        } else if (lowerName.endsWith('.docx')) {
          const docxData = await extractTextAndLinksFromDocx(buffer);
          resumeText = docxData.text;
          hintUrls = docxData.links;
        } else {
          resumeText = buffer.toString('utf8');
        }
      } else if (typeof textField === 'string') {
        resumeText = textField;
      }
    } else {
      const body = (await request.json().catch(() => ({}))) as {
        resumeText?: string;
        fileName?: string | null;
        primaryRole?: string;
        geminiApiKey?: string;
      };
      resumeText = body.resumeText || '';
      fileName = body.fileName ?? null;
      primaryRole = body.primaryRole || '';
      userGeminiKey = body.geminiApiKey?.trim() || '';
    }

    const cleanText = resumeText.trim();
    if (!cleanText || cleanText.length < 15) {
      return NextResponse.json(
        {
          error:
            'Could not extract enough readable text from that file. If it is a scanned image-only PDF, export it with selectable text or upload a .docx file.',
        },
        { status: 400 }
      );
    }

    const session = await resolveServerSession().catch(() => null);
    const deterministicStructured = parseResumeTextToStructured(
      cleanText,
      undefined,
      hintUrls
    );

    const serverGeminiKey = process.env.GEMINI_API_KEY?.trim() || '';
    const authorizedKey =
      userGeminiKey || (session?.authUser?.isAdmin ? serverGeminiKey : '');

    let structuredResume = deterministicStructured;
    let parseMethod: 'gemini-ai' | 'smart-parser' = 'smart-parser';

    if (authorizedKey) {
      const aiStructured = await extractStructuredResumeWithGemini(
        authorizedKey,
        cleanText,
        deterministicStructured,
        hintUrls
      );
      if (aiStructured) {
        structuredResume = aiStructured;
        parseMethod = 'gemini-ai';
      }
    }

    const skills = extractSkillsFromResume(cleanText);
    const summary =
      structuredResume.tailoredSummary || extractSummaryFromResume(cleanText);
    const suggestedRoles = inferDynamicRoles(cleanText, skills, primaryRole)
      .slice(0, 8)
      .map((r) => r.role);
    const inferredExperienceLevel = inferExperienceLevelFromText(cleanText);

    // Upload raw resume file to Supabase Storage bucket 'resumes' when authenticated
    let storagePath: string | null = null;
    if (uploadedFileBuffer && fileName && session) {
      try {
        if (
          session.authenticated &&
          session.mode === 'supabase' &&
          session.dbClient &&
          session.authUser
        ) {
          const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
          const objectPath = `${session.authUser.id}/latest-${safeName}`;

          const { data: existingProfile } = await session.dbClient
            .from('user_profiles')
            .select('resume_file_path')
            .eq('id', session.authUser.id)
            .maybeSingle<{ resume_file_path: string | null }>();

          if (
            existingProfile?.resume_file_path &&
            existingProfile.resume_file_path !== objectPath
          ) {
            await session.dbClient.storage
              .from('resumes')
              .remove([existingProfile.resume_file_path]);
          }

          const { error: uploadErr } = await session.dbClient.storage
            .from('resumes')
            .upload(objectPath, uploadedFileBuffer, {
              contentType: uploadedMimeType,
              upsert: true,
            });

          if (!uploadErr) {
            storagePath = objectPath;
            await session.dbClient
              .from('user_profiles')
              .update({
                resume_file_path: objectPath,
                resume_file_name: fileName,
                updated_at: new Date().toISOString(),
              })
              .eq('id', session.authUser.id);
          }
        }
      } catch {
        // Non-blocking: parsing succeeds even if Storage bucket isn't initialized yet
      }
    }

    return NextResponse.json({
      fileName,
      resumeText: cleanText,
      structuredResume,
      skills,
      summary,
      suggestedRoles,
      inferredExperienceLevel,
      inferredLocation: structuredResume.location || null,
      parseMethod,
      storagePath,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : 'Failed to analyze resume content',
      },
      { status: 500 }
    );
  }
}

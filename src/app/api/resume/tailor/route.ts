import { NextRequest, NextResponse } from 'next/server';
import {
  JobListing,
  StructuredResume,
  UserProfile,
} from '@/types/job';
import { MAR_KEVIN_PROFILE } from '@/lib/default-profile';
import { tailorResumeLocally } from '@/features/resume/lib/resume-tailor';

interface TailorRequestBody {
  profile?: UserProfile;
  targetJob?: JobListing | null;
  targetRole?: string;
  geminiApiKey?: string;
}

interface GeminiTailorPayload {
  targetHeadline?: string;
  tailoredSummary?: string;
  experience?: StructuredResume['experience'];
  projects?: StructuredResume['projects'];
  skillCategories?: StructuredResume['skillCategories'];
  tailorNotes?: string[];
}

async function tailorWithGemini(
  apiKey: string,
  profile: UserProfile,
  targetJob?: JobListing | null,
  targetRoleOverride?: string
): Promise<StructuredResume> {
  const targetRole =
    targetJob?.title || targetRoleOverride || profile.primaryRole;
  const targetCompany = targetJob?.company || 'Target Employer';
  const jobDescription =
    targetJob?.description ||
    `Target role: ${targetRole}. Skills: ${profile.skills.join(', ')}`;

  const systemPrompt = `You are an expert technical resume editor.
Your job is to tailor the candidate's existing resume for a specific target role/job while fitting cleanly on ONE A4 page.

STRICT GROUNDING RULES:
1. NEVER invent companies, dates, degrees, certifications, job titles, or tools the candidate has not actually used.
2. You may ONLY draw facts, metrics, and projects from the provided "baseResume" and "careerJourneyMarkdown".
3. Wrap important job-relevant tools and quantified impact metrics in **double asterisks** (e.g. **SQL**, **83%**, **Power BI**).
4. Keep bullet counts compact (at most 3-4 concise bullets per job, max 2 projects total) so it prints on 1 A4 page.
5. Return ONLY valid JSON matching this schema:
{
  "targetHeadline": "string (concise 1-line subtitle)",
  "tailoredSummary": "string (max 2 sentences connecting factual background to target job)",
  "experience": [{ "id": "string", "role": "string", "company": "string", "location": "string", "period": "string", "bullets": ["string"] }],
  "projects": [{ "id": "string", "name": "string", "subtitle": "string", "period": "string", "bullets": ["string"] }],
  "skillCategories": [{ "category": "string", "items": "string" }],
  "tailorNotes": ["string (2-3 short notes explaining what was tailored)"]
}`;

  const userPrompt = JSON.stringify({
    targetJob: {
      title: targetRole,
      company: targetCompany,
      matchedSkills: targetJob?.matchedSkills || [],
      missingSkills: targetJob?.missingSkills || [],
      description: jobDescription.slice(0, 2200),
    },
    baseResume: profile.structuredResume,
    careerJourneyMarkdown: profile.careerJourneyMarkdown.slice(0, 6000),
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 16000);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
      apiKey
    )}`,
    {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.25,
          responseMimeType: 'application/json',
        },
      }),
    }
  );
  clearTimeout(timer);

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini API HTTP ${response.status}: ${errText.slice(0, 140)}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawJson) {
    throw new Error('Gemini API returned empty content');
  }

  const parsed = JSON.parse(rawJson) as GeminiTailorPayload;
  const base = profile.structuredResume;

  return {
    ...base,
    targetHeadline: parsed.targetHeadline || base.targetHeadline,
    tailoredSummary: parsed.tailoredSummary || null,
    experience:
      Array.isArray(parsed.experience) && parsed.experience.length > 0
        ? parsed.experience
        : base.experience,
    projects:
      Array.isArray(parsed.projects) && parsed.projects.length > 0
        ? parsed.projects
        : base.projects,
    skillCategories:
      Array.isArray(parsed.skillCategories) && parsed.skillCategories.length > 0
        ? parsed.skillCategories
        : base.skillCategories,
    tailoredForJobTitle: targetRole,
    tailoredForCompany: targetJob?.company || null,
    tailorMethod: 'gemini-ai',
    tailorNotes:
      Array.isArray(parsed.tailorNotes) && parsed.tailorNotes.length > 0
        ? parsed.tailorNotes
        : [`Tailored via Gemini AI for ${targetRole}`],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as TailorRequestBody;
    const profile: UserProfile = body.profile || MAR_KEVIN_PROFILE;
    const apiKey =
      body.geminiApiKey?.trim() || process.env.GEMINI_API_KEY?.trim() || '';

    if (apiKey) {
      try {
        const geminiResume = await tailorWithGemini(
          apiKey,
          profile,
          body.targetJob,
          body.targetRole
        );
        return NextResponse.json({
          resume: geminiResume,
          method: 'gemini-ai',
        });
      } catch (err) {
        const fallback = tailorResumeLocally(
          profile,
          body.targetJob,
          body.targetRole
        );
        return NextResponse.json({
          resume: {
            ...fallback,
            tailorNotes: [
              ...(fallback.tailorNotes || []),
              `Gemini AI fallback triggered (${
                err instanceof Error ? err.message : 'unavailable'
              }); used Smart Career Journey Tailor instead.`,
            ],
          },
          method: 'smart-engine',
        });
      }
    }

    const tailored = tailorResumeLocally(
      profile,
      body.targetJob,
      body.targetRole
    );
    return NextResponse.json({
      resume: tailored,
      method: 'smart-engine',
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : 'Failed to tailor resume',
      },
      { status: 500 }
    );
  }
}

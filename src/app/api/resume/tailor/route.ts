import { NextRequest, NextResponse } from 'next/server';
import {
  JobListing,
  ResumePageSize,
  StructuredResume,
  UserProfile,
} from '@/types/job';
import { MAR_KEVIN_PROFILE } from '@/lib/default-profile';
import { tailorResumeLocally } from '@/features/resume/lib/resume-tailor';
import { FREE_TIER_LIMITS } from '@/lib/supabase/free-tier-limits';
import { resolveServerSession } from '@/lib/supabase/session';

interface TailorRequestBody {
  profile?: UserProfile;
  targetJob?: JobListing | null;
  targetRole?: string;
  geminiApiKey?: string;
  pageSize?: ResumePageSize;
}

interface GeminiTailorPayload {
  targetHeadline?: string;
  tailoredSummary?: string;
  experience?: StructuredResume['experience'];
  projects?: StructuredResume['projects'];
  skillCategories?: StructuredResume['skillCategories'];
  tailorNotes?: string[];
}

const GEMINI_TAILOR_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash',
] as const;

const PAGE_SIZE_GUIDANCE: Record<ResumePageSize, string> = {
  a4: 'ONE A4 page (210 x 297 mm)',
  letter: 'ONE US Letter page (8.5 x 11 in)',
  legal: 'ONE US Legal page (8.5 x 14 in)',
  auto: 'a concise, scannable dynamic single-sheet layout',
};

async function tailorWithGemini(
  apiKey: string,
  profile: UserProfile,
  targetJob?: JobListing | null,
  targetRoleOverride?: string,
  pageSize: ResumePageSize = 'a4'
): Promise<StructuredResume> {
  const targetRole =
    targetJob?.title || targetRoleOverride || profile.primaryRole;
  const targetCompany = targetJob?.company || 'Target Employer';
  const jobDescription =
    targetJob?.description ||
    `Target role: ${targetRole}. Skills: ${profile.skills.join(', ')}`;

  const targetPageLabel = PAGE_SIZE_GUIDANCE[pageSize] || PAGE_SIZE_GUIDANCE.a4;

  const systemPrompt = `You are an expert technical resume editor.
Your job is to tailor the candidate's existing resume for a specific target role/job while fitting cleanly on ${targetPageLabel}.

STRICT GROUNDING RULES:
1. NEVER invent companies, dates, degrees, certifications, job titles, or tools the candidate has not actually used.
2. You may ONLY draw facts, metrics, and projects from the provided "baseResume" and "careerJourneyMarkdown".
3. Wrap important job-relevant tools and quantified impact metrics in **double asterisks** (e.g. **SQL**, **83%**, **Power BI**).
4. Keep bullet counts compact (at most 3-4 concise bullets per job, max 2 projects total) so it stays crisp and easy to scan.
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

  let rawJson: string | undefined;
  let usedModel: string = GEMINI_TAILOR_MODELS[0];
  let lastError: Error | null = null;

  for (const model of GEMINI_TAILOR_MODELS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 14000);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
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
        lastError = new Error(
          `Gemini ${model} HTTP ${response.status}: ${errText.slice(0, 140)}`
        );
        continue;
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };

      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidateText) {
        lastError = new Error(`Gemini ${model} returned empty content`);
        continue;
      }

      rawJson = candidateText;
      usedModel = model;
      break;
    } catch (err) {
      clearTimeout(timer);
      lastError =
        err instanceof Error ? err : new Error(`Gemini ${model} failed`);
    }
  }

  if (!rawJson) {
    throw lastError || new Error('All configured Gemini models failed');
  }

  const parsed = JSON.parse(rawJson) as GeminiTailorPayload;
  const base = profile.structuredResume;

  return {
    ...base,
    pageSize: base.pageSize || pageSize || 'a4',
    density: base.density || 'standard',
    fontFamily: base.fontFamily || 'calibri',
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
        : [`Tailored via Personal Gemini AI (${usedModel}) for ${targetRole}`],
  };
}

export async function GET() {
  return NextResponse.json({
    personalApiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    primaryModel: GEMINI_TAILOR_MODELS[0],
  });
}

async function saveTailoredSnapshot(params: {
  targetJob?: JobListing | null;
  targetRole?: string;
  method: string;
  resume: StructuredResume;
}): Promise<string | null> {
  try {
    const session = await resolveServerSession();
    if (
      !session.authenticated ||
      session.mode !== 'supabase' ||
      !session.dbClient ||
      !session.authUser
    ) {
      return null;
    }

    const { data: inserted } = await session.dbClient
      .from('tailored_resumes')
      .insert({
        user_id: session.authUser.id,
        job_id: params.targetJob?.id || null,
        job_title:
          params.targetJob?.title ||
          params.targetRole ||
          params.resume.tailoredForJobTitle ||
          null,
        company:
          params.targetJob?.company || params.resume.tailoredForCompany || null,
        tailor_method: params.method,
        resume_data: params.resume,
      })
      .select('id')
      .maybeSingle<{ id: string }>();

    // Free-tier cap: retain newest tailored snapshots per user
    const { data: overflowRows } = await session.dbClient
      .from('tailored_resumes')
      .select('id')
      .eq('user_id', session.authUser.id)
      .order('created_at', { ascending: false })
      .range(FREE_TIER_LIMITS.maxTailoredSnapshotsPerUser, 500);

    const overflowIds = (overflowRows || []).map((row: { id: string }) => row.id);
    if (overflowIds.length > 0) {
      await session.dbClient
        .from('tailored_resumes')
        .delete()
        .eq('user_id', session.authUser.id)
        .in('id', overflowIds);
    }

    return inserted?.id ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as TailorRequestBody;
    const profile: UserProfile = body.profile || MAR_KEVIN_PROFILE;
    const pageSize: ResumePageSize =
      body.pageSize || profile.structuredResume?.pageSize || 'a4';
    const apiKey =
      process.env.GEMINI_API_KEY?.trim() || body.geminiApiKey?.trim() || '';

    if (apiKey) {
      try {
        const geminiResume = await tailorWithGemini(
          apiKey,
          profile,
          body.targetJob,
          body.targetRole,
          pageSize
        );
        const snapshotId = await saveTailoredSnapshot({
          targetJob: body.targetJob,
          targetRole: body.targetRole,
          method: 'gemini-ai',
          resume: geminiResume,
        });
        return NextResponse.json({
          resume: geminiResume,
          method: 'gemini-ai',
          snapshotId,
          personalApiUsed: Boolean(process.env.GEMINI_API_KEY?.trim()),
        });
      } catch (err) {
        const fallback = tailorResumeLocally(
          profile,
          body.targetJob,
          body.targetRole
        );
        const fallbackResume: StructuredResume = {
          ...fallback,
          pageSize: profile.structuredResume?.pageSize || pageSize,
          density: profile.structuredResume?.density || 'standard',
          fontFamily: profile.structuredResume?.fontFamily || 'calibri',
          tailorNotes: [
            ...(fallback.tailorNotes || []),
            `Gemini AI fallback triggered (${
              err instanceof Error ? err.message : 'unavailable'
            }); used Smart Career Journey Tailor instead.`,
          ],
        };
        const snapshotId = await saveTailoredSnapshot({
          targetJob: body.targetJob,
          targetRole: body.targetRole,
          method: 'smart-engine',
          resume: fallbackResume,
        });
        return NextResponse.json({
          resume: fallbackResume,
          method: 'smart-engine',
          snapshotId,
          personalApiUsed: false,
        });
      }
    }

    const tailored = tailorResumeLocally(
      profile,
      body.targetJob,
      body.targetRole
    );
    const localResume: StructuredResume = {
      ...tailored,
      pageSize: profile.structuredResume?.pageSize || pageSize,
      density: profile.structuredResume?.density || 'standard',
      fontFamily: profile.structuredResume?.fontFamily || 'calibri',
    };
    const snapshotId = await saveTailoredSnapshot({
      targetJob: body.targetJob,
      targetRole: body.targetRole,
      method: 'smart-engine',
      resume: localResume,
    });
    return NextResponse.json({
      resume: localResume,
      method: 'smart-engine',
      snapshotId,
      personalApiUsed: false,
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

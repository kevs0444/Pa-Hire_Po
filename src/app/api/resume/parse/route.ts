import { NextRequest, NextResponse } from 'next/server';
import {
  extractSkillsFromResume,
  extractSummaryFromResume,
  inferDynamicRoles,
} from '@/features/resume/lib/resume-analyzer';
import { FREE_TIER_LIMITS } from '@/lib/supabase/free-tier-limits';
import { resolveServerSession } from '@/lib/supabase/session';

function extractReadableTextFromPdfBuffer(buffer: Buffer): string {
  const raw = buffer.toString('latin1');
  const chunks: string[] = [];

  // Extract PDF text operator strings like (SQL Developer) Tj or [(Data) -10 (Analyst)] TJ
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

  // Fallback: extract printable ASCII words/lines (useful for uncompressed PDFs)
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

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let resumeText = '';
    let fileName: string | null = null;
    let primaryRole = '';
    let uploadedFileBuffer: Buffer | null = null;
    let uploadedMimeType = 'application/octet-stream';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      const roleField = formData.get('primaryRole');
      const textField = formData.get('resumeText');

      if (typeof roleField === 'string') {
        primaryRole = roleField;
      }

      if (file instanceof File) {
        if (file.size > FREE_TIER_LIMITS.maxResumeUploadBytes) {
          return NextResponse.json(
            {
              error:
                'Resume file exceeds the 4.5 MB free-tier upload limit. Please upload a compact PDF or paste text directly.',
            },
            { status: 413 }
          );
        }

        fileName = file.name;
        uploadedMimeType = file.type || uploadedMimeType;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        uploadedFileBuffer = buffer;

        if (file.name.toLowerCase().endsWith('.pdf')) {
          resumeText = extractReadableTextFromPdfBuffer(buffer);
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
      };
      resumeText = body.resumeText || '';
      fileName = body.fileName ?? null;
      primaryRole = body.primaryRole || '';
    }

    const cleanText = resumeText.trim();
    if (!cleanText || cleanText.length < 15) {
      return NextResponse.json(
        {
          error:
            'Could not extract enough readable text from that file. If it is a scanned/compressed PDF, paste your resume text directly into the editor!',
        },
        { status: 400 }
      );
    }

    const skills = extractSkillsFromResume(cleanText);
    const summary = extractSummaryFromResume(cleanText);
    const suggestedRoles = inferDynamicRoles(cleanText, skills, primaryRole).slice(0, 8);

    // Upload raw resume file to Supabase Storage bucket 'resumes' when authenticated
    let storagePath: string | null = null;
    if (uploadedFileBuffer && fileName) {
      try {
        const session = await resolveServerSession();
        if (
          session.authenticated &&
          session.mode === 'supabase' &&
          session.dbClient &&
          session.authUser
        ) {
          const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
          const objectPath = `${session.authUser.id}/latest-${safeName}`;

          // Single-slot Storage optimization: delete previous CV object so Storage stays minimal
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

    const warning =
      fileName?.toLowerCase().endsWith('.pdf') && skills.length === 0
        ? 'Compressed PDF streams can hide some formatting—verify or paste your plain-text resume below for best accuracy.'
        : undefined;

    return NextResponse.json({
      resumeText: cleanText,
      fileName,
      storagePath,
      summary,
      skills,
      suggestedRoles,
      recommendedPrimaryRole:
        suggestedRoles[0]?.role ||
        primaryRole ||
        'Data Analyst / Junior Data Analyst',
      warning,
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

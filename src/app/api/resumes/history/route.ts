import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import type {
  StructuredResume,
  TailoredResumeRecord,
  TailoredResumeSourceType,
} from '@/types/resume';
import { resolveServerSession } from '@/lib/supabase/session';
import { FREE_TIER_LIMITS } from '@/lib/supabase/free-tier-limits';

const LOCAL_RESUMES_PATH = path.join(
  process.cwd(),
  '.data',
  'tailored-resumes.json'
);

interface TailoredResumeRow {
  id: string;
  user_id: string;
  job_id: string | null;
  job_title: string | null;
  company: string | null;
  tailor_method: string | null;
  source_type?: string | null;
  is_sent?: boolean | null;
  sent_at?: string | null;
  notes?: string | null;
  resume_data: StructuredResume;
  created_at: string;
  updated_at?: string | null;
}

function rowToRecord(row: TailoredResumeRow): TailoredResumeRecord {
  const method = row.tailor_method || 'base';
  const inferredSource: TailoredResumeSourceType =
    row.source_type === 'manual-edit' ||
    row.source_type === 'smart-engine' ||
    row.source_type === 'ai-tailor' ||
    row.source_type === 'base'
      ? row.source_type
      : method === 'gemini-ai'
        ? 'ai-tailor'
        : method === 'smart-engine'
          ? 'smart-engine'
          : 'base';

  return {
    id: row.id,
    userId: row.user_id,
    jobId: row.job_id ?? null,
    jobTitle: row.job_title ?? null,
    company: row.company ?? null,
    tailorMethod: row.tailor_method ?? null,
    sourceType: inferredSource,
    isSent: Boolean(row.is_sent),
    sentAt: row.sent_at ?? null,
    notes: row.notes || '',
    resumeData: row.resume_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

async function readLocalSnapshots(): Promise<TailoredResumeRecord[]> {
  try {
    const raw = await fs.readFile(LOCAL_RESUMES_PATH, 'utf8');
    const parsed = JSON.parse(raw) as TailoredResumeRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLocalSnapshots(
  records: TailoredResumeRecord[]
): Promise<boolean> {
  try {
    await fs.mkdir(path.dirname(LOCAL_RESUMES_PATH), { recursive: true });
    await fs.writeFile(
      LOCAL_RESUMES_PATH,
      JSON.stringify(records, null, 2),
      'utf8'
    );
    return true;
  } catch {
    return false;
  }
}

function isMissingColumnError(err: unknown): boolean {
  const code = (err as { code?: string })?.code || '';
  const msg = (err as { message?: string })?.message || '';
  return (
    code === '42703' ||
    code === 'PGRST204' ||
    msg.includes('source_type') ||
    msg.includes('is_sent') ||
    msg.includes('sent_at') ||
    msg.includes('updated_at')
  );
}

export async function GET() {
  const session = await resolveServerSession();
  if (!session.authenticated || !session.authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.mode === 'supabase' && session.dbClient) {
    try {
      const { data, error } = await session.dbClient
        .from('tailored_resumes')
        .select('*')
        .eq('user_id', session.authUser.id)
        .order('created_at', { ascending: false })
        .limit(FREE_TIER_LIMITS.maxTailoredSnapshotsPerUser)
        .returns<TailoredResumeRow[]>();

      if (error) throw error;
      return NextResponse.json({
        records: (data || []).map(rowToRecord),
        storageMode: 'supabase-cloud',
      });
    } catch {
      if (!session.authUser.isAdmin) {
        return NextResponse.json(
          { error: 'Unable to load resume compilation' },
          { status: 500 }
        );
      }
    }
  }

  const local = await readLocalSnapshots();
  return NextResponse.json({
    records: local,
    storageMode: 'local-file',
  });
}

export async function POST(request: NextRequest) {
  const session = await resolveServerSession();
  if (!session.authenticated || !session.authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    jobId?: string | null;
    jobTitle?: string | null;
    company?: string | null;
    tailorMethod?: string | null;
    sourceType?: TailoredResumeSourceType;
    isSent?: boolean;
    sentAt?: string | null;
    notes?: string;
    resumeData?: StructuredResume;
  };

  if (!body.resumeData) {
    return NextResponse.json(
      { error: 'resumeData is required' },
      { status: 400 }
    );
  }

  const nowIso = new Date().toISOString();
  const sourceType: TailoredResumeSourceType =
    body.sourceType ||
    (body.tailorMethod === 'gemini-ai'
      ? 'ai-tailor'
      : body.tailorMethod === 'smart-engine'
        ? 'smart-engine'
        : 'manual-edit');

  if (session.mode === 'supabase' && session.dbClient) {
    const db = session.dbClient;
    const extendedPayload = {
      user_id: session.authUser.id,
      job_id: body.jobId ?? null,
      job_title:
        body.jobTitle ?? body.resumeData.tailoredForJobTitle ?? null,
      company: body.company ?? body.resumeData.tailoredForCompany ?? null,
      tailor_method:
        body.tailorMethod ?? body.resumeData.tailorMethod ?? 'base',
      source_type: sourceType,
      is_sent: Boolean(body.isSent),
      sent_at: body.isSent ? body.sentAt || nowIso : null,
      notes: body.notes || '',
      resume_data: body.resumeData,
      updated_at: nowIso,
    };

    let insertRes = await db
      .from('tailored_resumes')
      .insert(extendedPayload)
      .select('*')
      .single<TailoredResumeRow>();

    if (insertRes.error && isMissingColumnError(insertRes.error)) {
      insertRes = await db
        .from('tailored_resumes')
        .insert({
          user_id: session.authUser.id,
          job_id: extendedPayload.job_id,
          job_title: extendedPayload.job_title,
          company: extendedPayload.company,
          tailor_method: extendedPayload.tailor_method,
          resume_data: extendedPayload.resume_data,
        })
        .select('*')
        .single<TailoredResumeRow>();
    }

    if (insertRes.error) {
      return NextResponse.json(
        { error: insertRes.error.message || 'Failed to save resume snapshot' },
        { status: 500 }
      );
    }

    // Prune only unsent snapshots beyond the free-tier cap
    try {
      const { data: overflowRows } = await db
        .from('tailored_resumes')
        .select('id, is_sent')
        .eq('user_id', session.authUser.id)
        .order('created_at', { ascending: false })
        .range(FREE_TIER_LIMITS.maxTailoredSnapshotsPerUser, 500);

      const overflowIds = (overflowRows || [])
        .filter((r: { id: string; is_sent?: boolean | null }) => !r.is_sent)
        .map((r: { id: string }) => r.id);

      if (overflowIds.length > 0) {
        await db
          .from('tailored_resumes')
          .delete()
          .eq('user_id', session.authUser.id)
          .in('id', overflowIds);
      }
    } catch {
      // Non-blocking cap cleanup
    }

    return NextResponse.json({
      record: rowToRecord(insertRes.data),
      storageMode: 'supabase-cloud',
    });
  }

  // Local Admin Sandbox mode
  const local = await readLocalSnapshots();
  const created: TailoredResumeRecord = {
    id: `local-res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId: session.authUser.id,
    jobId: body.jobId ?? null,
    jobTitle: body.jobTitle ?? body.resumeData.tailoredForJobTitle ?? null,
    company: body.company ?? body.resumeData.tailoredForCompany ?? null,
    tailorMethod: body.tailorMethod ?? body.resumeData.tailorMethod ?? 'base',
    sourceType,
    isSent: Boolean(body.isSent),
    sentAt: body.isSent ? body.sentAt || nowIso : null,
    notes: body.notes || '',
    resumeData: body.resumeData,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  await writeLocalSnapshots([created, ...local].slice(0, 100));
  return NextResponse.json({ record: created, storageMode: 'local-file' });
}

export async function PATCH(request: NextRequest) {
  const session = await resolveServerSession();
  if (!session.authenticated || !session.authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    id?: string;
    jobTitle?: string | null;
    company?: string | null;
    isSent?: boolean;
    sentAt?: string | null;
    notes?: string;
    resumeData?: StructuredResume;
  };

  if (!body.id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const nowIso = new Date().toISOString();

  if (session.mode === 'supabase' && session.dbClient) {
    const patchPayload: Record<string, unknown> = {
      updated_at: nowIso,
    };
    if (body.jobTitle !== undefined) patchPayload.job_title = body.jobTitle;
    if (body.company !== undefined) patchPayload.company = body.company;
    if (body.isSent !== undefined) {
      patchPayload.is_sent = body.isSent;
      patchPayload.sent_at = body.isSent ? body.sentAt || nowIso : null;
    }
    if (body.notes !== undefined) patchPayload.notes = body.notes;
    if (body.resumeData !== undefined) patchPayload.resume_data = body.resumeData;

    let res = await session.dbClient
      .from('tailored_resumes')
      .update(patchPayload)
      .eq('id', body.id)
      .eq('user_id', session.authUser.id)
      .select('*')
      .single<TailoredResumeRow>();

    if (res.error && isMissingColumnError(res.error)) {
      const basePatch: Record<string, unknown> = {};
      if (body.jobTitle !== undefined) basePatch.job_title = body.jobTitle;
      if (body.company !== undefined) basePatch.company = body.company;
      if (body.resumeData !== undefined) basePatch.resume_data = body.resumeData;
      res = await session.dbClient
        .from('tailored_resumes')
        .update(basePatch)
        .eq('id', body.id)
        .eq('user_id', session.authUser.id)
        .select('*')
        .single<TailoredResumeRow>();
    }

    if (res.error) {
      return NextResponse.json(
        { error: res.error.message || 'Update failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ record: rowToRecord(res.data) });
  }

  const local = await readLocalSnapshots();
  let updatedRecord: TailoredResumeRecord | null = null;
  const next = local.map((item) => {
    if (item.id !== body.id) return item;
    updatedRecord = {
      ...item,
      jobTitle: body.jobTitle !== undefined ? body.jobTitle : item.jobTitle,
      company: body.company !== undefined ? body.company : item.company,
      isSent: body.isSent !== undefined ? body.isSent : item.isSent,
      sentAt:
        body.isSent !== undefined
          ? body.isSent
            ? body.sentAt || nowIso
            : null
          : item.sentAt,
      notes: body.notes !== undefined ? body.notes : item.notes,
      resumeData:
        body.resumeData !== undefined ? body.resumeData : item.resumeData,
      updatedAt: nowIso,
    };
    return updatedRecord;
  });
  await writeLocalSnapshots(next);
  return NextResponse.json({ record: updatedRecord });
}

export async function DELETE(request: NextRequest) {
  const session = await resolveServerSession();
  if (!session.authenticated || !session.authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  if (session.mode === 'supabase' && session.dbClient) {
    const { error } = await session.dbClient
      .from('tailored_resumes')
      .delete()
      .eq('id', id)
      .eq('user_id', session.authUser.id);
    if (error) {
      return NextResponse.json(
        { error: error.message || 'Delete failed' },
        { status: 500 }
      );
    }
    return NextResponse.json({ deleted: true });
  }

  const local = await readLocalSnapshots();
  await writeLocalSnapshots(local.filter((r) => r.id !== id));
  return NextResponse.json({ deleted: true });
}

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import type { AppStoreState, JobListing } from '@/types/job';
import { resolveServerSession } from '@/lib/supabase/session';
import { truncateJobForFreeTier } from '@/lib/supabase/free-tier-limits';
import {
  isMissingJobColumnError,
  jobListingToRow,
} from '@/lib/supabase/store-mapper';

const STORE_PATH = path.join(process.cwd(), '.data', 'store.json');

export async function POST(request: NextRequest) {
  const session = await resolveServerSession();
  if (!session.authenticated || !session.authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    job?: JobListing;
  };
  if (!body.job?.id) {
    return NextResponse.json({ error: 'job is required' }, { status: 400 });
  }

  const cleanJob = truncateJobForFreeTier(body.job);
  const { authUser, dbClient, mode } = session;

  if (mode === 'supabase' && dbClient) {
    const extRow = jobListingToRow(authUser.id, cleanJob, true);
    let upsertRes = await dbClient
      .from('user_jobs')
      .upsert(extRow, { onConflict: 'user_id,id' });

    if (upsertRes.error && isMissingJobColumnError(upsertRes.error)) {
      const baseRow = jobListingToRow(authUser.id, cleanJob, false);
      upsertRes = await dbClient
        .from('user_jobs')
        .upsert(baseRow, { onConflict: 'user_id,id' });
    }

    if (upsertRes.error) {
      return NextResponse.json(
        {
          saved: false,
          storageMode: 'browser-only',
          error: upsertRes.error.message || 'Failed to persist job status',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      saved: true,
      storageMode: 'supabase-cloud',
      job: cleanJob,
    });
  }

  if (authUser.isAdmin && !process.env.VERCEL) {
    try {
      const raw = await fs.readFile(STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as AppStoreState;
      const jobs = Array.isArray(parsed.jobs) ? parsed.jobs : [];
      const exists = jobs.some((j) => j.id === cleanJob.id);
      const nextJobs = exists
        ? jobs.map((j) => (j.id === cleanJob.id ? cleanJob : j))
        : [cleanJob, ...jobs];
      await fs.writeFile(
        STORE_PATH,
        JSON.stringify({ ...parsed, jobs: nextJobs }, null, 2),
        'utf8'
      );
      return NextResponse.json({
        saved: true,
        storageMode: 'local-file',
        job: cleanJob,
      });
    } catch {
      // Fall through to browser-only
    }
  }

  return NextResponse.json({
    saved: false,
    storageMode: 'browser-only',
  });
}

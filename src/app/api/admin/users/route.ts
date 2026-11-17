import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import {
  AdminPlatformStats,
  AdminUserRecord,
  AppStoreState,
  UserProfile,
} from '@/types/job';
import { MAR_KEVIN_PROFILE } from '@/lib/default-profile';
import {
  LOCAL_ADMIN_ID,
  PRIMARY_ADMIN_EMAIL,
} from '@/lib/supabase/config';
import {
  FREE_TIER_LIMITS,
  pruneStateForFreeTier,
} from '@/lib/supabase/free-tier-limits';
import { getServerSupabaseConfig } from '@/lib/supabase/server-env';
import { resolveServerSession } from '@/lib/supabase/session';
import { UserProfileRow } from '@/lib/supabase/store-mapper';

async function readLocalStoreFallback(): Promise<AppStoreState | null> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), '.data', 'store.json'),
      'utf8'
    );
    return JSON.parse(raw) as AppStoreState;
  } catch {
    return null;
  }
}

export async function GET() {
  const session = await resolveServerSession();
  if (!session.authenticated || !session.authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.authUser.isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden: Admin role required.' },
      { status: 403 }
    );
  }

  const cfg = getServerSupabaseConfig();
  const nowMs = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  if (session.mode === 'supabase' && session.dbClient) {
    try {
      const db = session.dbClient;
      const [profilesRes, jobsRes, scansRes, tailoredRes] = await Promise.all([
        db
          .from('user_profiles')
          .select('*')
          .order('last_active_at', { ascending: false })
          .returns<UserProfileRow[]>(),
        db.from('user_jobs').select('user_id, status'),
        db.from('scan_logs').select('user_id'),
        db.from('tailored_resumes').select('user_id'),
      ]);

      if (profilesRes.error) throw profilesRes.error;

      const profiles = profilesRes.data || [];
      const jobs = (jobsRes.data || []) as { user_id: string; status: string }[];
      const scans = (scansRes.data || []) as { user_id: string }[];
      const tailoredCount =
        !tailoredRes.error && Array.isArray(tailoredRes.data)
          ? tailoredRes.data.length
          : 0;

      // Optional full auth.users lookup when SUPABASE_SERVICE_ROLE_KEY is configured
      const authUsersMap = new Map<
        string,
        {
          email: string;
          fullName: string;
          provider: string;
          createdAt: string | null;
          lastSignInAt: string | null;
        }
      >();

      if (session.adminClient) {
        const { data: listData } =
          await session.adminClient.auth.admin.listUsers({
            page: 1,
            perPage: 1000,
          });
        for (const u of listData?.users || []) {
          authUsersMap.set(u.id, {
            email: u.email || '',
            fullName:
              (u.user_metadata?.full_name as string | undefined) ||
              (u.user_metadata?.name as string | undefined) ||
              u.email?.split('@')[0] ||
              'User',
            provider:
              (u.app_metadata?.provider as string | undefined) || 'email',
            createdAt: u.created_at || null,
            lastSignInAt: u.last_sign_in_at || null,
          });
        }
      }

      const jobCountsByUser = new Map<
        string,
        { total: number; saved: number; applied: number }
      >();
      for (const job of jobs) {
        const cur = jobCountsByUser.get(job.user_id) || {
          total: 0,
          saved: 0,
          applied: 0,
        };
        cur.total += 1;
        if (job.status === 'saved') cur.saved += 1;
        if (job.status === 'applied') cur.applied += 1;
        jobCountsByUser.set(job.user_id, cur);
      }

      const scanCountsByUser = new Map<string, number>();
      for (const s of scans) {
        scanCountsByUser.set(s.user_id, (scanCountsByUser.get(s.user_id) || 0) + 1);
      }

      const profileById = new Map(profiles.map((p) => [p.id, p]));
      const allIds = Array.from(
        new Set([...profiles.map((p) => p.id), ...authUsersMap.keys()])
      );

      const records: AdminUserRecord[] = allIds.map((id) => {
        const p = profileById.get(id);
        const authMeta = authUsersMap.get(id);
        const pData = (p?.profile_data || {}) as Partial<UserProfile>;
        const counts = jobCountsByUser.get(id) || {
          total: 0,
          saved: 0,
          applied: 0,
        };

        return {
          id,
          email: p?.email || authMeta?.email || '',
          fullName:
            p?.full_name ||
            pData.name ||
            authMeta?.fullName ||
            'Pending Profile',
          role: p?.role === 'admin' ? 'admin' : 'user',
          isSuspended: Boolean(p?.is_suspended),
          primaryRole: pData.primaryRole || 'Not configured yet',
          location: pData.location || '—',
          skillsCount: Array.isArray(pData.skills) ? pData.skills.length : 0,
          totalJobs: counts.total,
          savedJobs: counts.saved,
          appliedJobs: counts.applied,
          scansCount: scanCountsByUser.get(id) || 0,
          resumeFileName: p?.resume_file_name || pData.resumeFileName || null,
          resumeFilePath: p?.resume_file_path || null,
          provider: authMeta?.provider || 'supabase',
          lastActiveAt:
            p?.last_active_at || authMeta?.lastSignInAt || p?.created_at || null,
          createdAt: p?.created_at || authMeta?.createdAt || null,
        };
      });

      records.sort((a, b) => {
        if (a.role !== b.role) return a.role === 'admin' ? -1 : 1;
        return (
          new Date(b.lastActiveAt || 0).getTime() -
          new Date(a.lastActiveAt || 0).getTime()
        );
      });

      const resumesStoredCount = records.filter((r) =>
        Boolean(r.resumeFilePath)
      ).length;
      const estimatedDbBytes =
        profiles.length * 8192 +
        jobs.length * 3584 +
        scans.length * 2048 +
        tailoredCount * 6144;

      const stats: AdminPlatformStats = {
        totalUsers: records.length,
        activeLast7d: records.filter(
          (r) =>
            r.lastActiveAt &&
            nowMs - new Date(r.lastActiveAt).getTime() <= sevenDaysMs
        ).length,
        adminUsers: records.filter((r) => r.role === 'admin').length,
        suspendedUsers: records.filter((r) => r.isSuspended).length,
        totalJobsTracked: records.reduce((sum, r) => sum + r.totalJobs, 0),
        totalSavedJobs: records.reduce((sum, r) => sum + r.savedJobs, 0),
        totalAppliedJobs: records.reduce((sum, r) => sum + r.appliedJobs, 0),
        totalScans: records.reduce((sum, r) => sum + r.scansCount, 0),
        resumesStoredCount,
        freeTier: {
          estimatedDbBytes,
          maxDbBytes: FREE_TIER_LIMITS.maxDbSizeMb * 1024 * 1024,
          estimatedStorageFiles: resumesStoredCount,
          maxSuggestedJobsPerUser: FREE_TIER_LIMITS.maxSuggestedJobsPerUser,
          maxScanLogsPerUser: FREE_TIER_LIMITS.maxScanLogsPerUser,
          targetUsers: FREE_TIER_LIMITS.targetActiveUsers,
          maxFreeMau: FREE_TIER_LIMITS.maxFreeMau,
          keepAliveCron: FREE_TIER_LIMITS.keepAliveCron,
        },
      };

      return NextResponse.json({
        mode: 'supabase-cloud',
        schemaReady: true,
        hasServiceRole: cfg.hasServiceRole,
        supabaseUrl: cfg.url,
        projectRef: cfg.projectRef,
        stats,
        users: records,
      });
    } catch {
      // Schema not run yet -> fall through to local backup preview
    }
  }

  // Local fallback summary
  const local = await readLocalStoreFallback();
  const localUsers = local?.users?.length ? local.users : [MAR_KEVIN_PROFILE];
  const localJobs = local?.jobs || [];
  const localScans = local?.scanHistory || [];

  const records: AdminUserRecord[] = localUsers.map((u, idx) => ({
    id: idx === 0 ? LOCAL_ADMIN_ID : u.id,
    email:
      u.structuredResume?.email ||
      (idx === 0 ? PRIMARY_ADMIN_EMAIL : `${u.id}@local`),
    fullName: u.name,
    role: idx === 0 ? 'admin' : 'user',
    isSuspended: false,
    primaryRole: u.primaryRole,
    location: u.location,
    skillsCount: u.skills.length,
    totalJobs: idx === 0 ? localJobs.length : 0,
    savedJobs:
      idx === 0 ? localJobs.filter((j) => j.status === 'saved').length : 0,
    appliedJobs:
      idx === 0 ? localJobs.filter((j) => j.status === 'applied').length : 0,
    scansCount: idx === 0 ? localScans.length : 0,
    resumeFileName: u.resumeFileName,
    resumeFilePath: null,
    provider: 'local-sandbox',
    lastActiveAt: local?.lastScannedAt || new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }));

  const stats: AdminPlatformStats = {
    totalUsers: records.length,
    activeLast7d: records.length,
    adminUsers: 1,
    suspendedUsers: 0,
    totalJobsTracked: localJobs.length,
    totalSavedJobs: localJobs.filter((j) => j.status === 'saved').length,
    totalAppliedJobs: localJobs.filter((j) => j.status === 'applied').length,
    totalScans: localScans.length,
    resumesStoredCount: 0,
    freeTier: {
      estimatedDbBytes:
        localUsers.length * 8192 +
        localJobs.length * 3584 +
        localScans.length * 2048,
      maxDbBytes: FREE_TIER_LIMITS.maxDbSizeMb * 1024 * 1024,
      estimatedStorageFiles: 0,
      maxSuggestedJobsPerUser: FREE_TIER_LIMITS.maxSuggestedJobsPerUser,
      maxScanLogsPerUser: FREE_TIER_LIMITS.maxScanLogsPerUser,
      targetUsers: FREE_TIER_LIMITS.targetActiveUsers,
      maxFreeMau: FREE_TIER_LIMITS.maxFreeMau,
      keepAliveCron: FREE_TIER_LIMITS.keepAliveCron,
    },
  };

  return NextResponse.json({
    mode: 'schema-pending',
    schemaReady: false,
    hasServiceRole: cfg.hasServiceRole,
    supabaseUrl: cfg.url,
    projectRef: cfg.projectRef,
    stats,
    users: records,
  });
}

export async function POST(request: NextRequest) {
  const session = await resolveServerSession();
  if (!session.authenticated || !session.authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.authUser.isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden: Admin role required.' },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { action?: string };
  if (body.action !== 'prune-free-tier') {
    return NextResponse.json({ error: 'Unsupported admin action.' }, { status: 400 });
  }

  if (session.mode === 'supabase' && session.dbClient) {
    try {
      const db = session.dbClient;
      const { data: profiles, error: profilesError } = await db
        .from('user_profiles')
        .select('id');

      if (profilesError) throw profilesError;

      let prunedJobs = 0;
      let prunedScans = 0;
      let prunedSnapshots = 0;

      for (const profile of (profiles || []) as { id: string }[]) {
        const uid = profile.id;

        const { data: ephemeralJobs } = await db
          .from('user_jobs')
          .select('id, match_score, updated_at, is_fallback')
          .eq('user_id', uid)
          .in('status', ['suggested', 'hidden']);

        const jobRows = (ephemeralJobs || []) as {
          id: string;
          match_score: number | null;
          updated_at: string | null;
          is_fallback: boolean | null;
        }[];

        if (jobRows.length > FREE_TIER_LIMITS.maxSuggestedJobsPerUser) {
          jobRows.sort((a, b) => {
            const fbA = Boolean(a.is_fallback);
            const fbB = Boolean(b.is_fallback);
            if (fbA !== fbB) return fbA ? 1 : -1;
            const scoreDiff = (b.match_score || 0) - (a.match_score || 0);
            if (scoreDiff !== 0) return scoreDiff;
            return (
              new Date(b.updated_at || 0).getTime() -
              new Date(a.updated_at || 0).getTime()
            );
          });

          const removeIds = jobRows
            .slice(FREE_TIER_LIMITS.maxSuggestedJobsPerUser)
            .map((r) => r.id);

          if (removeIds.length > 0) {
            await db
              .from('user_jobs')
              .delete()
              .eq('user_id', uid)
              .in('id', removeIds);
            prunedJobs += removeIds.length;
          }
        }

        const { data: scanOverflow } = await db
          .from('scan_logs')
          .select('id')
          .eq('user_id', uid)
          .order('timestamp', { ascending: false })
          .range(FREE_TIER_LIMITS.maxScanLogsPerUser, 2000);

        const scanIds = (scanOverflow || []).map((r: { id: string }) => r.id);
        if (scanIds.length > 0) {
          await db.from('scan_logs').delete().eq('user_id', uid).in('id', scanIds);
          prunedScans += scanIds.length;
        }

        const { data: snapOverflow, error: snapErr } = await db
          .from('tailored_resumes')
          .select('id')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          .range(FREE_TIER_LIMITS.maxTailoredSnapshotsPerUser, 2000);

        if (!snapErr && Array.isArray(snapOverflow) && snapOverflow.length > 0) {
          const snapIds = snapOverflow.map((r: { id: string }) => r.id);
          await db
            .from('tailored_resumes')
            .delete()
            .eq('user_id', uid)
            .in('id', snapIds);
          prunedSnapshots += snapIds.length;
        }
      }

      return NextResponse.json({
        ok: true,
        mode: 'supabase-cloud',
        prunedJobs,
        prunedScans,
        prunedSnapshots,
        message: `Free-tier prune complete: removed ${prunedJobs} stale jobs, ${prunedScans} old scan logs, and ${prunedSnapshots} older AI resume snapshots.`,
      });
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : 'Failed to run Supabase free-tier prune.',
        },
        { status: 500 }
      );
    }
  }

  // Local store prune fallback
  const storePath = path.join(process.cwd(), '.data', 'store.json');
  const local = await readLocalStoreFallback();
  if (!local) {
    return NextResponse.json({
      ok: true,
      mode: 'local',
      prunedJobs: 0,
      prunedScans: 0,
      prunedSnapshots: 0,
      message: 'Local workspace is already within free-tier retention caps.',
    });
  }

  const pruned = pruneStateForFreeTier(local);
  const prunedJobs = Math.max(0, (local.jobs?.length || 0) - pruned.jobs.length);
  const prunedScans = Math.max(
    0,
    (local.scanHistory?.length || 0) - pruned.scanHistory.length
  );

  if (prunedJobs > 0 || prunedScans > 0) {
    await fs.writeFile(storePath, JSON.stringify(pruned, null, 2), 'utf8');
  }

  return NextResponse.json({
    ok: true,
    mode: 'local',
    prunedJobs,
    prunedScans,
    prunedSnapshots: 0,
    message: `Local prune complete: trimmed ${prunedJobs} stale jobs and ${prunedScans} old scan logs.`,
  });
}

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { AppStoreState, UserProfile, UserRole } from '@/types/job';
import {
  MAR_KEVIN_PROFILE,
  createBlankUserProfile,
} from '@/lib/default-profile';
import {
  LOCAL_ADMIN_ID,
  PRIMARY_ADMIN_EMAIL,
} from '@/lib/supabase/config';
import { resolveServerSession } from '@/lib/supabase/session';
import {
  UserJobRow,
  UserProfileRow,
  ScanLogRow,
  rowToJobListing,
  rowToScanEntry,
} from '@/lib/supabase/store-mapper';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const session = await resolveServerSession();
  if (!session.authenticated || !session.authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await context.params;

  if (session.mode === 'supabase' && session.dbClient) {
    try {
      const db = session.dbClient;
      const [{ data: profileRow }, { data: jobRows }, { data: scanRows }, { data: tailoredRows }] =
        await Promise.all([
          db
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle<UserProfileRow>(),
          db
            .from('user_jobs')
            .select('*')
            .eq('user_id', userId)
            .order('match_score', { ascending: false })
            .returns<UserJobRow[]>(),
          db
            .from('scan_logs')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })
            .limit(15)
            .returns<ScanLogRow[]>(),
          db
            .from('tailored_resumes')
            .select('id, job_title, company, tailor_method, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10),
        ]);

      let email = profileRow?.email || '';
      let fullName = profileRow?.full_name || 'User';

      if (!profileRow && session.adminClient) {
        const { data: authData } =
          await session.adminClient.auth.admin.getUserById(userId);
        if (authData?.user) {
          email = authData.user.email || '';
          fullName =
            (authData.user.user_metadata?.full_name as string | undefined) ||
            email.split('@')[0] ||
            'User';
        }
      }

      const baseFallback =
        email.toLowerCase() === PRIMARY_ADMIN_EMAIL
          ? MAR_KEVIN_PROFILE
          : createBlankUserProfile({
              name: fullName,
              email,
              primaryRole: 'Data Analyst / Junior Data Analyst',
            });

      const rawData = (profileRow?.profile_data || {}) as Partial<UserProfile>;
      const profile: UserProfile = {
        ...baseFallback,
        ...rawData,
        id: userId,
        name: rawData.name || fullName,
        structuredResume: {
          ...baseFallback.structuredResume,
          ...(rawData.structuredResume || {}),
          email:
            rawData.structuredResume?.email ||
            email ||
            baseFallback.structuredResume.email,
        },
      };

      let resumeDownloadUrl: string | null = null;
      if (profileRow?.resume_file_path) {
        const { data: signed } = await db.storage
          .from('resumes')
          .createSignedUrl(profileRow.resume_file_path, 3600);
        resumeDownloadUrl = signed?.signedUrl || null;
      }

      return NextResponse.json({
        userId,
        email,
        role: profileRow?.role || 'user',
        isSuspended: Boolean(profileRow?.is_suspended),
        resumeFileName: profileRow?.resume_file_name || null,
        resumeFilePath: profileRow?.resume_file_path || null,
        resumeDownloadUrl,
        lastActiveAt: profileRow?.last_active_at || null,
        createdAt: profileRow?.created_at || null,
        profile,
        jobs: (jobRows || []).map(rowToJobListing),
        scanHistory: (scanRows || []).map(rowToScanEntry),
        tailoredResumes: tailoredRows || [],
      });
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : 'Failed to inspect user data.',
        },
        { status: 500 }
      );
    }
  }

  // Local fallback inspection
  let local: AppStoreState | null = null;
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), '.data', 'store.json'),
      'utf8'
    );
    local = JSON.parse(raw) as AppStoreState;
  } catch {
    local = null;
  }

  const target =
    userId === LOCAL_ADMIN_ID
      ? local?.users?.[0] || MAR_KEVIN_PROFILE
      : local?.users?.find((u) => u.id === userId) || MAR_KEVIN_PROFILE;

  return NextResponse.json({
    userId,
    email: target.structuredResume?.email || PRIMARY_ADMIN_EMAIL,
    role: 'admin',
    isSuspended: false,
    resumeFileName: target.resumeFileName,
    resumeFilePath: null,
    resumeDownloadUrl: null,
    lastActiveAt: local?.lastScannedAt || new Date().toISOString(),
    createdAt: new Date().toISOString(),
    profile: target,
    jobs: local?.jobs || [],
    scanHistory: local?.scanHistory || [],
    tailoredResumes: [],
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const session = await resolveServerSession();
  if (!session.authenticated || !session.authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (session.mode !== 'supabase' || !session.dbClient) {
    return NextResponse.json(
      { error: 'Connect Supabase & apply schema.sql to update user roles.' },
      { status: 400 }
    );
  }

  const { userId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    role?: UserRole;
    isSuspended?: boolean;
  };

  const { data: targetRow } = await session.dbClient
    .from('user_profiles')
    .select('id, email, role, is_suspended')
    .eq('id', userId)
    .maybeSingle();

  if (
    targetRow?.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL &&
    (body.role === 'user' || body.isSuspended === true)
  ) {
    return NextResponse.json(
      { error: 'Cannot downgrade or suspend the primary owner admin account.' },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (body.role === 'admin' || body.role === 'user') {
    updates.role = body.role;
  }
  if (typeof body.isSuspended === 'boolean') {
    updates.is_suspended = body.isSuspended;
  }

  const { error } = await session.dbClient
    .from('user_profiles')
    .update(updates)
    .eq('id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (typeof body.isSuspended === 'boolean' && session.adminClient) {
    await session.adminClient.auth.admin
      .updateUserById(userId, {
        ban_duration: body.isSuspended ? '876000h' : 'none',
      })
      .catch(() => undefined);
  }

  return NextResponse.json({ ok: true, userId, ...updates });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const session = await resolveServerSession();
  if (!session.authenticated || !session.authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (session.mode !== 'supabase' || !session.dbClient) {
    return NextResponse.json(
      { error: 'Connect Supabase & apply schema.sql to delete cloud users.' },
      { status: 400 }
    );
  }

  const { userId } = await context.params;

  if (userId === session.authUser.id) {
    return NextResponse.json(
      { error: 'You cannot delete your own active admin account.' },
      { status: 400 }
    );
  }

  const { data: targetRow } = await session.dbClient
    .from('user_profiles')
    .select('email')
    .eq('id', userId)
    .maybeSingle();

  if (targetRow?.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL) {
    return NextResponse.json(
      { error: 'Cannot delete the primary owner admin account.' },
      { status: 400 }
    );
  }

  await session.dbClient.from('user_profiles').delete().eq('id', userId);

  if (session.adminClient) {
    const { error: authDelErr } =
      await session.adminClient.auth.admin.deleteUser(userId);
    if (authDelErr) {
      return NextResponse.json(
        {
          ok: true,
          warning: `Profile data deleted, but Auth deletion returned: ${authDelErr.message}`,
        },
        { status: 200 }
      );
    }
    return NextResponse.json({ ok: true, deletedAuthUser: true });
  }

  return NextResponse.json({
    ok: true,
    deletedAuthUser: false,
    warning:
      'User profile and job data removed. Add SUPABASE_SERVICE_ROLE_KEY in .env to also delete the auth.users login record.',
  });
}

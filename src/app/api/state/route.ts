import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { AppStoreState } from '@/types/job';
import { MAR_KEVIN_PROFILE, createBlankUserProfile } from '@/lib/default-profile';
import { resolveServerSession } from '@/lib/supabase/session';
import {
  buildSeededUserProfile,
  fetchUserStoreFromSupabase,
  syncUserStoreToSupabase,
} from '@/lib/supabase/store-mapper';

const DATA_DIR = path.join(process.cwd(), '.data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

async function readLocalBackupStore(): Promise<AppStoreState | null> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    return JSON.parse(raw) as AppStoreState;
  } catch {
    return null;
  }
}

async function writeLocalBackupStore(state: AppStoreState): Promise<boolean> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify(state, null, 2), 'utf8');
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const personalApiConfigured = Boolean(process.env.GEMINI_API_KEY?.trim());
  const session = await resolveServerSession();

  if (!session.authenticated || !session.authUser) {
    return NextResponse.json(
      {
        exists: false,
        unauthorized: true,
        storageMode: 'unauthenticated',
        personalApiConfigured,
        authUser: null,
        state: null,
      },
      { status: 401 }
    );
  }

  const { authUser, dbClient, mode, supabaseUser } = session;

  if (mode === 'supabase' && dbClient && supabaseUser) {
    try {
      const fallbackProfile = authUser.isAdmin
        ? { ...MAR_KEVIN_PROFILE, id: authUser.id }
        : {
            ...createBlankUserProfile({
              name: authUser.fullName,
              email: authUser.email,
              primaryRole:
                (supabaseUser.user_metadata?.primary_role as string | undefined) ||
                'Data Analyst / Junior Data Analyst',
            }),
            id: authUser.id,
          };

      const existing = await fetchUserStoreFromSupabase(
        dbClient,
        authUser.id,
        fallbackProfile
      );

      if (existing) {
        return NextResponse.json({
          exists: true,
          storageMode: 'supabase-cloud',
          schemaReady: true,
          personalApiConfigured,
          authUser,
          state: existing.state,
        });
      }

      // First login for this Supabase user -> auto-seed Admin or clean starter profile
      const localBackup = authUser.isAdmin ? await readLocalBackupStore() : null;
      const seeded = buildSeededUserProfile({
        userId: authUser.id,
        email: authUser.email,
        fullName: authUser.fullName,
        isAdmin: authUser.isAdmin,
        primaryRole:
          (supabaseUser.user_metadata?.primary_role as string | undefined) ||
          undefined,
        localBackupState: localBackup,
      });

      const initialState: AppStoreState = {
        users: [seeded.profile],
        activeUserId: authUser.id,
        theme: seeded.theme,
        geminiApiKey: '',
        jobs: seeded.jobs,
        queuedJobIds: seeded.queuedJobIds,
        autoApplyConfig: seeded.autoApplyConfig,
        scanHistory: seeded.scanHistory,
        lastScannedAt: seeded.lastScannedAt,
      };

      await syncUserStoreToSupabase(dbClient, {
        userId: authUser.id,
        email: authUser.email,
        role: authUser.role,
        state: initialState,
      });

      return NextResponse.json({
        exists: true,
        storageMode: 'supabase-cloud',
        schemaReady: true,
        personalApiConfigured,
        authUser,
        state: initialState,
      });
    } catch {
      // Schema might not be applied yet -> fall back cleanly to local file or starter state
      const local = authUser.isAdmin ? await readLocalBackupStore() : null;
      return NextResponse.json({
        exists: Boolean(local),
        storageMode: local ? 'local-file' : 'browser-only',
        schemaReady: false,
        personalApiConfigured,
        authUser,
        state: local,
      });
    }
  }

  // Local Admin Sandbox mode (before Supabase keys or schema are pasted)
  const local = await readLocalBackupStore();
  return NextResponse.json({
    exists: Boolean(local),
    storageMode: local || !process.env.VERCEL ? 'local-file' : 'browser-only',
    schemaReady: false,
    personalApiConfigured,
    authUser,
    state: local,
  });
}

export async function POST(request: NextRequest) {
  const session = await resolveServerSession();
  if (!session.authenticated || !session.authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rawBody = (await request.json()) as AppStoreState & {
      _syncScope?: 'full' | 'profile-only';
    };
    const syncScope: 'full' | 'profile-only' =
      rawBody._syncScope === 'profile-only' ? 'profile-only' : 'full';
    const { _syncScope: _ignoredScope, ...body } = rawBody;
    void _ignoredScope;
    const { authUser, dbClient, mode } = session;

    if (mode === 'supabase' && dbClient) {
      try {
        await syncUserStoreToSupabase(dbClient, {
          userId: authUser.id,
          email: authUser.email,
          role: authUser.role,
          state: body,
          syncScope,
        });

        return NextResponse.json({
          saved: true,
          storageMode: 'supabase-cloud',
          syncScope,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Supabase sync failed';
        if (!authUser.isAdmin) {
          return NextResponse.json(
            {
              saved: false,
              storageMode: 'browser-only',
              error: message,
            },
            { status: 500 }
          );
        }
      }
    }

    if (authUser.isAdmin) {
      const wroteLocal = await writeLocalBackupStore(body);
      return NextResponse.json({
        saved: wroteLocal,
        storageMode: wroteLocal ? 'local-file' : 'browser-only',
      });
    }

    return NextResponse.json({
      saved: false,
      storageMode: 'browser-only',
    });
  } catch {
    return NextResponse.json({
      saved: false,
      storageMode: 'browser-only',
    });
  }
}

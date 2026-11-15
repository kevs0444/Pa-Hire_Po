import { cookies } from 'next/headers';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import {
  AuthSessionUser,
  UserRole,
} from '@/types/job';
import {
  LOCAL_ADMIN_COOKIE,
  LOCAL_ADMIN_ID,
  PRIMARY_ADMIN_EMAIL,
} from '@/lib/supabase/config';
import {
  getServerSupabaseConfig,
  isServerAdminEmail,
} from '@/lib/supabase/server-env';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export interface ResolvedSession {
  authenticated: boolean;
  mode: 'supabase' | 'local-admin' | 'none';
  authUser: AuthSessionUser | null;
  supabaseUser: User | null;
  supabase: SupabaseClient | null;
  adminClient: SupabaseClient | null;
  dbClient: SupabaseClient | null;
}

export async function resolveServerSession(): Promise<ResolvedSession> {
  const cfg = getServerSupabaseConfig();
  const cookieStore = await cookies();
  const hasLocalCookie = cookieStore.get(LOCAL_ADMIN_COOKIE)?.value === '1';
  const adminClient = createAdminSupabaseClient();

  if (cfg.isConfigured) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const dbClient = adminClient || supabase;
        const { data: profileRow } = await dbClient
          .from('user_profiles')
          .select('role, full_name, is_suspended')
          .eq('id', user.id)
          .maybeSingle();

        const email = user.email || '';
        const isAdmin =
          isServerAdminEmail(email) || profileRow?.role === 'admin';
        const role: UserRole = isAdmin ? 'admin' : 'user';
        const metaName =
          (user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          profileRow?.full_name ||
          email.split('@')[0] ||
          'User';

        return {
          authenticated: !profileRow?.is_suspended,
          mode: 'supabase',
          supabaseUser: user,
          supabase,
          adminClient,
          dbClient,
          authUser: {
            id: user.id,
            email,
            fullName: metaName,
            role,
            isAdmin,
            provider:
              (user.app_metadata?.provider as string | undefined) || 'email',
            mode: 'supabase',
            createdAt: user.created_at || null,
            lastSignInAt: user.last_sign_in_at || null,
          },
        };
      }
    }
  }

  if (hasLocalCookie && !process.env.VERCEL) {
    return {
      authenticated: true,
      mode: 'local-admin',
      supabaseUser: null,
      supabase: null,
      adminClient,
      dbClient: adminClient,
      authUser: {
        id: LOCAL_ADMIN_ID,
        email: PRIMARY_ADMIN_EMAIL,
        fullName: 'Mar Kevin P. Alcantara',
        role: 'admin',
        isAdmin: true,
        provider: 'local-admin',
        mode: 'local-admin',
      },
    };
  }

  return {
    authenticated: false,
    mode: 'none',
    authUser: null,
    supabaseUser: null,
    supabase: null,
    adminClient,
    dbClient: null,
  };
}

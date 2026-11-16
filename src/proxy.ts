import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { LOCAL_ADMIN_COOKIE } from '@/lib/supabase/config';
import { getServerSupabaseConfig } from '@/lib/supabase/server-env';

const PUBLIC_PATHS = new Set(['/login', '/auth/callback']);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const cfg = getServerSupabaseConfig();
  const hasLocalAdmin =
    !process.env.VERCEL &&
    request.cookies.get(LOCAL_ADMIN_COOKIE)?.value === '1';

  let isAuthenticated = hasLocalAdmin;
  let isSuspended = false;

  if (cfg.isConfigured) {
    const supabase = createServerClient(cfg.url, cfg.anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      isAuthenticated = true;
      const { data: profileRow } = await supabase
        .from('user_profiles')
        .select('is_suspended')
        .eq('id', user.id)
        .maybeSingle();

      if (profileRow?.is_suspended) {
        isAuthenticated = false;
        isSuspended = true;
      }
    }
  }

  const isPublicPath = PUBLIC_PATHS.has(pathname);

  if (!isAuthenticated && !isPublicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    if (isSuspended) {
      loginUrl.searchParams.set('error', 'Your account has been suspended by an administrator.');
    } else if (pathname !== '/') {
      loginUrl.searchParams.set('next', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && pathname === '/login') {
    const targetUrl = request.nextUrl.clone();
    const nextPath = request.nextUrl.searchParams.get('next');
    targetUrl.pathname =
      nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')
        ? nextPath
        : '/';
    targetUrl.search = '';
    return NextResponse.redirect(targetUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|auth/callback|favicon.ico|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getServerSupabaseConfig } from '@/lib/supabase/server-env';

const PUBLIC_PATHS = new Set(['/login', '/auth/callback', '/privacy', '/terms']);

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return res;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const cfg = getServerSupabaseConfig();
  let isAuthenticated = false;
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
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  if (
    isAuthenticated &&
    pathname === '/login' &&
    request.nextUrl.searchParams.get('switch') !== '1'
  ) {
    const targetUrl = request.nextUrl.clone();
    const nextPath = request.nextUrl.searchParams.get('next');
    targetUrl.pathname =
      nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')
        ? nextPath
        : '/';
    targetUrl.search = '';
    return applySecurityHeaders(NextResponse.redirect(targetUrl));
  }

  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|auth/callback|favicon.ico|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

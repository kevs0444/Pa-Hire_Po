import { NextRequest, NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  OAUTH_POPUP_CHANNEL,
  OAUTH_POPUP_MESSAGE_TYPE,
} from '@/lib/supabase/oauth-popup';

function createPopupCallbackResponse(params: {
  ok: boolean;
  nextPath: string;
  error?: string | null;
}): NextResponse {
  const payload = JSON.stringify({
    type: OAUTH_POPUP_MESSAGE_TYPE,
    ok: params.ok,
    next: params.nextPath,
    error: params.error || null,
  }).replace(/</g, '\\u003c');

  const channelJson = JSON.stringify(OAUTH_POPUP_CHANNEL).replace(
    /</g,
    '\\u003c'
  );
  const statusHeading = params.ok
    ? 'Sign-in complete'
    : 'Authentication could not be completed';
  const statusDetail = params.ok
    ? 'Returning you to Pa-Hire Po...'
    : 'You can close this window and try again on the login screen.';

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <title>${statusHeading} — Pa-Hire Po</title>
  <style>
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f2ef; color: #0f172a; padding: 24px; text-align: center; }
    @media (prefers-color-scheme: dark) { body { background: #121214; color: #f4f4f5; } .card { background: #18181b; border-color: #27272a; } .muted { color: #a1a1aa; } }
    .card { max-width: 380px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; }
    .muted { color: #475569; font-size: 13px; margin: 8px 0 16px; }
    button { background: #0a66c2; color: #fff; border: 0; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; }
  </style>
</head>
<body>
  <div class="card">
    <h1 style="font-size:16px;margin:0;">${statusHeading}</h1>
    <p class="muted">${statusDetail}</p>
    <button type="button" onclick="window.close()">Close Window</button>
  </div>
  <script>
    (function() {
      var payload = ${payload};
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          var bc = new BroadcastChannel(${channelJson});
          bc.postMessage(payload);
          bc.close();
        }
      } catch (e) {}
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(payload, window.location.origin);
        }
      } catch (e) {}
      try { window.close(); } catch (e) {}
      setTimeout(function() {
        try { window.close(); } catch (e) {}
        if (!window.closed) {
          window.location.replace(
            payload.ok
              ? (payload.next || '/')
              : ('/login?error=' + encodeURIComponent(payload.error || 'Authentication failed'))
          );
        }
      }, 600);
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const nextParam = searchParams.get('next');
  const isPopup = searchParams.get('popup') === '1';
  const errorDesc =
    searchParams.get('error_description') || searchParams.get('error');

  const safeNext =
    nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
      ? nextParam
      : '/';

  const finishError = (msg: string) => {
    if (isPopup) {
      return createPopupCallbackResponse({
        ok: false,
        nextPath: safeNext,
        error: msg,
      });
    }
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(msg)}`
    );
  };

  const finishSuccess = () => {
    if (isPopup) {
      return createPopupCallbackResponse({ ok: true, nextPath: safeNext });
    }
    return NextResponse.redirect(`${origin}${safeNext}`);
  };

  if (errorDesc) {
    return finishError(errorDesc);
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return finishError('Supabase keys are not configured yet.');
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return finishError(error.message);
    }
    return finishSuccess();
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (error) {
      return finishError(error.message);
    }
    return finishSuccess();
  }

  if (isPopup) {
    return finishError('No authentication code returned.');
  }
  return NextResponse.redirect(`${origin}/login`);
}

export const OAUTH_POPUP_CHANNEL = 'pa-hire-po-oauth';
export const OAUTH_POPUP_MESSAGE_TYPE = 'PA_HIRE_PO_OAUTH_RESULT';

export interface OAuthPopupPayload {
  type: typeof OAUTH_POPUP_MESSAGE_TYPE;
  ok: boolean;
  next?: string;
  error?: string | null;
}

export interface OAuthPopupResult {
  ok: boolean;
  next?: string;
  error?: string;
  fallbackRedirected?: boolean;
  closedByUser?: boolean;
}

interface WebOriginInstance {
  isSameOrigin(other: WebOriginInstance): boolean;
  isSameSite(other: WebOriginInstance): boolean;
  opaque?: boolean;
}

interface WebOriginStatic {
  from(value: unknown): WebOriginInstance;
}

/**
 * Verifies that a MessageEvent originated from the exact same origin as this window.
 * Uses the modern Origin API when available with safe URL parsing + opaque "null" rejection.
 */
export function isTrustedSameOriginMessage(event: MessageEvent): boolean {
  try {
    const OriginCtor = (
      globalThis as unknown as { Origin?: WebOriginStatic }
    ).Origin;

    if (OriginCtor && typeof OriginCtor.from === 'function') {
      const selfOrigin = OriginCtor.from(globalThis);
      let senderOrigin: WebOriginInstance;
      try {
        senderOrigin = OriginCtor.from(event);
      } catch {
        senderOrigin = OriginCtor.from(event.origin);
      }
      return !senderOrigin.opaque && senderOrigin.isSameOrigin(selfOrigin);
    }

    if (!event.origin || event.origin === 'null') {
      return false;
    }

    const candidateUrl = new URL(event.origin);
    const currentUrl = new URL(window.location.href);
    return (
      candidateUrl.origin !== 'null' &&
      candidateUrl.origin === currentUrl.origin
    );
  } catch {
    return false;
  }
}

let activePopupWindow: Window | null = null;
let activePopupCancel: (() => void) | null = null;

/**
 * Brings the active OAuth popout window back on top of the main browser window.
 */
export function focusActiveOAuthPopup(): boolean {
  if (activePopupWindow && !activePopupWindow.closed) {
    try {
      activePopupWindow.focus();
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Closes the active OAuth popout window and cancels the pending sign-in flow.
 */
export function cancelActiveOAuthPopup(): void {
  if (activePopupWindow && !activePopupWindow.closed) {
    try {
      activePopupWindow.close();
    } catch {
      // Ignore close errors
    }
  }
  activePopupCancel?.();
}

/**
 * Opens a centered 520x680 OAuth popout window synchronously on user click,
 * navigates it to Supabase's OAuth URL (`skipBrowserRedirect: true`),
 * and waits for origin-verified completion via postMessage / BroadcastChannel.
 */
export async function runOAuthPopupFlow(params: {
  providerLabel: string;
  getAuthUrl: () => Promise<{ url: string | null; error: string | null }>;
  verifySessionFallback?: () => Promise<boolean>;
}): Promise<OAuthPopupResult> {
  const width = 520;
  const height = 680;
  const screenLeft = window.screenLeft ?? window.screenX ?? 0;
  const screenTop = window.screenTop ?? window.screenY ?? 0;
  const outerWidth = window.outerWidth || window.innerWidth || 1024;
  const outerHeight = window.outerHeight || window.innerHeight || 768;
  const left = Math.max(0, Math.round(screenLeft + (outerWidth - width) / 2));
  const top = Math.max(0, Math.round(screenTop + (outerHeight - height) / 2));

  // Open blank popup synchronously inside the user gesture to avoid popup blockers
  const popup = window.open(
    'about:blank',
    'pa_hire_po_oauth',
    `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=yes,status=no`
  );

  if (popup && !popup.closed) {
    activePopupWindow = popup;
    try {
      popup.focus();
      popup.document.title = `Sign in with ${params.providerLabel} — Pa-Hire Po`;
      popup.document.body.innerHTML =
        '<div style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:92vh;background:#f3f2ef;color:#0f172a;text-align:center;padding:24px;"><div><p style="font-weight:600;margin:0 0 6px;">Connecting to sign-in...</p><p style="font-size:13px;color:#475569;margin:0;">Please wait while we open the authentication window.</p></div></div>';
    } catch {
      // Ignore cross-origin document write errors
    }
  }

  const { url, error } = await params.getAuthUrl();
  if (error || !url) {
    activePopupWindow = null;
    if (popup && !popup.closed) {
      try {
        popup.close();
      } catch {
        // Ignore
      }
    }
    return {
      ok: false,
      error: error || `Unable to start ${params.providerLabel} authentication.`,
    };
  }

  // Fallback to full-page redirect when browser popup blocker refused the window
  if (!popup || popup.closed) {
    activePopupWindow = null;
    window.location.assign(url);
    return { ok: true, fallbackRedirected: true };
  }

  try {
    popup.location.href = url;
    popup.focus();
  } catch {
    activePopupWindow = null;
    window.location.assign(url);
    return { ok: true, fallbackRedirected: true };
  }

  return new Promise<OAuthPopupResult>((resolve) => {
    let settled = false;
    let channel: BroadcastChannel | null = null;
    let closedPollTimer: ReturnType<typeof setInterval> | null = null;
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

    const bringPopupToFront = (event?: Event) => {
      if (event?.target && event.target instanceof Element) {
        if (event.target.closest('[data-oauth-cancel="true"]')) {
          return;
        }
      }
      if (!popup.closed) {
        try {
          popup.focus();
        } catch {
          // Ignore focus errors
        }
      }
    };

    const cleanup = () => {
      if (activePopupWindow === popup) {
        activePopupWindow = null;
      }
      activePopupCancel = null;
      window.removeEventListener('message', handleWindowMessage);
      window.removeEventListener('focus', bringPopupToFront);
      window.removeEventListener('pointerdown', bringPopupToFront, true);
      if (channel) {
        try {
          channel.close();
        } catch {
          // Ignore
        }
        channel = null;
      }
      if (closedPollTimer) {
        clearInterval(closedPollTimer);
        closedPollTimer = null;
      }
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }
    };

    const finish = (result: OAuthPopupResult) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (!popup.closed) {
        try {
          popup.close();
        } catch {
          // Ignore
        }
      }
      resolve(result);
    };

    activePopupCancel = () => finish({ ok: false, closedByUser: true });

    const handlePayload = (payload: Partial<OAuthPopupPayload> | null) => {
      if (!payload || payload.type !== OAUTH_POPUP_MESSAGE_TYPE) return;
      if (payload.ok) {
        finish({ ok: true, next: payload.next || '/' });
      } else {
        finish({
          ok: false,
          error: payload.error || `${params.providerLabel} sign-in failed.`,
        });
      }
    };

    const handleWindowMessage = (event: MessageEvent) => {
      if (!isTrustedSameOriginMessage(event)) return;
      handlePayload(event.data as Partial<OAuthPopupPayload>);
    };

    window.addEventListener('message', handleWindowMessage);
    window.addEventListener('focus', bringPopupToFront);
    window.addEventListener('pointerdown', bringPopupToFront, true);

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel(OAUTH_POPUP_CHANNEL);
        channel.onmessage = (event: MessageEvent) => {
          handlePayload(event.data as Partial<OAuthPopupPayload>);
        };
      } catch {
        channel = null;
      }
    }

    closedPollTimer = setInterval(() => {
      if (popup.closed) {
        clearInterval(closedPollTimer!);
        closedPollTimer = null;
        // Brief grace wait so BroadcastChannel/postMessage can settle before fallback session check
        setTimeout(() => {
          if (settled) return;
          if (params.verifySessionFallback) {
            void params
              .verifySessionFallback()
              .then((authenticated) => {
                if (authenticated) {
                  finish({ ok: true, next: '/' });
                } else {
                  finish({ ok: false, closedByUser: true });
                }
              })
              .catch(() => finish({ ok: false, closedByUser: true }));
          } else {
            finish({ ok: false, closedByUser: true });
          }
        }, 280);
      }
    }, 350);

    timeoutTimer = setTimeout(() => {
      finish({
        ok: false,
        error: `${params.providerLabel} sign-in timed out. Please try again.`,
      });
    }, 5 * 60 * 1000);
  });
}

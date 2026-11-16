/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path');
let isPackagedApp = false;
try {
  const { app } = require('electron');
  isPackagedApp = Boolean(app && app.isPackaged);
} catch {
  isPackagedApp = false;
}

const LIVE_HOSTED_URL = 'https://pa-hire-po.vercel.app';

const DESKTOP_CONFIG = {
  appId: 'com.pahirepo.desktop',
  title: 'Pa-Hire Po — Desktop Studio',
  startUrl:
    process.env.ELECTRON_START_URL ||
    (isPackagedApp ? LIVE_HOSTED_URL : 'http://localhost:3000'),
  width: 1440,
  height: 920,
  minWidth: 1080,
  minHeight: 720,
  backgroundColor: '#f3f2ef',
};

function resolveDesktopIconPath() {
  return process.platform === 'win32'
    ? path.join(__dirname, '..', 'public', 'pa-hire-po.ico')
    : path.join(__dirname, '..', 'public', 'pa-hire-po-logo.jpg');
}

function isSafeExternalUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function buildOfflineFallbackHtml(startUrl) {
  return `
    <!doctype html>
    <html>
      <body style="margin:0;background:#f3f2ef;color:#0f172a;font-family:'Plus Jakarta Sans','Source Sans 3',sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">
        <div style="max-width:460px;padding:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;text-align:center;">
          <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;">Pa-Hire Po Local Server Not Running</h2>
          <p style="color:#475569;font-size:14px;line-height:1.5;">
            Start the local Next.js server first with <code>npm run dev</code>, then press Ctrl+R to reload.
          </p>
          <button onclick="location.href='${startUrl}'" style="margin-top:16px;padding:10px 18px;border:0;border-radius:8px;background:#0a66c2;color:#ffffff;font-weight:600;cursor:pointer;">
            Retry Connection
          </button>
        </div>
      </body>
    </html>
  `;
}

module.exports = {
  DESKTOP_CONFIG,
  resolveDesktopIconPath,
  isSafeExternalUrl,
  buildOfflineFallbackHtml,
};

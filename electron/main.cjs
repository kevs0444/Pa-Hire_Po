/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path');
const { app, BrowserWindow, ipcMain, shell } = require('electron');

const START_URL = process.env.ELECTRON_START_URL || 'http://localhost:3000';

let mainWindow = null;

function isSafeExternalUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 720,
    backgroundColor: '#000000',
    icon: path.join(__dirname, '..', 'public', 'pa-hire-po-logo.jpg'),
    title: 'Pa-Hire Po — Desktop Studio',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url) && !url.startsWith(START_URL)) {
      void shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.webContents.on('did-fail-load', () => {
    if (!mainWindow) return;
    const html = `
      <!doctype html>
      <html>
        <body style="margin:0;background:#000;color:#fff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">
          <div style="max-width:460px;padding:32px;border:1px solid #262626;border-radius:16px;text-align:center;">
            <h2 style="margin:0 0 8px;">Pa-Hire Po Local Server Not Running</h2>
            <p style="color:#a3a3a3;font-size:14px;line-height:1.5;">
              Start the local Next.js server first with <code>npm run dev</code>, then press Ctrl+R to reload.
            </p>
            <button onclick="location.href='${START_URL}'" style="margin-top:16px;padding:10px 18px;border:0;border-radius:10px;background:#fff;color:#000;font-weight:700;cursor:pointer;">
              Retry Connection
            </button>
          </div>
        </body>
      </html>
    `;
    void mainWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
    );
  });

  void mainWindow.loadURL(START_URL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.handle('open-external', async (_event, url) => {
  if (typeof url === 'string' && isSafeExternalUrl(url)) {
    await shell.openExternal(url);
    return true;
  }
  return false;
});

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

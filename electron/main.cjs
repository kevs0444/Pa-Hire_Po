/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path');
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const {
  DESKTOP_CONFIG,
  buildOfflineFallbackHtml,
  isSafeExternalUrl,
  resolveDesktopIconPath,
} = require('./config.cjs');
const { registerDesktopIpcHandlers } = require('./ipc-handlers.cjs');

if (process.platform === 'win32') {
  app.setAppUserModelId(DESKTOP_CONFIG.appId);
}

let mainWindow = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: DESKTOP_CONFIG.width,
    height: DESKTOP_CONFIG.height,
    minWidth: DESKTOP_CONFIG.minWidth,
    minHeight: DESKTOP_CONFIG.minHeight,
    backgroundColor: DESKTOP_CONFIG.backgroundColor,
    icon: resolveDesktopIconPath(),
    title: DESKTOP_CONFIG.title,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url, frameName }) => {
    if (frameName === 'pa_hire_po_oauth') {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          parent: mainWindow,
          width: 520,
          height: 680,
          center: true,
          alwaysOnTop: true,
          autoHideMenuBar: true,
          icon: resolveDesktopIconPath(),
        },
      };
    }

    if (isSafeExternalUrl(url) && !url.startsWith(DESKTOP_CONFIG.startUrl)) {
      void shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.webContents.on('did-create-window', (childWindow, details) => {
    if (details.frameName === 'pa_hire_po_oauth') {
      childWindow.setAlwaysOnTop(true, 'pop-up-menu');
      childWindow.focus();
      childWindow.once('ready-to-show', () => {
        if (!childWindow.isDestroyed()) {
          childWindow.setAlwaysOnTop(true, 'pop-up-menu');
          childWindow.focus();
        }
      });
    }
  });

  mainWindow.webContents.on('did-fail-load', () => {
    if (!mainWindow) return;
    const html = buildOfflineFallbackHtml(DESKTOP_CONFIG.startUrl);
    void mainWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
    );
  });

  void mainWindow.loadURL(DESKTOP_CONFIG.startUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

registerDesktopIpcHandlers({ ipcMain, shell, app });

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

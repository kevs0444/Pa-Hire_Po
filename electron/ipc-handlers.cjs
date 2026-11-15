/* eslint-disable @typescript-eslint/no-require-imports */
const { isSafeExternalUrl } = require('./config.cjs');

function registerDesktopIpcHandlers({ ipcMain, shell, app }) {
  ipcMain.handle('open-external', async (_event, url) => {
    if (typeof url === 'string' && isSafeExternalUrl(url)) {
      await shell.openExternal(url);
      return true;
    }
    return false;
  });

  ipcMain.handle('get-desktop-info', async () => ({
    isDesktop: true,
    platform: process.platform,
    electronVersion: process.versions.electron || 'desktop',
    appVersion: app ? app.getVersion() : '0.1.0',
  }));
}

module.exports = { registerDesktopIpcHandlers };

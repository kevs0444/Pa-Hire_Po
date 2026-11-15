/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  platform: process.platform,
  version: process.versions.electron || 'desktop',
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  getDesktopInfo: () => ipcRenderer.invoke('get-desktop-info'),
});

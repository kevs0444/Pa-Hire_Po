export interface ElectronDesktopInfo {
  isDesktop: boolean;
  platform: string;
  electronVersion: string;
  appVersion: string;
}

export interface ElectronDesktopAPI {
  isDesktop: boolean;
  platform: string;
  version: string;
  openExternal: (url: string) => Promise<boolean>;
  getDesktopInfo?: () => Promise<ElectronDesktopInfo>;
}

declare global {
  interface Window {
    electronAPI?: ElectronDesktopAPI;
  }
}

export function isElectronDesktop(): boolean {
  return (
    typeof window !== 'undefined' && Boolean(window.electronAPI?.isDesktop)
  );
}

/**
 * Opens an external job-board URL cleanly via Electron shell IPC when inside Desktop,
 * or safely in a new browser tab on the Web.
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (typeof window === 'undefined' || !url) return;
  if (window.electronAPI?.openExternal) {
    try {
      const opened = await window.electronAPI.openExternal(url);
      if (opened) return;
    } catch {
      // Fallback to browser window.open
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

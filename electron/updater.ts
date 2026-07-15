import { autoUpdater } from "electron-updater";
import { BrowserWindow } from "electron";
import log from "electron-log";

interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes: string;
}

function toDateString(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value ?? "");
}

function toAppUpdateInfo(raw: any): UpdateInfo {
  return {
    version: raw.version ?? "",
    releaseDate: toDateString(raw.releaseDate),
    releaseNotes: typeof raw.releaseNotes === "string" ? raw.releaseNotes : "",
  };
}

let mainWindow: BrowserWindow | null = null;

export function initUpdater(win: BrowserWindow): void {
  mainWindow = win;
  log.info("[updater] Initializing auto-updater");

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;

  autoUpdater.on("update-available", (info) => {
    log.info("[updater] Update available:", info.version);
    mainWindow?.webContents.send("update:available", toAppUpdateInfo(info));
  });

  autoUpdater.on("download-progress", (progress) => {
    mainWindow?.webContents.send("update:progress", Math.round(progress.percent));
  });

  autoUpdater.on("update-downloaded", (info) => {
    log.info("[updater] Update downloaded:", info.version);
    mainWindow?.webContents.send("update:downloaded", toAppUpdateInfo(info));
  });

  autoUpdater.on("error", (err) => {
    log.error("[updater] Update error:", err.message ?? "Unknown update error");
    mainWindow?.webContents.send("update:error", err.message ?? "Unknown update error");
  });

  autoUpdater.on("update-not-available", () => {
    log.info("[updater] No update available");
    mainWindow?.webContents.send("update:not-available");
  });
}

export async function handleCheckForUpdates(): Promise<UpdateInfo | null> {
  try {
    const result = await autoUpdater.checkForUpdates();
    if (!result) return null;
    return toAppUpdateInfo(result.updateInfo);
  } catch (err) {
    log.error("[updater] Check for updates failed:", err);
    return null;
  }
}

export function handleDownloadUpdate(): void {
  autoUpdater.downloadUpdate();
}

export function handleInstallUpdate(): void {
  autoUpdater.quitAndInstall(false, true);
}

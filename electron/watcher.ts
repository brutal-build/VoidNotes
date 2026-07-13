import * as fs from "fs";
import * as path from "path";
import type { BrowserWindow } from "electron";

let watcher: fs.FSWatcher | null = null;

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

export function startWatcher(vaultPath: string, mainWindow: BrowserWindow): void {
  stopWatcher();

  try {
    watcher = fs.watch(vaultPath, { recursive: true }, (eventType, filename) => {
      if (!filename) return;

      // Ignore .tmp files from atomic writes
      if (filename.endsWith(".tmp")) return;

      // Ignore everything inside .void-trash
      if (filename.includes(".void-trash")) return;

      // Only watch .md files
      if (!filename.toLowerCase().endsWith(".md")) return;

      let changeType: "changed" | "created" | "deleted";

      if (eventType === "rename") {
        const fullPath = path.join(vaultPath, filename);
        try {
          changeType = fs.existsSync(fullPath) ? "created" : "deleted";
        } catch {
          changeType = "deleted";
        }
      } else {
        changeType = "changed";
      }

      mainWindow.webContents.send("notes:external-change", {
        type: changeType,
        path: normalizePath(filename),
      });
    });
  } catch (error) {
    console.error("Failed to start file watcher:", error);
  }
}

export function stopWatcher(): void {
  if (watcher) {
    try {
      watcher.close();
    } catch (error) {
      console.error("Failed to stop file watcher:", error);
    }
    watcher = null;
  }
}

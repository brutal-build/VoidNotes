import { app } from "electron";
import * as path from "path";
import * as fs from "fs";
import log from "electron-log";

export const configPath = path.join(app.getPath("userData"), "config.json");

export function loadConfig(): string | null {
  try {
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (data.vault && fs.existsSync(data.vault)) {
        log.info("[config] Loaded vault path:", data.vault);
        return data.vault;
      }
    }
  } catch (error) {
    log.error("[config] Failed to load config:", error);
  }
  return null;
}

export function saveConfig(vaultPath: string): void {
  try {
    fs.writeFileSync(configPath, JSON.stringify({ vault: vaultPath }), "utf-8");
    log.info("[config] Saved vault path:", vaultPath);
  } catch (error) {
    log.error("[config] Failed to save config:", error);
  }
}

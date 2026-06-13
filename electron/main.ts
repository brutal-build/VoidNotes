import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as path from "path";
import * as fs from "fs";

let vaultPath: string | null = null;
let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: "#1e1e1e",
    frame: false,
    titleBarStyle: "hidden",
    icon: path.join(__dirname, "..", "icon.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// --- Window controls ---

ipcMain.handle("window:minimize", () => mainWindow?.minimize());
ipcMain.handle("window:maximize", () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.handle("window:close", () => mainWindow?.close());

// --- Vault ---

ipcMain.handle("vault:select", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
    title: "Select Vault Folder",
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  vaultPath = result.filePaths[0];
  return vaultPath;
});

ipcMain.handle("vault:set", async (_event, p: string) => {
  if (fs.existsSync(p)) {
    vaultPath = p;
    return true;
  }
  return false;
});

ipcMain.handle("vault:get", async () => vaultPath);

function safePath(fileName: string): string | null {
  if (!vaultPath) return null;
  const resolved = path.resolve(vaultPath, fileName);
  if (!resolved.startsWith(vaultPath)) return null;
  return resolved;
}

function scanDir(dir: string, prefix = ""): string[] {
  const results: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        results.push(...scanDir(fullPath, relPath));
      } else if (entry.name.endsWith(".md")) {
        results.push(relPath);
      }
    }
  } catch {}
  return results;
}

// --- Notes ---

ipcMain.handle("notes:list", async () => {
  if (!vaultPath) return [];
  return scanDir(vaultPath);
});

ipcMain.handle("notes:load", async (_event, fileName: string) => {
  try {
    const filePath = safePath(fileName);
    if (!filePath || !fs.existsSync(filePath)) return "";
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
});

ipcMain.handle("notes:save", async (_event, fileName: string, content: string) => {
  try {
    const filePath = safePath(fileName);
    if (!filePath) return false;
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, content, "utf-8");
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle("notes:create", async (_event, folder?: string) => {
  try {
    if (!vaultPath) return null;
    const targetDir = folder ? path.join(vaultPath, folder) : vaultPath;
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    const existing = fs.readdirSync(targetDir).filter((f) => f.endsWith(".md"));
    let name = "Untitled.md";
    let counter = 2;
    while (existing.includes(name)) {
      name = `Untitled ${counter}.md`;
      counter++;
    }
    fs.writeFileSync(path.join(targetDir, name), "", "utf-8");
    return folder ? `${folder}/${name}` : name;
  } catch {
    return null;
  }
});

ipcMain.handle("notes:delete", async (_event, fileName: string) => {
  try {
    const filePath = safePath(fileName);
    if (!filePath || !fs.existsSync(filePath)) return false;
    fs.unlinkSync(filePath);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle("notes:stat", async (_event, fileName: string) => {
  try {
    const filePath = safePath(fileName);
    if (!filePath || !fs.existsSync(filePath)) return null;
    const stats = fs.statSync(filePath);
    return { mtime: stats.mtime.toISOString(), size: stats.size };
  } catch {
    return null;
  }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});

import { app, BrowserWindow, ipcMain, dialog, nativeImage } from "electron";
import * as path from "path";
import * as fs from "fs";

app.setAppUserModelId("VoidNotes");

let vaultPath: string | null = null;
let mainWindow: BrowserWindow | null = null;

const configPath = path.join(app.getPath("userData"), "config.json");

function loadConfig(): void {
  try {
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (data.vault && fs.existsSync(data.vault)) {
        vaultPath = data.vault;
        if (vaultPath) createWelcomeFile(vaultPath);
      }
    }
  } catch {}
}

function saveConfig(): void {
  try {
    fs.writeFileSync(configPath, JSON.stringify({ vault: vaultPath }), "utf-8");
  } catch {}
}

function createWindow(): void {
  const iconPath = path.resolve(app.getAppPath(), "icon.ico");
  const appIcon = nativeImage.createFromPath(iconPath);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: "#1e1e1e",
    frame: false,
    titleBarStyle: "hidden",
    title: "Void Notes",
    icon: appIcon,
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

  mainWindow.setIcon(appIcon);
  mainWindow.webContents.openDevTools();
}

// --- Window controls ---

ipcMain.handle("window:minimize", () => mainWindow?.minimize());
ipcMain.handle("window:maximize", () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.handle("window:close", () => mainWindow?.close());

ipcMain.handle("window:set-background", (_event, color: string) => {
  if (mainWindow) {
    mainWindow.setBackgroundColor(color);
  }
});

// --- Vault ---

function createWelcomeFile(dir: string): void {
  try {
    const existing = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
    if (existing.length > 0) return;
    const content = [
      '---',
      'title: Void Notes Feature Showcase',
      'tags: [demo, features, markdown]',
      'date: 2026-06-13',
      '---',
      '',
      '# Void Notes Feature Showcase',
      '',
      'Welcome to **Void Notes** — your minimalist second-brain notepad. This note demonstrates every formatting feature available.',
      '',
      '---',
      '',
      '## Text Formatting',
      '',
      '| Style | Syntax | Result |',
      '|-------|--------|--------|',
      '| Bold | `**text**` | **bold text** |',
      '| Italic | `*text*` | *italic text* |',
      '| Underline | `__text__` | __underlined__ |',
      '| Strikethrough | `~~text~~` | ~~deleted~~ |',
      '| Inline Code | `` `code` `` | `console.log()` |',
      '| Highlight | `==text==` | ==important== |',
      '| Spoiler | `\\|\\|text\\|\\|` | ||click to reveal|| |',
      '',
      'Combine them: **bold and *italic* together** or __underlined **and bold**__.',
      '',
      '---',
      '',
      '## Headings',
      '',
      '# Heading 1',
      '## Heading 2',
      '### Heading 3',
      '#### Heading 4',
      '',
      '---',
      '',
      '## Lists',
      '',
      '### Unordered',
      '- First item',
      '- Second item',
      '  - Nested item A',
      '  - Nested item B',
      '- Third item',
      '',
      '### Ordered',
      '1. Step one',
      '2. Step two',
      '3. Step three',
      '',
      '### Task List',
      '- [x] Create vault',
      '- [x] Write notes',
      '- [ ] Organize knowledge',
      '- [ ] Build second brain',
      '',
      '---',
      '',
      '## Blockquotes',
      '',
      '> "The best way to predict the future is to create it."',
      '> — Peter Drucker',
      '',
      '> Multi-line blockquote with **bold** and *italic* inside.',
      '> Second line continues here.',
      '',
      '---',
      '',
      '## Code Blocks',
      '',
      '```javascript',
      'function greet(name) {',
      '  return `Hello, ${name}!`;',
      '}',
      '',
      'console.log(greet("Void Notes"));',
      '```',
      '',
      '```python',
      'def fibonacci(n):',
      '    a, b = 0, 1',
      '    for _ in range(n):',
      '        yield a',
      '        a, b = b, a + b',
      '',
      'list(fibonacci(10))',
      '```',
      '',
      '```css',
      '.theme-dark {',
      '  --bg: #1e1e1e;',
      '  --text: #e0e0e0;',
      '  --accent: #8a70d6;',
      '}',
      '```',
      '',
      '---',
      '',
      '## Tables',
      '',
      '| Feature | Status | Priority |',
      '|---------|--------|----------|',
      '| Markdown Editor | Done | High |',
      '| Wiki Links | Done | High |',
      '| Split View | Done | Medium |',
      '| Tag Filtering | Done | Medium |',
      '| Themes | Done | Low |',
      '| Graph View | Planned | Low |',
      '',
      '---',
      '',
      '## Callouts',
      '',
      '> [!INFO] Information',
      '> This is an informational callout. Use it for tips and notes.',
      '',
      '> [!WARNING] Warning',
      '> Be careful with destructive actions. Always keep backups.',
      '',
      '> [!TIP] Pro Tip',
      '> Use `Ctrl+Shift+E` to toggle split view for side-by-side editing.',
      '',
      '> [!ERROR] Danger Zone',
      '> Deleting a note is permanent. There is no trash bin.',
      '',
      '---',
      '',
      '## Wiki Links',
      '',
      'Link to other notes using double brackets:',
      '- [[Untitled]] — a basic note',
      '- [[non-existent]] — a missing link (dashed style)',
      '',
      '---',
      '',
      '## Horizontal Rules',
      '',
      'Content above the line.',
      '',
      '---',
      '',
      'Content below the line.',
      '',
      '---',
      '',
      '## Frontmatter',
      '',
      'This note uses YAML frontmatter for metadata:',
      '',
      '```yaml',
      '---',
      'title: Void Notes Feature Showcase',
      'tags: [demo, features, markdown]',
      'date: 2026-06-13',
      '---',
      '```',
      '',
      'Tags from frontmatter appear in the sidebar for filtering.',
      '',
      '---',
      '',
      '## Inline Tags',
      '',
      'You can also use hashtags in the text: #productivity #notes #secondbrain #markdown',
      '',
      'These are automatically detected and added to the tag index.',
      '',
      '---',
      '',
      '## Keyboard Shortcuts Reference',
      '',
      '| Shortcut | Action |',
      '|----------|--------|',
      '| `Ctrl+S` | Save note |',
      '| `Ctrl+E` | Toggle Edit / Preview |',
      '| `Ctrl+Shift+E` | Split view |',
      '| `Ctrl+P` | Command palette |',
      '| `Ctrl+N` | New note |',
      '| `Ctrl+Shift+N` | Daily note |',
      '| `Ctrl+T` | Templates |',
      '| `Ctrl+,` | Settings |',
      '| `F1` | Help |',
      '| `F9` | Focus mode |',
      '',
      '---',
      '',
      '## Dynamic Template Variables',
      '',
      'When using templates, these variables are available:',
      '',
      '| Variable | Description |',
      '|----------|-------------|',
      '| `{{date}}` | Current date |',
      '| `{{time}}` | Current time |',
      '| `{{datetime}}` | Date and time |',
      '| `{{year}}` | Current year |',
      '| `{{month}}` | Month number |',
      '| `{{month_name}}` | Month name |',
      '| `{{day}}` | Day number |',
      '| `{{weekday}}` | Day of week |',
      '| `{{timestamp}}` | Unix timestamp |',
      '| `{{uuid}}` | Random UUID |',
      '| `{{title}}` | Note title |',
      '',
      '---',
      '',
      '*Welcome to Void Notes — your second brain starts here.*',
      '',
    ].join('\n');
    fs.writeFileSync(path.join(dir, "Welcome to Void Notes.md"), content, "utf-8");
  } catch {}
}

ipcMain.handle("vault:select", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
    title: "Select Vault Folder",
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  vaultPath = result.filePaths[0];
  saveConfig();
  createWelcomeFile(vaultPath);
  return vaultPath;
});

ipcMain.handle("vault:set", async (_event, p: string) => {
  if (fs.existsSync(p)) {
    vaultPath = p;
    saveConfig();
    createWelcomeFile(p);
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

async function scanDir(dir: string, prefix = ""): Promise<string[]> {
  const results: string[] = [];
  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    const subdirs: Promise<string[]>[] = [];
    for (const entry of entries) {
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        subdirs.push(scanDir(path.join(dir, entry.name), relPath));
      } else if (entry.name.endsWith(".md")) {
        results.push(relPath);
      }
    }
    const subResults = await Promise.all(subdirs);
    for (const sub of subResults) results.push(...sub);
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
    if (!filePath) return "";
    return await fs.promises.readFile(filePath, "utf-8");
  } catch {
    return "";
  }
});

ipcMain.handle("notes:save", async (_event, fileName: string, content: string) => {
  try {
    const filePath = safePath(fileName);
    if (!filePath) return false;
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(filePath, content, "utf-8");
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

ipcMain.handle("notes:rename", async (_event, oldName: string, newName: string) => {
  try {
    const oldPath = safePath(oldName);
    if (!oldPath || !fs.existsSync(oldPath)) return false;
    const dir = path.dirname(oldPath);
    const newPath = path.join(dir, newName.endsWith(".md") ? newName : `${newName}.md`);
    if (fs.existsSync(newPath)) return false;
    fs.renameSync(oldPath, newPath);
    const relDir = path.relative(vaultPath!, dir);
    return relDir === "." ? newName.endsWith(".md") ? newName : `${newName}.md` : `${relDir}/${newName.endsWith(".md") ? newName : `${newName}.md`}`;
  } catch {
    return false;
  }
});

ipcMain.handle("notes:stat", async (_event, fileName: string) => {
  try {
    const filePath = safePath(fileName);
    if (!filePath || !fs.existsSync(filePath)) return null;
    const stats = fs.statSync(filePath);
    return { mtime: stats.mtime.toISOString(), birthtime: stats.birthtime.toISOString(), size: stats.size };
  } catch {
    return null;
  }
});



app.whenReady().then(() => {
  loadConfig();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});

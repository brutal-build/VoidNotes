<p align="center">
  <img src="logo.png" alt="Void Notes" width="120">
</p>

<h1 align="center">Void Notes</h1>

<p align="center">
  <strong>A local-first Markdown second-brain notepad.</strong><br>
  Obsidian-like features with a custom brutalist design system.
</p>

<p align="center">
<a href="https://www.producthunt.com/products/void-notes-minimalist-markdown-notepad?embed=true&amp;utm_source=badge-featured&amp;utm_medium=badge&amp;utm_campaign=badge-void-notes-minimalist-markdown-notepad" target="_blank" rel="noopener noreferrer"><img alt="Void Notes - Minimalist Markdown Notepad - A local-first Markdown second-brain - free &amp; open-source | Product Hunt" width="250" height="54" src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1195560&amp;theme=dark&amp;t=1783978188675"></a></p>

<p align="center">
  <a href="https://github.com/brutal-build/VoidNotes/actions/workflows/release.yml"><img src="https://img.shields.io/badge/build-release-blue?logo=github-actions" alt="Build" /></a>
  <a href="https://github.com/brutal-build/VoidNotes/actions/workflows/release.yml"><img src="https://img.shields.io/badge/tests-73%20passed-success?logo=vitest" alt="Tests" /></a>
  <a href="https://github.com/brutal-build/VoidNotes/releases"><img src="https://img.shields.io/github/v/release/brutal-build/VoidNotes?label=latest" alt="Latest Release" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License" /></a>
</p>

---

Built with **Electron 35** + **React 19** + **CodeMirror 6** + **d3-force**. No cloud, no telemetry, no account - your notes stay as plain `.md` files on your disk.

---

## Download

Get the latest installer from the **[Releases](https://github.com/brutal-build/VoidNotes/releases)** page.

---

## Features

### Markdown Editor
- Syntax highlighting, line numbers, bracket matching, auto-indent
- **Live Preview** - toggle edit / preview / split view (`Ctrl+E`, `Ctrl+Shift+E`)
- **Vim Keybindings** - optional modal editing (settings toggle)
- **Spellcheck** - browser-native spellcheck, toggle in settings
- **Readable Line Length** - optional width cap for comfortable reading
- **Custom Editor Font** - any system font via settings

### Wiki Links
- `[[note-name]]` with autocomplete and click-to-navigate
- Missing wiki-note creation dialog when clicking a non-existent link
- Automatic **Backlinks** - reverse-link indexing across all notes

### Tags & Properties
- YAML frontmatter `tags:` + inline `#hashtags`
- Filterable tag list in sidebar
- **Properties Panel** - view and edit frontmatter fields (date, tags, custom)

### Callouts & Formatting
- `> [!INFO]`, `> [!WARNING]`, `> [!TIP]`, `> [!ERROR]`
- `__underline__`, `||spoiler||`, `==highlight==`

### 6 Themes
| Theme | Background | Accent | Preview |
|-------|-----------|--------|---------|
| Obsidian | `#1e1e1e` | `#8a70d6` (purple) | Dark |
| Light | `#ffffff` | `#8a70d6` (purple) | Light |
| Dracula | `#282a36` | `#ff79c6` (pink) | Dark |
| Nord | `#2e3440` | `#88c0d0` (cyan) | Dark |
| Solarized | `#002b36` | `#268bd2` (blue) | Dark |
| **macOS Glass** | Gradient `#1a1a2e` to `#0f0f1a` | `#007aff` (blue) | Dark + blur |

### Left Ribbon
Vertical icon bar with quick actions - new note, new folder, search, daily note, graph, templates, bookmarks, trash, settings.

### Tab System
VS Code-style tabs with drag reorder, close buttons, and dirty-state indicators. Unsaved changes show a Save / Discard / Cancel dialog.

### Graph View
Interactive force-directed graph of note connections. Custom canvas engine with d3-force physics. Filters by link depth, node sizing options, and zoom/pan controls. Reduced-motion aware.

### Right Panel
Four tab panels: **Backlinks**, **Tags**, **Outline** (heading tree), **Properties** (YAML frontmatter editor with debounced saves).

### Global Search
`Ctrl+Shift+F` - indexed search across all notes with content preview and context snippets. Uses `VaultIndex` for O(1) lookup instead of linear scan.

### Templates
5 built-in templates: Daily Note, Meeting Notes, Project, Book Notes, Journal. Create from the Left Ribbon or `Ctrl+T`.

### Bookmarks
Star/bookmark notes via right-click context menu. Bookmarks get a **star icon** in the file tree and a dedicated panel. Auto-cleanup on delete.

### Trash
Accidental delete moves files to `.void-trash/` inside the vault. Restore or permanently delete from the **Trash panel** - click a note to **preview its content** before deciding.

### Dialog System
Custom `Dialog`, `ConfirmDialog`, and `InputDialog` components with full CSS. Replaces native `window.confirm()` / `window.prompt()`. Used everywhere - new note, new folder, delete, rename, wiki creation, trash permanent delete.

### Focus Mode
`F9` - hides everything except the editor. A subtle breadcrumb button restores the sidebar.

### External Change Detection
File watcher monitors the vault directory. If a file is created/deleted/modified outside the app, the UI updates automatically.

### Focus on Accessibility
- Sidebar with ARIA tree markup and full keyboard navigation (arrows, Enter, Space)
- `prefers-reduced-motion` respected on all animations
- Focus-visible outlines on all interactive elements
- Icon-only controls have labels and tooltips

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save |
| `Ctrl+E` | Toggle preview |
| `Ctrl+Shift+E` | Split view |
| `Ctrl+P` | Command palette (search notes) |
| `Ctrl+Shift+F` | Global search (search in content) |
| `Ctrl+N` | New note (with dialog) |
| `Ctrl+Shift+N` | Daily note |
| `Ctrl+T` | Templates |
| `Ctrl+,` | Settings |
| `F1` | Help |
| `F9` | Focus mode |

---

## Development

```bash
# Install dependencies
npm install

# Start dev server + Electron (hot reload)
npm run dev

# Run tests (73 tests, 16 test files, vitest)
npm test

# Build for production
npm run build

# Build Windows .exe installer
npm run dist:win
```

### Project Structure

```
void-notes/
├── electron/          # Electron main process (IPC handlers, watcher, path safety)
│   ├── main.ts        # App entry, window creation, lifecycle
│   ├── ipc-handlers.ts # All IPC channels (vault, notes, trash, folders)
│   ├── note-files.ts  # File operations (atomic writes, trash, restore)
│   ├── path-safety.ts # Vault containment, symlink protection
│   ├── watcher.ts     # chokidar-based vault file watcher
│   ├── window.ts      # BrowserWindow management
│   ├── config.ts      # Vault path persistence
│   └── preload.ts     # contextBridge API surface
├── src/
│   ├── components/    # React components
│   │   ├── ui/        # Reusable: Dialog, ConfirmDialog, InputDialog, ToastRegion
│   ├── services/      # Session coordinator, VaultIndex, VaultTree
│   ├── plugins/       # Frontmatter, properties, wiki-links, updater
│   ├── graph/         # Graph engine (d3-force), Canvas renderer, Settings UI
│   ├── store/         # Zustand global state
│   ├── styles/        # index.css (layout), themes.css (6 theme tokens)
│   ├── shared/        # IPC contract types
│   └── __tests__/     # 16 test files, 73 test cases
├── vitest.config.mts
├── CHANGELOG.md
└── package.json
```

---

## Tech Stack

| Library | Purpose |
|---------|---------|
| Electron 35 | Desktop runtime |
| React 19 | UI framework |
| TypeScript 5 | Type safety |
| Vite 6 | Bundler |
| CodeMirror 6 | Editor engine |
| react-markdown | Markdown rendering |
| remark-gfm | GitHub Flavored Markdown |
| gray-matter | YAML frontmatter |
| d3-force | Graph physics simulation |
| Zustand | State management |
| Vitest | Testing framework |
| Testing Library | React component tests |
| chokidar | File system watching |

---

[![Ko-fi](https://img.shields.io/badge/Support%20me-Ko--fi-FF5E5B?logo=ko-fi&logoColor=white)](https://ko-fi.com/brutalbuild)

## License

MIT - [brutal-build](https://github.com/brutal-build)

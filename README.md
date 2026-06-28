# Void Notes Expanded

> An Obsidian-like Markdown knowledge management app.

Built with **Electron 35** + **React 19** + **CodeMirror 6** + **react-force-graph**. Local-first, no backend, no cloud — your notes stay on your disk as plain `.md` files.

---

## Download

Get the latest installer from the **[Releases](https://github.com/brutal-build/VoidNotes/releases)** page.

---

## Features

### Core
- **Markdown Editor** — syntax highlighting, line numbers, bracket matching, auto-indent
- **Live Preview** — toggle between edit, preview, or split view (`Ctrl+E`, `Ctrl+Shift+E`)
- **Wiki Links** — `[[note-name]]` with autocomplete and click-to-navigate
- **Backlinks** — automatic reverse link indexing across all notes
- **Tags** — YAML frontmatter `tags:` + inline `#hashtags`, filterable in sidebar
- **Callouts** — `> [!INFO]`, `> [!WARNING]`, `> [!TIP]`, `> [!ERROR]`
- **Discord Formatting** — `__underline__`, `||spoiler||`, `==highlight==`
- **5 Themes** — Obsidian, Light, Dracula, Nord, Solarized
- **Vim Keybindings** — optional modal editing
- **Auto-Save** — 500ms debounce

### Expanded (Obsidian-like)
- **Left Ribbon** — vertical icon bar (new note, new folder, search, daily note, graph, templates, bookmarks, settings)
- **Tab System** — VS Code-style tabs with drag reorder and close buttons
- **Graph View** — interactive force-directed graph of note connections (`react-force-graph`)
- **Right Panel** — backlinks, tags, and outline/TOC tabs
- **Global Search** — `Ctrl+Shift+F` search across all notes with context
- **Templates** — built-in templates (Daily Note, Meeting Notes, Project, Book Notes, Journal)
- **Bookmarks** — star/bookmark notes via right-click context menu
- **Command Palette** — `Ctrl+P` fuzzy search across all notes
- **Focus Mode** — `F9` hides everything except the editor

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save |
| `Ctrl+E` | Toggle preview |
| `Ctrl+Shift+E` | Split view |
| `Ctrl+P` | Command palette (search notes) |
| `Ctrl+Shift+F` | Global search (search in content) |
| `Ctrl+N` | New note |
| `Ctrl+Shift+N` | Daily note |
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

# Build for production
npm run build

# Build Windows .exe installer
npm run dist:win
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
| react-force-graph | Graph visualization |

---

[![Ko-fi](https://img.shields.io/badge/Support%20me-Ko--fi-FF5E5B?logo=ko-fi&logoColor=white)](https://ko-fi.com/brutalbuild)

## License

MIT — [brutal-build](https://github.com/brutal-build)

# Void Notes

> A minimalist, brutalist-styled Markdown **second-brain** notepad.

Built with **Electron 35** + **React 19** + **CodeMirror 6**. Local-first, no backend, no cloud — your notes stay on your disk as plain `.md` files.

---

## Download

Get the latest installer from the **[Releases](https://github.com/brutal-build/VoidNotes/releases)** page.

---

## Features

- **Markdown Editor** — syntax highlighting, line numbers, bracket matching, auto-indent
- **Live Preview** — toggle between edit, preview, or split view (`Ctrl+E`, `Ctrl+Shift+E`)
- **Wiki Links** — `[[note-name]]` with autocomplete and click-to-navigate
- **Backlinks** — automatic reverse link indexing across all notes
- **Tags** — YAML frontmatter `tags:` + inline `#hashtags`, filterable in sidebar
- **Callouts** — `> [!INFO]`, `> [!WARNING]`, `> [!TIP]`, `> [!ERROR]`
- **Discord Formatting** — `__underline__`, `||spoiler||`, `==highlight==`
- **5 Themes** — Obsidian, Light, Dracula, Nord, Solarized
- **Command Palette** — `Ctrl+P` fuzzy search across all notes
- **Focus Mode** — `F9` hides everything except the editor
- **Auto-Save** — 500ms debounce, no manual saving needed
- **Vim Keybindings** — optional modal editing (`@replit/codemirror-vim`)
- **Daily Notes** — `Ctrl+Shift+N` creates a note for today
- **Resizable Sidebar** — drag to resize, width persisted
- **Context Menu** — right-click on notes (open, rename, copy path, delete)
- **Custom Window** — frameless with traffic-light controls

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save |
| `Ctrl+E` | Toggle preview |
| `Ctrl+Shift+E` | Split view |
| `Ctrl+P` | Command palette (search) |
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

---

## License

MIT — [brutal-build](https://github.com/brutal-build)

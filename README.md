# Void Notes

A minimalist, brutalist-styled Markdown **second-brain** notepad built with Electron, React, and CodeMirror 6.

> Write. Link. Think. Forget the rest.

## Features

- **Vault System** — choose any local folder as your note storage
- **Markdown Editor** — CodeMirror 6 with syntax highlighting, line numbers, auto-indent
- **Wiki Links** — `[[note-name]]` to link between notes, with autocomplete
- **Live Preview** — toggle between Edit and Preview with `Ctrl+E`
- **Backlinks Panel** — see which notes reference the current one
- **Discord-style Formatting** — `__underline__`, `||spoiler||`, `==highlight==`
- **Callouts** — `> [!INFO]`, `> [!WARNING]`, `> [!TIP]`
- **Frontmatter** — YAML metadata with gray-matter
- **Command Palette** — fuzzy search across all notes with `Ctrl+P`
- **File Tree** — collapsible folder structure in the sidebar
- **Dark Mode** — Obsidian-inspired color palette
- **Auto-save** — debounced save (500ms) + manual `Ctrl+S`
- **macOS Traffic Lights** — native-feeling window controls
- **Settings & Help** — accessible from sidebar or keyboard shortcuts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Electron 35 |
| Frontend | React 19, TypeScript 5 |
| Editor | CodeMirror 6 (@uiw/react-codemirror) |
| Bundler | Vite 6 |
| Markdown | react-markdown, remark-gfm |
| Frontmatter | gray-matter |

## Getting Started

### Prerequisites

- **Node.js** v18 or later — https://nodejs.org

### Install

Download the latest installer from the [Releases](https://github.com/PixelCodeGH/VoidNotes/releases) page.

### Development

```bash
npm run dev    # Start Vite dev server + Electron (hot reload)
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save note |
| `Ctrl+E` | Toggle Edit / Preview |
| `Ctrl+P` | Command Palette (fuzzy search) |
| `Ctrl+N` | New note |
| `Ctrl+,` | Open Settings |
| `F1` | Open Help & Documentation |

## Project Structure

```
├── electron/
│   ├── main.ts              # Electron main process (IPC, window, file ops)
│   └── preload.ts           # contextBridge API
├── src/
│   ├── main.tsx             # React entry point
│   ├── types.ts             # TypeScript declarations
│   ├── components/
│   │   ├── App.tsx          # Root component + layout
│   │   ├── Sidebar.tsx      # Collapsible file tree
│   │   ├── NoteEditor.tsx   # CodeMirror 6 editor
│   │   ├── NoteParser.tsx   # Markdown render pipeline
│   │   ├── CommandPalette.tsx # Ctrl+P search modal
│   │   ├── VaultSetup.tsx   # Vault folder picker
│   │   ├── StatusBar.tsx    # Word count + save status
│   │   ├── TrafficLights.tsx # macOS-style window controls
│   │   ├── Settings.tsx     # Settings modal
│   │   └── Help.tsx         # Help & documentation modal
│   ├── plugins/
│   │   ├── frontmatter.ts   # gray-matter + backlinks
│   │   ├── wiki-links.ts    # [[link]] parser
│   │   ├── highlight.ts     # ==text== parser
│   │   ├── callouts.ts      # > [!TYPE] parser
│   │   ├── discord-formats.ts # __underline__ + ||spoiler||
│   │   ├── code-fence.ts    # Code block protection
│   │   └── escape.ts        # Backslash escapes
│   └── styles/
│       └── index.css        # Design system (CSS variables)
├── index.html
├── vite.config.ts
├── package.json
└── LICENSE
```

## Releases

### v0.2.5
- Fixed spoiler toggle in preview (`||spoiler||` now reveals on click)
- Minor UI and markdown pipeline cleanup

### v0.2.0
- Initial public release with vault system, wiki links, preview, backlinks, Discord-style formatting, callouts, frontmatter, command palette, file tree, dark mode, auto-save, and traffic lights.

## Roadmap

- [ ] Graph view (note connections visualization)
- [ ] Plugin system (user-defined extensions)
- [ ] Split pane editing
- [ ] Export to PDF / HTML
- [ ] Tag-based filtering
- [ ] Vim keybindings mode
- [ ] Templates system

## License

[MIT](LICENSE)

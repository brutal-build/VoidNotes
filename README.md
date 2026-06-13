# Void Notes

A minimalist, brutalist-styled Markdown **second-brain** notepad built with Electron, React, and CodeMirror 6.

> Write. Link. Think. Forget the rest.

## Features

- **Vault System** — choose any local folder as your note storage (persisted across restarts)
- **Markdown Editor** — CodeMirror 6 with syntax highlighting, line numbers, auto-indent
- **Wiki Links** — `[[note-name]]` to link between notes, with autocomplete
- **Live Preview** — toggle between Edit and Preview with `Ctrl+E`
- **Split View** — side-by-side editing and preview with `Ctrl+Shift+E`
- **Backlinks Panel** — see which notes reference the current one
- **Discord-style Formatting** — `__underline__`, `||spoiler||`, `==highlight==`
- **Callouts** — `> [!INFO]`, `> [!WARNING]`, `> [!TIP]`, `> [!ERROR]`
- **Frontmatter** — YAML metadata with gray-matter
- **Tag Filtering** — filter notes by tags from frontmatter or inline `#tags`
- **Command Palette** — fuzzy search across all notes and plugin commands with `Ctrl+P`
- **File Tree** — collapsible folder structure in the sidebar
- **Right-click Context Menu** — open, rename, copy path, delete notes
- **Multiple Themes** — Obsidian, Light, Dracula, Nord, Solarized
- **Vim Keybindings** — optional Vim modal editing
- **Auto-save** — debounced save (500ms) + manual `Ctrl+S`
- **Focus Mode** — hide sidebar with `F9`, restore with button
- **Resizable Panels** — drag to resize sidebar
- **Plugin System** — extensible architecture with hooks, commands, and event bus
- **Plugin Marketplace** — browse and install plugins from GitHub
- **Auto-Updater** — checks GitHub for new releases on startup
- **Welcome Note** — auto-created showcase on first launch

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Electron 35 |
| Frontend | React 19, TypeScript 5 |
| Editor | CodeMirror 6 (@uiw/react-codemirror) |
| Vim Mode | @replit/codemirror-vim |
| Bundler | Vite 6 |
| Markdown | react-markdown, remark-gfm |
| Frontmatter | gray-matter |

## Getting Started

### Install

Download the latest installer from the [Releases](https://github.com/PixelCodeGH/VoidNotes/releases) page.

### Development

```bash
npm install
npm run dev    # Start Vite dev server + Electron (hot reload)
```

### Build Installer

```bash
npm run dist:win   # Build Windows .exe installer
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save note |
| `Ctrl+E` | Toggle Edit / Preview |
| `Ctrl+Shift+E` | Split view |
| `Ctrl+P` | Command palette (notes + plugin commands) |
| `Ctrl+N` | New note |
| `Ctrl+Shift+N` | Daily note |
| `Ctrl+,` | Open Settings |
| `F1` | Open Help & Documentation |
| `F9` | Toggle Focus Mode |

## Plugin System

Void Notes has a built-in plugin architecture. Plugins can:

- Register commands in the Command Palette
- Hook into lifecycle events (`onInit`, `onNoteLoad`, `onNoteSave`, `onAppReady`, `onUnload`)
- Add CodeMirror 6 extensions (keymaps, decorations, etc.)
- Access the editor, notes, vault, and event bus via `VoidAPI`

### Installing Plugins

**From Marketplace:**
1. Open Plugins (sidebar → Plugins)
2. Click "Marketplace"
3. Browse and click "Install"

**Manual:**
1. Place `.js` plugin files in `.plugins/` folder in your vault
2. Restart the app

### Creating Plugins

See [PLUGIN_DEVELOPMENT.md](PLUGIN_DEVELOPMENT.md) for the full documentation.

Quick example:
```javascript
export default {
  manifest: {
    id: "my-plugin",
    name: "My Plugin",
    version: "1.0.0",
    description: "Does something cool",
    main: "inline"
  },
  onInit(api) {
    api.commands.register({
      id: "my:hello",
      title: "Say Hello",
      icon: "👋",
      action: () => alert("Hello!")
    });
  }
};
```

## Plugin Marketplace

The marketplace fetches available plugins from [`plugins.json`](public/plugins.json) hosted on GitHub. No server required — just a JSON file in the repo.

To add your plugin to the marketplace:
1. Create your plugin `.js` file
2. Add an entry to `public/plugins.json` with your plugin's metadata and `scriptUrl`
3. Open a PR on GitHub

## Auto-Updater

The app checks GitHub for new releases on startup (max once per hour). If a newer version is found, a modal appears with the changelog and a download link.

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
│   │   ├── Sidebar.tsx      # Collapsible file tree + tags
│   │   ├── NoteEditor.tsx   # CodeMirror 6 editor
│   │   ├── NoteParser.tsx   # Markdown render pipeline
│   │   ├── CommandPalette.tsx # Ctrl+P search + commands
│   │   ├── VaultSetup.tsx   # Vault folder picker
│   │   ├── StatusBar.tsx    # Word count + save status
│   │   ├── TrafficLights.tsx # macOS-style window controls
│   │   ├── Settings.tsx     # Settings modal (themes, vim, plugins)
│   │   ├── Help.tsx         # Help & documentation modal
│   │   ├── PluginsModal.tsx # Plugin management + marketplace link
│   │   ├── MarketplaceModal.tsx # Plugin marketplace
│   │   ├── UpdateModal.tsx  # Auto-updater notification
│   │   ├── ResizablePanel.tsx # Draggable panel resize
│   │   └── ContextMenu.tsx  # Right-click context menu
│   ├── plugins/
│   │   ├── pluginInterface.ts # Plugin API types (VoidPlugin, VoidAPI)
│   │   ├── pluginSystem.ts   # Plugin manager + event bus + command registry
│   │   ├── pluginLoader.ts   # Dynamic plugin loading + enable/disable
│   │   ├── marketplace.ts    # Marketplace fetch, install, update, uninstall
│   │   ├── updater.ts        # GitHub release checker
│   │   ├── wordCountPlugin.ts # Built-in word count plugin
│   │   └── frontmatter.ts    # Frontmatter + backlinks + tag index
│   └── styles/
│       └── index.css        # Design system (CSS variables, themes, animations)
├── plugins/                  # Marketplace plugin scripts (hosted on GitHub)
│   ├── word-count.js
│   ├── text-snippets.js
│   └── auto-format.js
├── public/
│   └── plugins.json         # Marketplace plugin registry
├── index.html
├── vite.config.ts
├── package.json
├── PLUGIN_DEVELOPMENT.md    # Plugin development documentation
└── LICENSE
```

## Roadmap

- [ ] Graph view (note connections visualization)
- [ ] Export to PDF / HTML
- [ ] Cloud sync

## License

[MIT](LICENSE)

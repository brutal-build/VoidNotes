<p align="center">
  <img src="logo.png" alt="Void Notes" width="120">
</p>

<h1 align="center">Void Notes</h1>

> <p align="center">A brutalist, local-first Markdown knowledge management app. No cloud, no telemetry, no lock-in — your notes stay on your disk as plain <code>.md</code> files.</p>

<p align="center">Built with <strong>Electron 35</strong> + <strong>React 19</strong> + <strong>CodeMirror 6</strong> + <strong>react-force-graph</strong>. A privacy-focused second-brain notepad inspired by Obsidian.</p>
<p align="center">
<a href="https://www.producthunt.com/products/void-notes-minimalist-markdown-notepad?embed=true&amp;utm_source=badge-featured&amp;utm_medium=badge&amp;utm_campaign=badge-void-notes-minimalist-markdown-notepad" target="_blank" rel="noopener noreferrer"><img alt="Void Notes — Minimalist Markdown Notepad - A local-first Markdown second-brain  — free &amp; open-source | Product Hunt" width="250" height="54" src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1195560&amp;theme=dark&amp;t=1783978188675"></a></p>

<p align="center">
  <a href="https://brutalportfolio-three.vercel.app/">Portfolio</a> ·
  <a href="https://void-notes-coral.vercel.app/">Website</a> ·
  <a href="#features">Features</a> ·
  <a href="#installation">Installation</a>
</p>

---

## Features

### Core
- **Markdown Editing** — Full GFM support with live preview, split view, and syntax highlighting via CodeMirror 6
- **Wiki Links** — `[[Note Title]]` cross-references with automatic backlinks
- **Graph View** — Interactive node network of your notes and their connections
- **Tag System** — Organize notes with inline `#tags` and a dedicated tag browser
- **4 Themes** — Obsidian, Light, Dracula, and Nord
- **Vim Keybindings** — Full modal editing with insert, normal, and visual modes
- **Focus Mode** — Distraction-free writing environment
- **Command Palette** — `Ctrl+P` for quick actions
- **Global Search** — `Ctrl+Shift+F` across all notes
- **Templates** — Built-in templates for daily notes, meetings, projects, and more
- **Bookmarks** — Star your most-accessed notes
- **YAML Frontmatter** — Metadata parsing with date, tags, and custom fields

### Expanded (Beta)
- **Left Ribbon** — Vertical icon bar (new note, search, graph, settings)
- **Tab System** — VS Code-style tabs with drag reorder
- **Right Panel** — Backlinks, tags, and outline tabs
- **Graph View** — Enhanced with filters and zoom controls

---

## Installation

### Minimalistic Version (Stable)

```bash
git clone https://github.com/brutal-build/VoidNotes.git
cd VoidNotes
npm install
npm run dev
```

### Expanded Version (Beta)

Includes tabs, right panel, canvas, and enhanced graph view.

```bash
git checkout expanded
npm install
npm run dev
```

### Build for production

```bash
npm run build
npm run dist:win
```

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Electron 35 | Desktop shell |
| React 19 | UI framework |
| CodeMirror 6 | Markdown editor engine |
| TypeScript | Type safety |
| Vite | Build tooling |
| react-force-graph | Graph visualization |
| gray-matter | YAML frontmatter parsing |

---

## Themes

| Theme | Background | Accent |
|-------|------------|--------|
| Obsidian | `#1e1e1e` | `#8a70d6` (purple) |
| Light | `#ffffff` | `#8a70d6` (purple) |
| Dracula | `#282a36` | `#ff79c6` (pink) |
| Nord | `#2e3440` | `#88c0d0` (cyan) |

---

## License

MIT — free to use, modify, and distribute.

---

<p align="center">
  <a href="https://ko-fi.com/brutalbuild"><img src="https://img.shields.io/badge/Support%20me-Ko--fi-FF5E5B?logo=ko-fi&logoColor=white" alt="Ko-fi" /></a>
</p>

<p align="center">
  <sub>Built by <a href="https://github.com/brutal-build">brutal-build</a></sub>
</p>

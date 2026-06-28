<div align="center">
  <img src="docs/logo.png" alt="Void Notes" width="128" />
</div>

<h1 align="center">Void Notes</h1>

<p align="center">
  <strong>A brutalist, local-first Markdown knowledge management app.</strong>
  <br />
  Built with Electron, React, and CodeMirror 6.
</p>

<p align="center">
  <a href="https://brutalportfolio-three.vercel.app/">Portfolio</a> ·
  <a href="https://void-notes-coral.vercel.app/">Website</a> ·
  <a href="#features">Features</a> ·
  <a href="#installation">Installation</a>
</p>

---

## Overview

Void Notes is a privacy-focused second-brain notepad inspired by Obsidian. Every note is a plain `.md` file on your disk  no proprietary format, no cloud dependency, no telemetry. Just you and your markdown.

Choose from four built-in themes, use Vim keybindings, explore your notes through an interactive graph view, and keep everything under your control.

## Features

- **Markdown Editing** — Full GFM support with live preview, split view, and syntax highlighting via CodeMirror 6
- **Wiki Links** — `[[Note Title]]` cross-references with automatic backlinks
- **Graph View** — Interactive node network of your notes and their connections
- **Tag System** — Organize notes with inline `#tags` and a dedicated tag browser
- **4 Themes** — Obsidian, Light, Dracula, and Nord
- **Vim Keybindings** — Full modal editing with insert, normal, and visual modes
- **Focus Mode** — Distraction-free writing environment
- **Command Palette** — Ctrl+P for quick actions
- **Global Search** — Ctrl+Shift+F across all notes
- **Templates** — Built-in templates for daily notes, meetings, projects, and more
- **Bookmarks** — Star your most-accessed notes
- **YAML Frontmatter** — Metadata parsing with date, tags, and custom fields
- **Local-First** — Zero cloud, zero telemetry, zero lock-in. Your notes are plain `.md` files.

## Installation

### Minimalistic Version (Stable)

```
git clone https://github.com/brutal-build/VoidNotes.git
cd VoidNotes
npm install
npm run dev
```

### Expanded Version (Beta)

The expanded version includes tabs, right panel, canvas, and enhanced graph view.

```
git checkout expanded
npm install
npm run dev
```

## Tech Stack

| Technology | Purpose |
|---|---|
| Electron 35 | Desktop shell |
| React 19 | UI framework |
| CodeMirror 6 | Markdown editor engine |
| TypeScript | Type safety |
| Vite | Build tooling |
| react-force-graph | Graph visualization |
| gray-matter | YAML frontmatter parsing |

## Themes

| Theme | Background | Accent |
|---|---|---|
| Obsidian | `#1e1e1e` | `#8a70d6` (purple) |
| Light | `#ffffff` | `#8a70d6` (purple) |
| Dracula | `#282a36` | `#ff79c6` (pink) |
| Nord | `#2e3440` | `#88c0d0` (cyan) |

## License

MIT — free to use, modify, and distribute.

---

<p align="center">
  <a href="https://ko-fi.com/brutalbuild"><img src="https://img.shields.io/badge/Support%20me-Ko--fi-FF5E5B?logo=ko-fi&logoColor=white" alt="Ko-fi" /></a>
</p>

---

<p align="center">
  <sub>Built by <a href="https://github.com/brutal-build">brutal-build</a></sub>
</p>

import React, { useState } from "react";
import { APP_VERSION } from "../plugins/updater";

interface HelpProps {
  onClose: () => void;
}

type HelpSection =
  | "getting-started"
  | "shortcuts"
  | "features"
  | "markdown"
  | "about";

const SECTIONS: { id: HelpSection; label: string }[] = [
  { id: "getting-started", label: "Getting Started" },
  { id: "shortcuts", label: "Shortcuts" },
  { id: "features", label: "Features" },
  { id: "markdown", label: "Markdown" },
  { id: "about", label: "About" },
];

export default function Help({ onClose }: HelpProps) {
  const [activeSection, setActiveSection] = useState<HelpSection>("getting-started");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal-large"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">Help &amp; Documentation</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close help">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="help-nav">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              className={`help-nav-btn${activeSection === section.id ? " active" : ""}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <div className="modal-body">
          <div className="help-content">
            {activeSection === "getting-started" && <GettingStarted />}
            {activeSection === "shortcuts" && <KeyboardShortcuts />}
            {activeSection === "features" && <FeaturesOverview />}
            {activeSection === "markdown" && <MarkdownReference />}
            {activeSection === "about" && <AboutSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Getting Started
   ================================================================ */

function GettingStarted() {
  return (
    <>
      <h3>Welcome to Void Notes</h3>
      <p>
        Void Notes stores all your notes as plain Markdown files in a local folder called a{" "}
        <strong>Vault</strong>. When you first launch the app, you will be asked to choose a folder.
        All notes you create will be saved there as <code>.md</code> files.
      </p>

      <h3>Quick Start</h3>
      <ol className="help-ordered-list">
        <li>
          <strong>Choose a vault</strong> &mdash; pick an existing folder or create a new one when prompted.
        </li>
        <li>
          <strong>Create a note</strong> &mdash; press <kbd>Ctrl+N</kbd> or click the + button in the sidebar.
        </li>
        <li>
          <strong>Write Markdown</strong> &mdash; use standard syntax like <code>**bold**</code>,{" "}
          <code># headings</code>, and <code>[[wiki links]]</code>.
        </li>
        <li>
          <strong>Toggle preview</strong> &mdash; press <kbd>Ctrl+E</kbd> to switch between editing and preview.
        </li>
        <li>
          <strong>Search everything</strong> &mdash; press <kbd>Ctrl+P</kbd> for the command palette.
        </li>
        <li>
          <strong>Explore connections</strong> &mdash; open the Graph view from the left ribbon to visualize note links.
        </li>
        <li>
          <strong>Customize</strong> &mdash; press <kbd>Ctrl+,</kbd> to open Settings and choose themes, fonts, and more.
        </li>
      </ol>

      <h3>Key Concepts</h3>
      <table className="help-table">
        <thead>
          <tr><th>Concept</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Vault</strong></td><td>A local folder containing all your Markdown notes.</td></tr>
          <tr><td><strong>Wiki Links</strong></td><td>Type <code>[[</code> to link between notes. Click a link to navigate.</td></tr>
          <tr><td><strong>Frontmatter</strong></td><td>YAML metadata block at the top of a note (tags, dates, title).</td></tr>
          <tr><td><strong>Backlinks</strong></td><td>See which notes link to the current note in the right panel.</td></tr>
          <tr><td><strong>Graph View</strong></td><td>Interactive visualization of all note connections.</td></tr>
          <tr><td><strong>Daily Notes</strong></td><td>A new dated note created with <kbd>Ctrl+D</kbd> or <kbd>Ctrl+Shift+N</kbd>.</td></tr>
        </tbody>
      </table>
    </>
  );
}

/* ================================================================
   Keyboard Shortcuts
   ================================================================ */

function KeyboardShortcuts() {
  return (
    <>
      <h3>File Operations</h3>
      <table className="help-table">
        <thead>
          <tr><th>Shortcut</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td><kbd>Ctrl+N</kbd></td><td>Create new note</td></tr>
          <tr><td><kbd>Ctrl+Shift+N</kbd></td><td>Create daily note</td></tr>
          <tr><td><kbd>Ctrl+D</kbd></td><td>Create daily note (when not in editor)</td></tr>
          <tr><td><kbd>Ctrl+S</kbd></td><td>Save current note</td></tr>
        </tbody>
      </table>

      <h3>Edit &amp; View</h3>
      <table className="help-table">
        <thead>
          <tr><th>Shortcut</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td><kbd>Ctrl+E</kbd></td><td>Toggle Edit / Preview mode</td></tr>
          <tr><td><kbd>Ctrl+Shift+E</kbd></td><td>Toggle Split View (edit + preview)</td></tr>
          <tr><td><kbd>Ctrl+Z</kbd></td><td>Undo</td></tr>
          <tr><td><kbd>Ctrl+Shift+Z</kbd></td><td>Redo</td></tr>
          <tr><td><kbd>Ctrl+F</kbd></td><td>Search within current note</td></tr>
        </tbody>
      </table>

      <h3>Navigation &amp; Search</h3>
      <table className="help-table">
        <thead>
          <tr><th>Shortcut</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td><kbd>Ctrl+P</kbd></td><td>Open Command Palette (quick file search)</td></tr>
          <tr><td><kbd>Ctrl+Shift+F</kbd></td><td>Open Global Search (content search)</td></tr>
          <tr><td><kbd>Ctrl+,</kbd></td><td>Open Settings</td></tr>
          <tr><td><kbd>F1</kbd></td><td>Open this Help panel</td></tr>
        </tbody>
      </table>

      <h3>Panels &amp; Modes</h3>
      <table className="help-table">
        <thead>
          <tr><th>Shortcut</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td><kbd>Ctrl+T</kbd></td><td>Open Templates panel</td></tr>
          <tr><td><kbd>F9</kbd></td><td>Toggle Focus Mode (hide sidebars)</td></tr>
          <tr><td><kbd>Esc</kbd></td><td>Exit Focus Mode (when active and no modal open)</td></tr>
        </tbody>
      </table>

      <h3>Sidebar Tree Navigation</h3>
      <table className="help-table">
        <thead>
          <tr><th>Key</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td><kbd>&uarr;</kbd><kbd>&darr;</kbd></td><td>Move between files and folders</td></tr>
          <tr><td><kbd>&rarr;</kbd></td><td>Expand folder</td></tr>
          <tr><td><kbd>&larr;</kbd></td><td>Collapse folder or go to parent</td></tr>
          <tr><td><kbd>Enter</kbd></td><td>Open selected file / toggle folder</td></tr>
          <tr><td><kbd>Home</kbd></td><td>Jump to first item</td></tr>
          <tr><td><kbd>End</kbd></td><td>Jump to last item</td></tr>
        </tbody>
      </table>
    </>
  );
}

/* ================================================================
   Features Overview
   ================================================================ */

function FeaturesOverview() {
  return (
    <>
      <h3>Notes &amp; Editing</h3>
      <p>
        Write Markdown notes with syntax highlighting, live preview, and spellcheck.
        Each note is a plain <code>.md</code> file in your vault folder. Tabs preserve
        independent editor buffers, cursor positions, and undo history.
      </p>

      <h3>Wiki Links</h3>
      <p>
        Link between notes using <code>[[note-name]]</code>. When you type{" "}
        <code>[[</code> in the editor, an autocomplete menu appears showing all your notes.
        Clicking a wiki link in Preview mode navigates to that note. Links support aliases
        (<code>[[note|display text]]</code>), headings (<code>[[note#heading]]</code>), and
        folder-qualified paths.
      </p>

      <h3>Backlinks</h3>
      <p>
        The right panel shows backlinks &mdash; notes that link to the current note.
        This helps you discover connections between ideas. Outgoing links and unresolved
        links are shown separately.
      </p>

      <h3>Graph View</h3>
      <p>
        Interactive force-directed graph showing all your notes as nodes and wiki links as edges.
        Supports local view (neighbors of current note), global view (entire vault), filtering by tags,
        search, zoom, pan, and node focusing. Graph settings persist per vault.
      </p>

      <h3>Search</h3>
      <p>
        <strong>Command Palette</strong> (<kbd>Ctrl+P</kbd>) &mdash; quick file search with instant results.
      </p>
      <p>
        <strong>Global Search</strong> (<kbd>Ctrl+Shift+F</kbd>) &mdash; full-text search across
        all notes with match highlighting and keyboard navigation. Supports searching by filename,
        path, content, tags, and properties.
      </p>

      <h3>Sidebar &amp; File Tree</h3>
      <p>
        The sidebar shows all your notes organized in a collapsible folder tree.
        Folders expand and collapse with arrow keys. Right-click any file for context actions:
        open, pin, bookmark, rename, copy path, and delete. Pinned notes appear at the top.
      </p>

      <h3>Tags &amp; Frontmatter</h3>
      <p>
        Add YAML frontmatter at the top of any note to define metadata like tags,
        title, dates, and custom properties. Inline <code>#tags</code> in the body are
        also extracted and shown in the sidebar tag filter.
      </p>

      <h3>Templates</h3>
      <p>
        Insert pre-built note templates from the Templates panel (<kbd>Ctrl+T</kbd>).
        Templates support variables that are resolved at insertion time.
      </p>

      <h3>Daily Notes</h3>
      <p>
        Quickly create a note named with today&apos;s date using <kbd>Ctrl+D</kbd> or
        the calendar icon. Daily notes can use a configurable template via Settings.
      </p>

      <h3>Split View</h3>
      <p>
        View a note side-by-side with editing on one side and live preview on the other.
        Toggle with <kbd>Ctrl+Shift+E</kbd>. The split ratio is adjustable and persists
        across sessions.
      </p>

      <h3>Focus Mode</h3>
      <p>
        Hide the sidebar and left ribbon for distraction-free writing. Toggle with{" "}
        <kbd>F9</kbd>. Press <kbd>Esc</kbd> to exit.
      </p>

      <h3>Bookmarks</h3>
      <p>
        Star important notes for quick access. Bookmarks appear in their own panel
        accessible from the left ribbon. Stale bookmarks are cleaned up automatically
        when notes are deleted or renamed.
      </p>

      <h3>Canvas</h3>
      <p>
        A freeform whiteboard for visual thinking. Access from the left ribbon.
        Canvas data persists per vault.
      </p>

      <h3>Trash</h3>
      <p>
        Deleted notes go to a vault-local trash folder instead of being permanently removed.
        Restore or permanently delete notes from the Trash panel in the left ribbon.
      </p>

      <h3>Vault Stats</h3>
      <p>
        View statistics about your vault: total notes, folders, tags, links, word count,
        and file sizes. Access from the Settings panel.
      </p>

      <h3>Themes</h3>
      <p>
        Five built-in themes: Obsidian (dark), Light, Dracula, Nord, and Solarized.
        Theme selection persists across sessions with no flash on startup.
      </p>
    </>
  );
}

/* ================================================================
   Markdown Reference
   ================================================================ */

function MarkdownReference() {
  return (
    <>
      <h3>Basic Formatting</h3>
      <table className="help-table">
        <thead>
          <tr><th>Syntax</th><th>Result</th></tr>
        </thead>
        <tbody>
          <tr><td><code>**bold**</code></td><td><strong>bold</strong></td></tr>
          <tr><td><code>*italic*</code></td><td><em>italic</em></td></tr>
          <tr><td><code>__underline__</code></td><td><u>underline</u></td></tr>
          <tr><td><code>~~strikethrough~~</code></td><td><del>strikethrough</del></td></tr>
          <tr><td><code>==highlight==</code></td><td><span className="md-highlight">highlight</span></td></tr>
          <tr><td><code>||spoiler||</code></td><td><span className="spoiler-hidden revealed">spoiler</span></td></tr>
          <tr><td><code>`inline code`</code></td><td><code>inline code</code></td></tr>
        </tbody>
      </table>

      <h3>Headings</h3>
      <pre className="help-code">{`# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6`}</pre>

      <h3>Lists</h3>
      <pre className="help-code">{`- Unordered item
- Another item
  - Nested item

1. Ordered item
2. Another ordered item
   1. Nested ordered item

- [ ] Task item (unchecked)
- [x] Task item (checked)`}</pre>

      <h3>Links &amp; Images</h3>
      <pre className="help-code">{`[[Internal wiki link]]
[[note-name|Display text]]
[[note#heading]]
[[folder/note]]

[External link](https://example.com)
![Image alt text](image.png)`}</pre>

      <h3>Code Blocks</h3>
      <pre className="help-code">{`\`\`\`javascript
const greeting = "Hello, Void";
console.log(greeting);
\`\`\`

\`\`\`python
def hello():
    print("Hello, Void")
\`\`\``}</pre>

      <h3>Blockquotes</h3>
      <pre className="help-code">{`> Single line quote

> Multi-line
> blockquote

> Nested
>> Quote level 2`}</pre>

      <h3>Tables</h3>
      <pre className="help-code">{`| Column A | Column B | Column C |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |`}</pre>

      <h3>Horizontal Rule</h3>
      <pre className="help-code">{`---\n***\n___`}</pre>

      <h3>Callouts</h3>
      <p>Create styled callout blocks for tips, warnings, and info:</p>
      <pre className="help-code">{`> [!INFO] Note Title
> Informational content here.

> [!WARNING] Caution
> Something to watch out for.

> [!TIP] Pro Tip
> A helpful suggestion.

> [!DANGER] Critical
> Destructive or irreversible action ahead.

> [!EXAMPLE]
> An example block.

> [!QUOTE]
> A quotation or citation.`}</pre>

      <h3>Frontmatter</h3>
      <p>
        Add YAML metadata at the very top of any note, separated by <code>---</code> lines.
        Supported types: strings, numbers, booleans, dates, arrays, and null.
      </p>
      <pre className="help-code">{`---
title: My Note
tags: [project, idea, todo]
date: 2026-01-15
draft: false
priority: 2
author: Sebastian
---
Your note content starts here...`}</pre>

      <h3>Mermaid Diagrams</h3>
      <p>Render diagrams using Mermaid syntax inside code blocks:</p>
      <pre className="help-code">{`\`\`\`mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Do this]
    B -->|No| D[Do that]
\`\`\``}</pre>
    </>
  );
}

/* ================================================================
   About
   ================================================================ */

function AboutSection() {
  return (
    <>
      <h3>Void Notes</h3>
      <div className="help-about-card">
        <div className="help-about-row">
          <span className="help-about-label">Version</span>
          <span className="help-about-value">v{APP_VERSION}</span>
        </div>
        <div className="help-about-row">
          <span className="help-about-label">Branch</span>
          <span className="help-about-value">expanded</span>
        </div>
        <div className="help-about-row">
          <span className="help-about-label">Author</span>
          <span className="help-about-value">brutal-build</span>
        </div>
        <div className="help-about-row">
          <span className="help-about-label">License</span>
          <span className="help-about-value">MIT</span>
        </div>
        <div className="help-about-row">
          <span className="help-about-label">Repository</span>
          <span className="help-about-value">
            <a
              href="https://github.com/brutal-build/VoidNotes"
              target="_blank"
              rel="noopener noreferrer"
              className="help-link"
            >
              github.com/brutal-build/VoidNotes
            </a>
          </span>
        </div>
      </div>

      <h3>Description</h3>
      <p>
        Void Notes is a second-brain Markdown notepad. Think Obsidian but built from scratch
        with modern web technologies. It stores your notes as plain <code>.md</code> files
        in a local folder, never in a proprietary database.
      </p>

      <h3>Tech Stack</h3>
      <table className="help-table">
        <thead>
          <tr><th>Technology</th><th>Role</th></tr>
        </thead>
        <tbody>
          <tr><td>Electron 35</td><td>Desktop shell and native APIs</td></tr>
          <tr><td>React 19</td><td>UI framework</td></tr>
          <tr><td>TypeScript 5.8</td><td>Type-safe codebase</td></tr>
          <tr><td>Vite 6</td><td>Build tool and dev server</td></tr>
          <tr><td>CodeMirror 6</td><td>Code/text editor</td></tr>
          <tr><td>Zustand 5</td><td>State management</td></tr>
          <tr><td>D3 Force</td><td>Graph visualization engine</td></tr>
          <tr><td>Mermaid</td><td>Diagram rendering</td></tr>
          <tr><td>gray-matter</td><td>Frontmatter parsing</td></tr>
          <tr><td>electron-updater</td><td>Automatic updates</td></tr>
        </tbody>
      </table>

      <h3>Credits</h3>
      <p>
        Built by <strong>brutal-build</strong>. Inspired by Obsidian, Notion, and the
        broader Tools for Thought community. All icons are custom SVG. No emoji in the UI.
      </p>
    </>
  );
}

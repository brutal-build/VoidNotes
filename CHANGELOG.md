# Changelog

## v0.4.0 - Expanded (2026-07-15)

### New features

- **Auto-update** - `electron-updater` with progress dialog, release notes, and opt-in auto-download (Settings).
- **Image paste & drag-drop** - paste or drop images into the editor; saves to the vault and inserts `![](path)` markdown.
- **Note Export** - export as `.md`, HTML (full styled page), or entire vault as `.zip` via the native save dialog.
- **Vault Stats** - modal with note/folder/tag/wiki-link/orphan counts, size metrics, and recently modified list.
- **Pin favorites** - pin notes to the top of the sidebar tree (separate from bookmarks), with context menu and indicator.
- **Mermaid diagrams** - lazy `MermaidDiagram` renders ` ```mermaid ` blocks in preview (dark/light aware).
- **Toast notifications** - FIFO queue, max 3 visible, 4s auto-dismiss (success/error/warning/info).
- **Context menus** - right-click sidebar items (Open, Pin, Bookmark, Rename, Copy path, Delete).
- **Empty states** - shared icon/title/action component used across panels.
- **System theme** - `system` option follows `prefers-color-scheme` and OS changes.
- **Graph loading state** - progress indicator while the graph builds.

### Architecture

- Split App.tsx into feature hooks (`useNoteOperations`, `useVaultSync`, `useAutosave`, `useTheme`, `useUpdateFlow`, ...).
- Extracted `EditorArea`, `AppOverlays`, `LazyPanel`, `SettingsWrapper`, `RenameModal`.

### Pre-release fixes

- Session coordinator used when opening tabs (no dirty buffer loss on tab switch).
- Wiki links: create-missing dialog, clickable missing links, HTML escape in preview.
- ZIP export without shell injection (paths via env + `execFile`).
- File watcher starts after window creation (cold start with saved vault).
- Spellcheck from Settings reaches the editor; dirty dots on tabs work.
- CI release runs on `v*` tags.

---

## v0.3.0 - Expanded (2026-07-13)

### New features

- **macOS Glass Theme** - translucent panels with `backdrop-filter` blur and a dark gradient background. Panels, modals, sidebar, and top-bar use semi-transparent backgrounds; overlays get stronger blur.
- **Trash panel** - preview deleted notes before restore/delete, styled Restore/Delete SVG buttons, permanent delete confirmation dialog.
- **Note creation dialog** - New Note opens an InputDialog with a name field (same pattern as New Folder). Auto-appends `.md`.
- **Bookmark stars** - bookmarked files show an accent-colored star in the sidebar tree.
- **Dialog system** - `ConfirmDialog`, `InputDialog`, and `Dialog` with full CSS styling. Replaces native `window.confirm()` and `window.prompt()`.
- **Missing wiki note creation** - clicking `[[...]]` to a non-existent note offers creation via dialog.
- **External change detection** - file watcher monitors the vault and notifies the renderer of create/change/delete outside the app.

### Bug fixes

- **Autosave race condition** - session coordinator with versioned loads and queued saves prevents overwriting newer data.
- **Dirty-close dialog** - closing a tab with unsaved changes shows ConfirmDialog (Save / Discard / Cancel).
- **Theme name mismatch** - `obsidian` theme was stored incorrectly in localStorage.
- **Context menu z-index** - under macOS theme the context menu appeared under the editor. Fixed with `createPortal(..., document.body)`.
- **Preview pane macOS** - preview panel lacked the glass effect on the macOS theme.
- **Dialog styling** - Delete Note and New Folder dialogs had no CSS.
- **"Destination already exists"** - creating a note failed when the file already existed. Now auto-increments (Untitled 1, 2...).
- **Ctrl+E in editor** - preview toggle required clicking outside the editor first. Removed unnecessary `!inEditor` guard.
- **Focus mode button** - "Show sidebar" overlapped window controls. Moved next to the note name breadcrumb.
- **Graph simulation leak** - opening/closing the graph repeatedly no longer leaves a running simulation.
- **Trash restore/delete style** - trash buttons lacked CSS; now fully styled.

### UI/UX improvements

- **Accessibility** - sidebar ARIA tree markup and full keyboard support (arrows, Enter, Space).
- **`prefers-reduced-motion`** - animations respect the OS reduced-motion preference.
- **`transition: all`** - replaced with specific properties (`background-color`, `color`, `opacity`, etc.) for better performance.
- **Empty states** - panels without content show messages instead of blank areas.
- **Z-index and overlay rules** - unified stacking for modals, tooltips, and context menus.
- **Bookmark cleanup** - deleting a note removes it from bookmarks automatically.

### Architecture / Performance

- **VaultIndex** - global search uses a pre-built index instead of a linear scan.
- **Incremental backlinks** - backlink refresh uses incremental indexing instead of full rebuilds.
- **Code splitting** - `React.lazy()` for NoteEditor, GraphView, GlobalSearch, Settings, and other modals.
- **Session coordinator** - per-tab editor state with race-condition isolation.
- **Version** - 0.2.5 → 0.3.0

### Under the hood

- Error logging in empty catch blocks (`electron/main.ts`, `electron/window.ts`).
- `EditorState` interface for CodeMirror state persistence.
- New IPC channel `trash:load` to load trash note contents.

# Void Notes Quality Upgrade Specification

## 1. Goal

Turn Void Notes into a reliable, polished desktop knowledge app where file operations, editing, navigation, search, graph, panels, templates, bookmarks, properties, split views, settings, and recovery paths behave predictably.

The work must improve the existing `expanded` branch without replacing its architecture or removing current features.

## 2. Current Baseline

- Stack: Electron 35, React 19, TypeScript 5.8, Vite 6, CodeMirror 6, Zustand 5, D3 Force, Vitest.
- Existing verification passes: 19 tests and production build.
- Current branch: `expanded`.
- The worktree already contains a large unfinished change set. It must be preserved and treated as the baseline.
- Existing strengths: component-based renderer, isolated preload bridge, lazy-loaded secondary views, error boundaries, theme tokens, autosave, wiki links, backlinks, tags, graph settings, right-side panels, split editing, bookmarks, templates, and tests for core pure utilities.

## 3. Critical Functional Requirements

### 3.1 Data Safety

1. Autosave must never write note A's content into note B after a rapid tab switch.
2. Pending writes must be flushed before closing a tab, switching vaults, deleting or renaming a note, and closing the application.
3. A failed save must leave the note marked dirty and show a visible retryable error.
4. Destructive actions must require an in-app confirmation dialog.
5. Deleted notes must go to a vault-local trash folder with restore and permanent-delete actions.
6. External file changes must be detected. The app must refresh clean files and present a conflict dialog for dirty files.
7. Writes must be atomic: write to a temporary file and rename it over the destination.
8. Opening or switching vaults must validate that the target is a writable directory.

### 3.2 File and Path Correctness

1. Every IPC path must be validated against the canonical vault root using `path.relative`, not a string-prefix comparison.
2. Symlink traversal outside the vault must be blocked.
3. Note names and folder names must reject absolute paths, traversal segments, Windows reserved names, invalid characters, trailing dots/spaces, and empty values.
4. Rename must keep active note, open tab IDs, tab labels, bookmarks, backlinks, properties, and selection synchronized.
5. Rename and delete failures must return structured errors instead of silent `false` values.
6. Note creation must support the selected folder and report duplicate-name failures clearly.
7. Empty folders must appear in the tree and support rename/delete.

### 3.3 Editor and Tabs

1. Tabs must preserve an independent editor buffer, cursor position, scroll position, history, preview state, and dirty state.
2. Rapid note selection must not allow a slower earlier load to overwrite the latest selected note.
3. Closing a dirty tab must offer Save, Discard, and Cancel.
4. Closing the active tab must select the nearest logical neighbor.
5. Wiki-link completion must use note display names while retaining unambiguous full paths.
6. Clicking an unresolved wiki link must offer to create the missing note.
7. Wiki-link resolution must support aliases, headings, and folder-qualified links.
8. Editor spellcheck setting must be applied to the editable surface.
9. Undo and redo must remain scoped to each note.
10. Search and keyboard shortcuts must not override text editing shortcuts incorrectly.

### 3.4 Navigation and Organization

1. Sidebar items and folder headers must be keyboard accessible with correct tree semantics.
2. File tree state must persist across refreshes without collisions between same-named nested folders.
3. Search must support filename, path, content, tags, properties, and recent-note ranking.
4. Search results must highlight matches and support keyboard navigation.
5. Bookmarks must remove stale entries after delete and update paths after rename.
6. Recent notes and quick switcher history must persist per vault.
7. Backlinks and outgoing links must navigate reliably and display unresolved links separately.

### 3.5 Graph

1. Local and global graph modes must produce deterministic nodes and links from the current vault index.
2. Filters, depth, node size, color mode, orphan visibility, and force parameters must persist per vault.
3. Graph simulation must stop and dispose on close or data change.
4. Large vaults must remain interactive by limiting work, avoiding unnecessary React renders, and moving heavy indexing off the immediate UI path.
5. Graph nodes must support hover details, keyboard focus, selected-note highlighting, fit-to-view, reset, zoom, and pan.
6. Empty and filtered-out states must explain what happened and provide a reset action.

### 3.6 Properties, Frontmatter, Tags, and Outline

1. Frontmatter edits must preserve the Markdown body and unrelated YAML fields.
2. Invalid YAML must display an error without deleting or rewriting user data.
3. Property values must support strings, numbers, booleans, dates, arrays, and null.
4. Tags from frontmatter and inline hashtags must be normalized consistently.
5. Outline headings must navigate to the matching editor position or preview anchor.
6. Property saves must use the same safe save pipeline as editor changes.

### 3.7 Settings, Templates, Canvas, and Modals

1. All settings must persist and be applied immediately without theme flash.
2. Split orientation and ratio must persist, clamp safely, and support pointer and keyboard resizing.
3. Templates must preview before insertion and must not overwrite a note without confirmation.
4. Template variables must resolve consistently and have tests.
5. Canvas must persist its data per vault or be clearly marked as a temporary scratchpad.
6. All dialogs must be React dialogs. Native renderer `window.prompt`, `window.alert`, and `window.confirm` are forbidden.
7. Escape closes only the topmost overlay. Focus must be trapped and restored.

## 4. UI and UX Requirements

### 4.1 Visual Direction

- Sleek, compact, Obsidian-like desktop workspace.
- Clear hierarchy between ribbon, sidebar, tabs, top bar, editor, right panel, and status bar.
- Consistent SVG icon language with no text glyphs used as primary controls.
- High information density without cramped hit targets.
- Five themes remain supported through shared semantic tokens.
- No feature may use one-off inline styling in production components.

### 4.2 Interaction Quality

- Minimum interactive target: 28 by 28 px for dense desktop controls, 36 by 36 px for primary controls.
- Every control needs hover, active, disabled, focus-visible, and selected states.
- Tooltips must identify icon-only actions and shortcuts.
- Use explicit CSS transitions only. `transition: all` is forbidden.
- Motion must use project easing tokens and respect `prefers-reduced-motion`.
- Resizing must use Pointer Events, pointer capture, and a visible active divider.
- Loading, empty, error, and success states must be visually consistent.
- No abrupt layout jumps when panels open, notes load, or lazy views mount.

### 4.3 Accessibility

- Full keyboard navigation for file tree, tabs, ribbon, graph controls, panels, dialogs, and menus.
- Correct roles and ARIA labels for tree, treeitem, tablist, tab, dialog, menu, and status messages.
- Visible focus indicators in every theme.
- Contrast must meet WCAG AA for text and controls.
- Status and error messages must use appropriate live regions.

### 4.4 Responsive Desktop Layout

- Validate at 800x600, 1200x800, 1440x900, and ultrawide layouts.
- Side panels must never reduce the editor below a usable width.
- At narrow widths, the right panel becomes an overlay or collapses automatically.
- Modal dimensions must fit the available viewport and scroll internally.

## 5. Architecture Requirements

1. Keep Electron main-process responsibilities in focused modules.
2. Define typed IPC request and response contracts shared by preload and renderer.
3. Replace boolean or empty-string IPC failure sentinels with discriminated results.
4. Keep one authoritative note-session model for tabs, buffers, save state, and load versions.
5. Extract pure file-name validation, path validation, template expansion, link resolution, and tab-transition logic for direct testing.
6. Index vault content incrementally instead of reloading every note after each file operation.
7. Avoid adding dependencies unless the installed stack cannot solve the requirement cleanly.
8. Do not rewrite the app or introduce speculative plugin architecture beyond what current features use.

## 6. Performance Targets

- Initial UI becomes interactive within 1.5 seconds for a 1,000-note vault on a typical desktop SSD.
- Opening a note already indexed should feel immediate and complete within 100 ms excluding disk variance.
- Typing must remain at 60 FPS with autosave and indexing active.
- Sidebar filtering should complete within 50 ms for 5,000 notes.
- Graph view should remain usable at 2,000 nodes with graceful degradation above that size.
- Production renderer entry chunk should be reduced through meaningful manual chunks or lazy boundaries.

## 7. Test Requirements

### 7.1 Unit Tests

- Path containment and traversal.
- Filename and folder validation.
- Wiki-link parsing, aliases, headings, and unresolved links.
- Frontmatter parse, edit, invalid YAML, and body preservation.
- Template variable expansion.
- Tab rename, close, dirty-state, and neighbor selection logic.
- Store persistence with malformed stored values.

### 7.2 Component Tests

- Sidebar tree keyboard navigation and context actions.
- Dirty-tab close dialog.
- Rename and new-folder dialogs.
- Search keyboard flow and highlighting.
- Properties editor validation.
- Modal focus trap and Escape behavior.

### 7.3 Integration Tests

- Create, edit, autosave, rename, delete, restore, and reopen a note.
- Rapidly switch notes during delayed reads and saves.
- Switch vault with pending edits.
- External file modification conflict.
- Failed disk write and retry.
- Main/preload IPC contract validation.

### 7.4 Manual UI Verification

- All five themes.
- 800x600, 1200x800, and 1440x900.
- Keyboard-only workflow.
- Reduced-motion mode.
- Large generated vault.
- Production Electron build with no console errors.

## 8. Acceptance Gates

1. `npm run test` passes with expanded behavior coverage.
2. `npm run build` passes without TypeScript errors.
3. No known data-loss path remains in autosave, rename, delete, tab close, vault switch, or app close.
4. No renderer-native prompt, alert, or confirm remains.
5. No unsafe path can escape the selected vault.
6. No silent user-facing operation failure remains.
7. Every visible feature has loading, empty, error, and success behavior where applicable.
8. Keyboard-only navigation covers all primary flows.
9. UI review finds no clipped controls, overlapping layers, inconsistent icon sizing, or missing focus states.
10. Existing user changes are preserved and no unrelated files are reverted.

# Void Notes - Remaining Work

Status: **PHASE 1 COMPLETE** — 2026-07-11.
Branch: `expanded`.

This file is a continuation checklist. The existing worktree is intentionally dirty. Do not reset, checkout, or discard existing changes.

## Verification baseline

- `npm run test` currently passes: **16 test files, 73 tests** ✅
- `npm run build` now **PASSES** ✅
- `npm run build:main` and `npm run build:renderer` passing ✅
- No commit, push, tag, release, or deploy was performed.

## ✅ Completed: Immediate blockers (Phase 1)

### ✅ 1. Structured IPC migration in `App.tsx` — COMPLETE

All IPC call sites now check `result.ok` and handle errors:

- ✅ `getVault()` — checks `result.ok`, uses `result.value`
- ✅ `listNotes()` — checks `result.ok`, uses `result.value.notes`
- ✅ `loadNote()` — checks `result.ok`, shows error on failure
- ✅ `saveNote()` — checks `result.ok`, preserves dirty state on failure
- ✅ `createNote()` — checks `result.ok`, shows error on failure
- ✅ `deleteNote()` — checks `result.ok`, uses returned `trashId`
- ✅ `renameNote()` — checks `result.ok`, synchronizes state
- ✅ `selectVault()` / `setVault()` — check results before state changes
- ✅ `createFolder()` — checks `result.ok`, shows error on failure

Error messages shown via toast (temporary solution).

### ✅ 2. Note session coordinator integrated — PARTIAL

- ✅ `sessionCoordinator` created with `useMemo`
- ✅ `flush()` method available
- ⚠️ **NOT YET USED** for per-note buffers and autosave
- ⚠️ `saveTimeoutRef` still global (temporary — Phase 2 work)

Session coordinator is ready but not yet wired to editor state. Current autosave still uses global timeout as fallback.

### ✅ 3. Close handshake connected — COMPLETE

- ✅ `window.electronAPI.onCloseRequested()` registered in effect
- ✅ Calls `sessionCoordinator.flush()` before close
- ✅ Calls `window.electronAPI.closeReady()` after successful flush
- ✅ Shows error message if flush fails
- ✅ Cleanup on unmount

### ✅ 4. Native renderer prompt removed — COMPLETE

- ✅ `window.prompt()` removed from `handleNewFolder`
- ✅ New component: `src/components/ui/InputDialog.tsx`
- ✅ Dialog has input, validation, Cancel, and Create actions
- ✅ Error toast for folder creation failures

## Important completed foundations

These files already exist and have focused tests:

- `electron/path-safety.ts` - canonical containment, traversal, Windows name validation.
- `electron/note-files.ts` - writable vault validation, atomic saves, empty folders, trash/restore/permanent delete.
- `src/shared/ipc-contract.ts` - discriminated IPC results and channel constants.
- `src/services/note-session.ts` - per-note buffers, stale-load protection, serialized saves, retry/flush helpers.
- `src/services/vault-index.ts` - incremental metadata/content index and ranked query.
- `src/services/vault-tree.ts` - stable full-path tree IDs, empty folders, deterministic flattening.
- `src/plugins/wiki-links-utils.ts` - aliases, headings, path-aware resolution, ambiguous/missing states.
- `src/components/ui/Dialog.tsx` - ARIA dialog, focus trap, Escape, focus restoration.
- `src/components/ui/ConfirmDialog.tsx` - destructive and Save/Discard/Cancel variants.
- `src/components/ui/ToastRegion.tsx` - live status region.

## Remaining functional work after build is green

### Data safety

- Add watcher lifecycle and external-change handling:
  - clean notes refresh automatically,
  - dirty notes show conflict dialog,
  - watcher is disposed on vault switch and app close,
  - own atomic writes are suppressed or recognized.
- Validate and atomically persist `electron/config.ts`.
- Remove operational empty catches that hide user-visible failures.

### Sessions and navigation

- Connect session buffers to CodeMirror and restore cursor/scroll/history per tab.
- Dirty tab close must offer Save, Discard, Cancel.
- Rename/delete must synchronize tabs, active selection, bookmarks, backlinks, properties, recents, and index.
- Use nearest logical neighbor after closing the active tab.
- Add missing wiki-note creation dialog and heading navigation.
- Prevent global shortcuts from overriding text editing shortcuts.
- Confirm `spellcheck` is applied to the CodeMirror editable surface.

### Search and sidebar

- Connect `VaultIndex` to the live App store and GlobalSearch instead of rebuilding/scanning maps.
- Keep filename, path, content, tags, properties, and recent ranking.
- Render match highlighting and keyboard navigation through an accessible dialog.
- Finish semantic tree markup in `Sidebar`: `tree`, `treeitem`, `aria-expanded`, roving keyboard focus, arrows, Home/End.
- Persist expanded folders per vault.
- Support empty-folder rename/delete/create from the tree.

### Frontmatter and properties

- Connect safe frontmatter/property edits to the same save queue as editor changes.
- Show invalid YAML errors without rewriting user content.
- Verify body and unrelated YAML fields stay byte-safe enough for user expectations.
- Verify strings, numbers, booleans, dates, arrays, and null in the UI.
- Normalize frontmatter and inline tags consistently.

### Graph

- Finish GraphView structured IPC error rendering and stale build cancellation.
- Dispose simulation on close and data changes.
- Remove any remaining nondeterministic layout behavior.
- Add canvas keyboard accessibility, focusable node list, selected-note highlight, fit-to-view, reset, zoom, and pan.
- Persist graph settings per vault.
- Add large-vault graceful degradation and reduced-motion behavior.

### UI and `fix.md`

- Remove `transition: all` from:
  - `src/styles/index.css:2397`
  - `src/styles/index.css:2724`
  - `src/styles/themes.css:202-203`
- Replace with explicit property transitions and project easing tokens.
- Remove remaining production inline styles where practical, especially split pane flex styles and modal layout.
- Split resizing must use Pointer Events, pointer capture, keyboard control, clamp, `role="separator"`, `aria-valuenow`, and per-vault persistence.
- Keep editor scrollbar flush with pane edge while retaining content padding.
- Add complete reduced-motion overrides.
- Verify all five themes and target window sizes: 800x600, 1200x800, 1440x900, ultrawide.

## Final verification

Run in order:

```bash
npm run test
npm run build
npm run build:main
npm run build:renderer
```

Then launch the production-built Electron app and manually verify:

1. Open vault, create note/folder, edit, autosave, retry failed save.
2. Rapidly switch notes without content crossover.
3. Rename, delete to trash, restore, permanently delete.
4. Close dirty tab with Save/Discard/Cancel.
5. Switch vault with pending edits.
6. External clean change and dirty conflict.
7. Wiki aliases, headings, folder paths, unresolved-note creation.
8. Search and keyboard navigation.
9. Properties and malformed YAML.
10. Graph local/global/settings/lifecycle/accessibility.
11. Split right/down drag and keyboard resizing.
12. All themes, reduced motion, keyboard-only flow, and no console errors.

Before delivery, run simplify review and independent security/functional/UI review. Do not claim completion unless the test, build, and manual evidence are real.

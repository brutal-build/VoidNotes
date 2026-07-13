# Hermes Implementation Instructions

## Objective

Implement `spec.md` in the existing Void Notes `expanded` branch after Sebastian approves `spec.md`, `hermes.md`, and `agents.md`.

Do not implement anything before approval.

## Mandatory Workflow

1. Re-read `spec.md`, `hermes.md`, and `agents.md`.
2. Re-check `git status --short` and preserve every existing modification.
3. Use the existing `graphify-out/graph.json` first for architecture questions. Rebuild only if the graph is stale for files being changed.
4. Create an implementation plan with exact files, test targets, and vertical behavior slices.
5. Work in small TDD cycles:
   - write one failing test,
   - run it and verify the expected failure,
   - add the minimum implementation,
   - rerun the focused test,
   - run the relevant suite,
   - refactor only while green.
6. Use up to three parallel agents only for independent file groups. Never let two agents edit the same file concurrently.
7. After each batch, re-read modified files and verify exports, imports, IPC channel names, and shared types.
8. Run simplify review and independent code review before delivery.
9. Do not commit, push, tag, release, or deploy unless explicitly requested.

## Priority Order

### Phase 1: Data Safety and IPC

- Fix canonical vault containment and symlink traversal.
- Add validated note and folder names.
- Add structured IPC results and shared contracts.
- Add atomic saves and clear error propagation.
- Add race-safe note loading and saving.
- Flush pending saves on risky transitions.
- Add dirty-close and destructive-action dialogs.
- Add vault-local trash and restore.

This phase blocks all cosmetic work because visual polish cannot compensate for data-loss risk.

### Phase 2: Session and Navigation Correctness

- Introduce per-tab note sessions with buffers and editor state.
- Synchronize rename/delete across tabs, bookmarks, indexes, and active selection.
- Make wiki-link resolution path-aware and support missing-note creation.
- Fix folder tree identity, keyboard behavior, and empty folders.
- Add external-change detection and conflict handling.

### Phase 3: Search, Metadata, and Graph

- Build incremental vault indexing.
- Upgrade filename/content/tag/property search.
- Harden frontmatter and property editing.
- Complete outline navigation.
- Make graph lifecycle, persistence, accessibility, and large-vault behavior reliable.

### Phase 4: UI System and Polish

- Remove renderer-native prompts and remaining one-off inline styles.
- Consolidate modal, input, button, tooltip, empty-state, and toast patterns.
- Improve visual hierarchy, responsive panel behavior, focus states, and overlay layering.
- Replace `transition: all` and add reduced-motion overrides.
- Add pointer and keyboard resizing.
- Verify all five themes at target window sizes.

### Phase 5: Performance and Final Quality Gate

- Profile initial indexing, typing, search, and graph behavior with generated large vaults.
- Reduce the main renderer chunk through meaningful boundaries.
- Run the full automated suite and production build.
- Run an independent functional review, UI review, and security review.
- Fix every blocking and high-severity finding.

## Coding Rules

- Keep public code, comments, UI copy, and documentation in English.
- Keep changes focused. Do not rewrite the application.
- Use existing libraries before adding dependencies.
- Prefer pure helpers for validation and transition logic.
- Never swallow an error that changes user data or visible behavior.
- Avoid empty `catch` blocks in operational code.
- Never use `window.prompt`, `window.alert`, or `window.confirm` in the renderer.
- Never use `transition: all`.
- No new inline styles in production React components.
- Use semantic CSS variables from `themes.css`.
- Use SVG icons with consistent sizing and strokes.
- Respect `prefers-reduced-motion`.
- Use `path.relative` plus canonical paths for containment checks.
- Treat symlinks and Windows path semantics as security boundaries.
- Keep `nodeIntegration: false` and `contextIsolation: true`.
- Do not expose raw `ipcRenderer` to the renderer.

## Expected File Areas

Likely existing files to modify:

- `electron/ipc-handlers.ts`
- `electron/preload.ts`
- `electron/window.ts`
- `electron/main.ts`
- `src/components/App.tsx`
- `src/components/NoteEditor.tsx`
- `src/components/Sidebar.tsx`
- `src/components/TabBar.tsx`
- `src/components/RightPanel.tsx`
- `src/components/PropertiesPanel.tsx`
- `src/components/GraphView.tsx`
- `src/components/GlobalSearch.tsx`
- `src/components/TemplatesPanel.tsx`
- `src/store/useAppStore.ts`
- `src/plugins/frontmatter.ts`
- `src/plugins/wiki-links-utils.ts`
- `src/styles/index.css`
- `src/styles/themes.css`
- `src/types.ts`

Likely focused files to create only when their responsibility is clear:

- `src/shared/ipc-contract.ts`
- `electron/path-safety.ts`
- `electron/note-files.ts`
- `src/services/note-session.ts`
- `src/services/vault-index.ts`
- reusable dialog, toast, and tooltip components
- focused unit and integration test files under `src/__tests__/`

Do not create all of these automatically. Reuse existing files when that is simpler and keeps responsibilities clear.

## Verification Commands

Run focused Vitest files during each TDD cycle, then:

```bash
npm run test
npm run build
```

Before final delivery, also launch the production Electron output or the locally built application and exercise the acceptance flows from `spec.md`.

## Delivery Report

The final report must include:

- implemented behavior grouped by phase,
- files changed with relevant line references,
- exact test and build results,
- manual flows verified,
- any residual risk or unverified environment-dependent behavior,
- no claim that a feature works without real execution evidence.

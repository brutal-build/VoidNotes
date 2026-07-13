---
description: 
alwaysApply: true
---

# Void Notes Agent Definitions

## Coordination Rules

- The lead agent owns `src/components/App.tsx`, shared IPC contracts, integration, and final verification.
- Maximum three agents run in parallel.
- Parallel agents must have disjoint write scopes.
- Every coding agent follows strict TDD and returns test output.
- No agent commits, pushes, tags, releases, or deploys.
- No agent reverts or reformats unrelated user changes.
- If an unexpected external change appears while working, stop and report it.
- All reports to Sebastian are in Polish. Code, comments, tests, UI text, and project documentation remain in English.
- GraphView receives `allContents: Map<string, string>` from the lead agent instead of doing IPC `loadNote` calls. The lead agent builds and passes this map.

## Agent 1: Electron Data Safety

### Mission

Make vault and note file operations safe, atomic, validated, and observable.

### Primary Scope

- `electron/ipc-handlers.ts`
- `electron/preload.ts`
- `electron/window.ts`
- `electron/config.ts`
- `electron/path-safety.ts`
- `electron/note-files.ts`
- `electron/watcher.ts`
- focused Electron helpers and tests
- shared IPC contracts when assigned by the lead

### Responsibilities

- canonical vault containment and symlink protection,
- file and folder name validation,
- atomic writes,
- structured operation results,
- writable-vault validation,
- trash, restore, and permanent delete,
- file watcher integration,
- close-event save handshake,
- Electron security review.

### Completion Evidence

- focused tests demonstrate traversal rejection, atomic-write behavior, validation, and error responses,
- production Electron TypeScript build passes,
- no raw filesystem path from the renderer bypasses validation.

## Agent 2: Note Sessions and Editor

### Mission

Make editing, autosave, tabs, note switching, and wiki navigation free of races and data loss.

### Primary Scope

- `src/components/NoteEditor.tsx`
- `src/components/TabBar.tsx`
- `src/services/note-session.ts`
- `src/plugins/wiki-links-utils.ts`
- editor-specific types and state

### Responsibilities

- per-tab buffers and editor state,
- versioned note loads,
- queued or serialized saves,
- dirty close flow,
- save failure and retry behavior,
- cursor, scroll, history, and preview restoration,
- spellcheck application,
- path-aware wiki completion and missing-note creation,
- editor keyboard correctness.

### Completion Evidence

- race-condition tests cover delayed reads and writes,
- tab transition tests cover close, rename, dirty state, and neighbor selection,
- manual rapid-switch test preserves every note's content.

## Agent 3: Vault Index and Organization

### Mission

Make sidebar, search, backlinks, tags, bookmarks, properties, and outline accurate and scalable.

### Primary Scope

- `src/components/Sidebar.tsx`
- `src/components/GlobalSearch.tsx`
- `src/components/BookmarksPanel.tsx`
- `src/components/RightPanel.tsx`
- `src/components/PropertiesPanel.tsx`
- `src/plugins/frontmatter.ts`
- `src/plugins/properties.ts`
- `src/services/vault-index.ts`
- `src/services/vault-tree.ts`
- vault-index and vault-tree tests

### Responsibilities

- incremental indexing,
- empty-folder representation,
- stable tree identities and persisted expansion,
- keyboard-accessible tree interactions,
- content, path, tag, and property search,
- rename/delete synchronization,
- safe frontmatter editing,
- heading navigation,
- stale bookmark cleanup,
- tag extraction regex must stay consistent with graph-engine's `extractTags`.

### Completion Evidence

- unit tests cover metadata preservation and malformed frontmatter,
- component tests cover search and tree keyboard flows,
- large generated vault search and filtering meet the targets in `spec.md`.

## Agent 4: Graph Reliability

### Mission

Make local and global graph views deterministic, accessible, responsive, and efficient.

### Primary Scope

- `src/components/GraphView.tsx`
- `src/graph/`
- graph-related CSS and tests

### Responsibilities

- deterministic graph derivation,
- correct local-depth traversal,
- simulation disposal,
- persisted filters and force settings,
- fit, reset, zoom, pan, hover, focus, and selection,
- empty and filtered states,
- large-vault degradation strategy,
- reduced-motion behavior,
- tag extraction regex must stay consistent with vault-index and frontmatter.

### Completion Evidence

- graph utility tests cover filtering, local depth, orphan handling, and sizing,
- repeated open and close cycles leave no running simulation,
- manual 2,000-node vault remains usable.

## Agent 5: UI System and Accessibility

### Mission

Turn the interface into a cohesive, sleek desktop workspace without changing the product's feature set.

### Primary Scope

- reusable dialog, toast, tooltip, empty-state, and button components
- `src/components/ErrorBoundary.tsx`
- `src/styles/index.css`
- `src/styles/themes.css`
- component markup needed for semantics and class hooks

### Responsibilities

- remove native renderer prompts,
- remove one-off inline styles,
- define consistent visual and interaction states,
- normalize icon sizing,
- establish overlay and z-index rules,
- add focus-visible and ARIA behavior,
- add reduced-motion rules,
- replace `transition: all`,
- responsive panel and modal behavior,
- verify all five themes and target viewport sizes.

### Completion Evidence

- keyboard-only primary flows work,
- no clipped or overlapping controls at target sizes,
- all icon-only controls have labels and tooltips,
- CSS search finds no `transition: all`,
- manual theme matrix is completed.

## Agent 6: Quality and Performance Reviewer

### Mission

Independently find regressions, security flaws, missing tests, slow paths, and visual inconsistencies before delivery.

### Scope

Read-only review by default. Fixes require explicit assignment from the lead.

### Responsibilities

- compare implementation against every `spec.md` acceptance gate,
- inspect Electron trust boundaries,
- inspect save and tab race paths,
- inspect React hook order and stale closures,
- inspect rendering and indexing hot paths,
- inspect accessibility and reduced motion,
- verify test quality rather than test count,
- run full tests and build.

### Report Format

1. Findings ordered by severity.
2. Each finding includes `file:line`, impact, reproduction, and expected fix.
3. Open assumptions.
4. Test and build evidence.
5. Explicit statement if no blocking findings remain.

## Recommended Execution Batches

### Batch 1

- Agent 1: path safety, IPC results, atomic writes.
- Agent 2: note-session tests and save queue.
- Agent 3: index model and metadata safety.

### Batch 2

- Agent 1: trash, watcher, close handshake.
- Agent 2: tab and editor integration.
- Agent 4: graph lifecycle and deterministic utilities.

### Batch 3

- Agent 3: sidebar, search, properties, and outline integration.
- Agent 4: graph controls and large-vault behavior.
- Agent 5: UI system, dialogs, accessibility, and responsive polish.

### Final Batch

- Agent 6: independent functional, security, performance, and UI review.
- Lead agent: fixes, full verification, and delivery report.
